
import request from 'request';
import Webcom from 'webcom';
import uuid from 'uuid';
import minimist from 'minimist';
import range from 'lodash/utility/range';
import find from 'lodash/collection/find';

// TODO add .webcomrc.yml | .webcomrc.json support for options ?
const defaultOptions = {
	server: 'https://webcom.orange.com',
	log: false,
	ns: uuid.v1()
}

// Parse args
const config = minimist(process.argv.slice(2), {
	boolean: ['log'],
	default: defaultOptions
});

// Created users
const simplelogin = {};
let authenticated = null;

// Override console warn to avoid log pollution by Webcom
if(!config.log) {
	console.warn = () => {};
}

// Auth token
//	Generate a JWT using the namespace's secret & npm run jwt
const admin_jwt = process.env.WEBCOM_JWT;

/**
 * Get webcom server version
 * @return Promise
 */
const serverVersion = () => new Promise((resolve, reject) => {
	// Force node to accept unauthorized certificates (for self-signed certs)
	process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
	request({
		url: `${config.server}/version/v.json`,
		proxy: config.proxy
	}, (err, header, body) => {
		if(err) {
			reject(err);
		} else {
			const versionData = JSON.parse(body);
			resolve(parseFloat(versionData['Implementation-Version'] || versionData['Specification-Version'] || 1));
		}
	});
});

/**
 * Create a namespace.
 * You need to be authenticated on the 'accounts' namespace to to that.
 * @param {string} token - Your admin token
 * @param {string} [namespace=config.ns] - The namespace to create. Default to the config ns value.
 * @return Promise
 */
const createNamespace = (token, namespace = config.ns) => new Promise((resolve, reject) => {
	request.post({
		url: `${config.server}/admin/base/${namespace}`,
		formData: {token},
		proxy: config.proxy
	}, err => err ? reject(err) : resolve());
});

/**
 * Delete a namespace.
 * You need to be authenticated on the 'accounts' namespace to to that.
 * @param {string} token - Your admin token
 * @param {string} [namespace=config.ns] - The namespace to delete. Default to the config ns value.
 * @return Promise
 */
const deleteNamespace = (token, namespace = config.ns) => new Promise((resolve, reject) => {
	request.post({
		url: `${config.server}/admin/base/${namespace}`,
		formData: {
			_method: 'DELETE',
			namespace,
			token
		},
		proxy: config.proxy
	}, err => err ? reject(err) : resolve());
});

/**
 * Get the admin token on a namespace.
 * @param {string} token - Your auth token
 * @param {string} [namespace=config.ns] - The namespace to get the token for. Default to the config ns value.
 * @return Promise
 */
const adminToken = (token, namespace = config.ns) => new Promise((resolve, reject) => {
	request({
		url: `${config.server}/admin/base/${namespace}/token?token=${token}`,
		proxy: config.proxy
	}, (err, header, body) => err ? reject(err) : resolve(JSON.parse(body).authToken));
});

/**
 * Set the security rules for a namespace.
 * @param {string} token - Your admin token
 * @param {string} [namespace=config.ns] - The namespace to create. Default to the config ns value.
 * @return Promise
 */
const putRules = (token, rulesToTest, namespace = config.ns) => new Promise((resolve, reject) => {
	request({
		url: `${config.server}/base/${namespace}/.settings/rules.json?auth=${token}`,
		method: 'PUT',
		json: rulesToTest,
		proxy: config.proxy
	}, (err, header, body) => {
		const parseError = err || (body && body.error ? new Error(body.error) : false)
		parseError ? reject(parseError) : resolve();
	});
});

/**
 * Create a user in a namespace.
 * @param {string} email - The user email
 * @param {string} [namespace=config.ns] - The namespace to create. Default to the config ns value.
 * @return Promise
 */
