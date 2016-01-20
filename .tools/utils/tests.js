
import request from 'request';
import Webcom from 'webcom';
import uuid from 'uuid';
import minimist from 'minimist';
import Debug from 'console-debug';
import range from 'lodash/utility/range';

const args = minimist(process.argv.slice(2), {boolean: ['log']});
const host = args.server || 'https://webcom.orange.com';
const proxy = args.proxy;
const ns = uuid.v1();
const simplelogin = {};

if(!args.log) {
	// Override console warn to avoid log pollution by Webcom
	const debugConsole = new Debug({
		uncaughtExceptionCatch: false,      // Do we want to catch uncaughtExceptions?
		consoleFilter: ['LOG', 'WARN'],     // Filter these console output types
		colors: true                        // do we want pretty pony colors in our console output?
	});
	console.warn = debugConsole.warn.bind(debugConsole);
}

const admin_jwt = process.env.WEBCOM_JWT;

const createNamespace = (token, namespace = ns) => new Promise((resolve, reject) => {
	request.post({
		url: `${host}/admin/base/${namespace}`,
		formData: {token},
		proxy
	}, err => err ? reject(err) : resolve());
});

const deleteNamespace = (token, namespace = ns) => new Promise((resolve, reject) => {
	request.post({
		url: `${host}/admin/base/${namespace}`,
		formData: {
			_method: 'DELETE',
			namespace,
			token
		},
		proxy
	}, err => err ? reject(err) : resolve());
});

const adminToken = (token, namespace = ns) => new Promise((resolve, reject) => {
	request({
		url: `${host}/admin/base/${namespace}/token?token=${token}`,
		proxy
	}, (err, header, body) => err ? reject(err) : resolve(JSON.parse(body).authToken));
});

const putRules = (token, rulesToTest, namespace = ns) => new Promise((resolve, reject) => {
	request({
		url: `${host}/base/${namespace}/.settings/rules.json?auth=${token}`,
		method: 'PUT',
		json: rulesToTest,
		proxy
	}, (err, header, body) => {
		const parseError = err || (body && body.error ? new Error(body.error) : false)
		parseError ? reject(parseError) : resolve();
	});
});

const createUser = (namespace, email) => new Promise((resolve, reject) => {
	(new Webcom(`${host}/base/${namespace}`, proxy)).createUser(email, 'password', (err, authData) => {
		if(err) {
			reject(err);
			return console.error(err);
		}
		simplelogin[authData.id] = {
			token: authData.token,
			uid: authData.uid,
			id: authData.id,
			email
		};
		resolve(authData);
	});
});

const deleteUser = (namespace, email) => new Promise((resolve, reject) => {
	(new Webcom(`${host}/base/${namespace}`, proxy)).removeUser(email, 'password', (err) => {
		if (err) {
			reject(err);
			return console.error(err);
		}
		resolve();
	});
});

const auth = (token, namespace = ns) => new Promise((resolve, reject) => {
	(new Webcom(`${host}/base/${namespace}`, proxy)).auth(token, (err, authData) => {
		if (err) {
			reject(err);
		} else {
			resolve(authData && authData.auth ? authData.auth : authData);
		}
	}, reject);
});

const update = (path, data) => new Promise((resolve, reject) => {
	(new Webcom(`${host}/base/${ns}/${path}`, proxy)).update(data, (err) => {
		if (err) {
			reject(err);
		} else {
			resolve();
		}
	});
});

const push = (path, data) => new Promise((resolve, reject) => {
	(new Webcom(`${host}/base/${ns}/${path}`, proxy)).push(data, (err) => {
		if (err) {
			reject(err);
		} else {
			resolve();
		}
	});
});

const set = (path, data) => new Promise((resolve, reject) => {
	(new Webcom(`${host}/base/${ns}/${path}`, proxy)).set(data, (err) => {

		if (err) {
			reject(err);
		} else {
			resolve();
		}
	});
});

