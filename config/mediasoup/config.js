// let publicIp = '127.0.0.1'
// let publicIp = "192.168.206.123"
// let publicIp = '192.168.205.229'
// let publicIp = '192.168.3.135' // IP Kost
// let publicIp = "192.168.3.208"
// let publicIp = "117.54.234.54" // RDS POC PKT CO ID
// let publicIp = "192.168.205.198" // Server Local
// let publicIp = "192.168.202.41" // RDS DEV
// let publicIp = "117.54.234.54" // Server Public
// let publicIp = "test-meet.dikyardiyanto.site"
// let publicIp = "172.67.159.191" // test-meet ip dns cloudflare
// let publicIp = "104.21.9.106" // test-meet ip dns cloudflare
// let publicIp = "192.168.100.14" // Gemoy
// let publicIp = "192.168.201.42" // RDS Server
// let publicIp = "203.194.113.166" // VPS Mr. Indra IP
// let publicIp = "203.175.10.29" // My VPS
let publicIp = "192.168.205.229" // RDS co.id
// let publicIp = "192.168.18.68" // Laptop Jaringan 5G
// let publicIp = "147.139.136.209" // Wire Guard
// let publicIp = "192.168.3.237" // Indonesia Merdeka
// let publicIp = "103.119.141.42"

// let privateIp = "103.119.141.42"
// let privateIp = "192.168.100.14"
// let privateIp = "10.10.28.2"
let privateIp = "0.0.0.0"

const webRtcTransport_options = {
	listenIps: [
		{
			ip: "0.0.0.0",
			announcedIp: publicIp,
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
			announcedIp: publicIp,
			// port: 1051,
		},
		{
			protocol: "tcp",
			ip: privateIp,
			announcedIp: publicIp,
			// port: 1051,
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
