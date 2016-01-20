#!/usr/bin/env node

import jwt from 'jsonwebtoken';
import minimist from 'minimist';
import moment from 'moment';

// Parse args. Secret is mandatory, uid is optional
const args = minimist(process.argv.slice(2), {'default': {uid: 'simplelogin:1'}});
if(!args.secret){
	console.error('Missing secret. the \'--secret\' is mandatory.');
	process.exit(1);
}
const payload = {
	uid: args.uid,
	email: args.email
};

// Create a JWT with a 1 year validity (we don't want to change it all the time)
const token = jwt.sign({
	v: 0,
	d: payload,
	iat: moment().unix(),
	exp: moment().add(1, 'year').unix()
}, args.secret);

// output
console.log(token);