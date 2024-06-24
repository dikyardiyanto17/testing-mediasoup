const mediasoupClient = require("mediasoup-client")
const { createVideo, createAudio, insertVideo, updatingLayout, changeLayout, createAudioVisualizer, startSpeechToText } = require("../ui/video")
const {
	turnOffOnCamera,
	changeLayoutScreenSharingClient,
	addMuteAllButton,
	getMicOptions,
	videoDisplayModeScreenSharing,
	getCameraOptions,
} = require("../ui/button")
const { createUserList, muteAllParticipants, goToLobby } = require(".")
const { encodingVP8, encodingsVP9, VIDEO_SVC_ENCODINGS } = require("../config/mediasoup")
const getEncoding = ({ parameter }) => {
	try {
		// const firstVideoCodec = parameter.device.rtpCapabilities.codecs.find((c) => c.kind === "video")
		const firstVideoCodec = parameter.device.rtpCapabilities.codecs.find((c) => c.mimeType.toLowerCase() === "video/vp9")
		let mimeType = firstVideoCodec?.mimeType?.toLowerCase()
		if (mimeType.includes("vp9")) {
			console.log("- Encoding VP 9")
			parameter.videoParams.codec = firstVideoCodec
			parameter.videoParams.encodings = encodingsVP9
		} else {
			console.log("- Encoding VP 8")
			parameter.videoParams.encodings = encodingVP8
		}
		return firstVideoCodec
	} catch (error) {
		console.log("- Error Get Encoding : ", error)
	}
}

const createDevice = async ({ parameter, socket }) => {
	try {
		parameter.device = new mediasoupClient.Device()
		await parameter.device.load({
			routerRtpCapabilities: parameter.rtpCapabilities,
		})
		await getEncoding({ parameter })
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
							if (!producersExist) addMuteAllButton({ parameter, socket })
						}
					)
				} catch (error) {
					errback(error)
				}
			})

			parameter.producerTransport.on("connectionstatechange", async (e) => {
				try {
					console.log("- State Change Producer : ", e)
					if (e == "failed") {
						// socket.close()
						window.location.reload()
					}
				} catch (error) {
					console.log("- Error Connecting State Change Producer : ", error)
				}
			})

			socket.emit("create-webrtc-transport", { consumer: true, roomName: parameter.roomName }, ({ params }) => {
				parameter.consumerTransport = parameter.device.createRecvTransport(params)

				parameter.consumerTransport.on("connectionstatechange", async (e) => {
					if (e === "failed") {
						window.location.reload()
					}
					console.log("- Receiver Transport State : ", e)
				})

				parameter.consumerTransport.on("connect", async ({ dtlsParameters }, callback, errback) => {
					try {
						await socket.emit("transport-recv-connect", { dtlsParameters, serverConsumerTransportId: params.id })
						callback()
					} catch (error) {
						errback(error)
					}
				})
			})
			connectSendTransport({ parameter, socket })
		})
	} catch (error) {
		console.log("- Error Creating Send Transport : ", error)
	}
}

