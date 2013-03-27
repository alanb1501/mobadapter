#!/usr/bin/env node
var soap = require('soap');
var nconf = require('nconf');
var express = require('express');
var uuid  = require('uuid');

var User = function (fname,lname,birthday,addLine1,addLine2,city,state,country,zip,phone,email,emergency) {
    //todo: pull this formatting logic into a more appropriate/centralized place
    this.id = uuid.v4();
    this.fname = fname;
    this.lname = lname;
    this.birthday = birthday.replace(/(\d{4})(\d{2})(\d{2})/,'$1-$2-$3');
    this.addressLine1 = addLine1;
    this.addressLine2 = addLine2;
    this.city = city;
    this.state = state;
    this.zip = zip;
    this.country = country;
    this.phone = phone;
    this.email = email;
    this.emergency = emergency;
}

User.prototype = {
    serialize: function () {
        return {
            "ID": this.id,
            "FirstName": this.fname,
            "LastName":this.lname,
            "Email":this.email,
            "AddressLine1":this.addressLine1,
            "AddressLine2":this.addressLine2,
            "City":this.city,
            "State":this.state,
            "PostalCode":this.zip,
            "Country":this.country,
            "MobilePhone":this.phone,
            "BirthDate":this.birthday,
            "ReferredBy":"Web",
            "EmergencyContactInfoName": this.emergency.firstName + " " + this.emergency.lastName,
            "EmergencyContactInfoRelationship": this.emergency.relationship,
            "EmergencyContactInfoPhone": this.emergency.phone
        };
    }
}


function die(message) {
	console.error(message);
	process.exit();
}

function getSourceCreds() {
	return 	{ 	
		"SourceName": nconf.get('source'),
		"Password": nconf.get('key'),
		"SiteIDs": [
			{"int":nconf.get('siteid')}
	]};
}

function activate(client) {
	client.GetActivationCode(
	{
		"Request": {
			"SourceCredentials" : getSourceCreds()
		}
		
	},function(err,result){

		if(err && err != null) {
			die(err);
		}

		console.log('Activation Code: ' + result.GetActivationCodeResult[0].ActivationCode);
		console.log('Activation Link: ' + result.GetActivationCodeResult[0].ActivationLink);
		//console.log(result[0].Actiateion);	
		process.exit();
	});
}

var userQueue = [];

function addUser(client,user) {
	client.AddOrUpdateClients({
		"Request": {
			"SourceCredentials" : getSourceCreds(),
			"Clients": [{
				"Client":user.serialize()
			}]
		}
	},function(err,results) {
		console.log(JSON.stringify(err));
		console.log(JSON.stringify(results));

		// We have an error; queue this user and retry
		if(results.AddOrUpdateClientsResult[0].ErrorCode !== '200') {
			//Also email this error to Alan
			userQueue.push(user);
		}
	});
}

//Load Global configurations
nconf.argv().file('global','./global.json');

// load the any
nconf.file('user',nconf.get('user') || './user.json').env();

if(nconf.get('help')) {
	console.log(process.argv.join(' '));
	console.log('usage:');ae
	console.log('	--help: this help message');
	console.log('	--user /path/to/user.json');
	console.log('	--activate: outputs activation code');
}

if(!nconf.get('key') || !nconf.get('source')) {
	die('Missing [key] and [source] values in user.json file');
}

//create soap client to MindBodyOnline
if(nconf.get('activate')) {
	soap.createClient(nconf.get('wsdl'),function(err,client) {
		activate(client);
	});
}

if(nconf.get('testadduser')) {

	var num = Math.floor(Math.random()*90000) + 10000;

	soap.createClient(nconf.get('clientWsdl'),function(err,client) {
		//var User = function (fname,lname,birthday,addLine1,addLine2,city,state,country,zip,phone,email,emergency) {
		var u = new User("arbTest","arbTest-" + num ,"19800301","1234 Anywhere",
			"Suite 187","Renton","WA","USA","98057","5554143145",
			"test-" + num + "@tempuri.org",{firstName: "FirstMom",
								  lastName: "MomLast",
								  relationship: "Mom",
								  phone: "4255551111"
								});

		console.log(u.serialize());
		addUser(client,u);
	});
}

// create a daemon
var app = express();
app.use(express.bodyParser());

app.post('/wufoo/adduser',function(req,res) {
	res.send('ok!');

	function getVal(val) {
		return req.body[nconf.get(val)];
	}

	var fName = getVal('firstName');
	var lName = getVal('lastName');

	var addLine1 = getVal('addressLine1');
	var addLine2 = getVal('addressLine2');

	var city = getVal('city');
	var state = getVal('state');
	var country = getVal('country');
	var birthday = getVal('birthday');
	var zip = getVal('zipCode');
	var email = getVal('email');
	var phone = getVal('phone');

	var emergency = {
		firstName: getVal('emergencyFirstName'),
		lastName: getVal('emergencyLastName'),
		relationship: getVal('emergencyRelation'),
		phone: getVal('emergencyPhone')
	};

	soap.createClient(nconf.get('clientWsdl'),function(err,client) {

		//var User = function (fname,lname,birthday,addLine1,addLine2,city,state,country,zip,phone,email,emergency) {
		var u = new User(fName,lName,birthday,addLine1,addLine2,city,state,country,zip,phone,email,emergency);
		console.log(u.serialize());
		addUser(client,u);
	});
});

app.get('*',function(req,res){
	console.log('hi!');
	res.end();
})

var port = process.env.PORT || 8001;
app.listen(port, function() {
  console.log("Listening on " + port);
});