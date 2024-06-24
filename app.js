const express = require("express")
const cors = require("cors")
const router = require("./routes/index.js")
const app = express()
// const port = 3001
// const port = 1028
const port = 9188
// const port = 1028
// const port = 80
const http = require("http")
const path = require("path")
const https = require("httpolyglot")
const { Server } = require("socket.io")
const mediasoup = require("mediasoup")
const { options } = require("./certif")
const { mediaCodecs, listenInfo } = require("./config/mediasoup/config")
const { Server_Parameter } = require("./helpers/server_parameters.js")
const { Room } = require("./helpers/rooms.js")
const { Users } = require("./helpers/users.js")
const {
	createWorker,
	Mediasoup_Parameter,
	createWebRtcTransport,
	getTransport,
	informConsumer,
	getMediasoupSupportedRTPCapabilities,
} = require("./helpers/mediasoup/index.js")

app.use(cors())
app.set("view engine", "ejs")
app.use(express.static(path.join(__dirname, "views")))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.use(express.static("public"))
app.use(express.static(path.join(__dirname, "public")))

const httpsServer = https.createServer(options, app)
httpsServer.listen(port, () => {
	console.log("App On : " + port)
})
const io = new Server(httpsServer, {
	// pingInterval: 5000,
	// pingTimeout: 6000,
})

// const httpServer = http.createServer(app)
// httpServer.listen(port, () => {
// 	console.log("App On : " + port)
// })
// const io = new Server(httpServer, {
// 	// pingInterval: 7000,
// 	// pingTimeout: 8000,
// })

let serverParameter = new Server_Parameter()
let mediasoupParameter = new Mediasoup_Parameter()

const init = async () => {
	try {
		serverParameter.worker = await createWorker()
		serverParameter.webRtcServer = await serverParameter.worker.createWebRtcServer(listenInfo)
	} catch (error) {
		console.log("- Failed Initialization : ", error)
	}
}

init()