const connectSendTransport = async ({ parameter, socket }) => {
	try {
		// Producing Audio And Video Transport
		let myData = parameter.allUsers.find((data) => data.socketId == parameter.socketId)

		parameter.audioProducer = await parameter.producerTransport.produce(parameter.audioParams)
		if (parameter.initialVideo) {
			// const videoParameter = { ...parameter.videoParams, encodings: encodingsVP9 }
			parameter.videoProducer = await parameter.producerTransport.produce(parameter.videoParams)
			// console.log("- Producer : ", parameter.videoProducer)
			myData.video.producerId = parameter.videoProducer.id
			myData.video.transportId = parameter.producerTransport.id
			parameter.videoProducer.setMaxIncomingBitrate(1500000)
			parameter.videoProducer.on("trackended", () => {
				window.location.reload()
				console.log("video track ended")
			})

			parameter.videoProducer.on("transportclose", () => {
				window.location.reload()
				console.log("video transport ended")
			})

			await parameter.videoProducer.setMaxSpatialLayer(parameter.upStreamQuality)
		}

		await getMicOptions({ parameter, socket })
		await getCameraOptions({ parameter })

		myData.audio.producerId = parameter.audioProducer.id
		myData.audio.transportId = parameter.producerTransport.id

		parameter.audioProducer.on("trackended", () => {
			console.log("audio track ended")
		})

		parameter.audioProducer.on("transportclose", () => {
			console.log("audio transport ended")
		})

		// await startSpeechToText({ parameter, socket, status: true })
	} catch (error) {
		window.alert(`Error getting your stream\nPlease make sure your camera is working\nThis page will refresh in a few seconds\n`)
		setTimeout(() => {
			window.location.reload()
		}, 7000)
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
		let totalReconnecting = 0
		const connectingRecvTransport = async () => {
			if (!parameter.consumerTransport) {
				totalReconnecting++
				setTimeout(() => {
					connectingRecvTransport()
				}, 1000)
			} else if (totalReconnecting >= 20) {
				console.log("Receiver Transport Wont Connected")
			} else {
				await connectRecvTransport({
					parameter,
					consumerTransport: parameter.consumerTransport,
					socket,
					remoteProducerId,
					serverConsumerTransportId: parameter.consumerTransport.id,
				})
			}
		}

		await connectingRecvTransport()
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
					if (parameter.micCondition.isLocked && parameter.micCondition.socketId == socket.id) {
						muteAllParticipants({ parameter, socket })
					}
					let streamId
					if (params?.appData?.label == "audio" || params?.appData?.label == "video") streamId = `${params.producerSocketOwner}-mic-webcam`
					else streamId = `${params.producerSocketOwner}-screen-sharing`

					const consumer = await consumerTransport.consume({
						id: params.id,
						producerId: params.producerId,
						kind: params.kind,
						rtpParameters: params.rtpParameters,
						streamId,
					})
					let isUserExist = parameter.allUsers.find((data) => data.socketId == params.producerSocketOwner)
					const { track } = consumer

					if (!params?.appData?.isActive) {
						track.enabled = false
					}

					if (isUserExist) {
						isUserExist[params.appData.label] = {
							track,
							isActive: params?.appData?.isActive,
							consumerId: consumer.id,
							producerId: remoteProducerId,
							transportId: consumerTransport.id,
						}
					} else {
						parameter.totalUsers++
						parameter.isScreenSharing.screenSharingUserViewTotalPage = Math.ceil(
							parameter.totalUsers / parameter.isScreenSharing.screenSharingUserViewCurrentDisplay
						)
						let data = {
							username: params.username,
							socketId: params.producerSocketOwner,
							picture: params.appData.picture,
						}
						data[params.appData.label] = {
							track,
							isActive: params.appData.isActive,
							consumerId: consumer.id,
							producerId: remoteProducerId,
							transportId: consumerTransport.id,
						}
						parameter.allUsers = [...parameter.allUsers, data]
						updatingLayout({ parameter })
						createVideo({
							id: params.producerSocketOwner,
							videoClassName: parameter.videoLayout,
							picture: params.appData.picture,
							username: params.username,
							micTrigger: params.appData.isMicActive,
							parameter,
						})
						changeLayout({ parameter })
						turnOffOnCamera({ id: params.producerSocketOwner, status: false })
						createUserList({
							username: params.username,
							socketId: params.producerSocketOwner,
							cameraTrigger: params.appData.isVideoActive,
							picture: params.appData.picture,
							micTrigger: params.appData.isMicActive,
						})
					}
					if (params.kind == "audio" && params.appData.label == "audio") {
						createAudio({ id: params.producerSocketOwner, track, parameter })
						createAudioVisualizer({ id: params.producerSocketOwner, track })
					}
					if (params.kind == "video" && params.appData.label == "video") {
						insertVideo({ id: params.producerSocketOwner, track, pictures: "/assets/pictures/unknown.jpg" })
						turnOffOnCamera({ id: params.producerSocketOwner, status: true })
					}
					if (params.appData.label == "screensharing") {
						changeLayoutScreenSharingClient({ track, id: params.producerSocketOwner, parameter, status: true })
						updatingLayout({ parameter })
						changeLayout({ parameter })
					}
					if (params.kind == "audio" && params.appData.label == "screensharingaudio") {
						createAudio({ id: params.producerSocketOwner + "screensharingaudio", track, parameter })
					}

					if (parameter.record.isRecording && params.kind == "audio") {
						const audioSource = parameter.record.audioContext.createMediaStreamSource(new MediaStream([track]))
						audioSource.connect(parameter.record.audioDestination)
					}

					if (parameter.isScreenSharing.isScreenSharing) {
						videoDisplayModeScreenSharing({ parameter, status: true })
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

					socket.emit("consumer-resume", { serverConsumerId: params.serverConsumerId, SL: parameter.downStreamQuality, TL: 2 })
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
