// let ipServer = '127.0.0.1'
// let ipServer = "192.168.206.123"
// let ipServer = '192.168.205.229'
// let ipServer = "203.194.113.166" // VPS Mr. Indra IP
// let ipServer = "203.175.10.29" // My VPS
let ipServer = "192.168.18.68" // Laptop Jaringan 5G
// let ipServer = '192.168.3.135' // IP Kost

const webRtcTransport_options = {
	listenIps: [
		{
			ip: "0.0.0.0",
			announcedIp: ipServer,
		},
	],
	enableUdp: true,
	enableTcp: true,
	preferUdp: true,
}

const mediaCodecs = [
	{
		kind: "audio",
		mimeType: "audio/opus",
		clockRate: 48000,
		channels: 2,
	},
	{
		kind: "video",
		mimeType: "video/VP8",
		clockRate: 90000,
		parameters: {
			"x-google-start-bitrate": 1000,
		},
	},
	{
		kind: "video",
		mimeType: "video/VP9",
		clockRate: 90000,
		parameters: {
			"profile-id": 2,
			"x-google-start-bitrate": 1000,
		},
	},
	{
		kind: "video",
		mimeType: "video/h264",
		clockRate: 90000,
		parameters: {
			"packetization-mode": 1,
			"profile-level-id": "4d0032",
			"level-asymmetry-allowed": 1,
			"x-google-start-bitrate": 1000,
		},
	},
	{
		kind: "video",
		mimeType: "video/h264",
		clockRate: 90000,
		parameters: {
			"packetization-mode": 1,
			"profile-level-id": "42e01f",
			"level-asymmetry-allowed": 1,
			"x-google-start-bitrate": 1000,
		},
	},
]

const listenInfo = {
	listenInfos: [
		{
			protocol: "udp",
			ip: "0.0.0.0",
			announcedIp: ipServer,
			// port: 20333
		},
		{
			protocol: "tcp",
			ip: "0.0.0.0",
			announcedIp: ipServer,
			// port: 80
		},
	],
}

class Mediasoup {
	constructor() {
		this.worker
		this.rooms = {}
		this.peers = {}
		this.transports = []
		this.producers = []
		this.consumers = []
		this.roomsSocketCollection = {}
		this.allWorkers = {
			worker1: null,
			worker2: null,
			worker3: null,
			worker4: null,
		}
	}
}

module.exports = { webRtcTransport_options, Mediasoup, mediaCodecs, listenInfo }
