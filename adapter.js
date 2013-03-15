#!/usr/bin/env node
var soap = require('soap');
var nconf = require('nconf');
var express = require('express');
var uuid  = require('uuid');

var User = function (fname,lname,addLine1,addLine2,city,state,country,zip,phone,email) {
    //todo: pull this formatting logic into a more appropriate/centralized place
    this.id = uuid.v4();
    this.fname = fname;
    this.lname = lname;
    this.addressLine1 = addLine1;
    this.addressLine2 = addLine2;
    this.city = city;
    this.state = state;
    this.zip = zip;
    this.phone = phone;
    this.email = email;
}

User.prototype = {
    serialize: function () {
        return {
            "ID": this.id,
            "FirstName": this.fname,
            "LastName":this.lname,
            "Email":this.email,
            "AddressLine1":this.addressLine2,
            "AddressLine2":this.addressLine2,
            "City":this.city,
            "State":this.state,
            "PostalCode":this.zip,
            "Country":this.country,
            "MobilePhone":this.phone,
            "BirthDate":"1980-01-01",
            "ReferredBy":"Web"
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
	soap.createClient(nconf.get('clientWsdl'),function(err,client) {
		//var user = function (fname,lname,addline1,addline2,city,state,country,zip,phone,email) {
		var u = new User("arbTest","arbTest2","1234 Anywhere","Suite 187","Renton","WA","USA","98057","5554143145","test-1@tempuri.org");
		console.log(u.serialize());
		addUser(client,u);
	});
}


// create a daemon
var app = express();
app.use(express.bodyParser());

app.post('/wufoo/adduser',function(req,res) {
	//todo: reduce this.

	console.log(JSON.stringify(req.body));

	var fName = req.body[nconf.get('firstName')];
	var lName = req.body[nconf.get('lastName')];
	var addLine1 = req.body[nconf.get('addressLine1')];
	var addLine2 = req.body[nconf.get('addressLine2')];
	var city = req.body[nconf.get('city')];
	var state = req.body[nconf.get('state')];
	var country = req.body[nconf.get('country')];
	var zip = req.body[nconf.get('zipCode')];
	var email = req.body[nconf.get('email')];
	var phone = req.body[nconf.get('phone')];
	var rsvp = req.body[nconf.get('rsvpClass')];
	var referral = req.body[nconf.get('referral')];
	res.send('ok!');

	soap.createClient(nconf.get('clientWsdl'),function(err,client) {
		//var user = function (fname,lname,addline1,addline2,city,state,country,zip,phone,email) {
		var u = new User(fName,lName,addLine1,addLine2,city,state,country,zip,phone,email);
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