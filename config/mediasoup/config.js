// let ipServer = '127.0.0.1'
// let ipServer = "192.168.206.123"
// let ipServer = '192.168.205.229'
// let ipServer = "203.194.113.166" // VPS Mr. Indra IP
// let ipServer = "203.175.10.29" // My VPS
// let ipServer = "192.168.18.68" // Laptop Jaringan 5G
// let ipServer = '192.168.3.135' // IP Kost
// let ipServer = "192.168.3.208"
// let ipServer = "117.54.234.54" // RDS POC PKT CO ID
// let ipServer = "192.168.205.198" // Server Local
// let ipServer = "192.168.205.229" // RDS co.id
// let ipServer = "192.168.202.41" // RDS DEV
// let ipServer = "117.54.234.54" // Server Public
// let ipServer = "test-meet.dikyardiyanto.site"
// let ipServer = "172.67.159.191" // test-meet ip dns cloudflare
// let ipServer = "104.21.9.106" // test-meet ip dns cloudflare
// let ipServer = "192.168.100.14" // Gemoy
// let ipServer = "192.168.3.237" // Indonesia Merdeka
let ipServer = "147.139.136.209" // Wire Guard
// let ipServer = "103.119.141.42"

// let privateIp = "103.119.141.42"
// let privateIp = "192.168.100.14"
let privateIp = "10.10.28.2"
// let privateIp = "0.0.0.0"

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
			ip: privateIp,
			// ip: "192.168.205.229",
			// ip: "192.168.18.68",
			// ip: "127.0.0.1",
			announcedIp: ipServer,
			// announcedIp: privateIp,
			// announcedIp: "192.168.205.229",
			port: 1028
		},
		{
			protocol: "tcp",
			ip: privateIp,
			// ip: "192.168.205.229",
			// ip: "192.168.18.68",
			// ip: "127.0.0.1",
			announcedIp: ipServer,
			// announcedIp: privateIp,
			// announcedIp: "192.168.205.229",
			port: 1028
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
