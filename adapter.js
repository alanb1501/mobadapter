#!/usr/bin/env node
var soap = require('soap');
var nconf = require('nconf');


function die(message) {
	console.error(message);
	process.exit();
}

//Load Global configurations
nconf.argv().file('global','./global.json');

// load the any
nconf.file('user',nconf.get('user') || './user.json');

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

if()
soap.createClient(nconf.get('wsdl'),function(err,client) {

	var subs = client.describe();

	client.GetActivationCode(
	{
		"Request":{
			"SourceCredentials": {
			"SourceName": nconf.get('source'),
			"Password": nconf.get('key'),
			"SiteIDs": [
				{"int":"-99"}
			]
		}
	}

	},function(err,result){
		console.log(result);
		console.log(client.lastRequest);
	});
});