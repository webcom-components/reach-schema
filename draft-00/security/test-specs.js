/* global describe, before, it, xit*/

const chai = require('chai');
const expect = chai.expect;
const targaryen = require('targaryen');
const anonymous = targaryen.users.unauthenticated;
const authenticated = targaryen.users.password;

chai.use(targaryen.chai);

const userData = (name, status, lastSeen) => {
	return {name: name || 'user1', status: status || 'CONNECTED', lastSeen: lastSeen || Date.now()};
};
const roomData = (u, s, n, c) => {
	return {
		meta: {
			name: n || 'testRoom',
			owner: u || 'simplelogin:1',
			status: s || 'OPENED',
			_created: c || Date.now()
		},
		participants: {
			'simplelogin:1': {
				status: 'CONNECTED',
				role: 'OWNER'
			}
		}
	};
};

describe('Security rules test for \'DRAFT-00\':', () => {
	before(() => {
		targaryen.setFirebaseData(require('./test-data.json'));
		targaryen.setFirebaseRules(require('./rules.json'));
	});
	describe('/', () => {
		it('Unauthenticated users cannot read anything under root', () => expect(anonymous).cannot.read.path('/'));
		it('Unauthenticated users cannot write to root', () => expect(anonymous).cannot.write.to.path('/'));
		it('Authenticated users cannot read anything under root', () => expect(authenticated).cannot.read.path('/'));
		it('Authenticated users cannot write to root', () => expect(authenticated).cannot.write.to.path('/'));
	});
	describe('/users', () => {
		it('Unauthenticated users cannot read anything under /users', () => {
			expect(anonymous).cannot.read.path('users');
			expect(anonymous).cannot.read.path('users/simplelogin:1/name');
		});
		it('Unauthenticated users cannot register (i.e. add itself to the list)', () => {
			expect(anonymous).cannot.write(userData('user3')).to.path('users/simplelogin:3');
		});
		it('Authenticated users can read everything under /users', () => {
			expect(authenticated).can.read.path('users');
			expect(authenticated).can.read.path('users/simplelogin:1/name');
		});
		it('Authenticated users can register (i.e. add itself to the list)', () => {
			expect({uid: 'simplelogin:3'}).can.write(userData('user3')).to.path('users/simplelogin:3');
		});
		xit('Authenticated users can update status (i.e. add itself to the list)', () => {
			// TODO Should work but doesn't with targaryen (maybe a bug) since it applies the User schema to the update
			expect({uid: 'simplelogin:3'}).can.write('SLEEPING').to.path('users/simplelogin:3/status');
		});
		it('Authenticated users cannot write another user\'s data', () => {
			expect({uid: 'simplelogin:2'}).cannot.write(userData()).to.path('users/simplelogin:1');
		});
	});
	describe('/rooms', () => {
		it('Unauthenticated users cannot read list rooms & read metadata', () => {
			expect(anonymous).cannot.read.path('rooms');
			expect(anonymous).cannot.read.path('rooms/-K85HVr9Ke3yXovthoL7/meta');
		});
		it('Unauthenticated users cannot create a room',
			() => expect(anonymous).cannot.write(roomData()).path('rooms/-testRoomId')
		);
		it('Authenticated users can list rooms & read metadata', () => {
			expect(authenticated).can.read.path('rooms');
			expect(authenticated).can.read.path('rooms/-K85HVr9Ke3yXovthoL7/meta');
		});
		xit('Authenticated users cannot read participants & streams unless he is a participant of the room', () => {
			//expect({uid: 'simplelogin:2'}).can.read.path('rooms/-K85HVr9Ke3yXovthoL7/participants');
			expect({uid: 'simplelogin:3'}).cannot.read.path('rooms/-K85HVr9Ke3yXovthoL7/participants');
		});
	});
	describe('/invites', () => {
		it('Unauthenticated users cannot read /invites',
			() => expect(anonymous).cannot.read.path('invites')
		);
	});
	describe('/_webrtc', () => {
		it('Unauthenticated users cannot read /_webrtc',
			() => expect(anonymous).cannot.read.path('_webrtc')
		);
	});
	describe('/_iceServers', () => {
		it('Unauthenticated users can read /_iceServers',
			() => expect(anonymous).can.read.path('_iceServers')
		);
	});
});