const remove = (path, data) => new Promise((resolve, reject) => {
	(new Webcom(`${host}/base/${ns}/${path}`, proxy)).remove((err) => {
		if (err) {
			reject(err);
		} else {
			resolve();
		}
	});
});

const read = (path) => new Promise(
	(resolve, reject) => {
		(new Webcom(`${host}/base/${ns}/${path}`, proxy)).once('value', resolve, reject);
	}
);

const logout = (path = '') => new Promise(
	(resolve, reject) => {
		(new Webcom(`${host}/base/${ns}/${path}`, proxy)).logout(err => err ? reject(err) : resolve());
	}
);

export const initNamespace = (rules, nbUser = 5) => done => {
	console.info(`\n  \u2622 ${ns}\n`);
	auth(admin_jwt, 'accounts')
		.then(() => createNamespace(admin_jwt, ns))
		.then(() => adminToken(admin_jwt, ns))
		.then((token) => putRules(token, rules))
		.then(() => {
			const users = range(1, nbUser + 1).map(id => createUser(ns, `user${id}@reach.io`));
			return Promise.all(users);
		})
		.then(() => done())
		.catch(done);
};

export const destroyNamespace = () => done => {
	const users = Object.keys(simplelogin).map(id => deleteUser(ns, simplelogin[id].email));
	Promise.all(users)
		.then(() => deleteNamespace(admin_jwt, ns))
		.then(() => done())
		.catch(done);
};

export const resetNamespace = (data) => done => {
	adminToken(admin_jwt, ns)
		.then((token) => auth(token, ns))
		.then(() => set('', data))
		.then(() => done())
		.catch(done);
};

export const plugin = (chai, utils) => {
	// Add Properties
	[
		['can', 'positivity', true],
		['cannot', 'positivity', false],
		['read', 'operation'],
		['remove', 'operation']
	].forEach(args => {
		chai.Assertion.addProperty(
			args[0],
			function(){
				utils.flag(this, args[1], args.length == 3 ? args[2] : args[0]);
			}
		);
	}, this);

	// Add chainable methods
	[
		'write',
		'push',
		'update',
		'set'
	].forEach(method => {
		chai.Assertion.addChainableMethod(
			method,
			function(d) {
				utils.flag(this, 'operation', method);
				utils.flag(this, 'operationData', d);
			},
			function() {
				utils.flag(this, 'operation', method);
				utils.flag(this, 'operationData', null);
			}
		);
	}, this);

	// Add final method
	chai.Assertion.addMethod('path', function(path, done) {
		const operationType = utils.flag(this, 'operation');
		const positivity = utils.flag(this, 'positivity');
		const newData = utils.flag(this, 'operationData');
		const user = this._obj === false ? 'Unauthenticated user' : this._obj.email;

		let method;
		switch (operationType) {
			case 'write':
				method = newData && newData instanceof Object ? update : set;
				break;
			case 'set':
				method = set;
				break;
			case 'update':
				method = update;
				break;
			case 'push':
				method = push;
				break;
			case 'remove':
				method = remove;
				break;
			case 'read':
			default:
				method = read;
				break;
		}

		(this._obj ? auth(this._obj.token) : logout(path)).then(() => {
			const errorMsg = newData ? `${operationType} '${newData instanceof Object ? JSON.stringify(newData) : newData}' to ${path}` : `${operationType} ${path}`
			if (positivity) {
				method(path, newData).then(() => done(), (err) => {
					if (err && /^PERMISSION_DENIED$/i.test(err.code)) {
						done(new Error(`${user} cannot ${errorMsg} but should be able to`));
					} else {
						done(err);
					}
				});
			} else {
				method(path, newData).then(
					() => {
						done(new Error(`${user} can ${errorMsg} but should not be able to`));
					},
					(err) => {
						if (err && /^PERMISSION_DENIED$/i.test(err.code)) {
							done();
						} else {
							done(err);
						}
					}
				);
			}
		});
	});
};

export const users = {
	unauthenticated: false,
	password: (id = 5) => simplelogin[id]
};
