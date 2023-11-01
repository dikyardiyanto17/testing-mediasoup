// let ip = '127.0.0.1'
// let ip = "192.168.206.123"
// let ip = '192.168.205.229'
let ip = "203.194.113.166" // VPS Mr. Indra IP
// let ip = '203.175.10.29' // My VPS
// let ip = "192.168.18.68" // Laptop Jaringan 5G
// let ip = '192.168.3.135' // IP Kost

const webRtcTransport_options = {
	listenIps: [
		{
			ip,
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
		mimeType: "video/vp9",
		clockRate: 90000,
		parameters: {
			"x-google-start-bitrate": 1000,
			"profile-id": 2,
		},
	},
	{
		kind: "video",
		mimeType: "video/H264",
		clockRate: 90000,
		parameters: {
			"x-google-start-bitrate": 1000,
			"packetization-mode": 1,
			"profile-level-id": "42e01f",
			"level-asymmetry-allowed": 1,
		},
	},
	{
		kind: "video",
		mimeType: "video/VP8",
		clockRate: 90000,
		parameters: {
			"x-google-start-bitrate": 1000,
		},
	},
]

const listenInfo = {
	listenInfos: [
		{
			protocol: "udp",
			ip,
		},
		{
			protocol: "tcp",
			ip,
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
