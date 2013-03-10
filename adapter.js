#!/usr/bin/env node
var soap = require('soap');
var nconf = require('nconf');
var express = require('express');


function die(message) {
	console.error(message);
	process.exit();
}

function activate(client) {
	client.GetActivationCode(
	{
		"Request":{
			"SourceCredentials": {
			"SourceName": nconf.get('source'),
			"Password": nconf.get('key'),
			"SiteIDs": [
				{"int":nconf.get('siteid')}
			]
		}
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

//Load Global configurations
nconf.argv().file('global','./global.json');

// load the any
nconf.file('user',nconf.get('user') || './user.json').env();

if(nconf.get('help')) {
	console.log(process.argv.join(' '));
	console.log('usage:');
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

// create a daemon
var app = express();

app.post('/wufoo/adduser',function(req,res) {
	res.send(req.body);
});

app.get('*',function(req,res){
	console.log('hi!');
	res.end();
})

var port = process.env.PORT || 8001;
app.listen(port, function() {
  console.log("Listening on " + port);
});