const createUser = (email, namespace = config.ns) => new Promise((resolve, reject) => {
	(new Webcom(`${config.server}/base/${namespace}`, config.proxy)).createUser(email, 'password', (err, authData) => {
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

/**
 * Delete a user in a namespace.
 * @param {string} email - The user email
 * @param {string} [namespace=config.ns] - The namespace to create. Default to the config ns value.
 * @return Promise
 */
const deleteUser = (email, namespace = config.ns) => new Promise((resolve, reject) => {
	(new Webcom(`${config.server}/base/${namespace}`, config.proxy)).removeUser(email, 'password', (err) => {
		if (err) {
			reject(err);
			return console.error(err);
		}
		resolve();
	});
});

/**
 * Authenticate with a token.
 * @param {string} token - auth token
 * @param {string} [namespace=config.ns] - The namespace to create. Default to the config ns value.
 * @return Promise
 */
const auth = (token, namespace = config.ns) => new Promise((resolve, reject) => {
	(new Webcom(`${config.server}/base/${namespace}`, config.proxy)).auth(token, (err, authData) => {
		if (err) {
			reject(err);
		} else {
			resolve(authData && authData.auth ? authData.auth : authData);
		}
	}, reject);
});

/**
 * Authenticate with a email/password.
 * @param {string} email
 * @param {string} password
 * @param {string} [namespace=config.ns] - The namespace to create. Default to the config ns value.
 * @return Promise
 */
const authWithPassword = (email, password, namespace = config.ns) => new Promise((resolve, reject) => {
	(new Webcom(`${config.server}/base/${namespace}`, config.proxy)).authWithPassword({email, password, rememberMe: false}, (err, authData) => {
		if (err) {
			reject(err);
		} else {
			resolve(authData && authData.auth ? authData.auth : authData);
		}
	}, reject);
});

/**
 * Update data
 * @param {string} path - The path to set data to
 * @param {string} data - The data to set
 * @param {string} [namespace=config.ns] - The namespace. Default to the config ns value.
 * @return Promise
 */
const update = (path, data, namespace = config.ns) => new Promise((resolve, reject) => {
	(new Webcom(`${config.server}/base/${namespace}/${path}`, config.proxy)).update(data, (err) => {
		if (err) {
			reject(err);
		} else {
			resolve();
		}
	});
});

/**
 * Push data
 * @param {string} path - The path to push data to
 * @param {string} data - The data to push
 * @param {string} [namespace=config.ns] - The namespace. Default to the config ns value.
 * @return Promise
 */
const push = (path, data, namespace = config.ns) => new Promise((resolve, reject) => {
	(new Webcom(`${config.server}/base/${namespace}/${path}`, config.proxy)).push(data, (err) => {
		if (err) {
			reject(err);
		} else {
			resolve();
		}
	});
});

/**
 * Set data
 * @param {string} path - The path to set data to
 * @param {string} data - The data to set
 * @param {string} [namespace=config.ns] - The namespace. Default to the config ns value.
 * @return Promise
 */
const set = (path, data, namespace = config.ns) => new Promise((resolve, reject) => {
	(new Webcom(`${config.server}/base/${namespace}/${path}`, config.proxy)).set(data, (err) => {

		if (err) {
			reject(err);
		} else {
			resolve();
		}
	});
});

/**
 * Remove data
 * @param {string} path - The path to remove data from
 * @param {string} data - The data to remove. Not used but present to simplify chai plugin
 * @param {string} [namespace=config.ns] - The namespace. Default to the config ns value.
 * @return Promise
 */
const remove = (path, data = null, namespace = config.ns) => new Promise((resolve, reject) => {
	(new Webcom(`${config.server}/base/${namespace}/${path}`, config.proxy)).remove((err) => {
		if (err) {
			reject(err);
		} else {
			resolve();
		}
	});
});

/**
 * Read data
 * @param {string} path - The path to read data from
 * @param {string} data - The data to read. Not used but present to simplify chai plugin
 * @param {string} [namespace=config.ns] - The namespace. Default to the config ns value.
 * @return Promise
 */
const read = (path, data = null, namespace = config.ns) => new Promise(
	(resolve, reject) => {
		(new Webcom(`${config.server}/base/${namespace}/${path}`, config.proxy)).once('value', resolve, reject);
	}
);

/**
 * Logout
 * @param {string} [namespace=config.ns] - The namespace. Default to the config ns value.
 * @return Promise
 */
const logout = (namespace = config.ns) => new Promise(
	(resolve, reject) => {
		(new Webcom(`${config.server}/base/${namespace}`, config.proxy)).logout(err => err ? reject(err) : resolve());
	}
);

/**
 * Initialize a namespace
 * @param {object} rules - the security rules as a JSON object
 * @param {string} [namespace=config.ns] - The namespace. Default to the config ns value.
 * @param {string} [nbUser=5] - the number of users to create (simplelogin:1, ..., simplelogin:<nbUser>)
 * @return Function
 */
export const initNamespace = (rules, namespace = config.ns, nbUser = 5) => done => {
	console.info(`\n  \u2622 ${namespace}\n`);
	auth(admin_jwt, 'accounts')
		.then(() => {
			console.warn('auth success');
			return createNamespace(admin_jwt, namespace);
		})
		.then(() => {
			console.warn(`namespace ${namespace} created`);
			return adminToken(admin_jwt, namespace)
		})
		.then((token) => {
			console.warn(`admin token for namespace ${namespace} ok`);
			return putRules(token, rules, namespace);
		})
		.then(() => {
			console.warn(`rules set for namespace ${namespace}`);
			const users = range(1, nbUser + 1).map(id => createUser(`user${id}@reach.io`, namespace));
			return Promise.all(users);
		})
		.then(() => {
			console.warn(`users created for namespace ${namespace}`);
			return createUser('user.authenticated@reach.io', namespace);
		})
		.then(() => {
			console.warn(`default authenticated user created for namespace ${namespace}`);
			authenticated = find(simplelogin, {email: 'user.authenticated@reach.io'})
			done();
		})
		.catch(done);
};

/**
 * Destroy a namespace
 * @param {string} [namespace=config.ns] - The namespace. Default to the config ns value.
 * @return Function
 */
export const destroyNamespace = (namespace = config.ns) => done => {
	const users = Object.keys(simplelogin).map(id => deleteUser(simplelogin[id].email, namespace));
	Promise.all(users)
		.then(() => deleteNamespace(admin_jwt, namespace))
		.then(() => done())
		.catch(done);
};

/**
 * Reset a namespace (i.e. put default dataset)
 * @param {object} data - The dataset
 * @param {string} [namespace=config.ns] - The namespace. Default to the config ns value.
 * @return Function
 */
export const resetNamespace = (data, namespace = config.ns) => done => {
	adminToken(admin_jwt, namespace)
		.then((token) => auth(token, namespace))
		.then(() => set('', data, namespace))
		.then(() => done())
		.catch(done);
};

/**
 * Security rules chai plugin
 */
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

		let token = false;
		let user = 'Unauthenticated user';
		if(this._obj == true) {
			token = authenticated.token;
			user = 'Authenticated user'
		} else if(this._obj != false) {
			token = this._obj.token;
			user = `${this._obj.email} (${this._obj.uid})`
		}

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

		(token ? auth(token) : logout()).then(() => {
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
	authenticated: true,
	password: (id) => id ? simplelogin[id] : authenticated
};
