/*eslint complexity: [2, 10]*/

import {readdirSync, statSync} from 'fs';
import {findLast, includes} from 'lodash/collection';
import intersection from 'lodash/array/intersection';
import minimist from 'minimist';

// List schema versions
export const schemas = readdirSync('.').filter((file) => /^draft-\d+$/.test(file) || /^legacy$/.test(file));

// Latest schema version
export const latestSchema = findLast(schemas, (v) => /^draft-\d+$/.test(v));

// List security rules versions
export const rules = (readdirSync('.').filter((file) => {
	if((/^draft-\d+$/.test(file) || /^legacy$/.test(file))) {
		try {
			statSync(`./${file}/security/rules.bolt`);
			return true;
		} catch (e) {
			//console.log(`No security rules for ${file}`);
		}
	}
	return false;
}));

// Extract versions from command line args. If no args or unknown versions then all.
export const extract = (list) => {
	const argv = minimist(process.argv.slice(2))._;
	const all = /^schemas$/.test(list) ? schemas : (/^rules/.test(list) ? rules : []);
	const latest = findLast(all, (v) => /^draft-\d+$/.test(v));

	let versions = intersection(argv, all);
	if(includes(argv, 'all')){
		versions = all;
	} else if(includes(argv, 'latest') && !includes(versions, latest)) {
		versions.push(latest);
	}
	return versions.length > 0 ? versions : all;
};
