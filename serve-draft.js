#!/usr/bin/env node

var inquirer = require('inquirer'),
	fs = require('fs');

// Versions
var versions = fs.readdirSync('.').filter(function(file){
	return /^draft-\d+$/.test(file) || /^legacy$/.test(file);
});
var latestVersion = versions.length > 0 ? versions[versions.length -1] : null;

inquirer.prompt([
	{
		type: "list",
		name: "version",
		message: "Which draft version to display ?",
		choices: versions.concat(['latest'])
	}
], function( answers ) {
	console.log(answers.version);
	var version = answers.version;
	if(version == "latest") {
		version = latestVersion;
	}
	if(version){
		var bs = require("browser-sync").create('draft');
		bs.init({
			server: true,
			files: 'draft-*/*',
			startPath: 'bower_components/docson/#/../../'+version+'/reach.json'
		});
	}
});