io.on("connection", async (socket) => {
	socket.emit("connection-success", {
		socketId: socket.id,
	})

	socket.on("disconnect", () => {
		try {
			console.log("- Disconnected : ", socket.id)

			if (!serverParameter.allUsers[socket.id]) {
				return
			}
			serverParameter.allUsers[socket.id].producers.forEach((producerId) => {
				socket.emit("producer-closed", { remoteProducerId: producerId, socketId: socket.id })
			})
			mediasoupParameter.consumers.forEach((consumerData) => {
				if (consumerData.socketId == socket.id) {
					consumerData.consumer.close()
				}
			})

			mediasoupParameter.consumers = mediasoupParameter.consumers.filter((data) => data.socketId !== socket.id)

			mediasoupParameter.producers.forEach((producerData) => {
				if (producerData.socketId == socket.id) {
					producerData.producer.close()
				}
			})

			mediasoupParameter.producers = mediasoupParameter.producers.filter((data) => data.socketId !== socket.id)

			mediasoupParameter.transports.forEach((transportData) => {
				if (transportData.socketId == socket.id) {
					transportData.transport.close()
				}
			})

			mediasoupParameter.transports = mediasoupParameter.transports.filter((data) => data.socketId !== socket.id)

			serverParameter.allRooms[serverParameter.allUsers[socket.id].roomName].participants = serverParameter.allRooms[
				serverParameter.allUsers[socket.id].roomName
			].participants.filter((user) => user.socketId !== socket.id)

			if (serverParameter.allRooms[serverParameter.allUsers[socket.id].roomName].participants.length == 0) {
				serverParameter.allRooms[serverParameter.allUsers[socket.id].roomName].router.close()
				delete serverParameter.allRooms[serverParameter.allUsers[socket.id].roomName]
			}
			delete serverParameter.allUsers[socket.id]
		} catch (error) {
			console.log("- Error Disconnected : ", error)
		}
	})

	socket.on("joinRoom", async ({ roomName, username }, callback) => {
		try {
			let router
			if (!serverParameter.allRooms[roomName]) {
				router = await serverParameter.worker.createRouter({ mediaCodecs })
				serverParameter.allRooms[roomName] = new Room(roomName, router)
				serverParameter.allRooms[roomName].participants = []
			} else {
				router = serverParameter.allRooms[roomName].router
			}
			serverParameter.allRooms[roomName].participants = [...serverParameter.allRooms[roomName].participants, new Users(username, socket.id, roomName)]
			serverParameter.allUsers[socket.id] = { socketId: socket.id, roomName, socket, producers: [], consumers: [], transports: [] }
			const rtpCapabilities = router.rtpCapabilities
			callback({ rtpCapabilities })
		} catch (error) {
			console.log("- Error Joining Room : ", error)
		}
	})

	socket.on("create-webrtc-transport", async ({ consumer, roomName }, callback) => {
		try {
			let router = serverParameter.allRooms[roomName].router
			const transport = await createWebRtcTransport({ router, serverParameter })
			transport.setMaxIncomingBitrate(1500000)
			transport.setMaxOutgoingBitrate(1500000)
			let username
			const editParticipants = serverParameter.allRooms[roomName].participants.map((data) => {
				if (data.socketId == socket.id) {
					data.transports = [...data.transports, transport.id]
					username = data.username
				}
				return data
			})
			mediasoupParameter.transports = [...mediasoupParameter.transports, { socketId: socket.id, transport, roomName, consumer, username }]
			serverParameter.allRooms[roomName].participants = [...editParticipants]
			serverParameter.allUsers[socket.id].transports = [...serverParameter.allUsers[socket.id].transports, transport.id]

			callback({
				params: {
					id: transport.id,
					iceParameters: transport.iceParameters,
					iceCandidates: transport.iceCandidates,
					dtlsParameters: transport.dtlsParameters,
				},
			})
		} catch (error) {
			console.log("- Error Creating WebRTC Transport : ", error)
		}
	})

	socket.on("transport-connect", ({ dtlsParameters }) => {
		try {
			getTransport({ socketId: socket.id, mediasoupParameter })
				.connect({ dtlsParameters })
				.catch((error) => {
					console.log("- Error Connecting Transport : ", error)
				})
		} catch (error) {
			console.log("- Error Connecting Transport Connect : ", error)
		}
	})

	socket.on("transport-produce", async ({ kind, rtpParameters, appData, roomName }, callback) => {
		try {
			rtpParameters.rtcp = { reducedSize: true }
			const producer = await getTransport({ socketId: socket.id, mediasoupParameter }).produce({
				kind,
				rtpParameters,
				appData,
				keyFrameRequestDelay: 1000,
			})
			let username
			const editParticipants = serverParameter.allRooms[roomName].participants.map((data) => {
				if (data.socketId == socket.id) {
					data.producers = [...data.producers, producer.id]
					username = data.username
				}
				return data
			})
			mediasoupParameter.producers = [...mediasoupParameter.producers, { producer, socketId: socket.id, roomName, username }]

			serverParameter.allRooms[roomName].participants = [...editParticipants]
			serverParameter.allUsers[socket.id].producers = [...serverParameter.allUsers[socket.id].producers, producer.id]

			producer.on("transportclose", () => {
				producer.close()
			})

			serverParameter.allRooms[roomName].participants.forEach((user) => {
				if (user.socketId !== socket.id && kind == "audio") {
					socket.to(user.socketId).emit("new-user-notification", { username, picture: appData.picture })
				}
			})

			informConsumer({ roomName, socketId: socket.id, producerId: producer.id, mediasoupParameter, serverParameter })

			callback({ kind, id: producer.id, producersExist: serverParameter.allRooms[roomName].participants.length > 1 ? true : false })
		} catch (error) {
			console.log("- Error Producing Producer : ", error)
		}
	})

	socket.on("get-producers", ({ roomName }, callback) => {
		try {
			let producerList = []
			serverParameter.allRooms[roomName].participants.forEach((data) => {
				if (socket.id != data.socketId) {
					data.producers.forEach((producer) => {
						producerList = [...producerList, producer]
					})
				}
			})
			callback(producerList)
		} catch (error) {
			console.log("- Error Getting Producers : ", error)
		}
	})

	socket.on("transport-recv-connect", async ({ dtlsParameters, serverConsumerTransportId }) => {
		try {
			const consumerTransport = mediasoupParameter.transports.find(
				(transportData) => transportData.consumer && transportData.transport.id == serverConsumerTransportId
			).transport
			consumerTransport.connect({ dtlsParameters }).catch((error) => {
				console.log("- Error Connecting Receiver Transport : ", error)
			})
		} catch (error) {
			console.log("- Error Connecting Transport Receive : ", error)
		}
	})

	socket.on("consume", async ({ rtpCapabilities, remoteProducerId, serverConsumerTransportId, roomName }, callback) => {
		try {
			const router = serverParameter.allRooms[roomName].router
			let consumerTransport = mediasoupParameter.transports.find(
				(transportData) => transportData.consumer && transportData.transport.id == serverConsumerTransportId
			).transport

			let producerData = mediasoupParameter.producers.find((producer) => producer.producer.id == remoteProducerId)

			let producerSocket = producerData.socketId
			let appData = producerData.producer.appData
			if (
				router.canConsume({
					producerId: remoteProducerId,
					rtpCapabilities,
				})
			) {
				const consumer = await consumerTransport.consume({
					producerId: remoteProducerId,
					rtpCapabilities,
					paused: true,
					appData,
				})

				let params = {
					id: consumer.id,
					producerId: remoteProducerId,
					kind: consumer.kind,
					rtpParameters: consumer.rtpParameters,
					serverConsumerId: consumer.id,
					appData,
					producerSocketOwner: producerSocket,
					username: producerData.username,
				}

				params.rtpParameters

				consumer.on("transportclose", () => {
					console.log("transport close from consumer")
				})

				consumer.on("producerclose", () => {
					socket.emit("producer-closed", { remoteProducerId, socketId: producerSocket })
					let removeConsumerAndTransport = serverParameter.allRooms[serverParameter.allUsers[socket.id].roomName].participants.find(
						(data) => data.socketId == socket.id
					)
					removeConsumerAndTransport.consumers = removeConsumerAndTransport.consumers.filter((data) => data != consumer.id)

					serverParameter.allUsers[socket.id].consumers = serverParameter.allUsers[socket.id].consumers.filter((id) => id != consumer.id)
					consumer.close()
					mediasoupParameter.consumers = mediasoupParameter.consumers.filter((consumerData) => consumerData.consumer.id !== consumer.id)
				})

				serverParameter.allUsers[socket.id].consumers = [...serverParameter.allUsers[socket.id].consumers, consumer.id]

				let findConsumerInServerParameterAllRooms = serverParameter.allRooms[roomName].participants.find((data) => data.socketId == socket.id)
				findConsumerInServerParameterAllRooms.consumers = [...findConsumerInServerParameterAllRooms.consumers, consumer.id]

				mediasoupParameter.consumers = [...mediasoupParameter.consumers, { consumer, roomName, socketId: socket.id, username: producerData.username }]

				callback({ params })
			}
		} catch (error) {
			console.log("- Error Consuming : ", error)
		}
	})

	socket.on("consumer-resume", async ({ serverConsumerId, SL, TL }) => {
		try {
			const getConsumer = mediasoupParameter.consumers.find((consumerData) => consumerData.consumer.id === serverConsumerId)
			if (getConsumer) {
				const { consumer } = getConsumer
				await consumer.resume()
				await consumer.setPreferredLayers({ spatialLayer: SL, temporalLayer: TL })
			}
		} catch (error) {
			console.log("- Error Resuming Consumer : ", error)
		}
	})

	socket.on("mic-config", ({ sendTo, isMicActive, id }) => {
		try {
			socket.to(sendTo).emit("mic-config", { isMicActive, id })
		} catch (error) {
			console.log("- Error Mic Config : ", error)
		}
	})

	socket.on("close-producer-from-client", ({ id }) => {
		try {
			let socketId
			mediasoupParameter.producers.forEach((data) => {
				if (data.producer.id == id) {
					data.producer.close()
					socketId = data.socketId
				}
			})
			let producerData = mediasoupParameter.producers.find((producer) => producer.socketId == socketId && producer.producer.kind == "audio")
			producerData.producer.appData.isVideoActive = false
			let removeProducer = serverParameter.allRooms[serverParameter.allUsers[socket.id].roomName].participants.find(
				(data) => data.socketId == socket.id
			)
			removeProducer.producers = removeProducer.producers.filter((data) => data != id)
			mediasoupParameter.producers = mediasoupParameter.producers.filter((data) => data.producer.id != id)
		} catch (error) {
			console.log("- Error Closing Producer From Client : ", error)
		}
	})

	socket.on("send-message", (data) => {
		try {
			socket.to(data.sendTo).emit("receive-message", data)
		} catch (error) {
			console.log("- Error Send Message : ", error)
		}
	})

	socket.on("mute-all", ({ socketId }) => {
		try {
			socket.to(socketId).emit("mute-all", { hostSocketId: socket.id })
		} catch (error) {
			console.log("- Error Mute All : ", error)
		}
	})

	socket.on("unmute-all", ({ socketId }) => {
		try {
			socket.to(socketId).emit("unmute-all", { message: "Hello World" })
		} catch (error) {
			console.log("- Error UnMute All : ", error)
		}
	})

	socket.on("change-app-data", ({ data, remoteProducerId }) => {
		try {
			let producerData = mediasoupParameter.producers.find((producer) => producer.producer.id == remoteProducerId)
			producerData.producer.appData = { ...producerData.producer.appData, ...data }
			if (data.username) {
				producerData.username = data.username
			}
		} catch (error) {
			console.log("- Error Change App Data : ", error)
		}
	})

	socket.on("set-consumer-quality", async ({ consumerId, SL, TL }) => {
		try {
			mediasoupParameter.consumers.forEach((consumer) => {
				if (consumer.consumer.id == consumerId) {
					const { spatialLayer, temporalLayer } = consumer.consumer.currentLayers
					console.log(spatialLayer, temporalLayer)
					consumer.consumer.setPreferredLayers({ spatialLayer: SL, temporalLayer: TL })
				}
			})
		} catch (error) {
			console.log("- Error Set Consumer Quality : ", error)
		}
	})

	socket.on("transcribe", ({ sendTo, message, id }) => {
		try {
			socket.to(sendTo).emit("transcribe", { id, message })
		} catch (error) {
			console.log("- Error Mic Config : ", error)
		}
	})

	socket.on("rename-user", ({ sendTo, content, id }) => {
		try {
			socket.to(sendTo).emit("rename-user", { id, content })
		} catch (error) {
			console.log("- Error Mic Config : ", error)
		}
	})

	// socket.on("manually-turn-off-video", ({ socketId }) => {
	// 	// console.log(`- Socket Manual Turn Off : ${socketId}`)
	// 	// console.log("- Server Parameter : ", serverParameter.allUsers)
	// 	if (serverParameter?.allUsers[socketId]) {
	// 		console.log("- Closing Reconnect Network")
	// 		serverParameter?.allUsers[socketId]?.socket?.disconnect()
	// 	}
	// 	// setTimeout(() => {
	// 	// 	// console.log(serverParameter.allUsers[socketId], "<<<<<<<<<<<")
	// 	// 	if (serverParameter.allUsers[socketId]) {
	// 	// 		serverParameter.allUsers[socketId].socket.close()
	// 	// 		console.log(" ->>>>>>>>>>>>>>",serverParameter.allUsers[socketId].socket.id)
	// 	// 	}
	// 	// }, 1000)
	// })
})

app.get("/mediasoup", (req, res, next) => {
	try {
		const sortedData = {
			transport: mediasoupParameter.transports.length,
			producer: mediasoupParameter.producers.length,
			consumer: mediasoupParameter.consumers.length,
		}
		res.send(sortedData)
	} catch (error) {
		next(error)
	}
})

app.use(router)
