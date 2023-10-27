const mediasoupClient = require("mediasoup-client")
const { createVideo, createAudio, insertVideo, updatingLayout, changeLayout, createAudioVisualizer } = require("../ui/video")
const { turnOffOnCamera, changeLayoutScreenSharingClient } = require("../ui/button")

const createDevice = async ({ parameter, socket }) => {
	try {
		parameter.device = new mediasoupClient.Device()
		await parameter.device.load({
			routerRtpCapabilities: parameter.rtpCapabilities,
		})
		await createSendTransport({ socket, parameter })
	} catch (error) {
		console.log("- Error Creating Device : ", error)
	}
}

const createSendTransport = async ({ socket, parameter }) => {
	try {
		socket.emit("create-webrtc-transport", { consumer: false, roomName: parameter.roomName }, ({ params }) => {
			parameter.producerTransport = parameter.device.createSendTransport(params)
			parameter.producerTransport.on("connect", async ({ dtlsParameters }, callback, errback) => {
				try {
					await socket.emit("transport-connect", {
						dtlsParameters,
					})

					callback()
				} catch (error) {
					errback("- Error Connecting Transport : ", error)
				}
			})

			parameter.producerTransport.on("produce", async (parameters, callback, errback) => {
				try {
					await socket.emit(
						"transport-produce",
						{
							kind: parameters.kind,
							rtpParameters: parameters.rtpParameters,
							appData: parameters.appData,
							roomName: parameter.roomName,
						},
						({ id, producersExist, kind }) => {
							callback({ id })
							if (producersExist && kind == "audio") getProducers({ parameter, socket })
						}
					)
				} catch (error) {
					errback(error)
				}
			})

			parameter.producerTransport.on("connectionstatechange", async (e) => {
				try {
					console.log("- State Change Producer : ", e)
				} catch (error) {
					console.log("- Error Connecting State Change Producer")
				}
			})
			connectSendTransport(parameter)
		})
	} catch (error) {
		console.log("- Error Creating Send Transport : ", error)
	}
}

const connectSendTransport = async (parameter) => {
	try {
		// Producing Audio And Video Transport
		parameter.audioProducer = await parameter.producerTransport.produce(parameter.audioParams)
		parameter.videoProducer = await parameter.producerTransport.produce(parameter.videoParams)

		let myData = parameter.allUsers.find((data) => data.socketId == parameter.socketId)

		myData.audio.producerId = parameter.audioProducer.id
		myData.video.producerId = parameter.videoProducer.id
		myData.audio.transportId = parameter.producerTransport.id
		myData.video.transportId = parameter.producerTransport.id

		parameter.audioProducer.on("trackended", () => {
			console.log("audio track ended")
		})

		parameter.audioProducer.on("transportclose", () => {
			console.log("audio transport ended")
		})

		parameter.videoProducer.on("trackended", () => {
			console.log("video track ended")
		})

		parameter.videoProducer.on("transportclose", () => {
			console.log("video transport ended")
		})
	} catch (error) {
		console.log("- Error Connecting Transport Producer : ", error)
	}
}

// Get Producers
const getProducers = ({ socket, parameter }) => {
	try {
		socket.emit("get-producers", { roomName: parameter.roomName }, (producerList) => {
			// Informing Consumer Transport
			producerList.forEach((id) => {
				signalNewConsumerTransport({ remoteProducerId: id, socket, parameter })
			})
		})
	} catch (error) {
		console.log("- Error Get Producer : ", error)
	}
}

