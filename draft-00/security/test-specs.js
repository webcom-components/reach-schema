/* global beforeEach*/

/*eslint max-len: [2, 200] */

import chai from 'chai';
import {plugin, initNamespace, resetNamespace, destroyNamespace, users} from '../../.tools/utils/tests';
import data from './test-data.json';
import rules from './rules.json';

chai.use(plugin);

const userData = (n, status = 'CONNECTED', lastSeen = Date.now()) => {
	return {
		name: users.password(n).email,
		status,
		lastSeen
	};
};
const participantData = (role = 'NONE', status = 'CONNECTED', _joined = Date.now()) => {
	return {
		status,
		role,
		_joined
	};
};
const roomData = (owner, status = 'OPENED', name = 'testRoom', _created = Date.now()) => {
	return {
		name,
		owner: users.password(owner).uid,
		status,
		_created
	};
};

describe('DRAFT-00', function() {// eslint-disable-line
	// Don't change this to arrow function as it will mess with the Mocha context (https://mochajs.org/#arrow-functions)
	this.slow(process.env.CI === true && process.env.TRAVIS === true ? 500 : 100);

	// Sets rules & creates users
	before(initNamespace(rules));

	// Reset namespace data
	beforeEach(resetNamespace(data));

	describe('<root>', () => {
		// Root access
		it('Anonymous users cannot read root', done => {
			chai.expect(users.unauthenticated).cannot.read.path('/', done);
		});
		it('Authenticated users cannot read root', done => {
			chai.expect(users.authenticated).cannot.read.path('/', done);
		});
		it('Anonymous users cannot write anything to root', done => {
			chai.expect(users.unauthenticated).cannot.set({test: 'test'}).path('/test', done);
		});
		it('Authenticated users cannot write anything to root', done => {
			chai.expect(users.authenticated).cannot.set({test: 'test'}).path('/test', done);
		});
	});

	describe('users', () => {
		// List users
		it('Anonymous users cannot list users', done => {
			chai.expect(users.unauthenticated).cannot.read.path('/users', done);
		});
		it('Authenticated users can list users', done => {
			chai.expect(users.authenticated).can.read.path('/users', done);
		});

		// Register
		it('Anonymous users cannot register', done => {
			chai.expect(users.unauthenticated).cannot.set(userData()).to.path('/users/toto', done);
		});
		it('Authenticated users can register', done => {
			chai.expect(users.authenticated).can.set(userData()).to.path(`/users/${users.password().uid}`, done);
		});

		// Update user info
		it('Authenticated users cannot write another user\'s data', done => {
			chai.expect(users.password(1)).cannot.set(userData(1)).to.path(`/users/${users.password(2).uid}`, done);
		});
		it('Authenticated users can update status', done => {
			chai.expect(users.authenticated).can.set('SLEEPING').to.path(`/users/${users.password().uid}/status`, done);
		});
	});

	describe('rooms', () => {
		// List rooms
		it('Anonymous users cannot list rooms', done => {
			chai.expect(users.unauthenticated).cannot.read.path('rooms', done);
		});
		it('Anonymous users cannot read a room metadata', done => {
			chai.expect(users.unauthenticated).cannot.read.path('rooms/-room_1/status', done);
		});
		it('Authenticated users can list rooms', done => {
			chai.expect(users.authenticated).can.read.path('rooms', done);
		});

		// Read room data
		it('Anonymous users cannot create a room', done => {
			chai.expect(users.unauthenticated).cannot.push(roomData()).path('rooms', done);
		});
		it('Authenticated users can read a room metadata', done => {
			chai.expect(users.authenticated).can.read.path('rooms/-room_1/status', done);
		});

		// Create room
		it('Anonymous users cannot create a room', done => {
			chai.expect(users.unauthenticated).cannot.push(roomData()).path('rooms', done);
		});
		it('Authenticated users can create a room', done => {
			chai.expect(users.authenticated).can.push(roomData()).path('rooms', done);
		});


		// Update room
		it('Anonymous users cannot modify a room', done => {
			chai.expect(users.unauthenticated).cannot.set('CLOSED').path('rooms/-room_1/status', done);
		});
		it('Authenticated users cannot modify a room if they are not the owner', done => {
			chai.expect(users.password(2)).cannot.set('CLOSED').path('rooms/-room_1/status', done);
		});
		it('The owner can modify a room', done => {
			chai.expect(users.password(1)).can.set('CLOSED').path('rooms/-room_1/status', done);
		});
	});

	describe('_/devices', () => {
		// List users
		it('Anonymous users cannot list devices', done => {
			chai.expect(users.unauthenticated).cannot.read.path(`/_/devices/${users.password(1).uid}`, done);
		});
		it('Authenticated users cannot list devices', done => {
			chai.expect(users.authenticated).cannot.read.path(`/_/devices/${users.password(1).uid}`, done);
		});
		it('a user can list his devices', done => {
			chai.expect(users.password(1)).can.read.path(`/_/devices/${users.password(1).uid}`, done);
		});

		// Update device info
		it('Authenticated users cannot write another user\'s device', done => {
			chai.expect(users.password(2)).cannot.set('DISCONNECTED').to.path(`/_/devices/${users.password(1).uid}/-device_1_1/status`, done);
		});
		it('Authenticated users can update his device status', done => {
			chai.expect(users.password(1)).can.set('DISCONNECTED').to.path(`/_/devices/${users.password(1).uid}/-device_1_1/status`, done);
		});
	});

	describe('_/invites', () => {
		// List invites
		it('Anonymous users cannot read invites', done => {
			chai.expect(users.unauthenticated).cannot.read.path('/_/invites', done);
		});
		it('A user can list his invites', done => {
			chai.expect(users.password(2)).can.read.path(`/_/invites/${users.password(2).uid}`, done);
		});
		it('A user cannot list another user invites', done => {
			chai.expect(users.password(3)).cannot.read.path(`/_/invites/${users.password(2).uid}`, done);
		});

		// Read invite
		it('A user can read an invite he sent', done => {
			chai.expect(users.password(3)).can.read.path(`/_/invites/${users.password(2).uid}/-invite-3`, done);
		});
		it('A user cannot read an invite he did not send', done => {
			chai.expect(users.password(1)).cannot.read.path(`/_/invites/${users.password(2).uid}/-invite-3`, done);
		});

		// Update invite
		it('A user can change the status of an invite he sent', done => {
			chai.expect(users.password(3)).can.set('CANCELED').path(`/_/invites/${users.password(2).uid}/-invite-3/status`, done);
		});
		it('A user cannot change the status of an invite he did not send', done => {
			chai.expect(users.password(1)).cannot.set('CANCELED').path(`/_/invites/${users.password(2).uid}/-invite-3/status`, done);
		});
		it('A user cannot make an invite his own', done => {
			chai.expect(users.password(1)).cannot.set(users.password(1).uid).path(`/_/invites/${users.password(2).uid}/-invite-3/from`, done);
		});
	});

	describe('_/rooms', () => {
		// List rooms
		it('Anonymous users cannot list _rooms', done => {
			chai.expect(users.unauthenticated).cannot.read.path('_/rooms', done);
		});
		it('Authenticated users cannot read _rooms', done => {
			chai.expect(users.authenticated).cannot.read.path('_/rooms', done);
		});

		// Read room private data
		it('Anonymous users cannot read a room private data', done => {
			chai.expect(users.unauthenticated).cannot.read.path('_/rooms/-room_1', done);
		});
		it('Authenticated users cannot read a room private data', done => {
			chai.expect(users.authenticated).cannot.read.path('_/rooms/-room_1', done);
		});
	});

	describe('_/rooms/{roomId}/participants', () => {
		// List participants
		it('Anonymous users cannot list the participants of a room', done => {
			chai.expect(users.unauthenticated).cannot.read.path('_/rooms/-room_1/participants', done);
		});
		it('Authenticated users cannot list the participants of a room if they are not a participant', done => {
			chai.expect(users.authenticated).cannot.read.path('_/rooms/-room_1/participants', done);
		});
		it('Participants users can list the participants of a room', done => {
			chai.expect(users.password(1)).can.read.path('_/rooms/-room_1/participants', done);
		});

		// Read participant infos
		it('Anonymous users cannot read a participant\'s data', done => {
			chai.expect(users.unauthenticated).cannot.read.path(`_/rooms/-room_1/participants/${users.password(1).uid}`, done);
		});
		it('Authenticated users cannot read a participant\'s data if they are not a participant', done => {
			chai.expect(users.authenticated).cannot.read.path(`_/rooms/-room_1/participants/${users.password(1).uid}`, done);
		});
		it('Participants users can read a participant\'s data', done => {
			chai.expect(users.password(2)).can.read.path(`_/rooms/-room_1/participants/${users.password(1).uid}`, done);
		});

		// Add participant
		it('Owner can add a new participant', done => {
			chai.expect(users.password(2)).can.update(participantData()).path(`_/rooms/-room_3/participants/${users.password(4).uid}`, done);
		});
		it('Moderator can add a new participant', done => {
			chai.expect(users.password(1)).can.update(participantData()).path(`_/rooms/-room_3/participants/${users.password(5).uid}`, done);
		});
		it('Any connected User can join an open room', done => {
			chai.expect(users.password(1)).can.set(participantData()).path(`_/rooms/-room_4/participants/${users.password(1).uid}`, done);
		});

		// Udpate participant infos (join, role)
		it('Participant can change its status', done => {
			chai.expect(users.password(3)).can.set('SLEEPING').path(`_/rooms/-room_3/participants/${users.password(3).uid}/status`, done);
		});
		it('Participant can not change his role to MODERATOR', done => {
			chai.expect(users.password(3)).cannot.set('MODERATOR').path(`_/rooms/-room_3/participants/${users.password(3).uid}/role`, done);
		});
		it('Moderator can promote another participant to MODERATOR', done => {
			chai.expect(users.password(1)).can.set('MODERATOR').path(`_/rooms/-room_3/participants/${users.password(3).uid}/role`, done);
		});
		it('Moderator can change its role to simple participant', done => {
			chai.expect(users.password(1)).can.set('NONE').path(`_/rooms/-room_3/participants/${users.password(1).uid}/role`, done);
		});

		// Remove participant
		it('Participant can remove itself', done => {
			chai.expect(users.password(3)).can.remove.path(`_/rooms/-room_3/participants/${users.password(3).uid}`, done);
		});
		it('Moderator can remove participant', done => {
			chai.expect(users.password(1)).can.remove.path(`_/rooms/-room_3/participants/${users.password(3).uid}`, done);
		});
		it('Owner can remove participant', done => {
			chai.expect(users.password(2)).can.remove.path(`_/rooms/-room_3/participants/${users.password(1).uid}`, done);
		});
	});

	describe('_/rooms/{roomId}/streams', () => {
		// List streams
		it('Anonymous users cannot list the streams of a room', done => {
			chai.expect(users.unauthenticated).cannot.read.path('_/rooms/-room_2/streams', done);
		});
		it('Authenticated users cannot list the streams of a room if they are not a participant', done => {
			chai.expect(users.authenticated).cannot.read.path('_/rooms/-room_2/streams', done);
		});
		it('Participants users can list the streams of a room', done => {
			chai.expect(users.password(1)).can.read.path('_/rooms/-room_3/streams', done);
		});

		// Read stream info
		it('Anonymous users cannot read a stream\'s data', done => {
			chai.expect(users.unauthenticated).cannot.read.path('_/rooms/-room_3/streams/-stream_3_1', done);
		});
		it('Authenticated users cannot read a stream\'s data if they are not a participant', done => {
			chai.expect(users.authenticated).cannot.read.path('_/rooms/-room_3/streams/-stream_3_1', done);
		});
		it('Participants users can read a stream\'s data', done => {
			chai.expect(users.password(2)).can.read.path('_/rooms/-room_3/streams/-stream_3_1', done);
		});

		// Create stream
		it('Anonymous users cannot add a new stream', done => {
			chai.expect(users.unauthenticated).cannot.push({
				from : users.password(5).uid,
				device : '-device_5_1',
				type : 'audio'
			}).path('_/rooms/-room_3/streams', done);
		});
		it('Authenticated users cannot add a new stream if they are not a participant', done => {
			chai.expect(users.authenticated).cannot.push({
				from : users.password(5).uid,
				device : '-device_5_1',
				type : 'audio'
			}).path('_/rooms/-room_3/streams', done);
		});
		it('Participant can add a new stream', done => {
			chai.expect(users.password(3)).can.push({
				from : users.password(3).uid,
				device : '-device_3_1',
				type : 'audio',
				muted: {audio: false, video: false}
			}).path('_/rooms/-room_3/streams', done);
		});

		// Remove Stream
		it('Publisher can remove his stream', done => {
			chai.expect(users.password(3)).can.remove.path('_/rooms/-room_3/streams/-stream_3_3', done);
		});
		it('Moderator can remove a stream', done => {
			chai.expect(users.password(1)).can.remove.path('_/rooms/-room_3/streams/-stream_3_1', done);
		});
		it('Owner can remove a stream', done => {
			chai.expect(users.password(2)).can.remove.path('_/rooms/-room_3/streams/-stream_3_1', done);
		});
	});

	describe('_/rooms/{roomId}/subscribers', () => {
		// List subscribers
		it('Anonymous users cannot list the subscribers of a stream within a room', done => {
			chai.expect(users.unauthenticated).cannot.read.path('_/rooms/-room_2/subscribers', done);
		});
		it('Authenticated users cannot list the subscribers of a stream within a room if they are not a participant', done => {
			chai.expect(users.authenticated).cannot.read.path('_/rooms/-room_2/subscribers', done);
		});
		it('Participants users can list the subscribers of a stream within a room', done => {
			chai.expect(users.password(1)).can.read.path('_/rooms/-room_3/subscribers', done);
		});

		// Subscribe
		it('Participant can subscribe to a stream', done => {
			chai.expect(users.password(3)).can.set({
				to: users.password(3).uid,
				_created: Date.now()
			}).path('_/rooms/-room_3/subscribers/-stream_3_1/-device_3_1', done);
		});

		// Unsubscribe
		it('Participant can unsubscribe to a stream', done => {
			chai.expect(users.password(3)).can.remove.path('_/rooms/-room_3/subscribers/-stream_3_2/-device_3_2', done);
		});
		it('Publisher can remove the subscribers', done => {
			chai.expect(users.password(3)).can.remove.path('_/rooms/-room_3/subscribers/-stream_3_3', done);
		});
		it('Moderator can remove the subscribers', done => {
			chai.expect(users.password(1)).can.remove.path('_/rooms/-room_3/subscribers/-stream_3_1', done);
		});
		it('Owner can remove a subscriber', done => {
			chai.expect(users.password(2)).can.remove.path('_/rooms/-room_3/subscribers/-stream_3_1', done);
		});
	});

	describe('_/rooms/{roomId}/messages', () => {
		// List messages
		it('Anonymous users cannot list the messages of a room', done => {
			chai.expect(users.unauthenticated).cannot.read.path('_/rooms/-room_1/messages', done);
		});
		it('Authenticated users cannot list the messages of a room if they are not a participant', done => {
			chai.expect(users.authenticated).cannot.read.path('_/rooms/-room_3/messages', done);
		});
		it('Participants users can list the messages of a room', done => {
			chai.expect(users.password(1)).can.read.path('_/rooms/-room_3/messages', done);
		});

		// Create message
		it('Participants can add a new message', done => {
			chai.expect(users.password(1)).can.push({
				from: users.password(1).uid,
				text: users.password(1).email,
				_created: Date.now()
			}).path('_/rooms/-room_3/messages', done);
		});

		// Modify message
		it('Participants cannot modify another participant\'s message', done => {
			chai.expect(users.password(3)).cannot.set(users.password(1).email).path('_/rooms/-room_3/messages/-msg_1/text', done);
		});
		it('Moderators can modify another participant\'s message', done => {
			chai.expect(users.password(1)).can.set(users.password(1).email).path('_/rooms/-room_3/messages/-msg_3/text', done);
		});
		it('Owner can modify another participant\'s message', done => {
			chai.expect(users.password(2)).can.set(users.password(2).email).path('_/rooms/-room_3/messages/-msg_1/text', done);
		});

		// Remove message
		it('Participants can remove their message', done => {
			chai.expect(users.password(3)).can.remove.path('_/rooms/-room_3/messages/-msg_3', done);
		});
		it('Moderators can remove another participant\'s message', done => {
			chai.expect(users.password(1)).can.remove.path('_/rooms/-room_3/messages/-msg_3', done);
		});
		it('Owner can remove another participant\'s message', done => {
			chai.expect(users.password(2)).can.remove.path('_/rooms/-room_3/messages/-msg_1', done);
		});
	});

	describe('_/webrtc', () => {
		// List PeerConnections
		it('Anonymous users cannot list PeerConnections', done => {
			chai.expect(users.unauthenticated).cannot.read.path('_/webrtc', done);
		});
		it('Authenticated users cannot list PeerConnections', done => {
			chai.expect(users.password(3)).cannot.read.path('_/webrtc', done);
		});

		// Read PeerConnections infos
		it('Anonymous users cannot read PeerConnections infos', done => {
			chai.expect(users.unauthenticated).cannot.read.path('_/webrtc/-device_1_1--device_2_2', done);
		});
		it('Authenticated users cannot read another User\'s PeerConnections infos', done => {
			chai.expect(users.password(3)).cannot.read.path('_/webrtc/-device_1_1--device_2_2', done);
		});
		it('Authenticated users can read his PeerConnections infos', done => {
			chai.expect(users.password(2)).can.read.path('_/webrtc/-device_1_1--device_2_2', done);
		});

		// Write PeerConnections infos
		const pcData = {
			'-device_1_1': {sdp: {type: 'offer', sdp: 'offer SDP'}},
			'-device_2_2': {sdp: {type: 'answer', sdp: 'answer SDP'}}
		};
		it('Anonymous users cannot add a PeerConnection', done => {
			chai.expect(users.unauthenticated).cannot.set(pcData).path('_/webrtc/-device_1_1--device_2_2/-stream_1_2', done);
		});
		it('Authenticated users cannot add another User\'s PeerConnection', done => {
			chai.expect(users.authenticated).cannot.set(pcData).path('_/webrtc/-device_1_1--device_2_2/-stream_1_2', done);
		});
		it('Authenticated users can create a new PeerConnections', done => {
			chai.expect(users.password(2)).can.set(pcData).path('_/webrtc/-device_1_1--device_2_2/-stream_1_2', done);
		});

		// Create
		it('Authenticated users can create a Device PeerConnections ', done => {
			const d = {};
			d[users.password(2).uid] = true;
			d[users.password(3).uid] = true;
			chai.expect(users.password(2)).can.set(d).path('_/webrtc/-device_2_1--device_3_2', done);
		});
	});

	describe('_/ice', () => {
		it('Anonymous users can list ICE servers configurations', done => {
			chai.expect(users.unauthenticated).can.read.path('_/ice/', done);
		});
		it('Authenticated users can list ICE servers configurations', done => {
			chai.expect(users.authenticated).can.read.path('_/ice/', done);
		});
	});

	// Remove users & namespace
	after(destroyNamespace());
});
