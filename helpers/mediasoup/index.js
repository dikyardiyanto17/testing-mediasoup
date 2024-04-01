const mediasoup = require("mediasoup")
const { webRtcTransport_options } = require("../../config/mediasoup/config")

class Mediasoup_Parameter {
	transports = []
	producers = []
	consumers = []
}

const createWorker = async () => {
	try {
		let worker = await mediasoup.createWorker({
			// rtcMinPort: 9500,
			// rtcMaxPort: 10000,
			// logLevel: "debug",
			// logTags: ['ice', 'dtls']
		})

		worker.on("died", (error) => {
			console.log(error)
			setTimeout(() => process.exit(1), 2000)
		})

		return worker
	} catch (error) {
		console.log("- Error Creating Worker : ", error)
	}
}

const createWebRtcTransport = async ({ router, serverParameter }) => {
	try {
		let configuration = {
			webRtcServer: serverParameter.webRtcServer,
			enableUdp: true,
			enableTcp: true,
			preferUdp: true,
		}
		// let transport = await router.createWebRtcTransport(webRtcTransport_options)
		// console.log("- Server Parameter : ", serverParameter.webRtcServer)
		let transport = await router.createWebRtcTransport(configuration)
		// let transport = await router.createPlainTransport({
		// 	listenIp: "fe80::8f12:b0cd:e3ae:a185",
		// 	listenIp: "192.168.18.68",
		// })

		transport.on("dtlsstatechange", (dtlsState) => {
			if (dtlsState === "closed") {
				transport.close()
			}
		})

		transport.on("close", () => {
			console.log("transport closed")
		})

		return transport
	} catch (error) {
		console.log("- Error Creating WebRTC Transport : ", error)
	}
}

const getTransport = ({ socketId, mediasoupParameter }) => {
	try {
		const [producerTransport] = mediasoupParameter.transports.filter((transport) => transport.socketId === socketId && !transport.consumer)
		return producerTransport.transport
	} catch (error) {
		console.log("- Error Get Transport : ", error)
	}
}

const informConsumer = ({ roomName, socketId, producerId, mediasoupParameter, serverParameter }) => {
	try {
		mediasoupParameter.producers.forEach((producerData) => {
			if (producerData.socketId !== socketId && producerData.roomName === roomName) {
				const producerSocket = serverParameter.allUsers[producerData.socketId].socket
				producerSocket.emit("new-producer", { producerId, socketId })
			}
		})
	} catch (error) {
		console.log("- Error Informing New Consumer : ", error)
	}
}
module.exports = { createWorker, Mediasoup_Parameter, createWebRtcTransport, getTransport, informConsumer }