const signalNewConsumerTransport = async ({ remoteProducerId, socket, parameter }) => {
	try {
		if (parameter.consumingTransports.includes(remoteProducerId)) return
		parameter.consumingTransports.push(remoteProducerId)
		await socket.emit("create-webrtc-transport", { consumer: true, roomName: parameter.roomName }, ({ params }) => {
			parameter.consumerTransport = parameter.device.createRecvTransport(params)

			parameter.consumerTransport.on("connect", async ({ dtlsParameters }, callback, errback) => {
				try {
					await socket.emit("transport-recv-connect", { dtlsParameters, serverConsumerTransportId: params.id })
					callback()
				} catch (error) {
					errback(error)
				}
			})
			parameter.consumerTransport.on("connectionstatechange", async (e) => {
				console.log("- Receiver Transport State : ", e)
			})
			connectRecvTransport({
				parameter,
				consumerTransport: parameter.consumerTransport,
				socket,
				remoteProducerId,
				serverConsumerTransportId: params.id,
			})
		})
	} catch (error) {
		console.log("- Error Signaling New Consumer Transport : ", error)
	}
}

const connectRecvTransport = async ({ parameter, consumerTransport, socket, remoteProducerId, serverConsumerTransportId }) => {
	try {
		await socket.emit(
			"consume",
			{
				rtpCapabilities: parameter.device.rtpCapabilities,
				remoteProducerId,
				serverConsumerTransportId,
				roomName: parameter.roomName,
			},
			async ({ params }) => {
				try {
					const consumer = await consumerTransport.consume({
						id: params.id,
						producerId: params.producerId,
						kind: params.kind,
						rtpParameters: params.rtpParameters,
					})

					let isUserExist = parameter.allUsers.find((data) => data.socketId == params.producerSocketOwner)
					const { track } = consumer

					if (isUserExist) {
						isUserExist[params.appData.label] = {
							track,
							isActive: params.appData.isActive,
							consumserId: consumer.id,
							producerId: remoteProducerId,
							transportId: consumerTransport.id,
						}
					} else {
						parameter.totalUsers++
						let data = {
							username: params.username,
							socketId: params.producerSocketOwner,
							picture: params.appData.picture,
						}
						data[params.appData.label] = {
							track,
							isActive: params.appData.isActive,
							consumserId: consumer.id,
							producerId: remoteProducerId,
							transportId: consumerTransport.id,
						}
						parameter.allUsers = [...parameter.allUsers, data]
						updatingLayout({ parameter })
						changeLayout({ parameter })
						createVideo({ id: params.producerSocketOwner, videoClassName: parameter.videoLayout, picture: params.appData.picture })
						turnOffOnCamera({ id: params.producerSocketOwner, status: false })
					}
					if (params.kind == "audio" && params.appData.label == "audio") {
						createAudio({ id: params.producerSocketOwner, track })
						createAudioVisualizer({ id: params.producerSocketOwner, track })
					}
					if (params.kind == "video" && params.appData.label == "video") {
						insertVideo({ id: params.producerSocketOwner, track, pictures: "/assets/pictures/unknown.jpg" })
						turnOffOnCamera({ id: params.producerSocketOwner, status: true })
					}
					if (params.appData.label == "screensharing") {
						changeLayoutScreenSharingClient({ track, id: params.producerSocketOwner, parameter, status: true })
					}
					if (params.kind == "audio" && params.appData.label == "screensharingaudio") {
						createAudio({ id: params.producerSocketOwner + "screensharingaudio", track })
					}

					if (parameter.record.isRecording && params.kind == "audio") {
						const audioSource = parameter.record.audioContext.createMediaStreamSource(new MediaStream([track]))
						audioSource.connect(parameter.record.audioDestination)
					}

					parameter.consumerTransports = [
						...parameter.consumerTransports,
						{
							consumer,
							consumerTransport,
							serverConsumerTransportId: params.id,
							producerId: remoteProducerId,
						},
					]

					socket.emit("consumer-resume", { serverConsumerId: params.serverConsumerId })
				} catch (error) {
					console.log("- Error Consuming : ", error)
				}
			}
		)
	} catch (error) {
		console.log("- Error Connecting Receive Transport : ", error)
	}
}

module.exports = { createDevice, createSendTransport, signalNewConsumerTransport }
