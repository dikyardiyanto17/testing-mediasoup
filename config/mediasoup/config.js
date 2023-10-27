const webRtcTransport_options = {
	listenIps: [
		{
			// ip: '127.0.0.1',
			// ip: '192.168.206.123',
			// ip: '192.168.205.229',
			// ip: "192.168.18.68", // Laptop Jaringan 5G
			// ip: "203.194.113.166", // VPS Mr. Indra IP
			ip: '203.175.10.29' // My VPS
			// ip: '192.168.3.135' // IP Kost
			// announcedIp: "88.12.10.41"
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
]

const listenInfo = {
	listenInfos: [
		{
			protocol: "udp",
			// ip: "0.0.0.0",
			// ip: "9.9.9.9",
			// ip: '127.0.0.1',
			// ip: '192.168.206.123',
			// ip: '192.168.205.229',
			ip: "192.168.18.68", // Laptop Jaringan 5G
			// ip: "203.194.113.166", // VPS Mr. Indra IP
			// ip: '203.175.10.29' // My VPS
			// ip: '192.168.3.135' // IP Kost
			// announcedIp: "88.12.10.41"
		},
		{
			protocol: "tcp",
			// ip: "0.0.0.0",
			// ip: "9.9.9.9",
			// ip: '127.0.0.1',
			// ip: '192.168.206.123',
			// ip: '192.168.205.229',
			ip: "192.168.18.68", // Laptop Jaringan 5G
			// ip: "203.194.113.166", // VPS Mr. Indra IP
			// ip: '203.175.10.29' // My VPS
			// ip: '192.168.3.135' // IP Kost
			// announcedIp: "88.12.10.41"
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
