#!/usr/bin/env node

import * as version from './version';
import {prompt} from 'inquirer';
import BrowserSync from 'browser-sync';

if(version.list.length === 0) {
	process.exit(0);
} else {
	prompt(
		{
			type: 'list',
			name: 'version',
			message: 'Which draft version to display ?',
			choices: ['latest'].concat(version.list)
		},
		(answers) => {
			const v = version.get(answers.version);
			if(v){
				BrowserSync.create('draft').init({
					server: true,
					files: ['draft-*/*', 'legacy/*'],
					startPath: `bower_components/docson/#/../../${v}/schema.json`
				});
			}
		}
	);
}