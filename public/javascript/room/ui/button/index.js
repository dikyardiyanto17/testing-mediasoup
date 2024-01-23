const RecordRTC = require("recordrtc")
const { timerLayout, muteAllParticipants, unlockAllMic } = require("../../function")

const changeMic = ({ parameter, socket, status }) => {
	parameter.allUsers.forEach((data) => {
		if (data.socketId != socket.id) {
			socket.emit("mic-config", { sendTo: data.socketId, isMicActive: status, id: socket.id })
		}
	})
}

const turnOffOnCamera = ({ id, status }) => {
	let videoId = document.getElementById(`user-picture-container-${id}`)
	let cameraIconsUserList = document.getElementById("ulic-" + id)
	if (!status && videoId) {
		videoId.className = "video-off"
	} else videoId.className = "video-on"
	if (cameraIconsUserList) cameraIconsUserList.className = `${status ? "fas fa-video" : "fas fa-video-slash"}`
}

const switchCamera = async ({ parameter }) => {
	try {
		const myVideo = document.getElementById(`v-${parameter.socketId}`)
		console.log(myVideo.srcObject.getVideoTracks()[0])
		let myData = parameter.allUsers.find((data) => data.socketId == parameter.socketId)
		let videoDevices = (await navigator.mediaDevices.enumerateDevices()).filter((device) => device.kind === "videoinput")
		// console.log("- Parameter : ", parameter.devices)
		parameter.devices.video.iteration++
		if (parameter.devices.video.iteration >= videoDevices?.length) parameter.devices.video.iteration = 0
		parameter.devices.video.id = videoDevices[parameter.devices.video.iteration].deviceId
		// let mode = await videoDevices[parameter.devices.video.iteration].getCapabilities().facingMode
		// console.log("- Mode : ", mode[0])
		// mode.length === 0 ? "environment" : mode[0]

		let config = {
			video: {
				deviceId: { exact: parameter.devices.video.id },
				// video: { facingMode: { exact: mode[0] ? mode[0] : "environment" } },
			},
		}

		myVideo.srcObject.getVideoTracks()[0].stop()

		let newStream = await navigator.mediaDevices.getUserMedia(config)
		parameter.localStream.getVideoTracks()[0].stop()
		parameter.localStream.removeTrack(parameter.localStream.getVideoTracks()[0])
		parameter.localStream.addTrack(newStream.getVideoTracks()[0])

		if (!parameter.videoProducer) {
			parameter.videoParams.appData.isActive = true
			parameter.videoParams.appData.isVideoActive = true
			parameter.videoParams.track = newStream.getVideoTracks()[0]
			parameter.videoProducer = await parameter.producerTransport.produce(parameter.videoParams)
			myData.video.producerId = parameter.videoProducer.id
			myData.video.isActive = true
		} else {
			parameter.videoProducer.replaceTrack({ track: newStream.getVideoTracks()[0] })
		}
	} catch (error) {
		console.log("- Error Switching Camera : ", error)
	}
}

const getScreenSharing = async ({ parameter, socket }) => {
	try {
		let config = {
			video: {
				cursor: "always",
				displaySurface: "window",
				chromeMediaSource: "desktop",
			},
			audio: true,
		}
		let myData = parameter.allUsers.find((data) => data.socketId == parameter.socketId)
		parameter.screensharing.stream = await navigator.mediaDevices.getDisplayMedia(config)
		parameter.screensharing.isActive = true

		parameter.screensharingVideoParams.track = parameter.screensharing.stream.getVideoTracks()[0]

		parameter.isScreenSharing.isScreenSharing = true
		parameter.isScreenSharing.socketId = parameter.socketId

		parameter.screensharing.stream.getVideoTracks()[0].onended = () => {
			parameter.screensharing.videoProducer.close()
			socket.emit("close-producer-from-client", { id: parameter.screensharing.videoProducerId })
			if (parameter.screensharing.audioProducerId) {
				parameter.screensharing.audioProducer.close()
				socket.emit("close-producer-from-client", { id: parameter.screensharing.audioProducerId })
				delete myData.screensharingaudio
			}
			delete myData.screensharing

			let screenSharingButton = document.getElementById("user-screen-share-button")
			screenSharingButton.className = "btn button-small-custom"
			changeLayoutScreenSharing({ parameter, status: false })
		}

		changeLayoutScreenSharing({ parameter, status: true })
		if (parameter.screensharing.stream.getAudioTracks()[0]) {
			parameter.screensharingAudioParams.track = parameter.screensharing.stream.getAudioTracks()[0]
			parameter.screensharing.audioProducer = await parameter.producerTransport.produce(parameter.screensharingAudioParams)
			parameter.screensharing.audioProducerId = parameter.screensharing.audioProducer.id
			myData.screensharingaudio = {
				isActive: true,
				track: parameter.screensharingAudioParams.track,
				producerId: parameter.screensharing.audioProducer.id,
				transportId: parameter.producerTransport.id,
				consumerId: undefined,
			}
			parameter.screensharing.audioProducer("trackended", () => {
				window.location.reload()
				console.log("screensharing track ended")
			})
		}

		parameter.screensharing.videoProducer = await parameter.producerTransport.produce(parameter.screensharingVideoParams)
		parameter.screensharing.videoProducer.on("trackended", () => {
			window.location.reload()
			console.log("video track ended")
		})
		parameter.screensharing.videoProducerId = parameter.screensharing.videoProducer.id
		myData.screensharing = {
			isActive: true,
			track: parameter.screensharingVideoParams.track,
			producerId: parameter.screensharing.videoProducer.id,
			transportId: parameter.producerTransport.id,
			consumerId: undefined,
		}
	} catch (error) {
		changeLayoutScreenSharing({ parameter, status: false })
		let screenSharingButton = document.getElementById("user-screen-share-button")
		screenSharingButton.className = "btn button-small-custom"
		console.log("- Error Getting Screen Sharing : ", error)
	}
}

const changeLayoutScreenSharingClient = ({ track, status, parameter, id }) => {
	let upperContainer = document.getElementById("upper-container")
	let videoContainer = document.getElementById("video-container")

	if (status) {
		let userListButton = document.getElementById("user-list-button")

		let screenSharingContainer = document.createElement("div")
		screenSharingContainer.id = "screen-sharing-container"
		screenSharingContainer.innerHTML = `<div id="screen-sharing-video-container"><video id="screen-sharing-video" autoplay></video></div>`
		upperContainer.insertBefore(screenSharingContainer, upperContainer.firstChild)
		videoContainer.className = "video-container-screen-sharing-mode"
		document.getElementById("screen-sharing-video").srcObject = new MediaStream([track])
		slideUserVideoButton({ status: true })
		parameter.isScreenSharing.isScreenSharing = true
		parameter.isScreenSharing.socketId = id
		let chatButton = document.getElementById("user-chat-button")
		if (userListButton.classList[1] == "button-small-custom-clicked" || chatButton.classList[1] == "button-small-custom-clicked") {
			screenSharingContainer.style.minWidth = "75%"
			screenSharingContainer.style.maxWidth = "75%"
		}
	} else {
		let screenSharingContainer = document.getElementById("screen-sharing-container")
		if (screenSharingContainer) screenSharingContainer.remove()
		parameter.isScreenSharing.isScreenSharing = false
		parameter.isScreenSharing.socketId = undefined
		videoContainer.removeAttribute("class")
		slideUserVideoButton({ status: false })
	}
}

const changeLayoutScreenSharing = ({ parameter, status }) => {
	let upperContainer = document.getElementById("upper-container")
	let videoContainer = document.getElementById("video-container")

	if (status) {
		let userListButton = document.getElementById("user-list-button")
		let screenSharingContainer = document.createElement("div")

		screenSharingContainer.id = "screen-sharing-container"
		screenSharingContainer.innerHTML = `<div id="screen-sharing-video-container"><video id="screen-sharing-video" muted autoplay></video></div>`
		upperContainer.insertBefore(screenSharingContainer, upperContainer.firstChild)
		videoContainer.className = "video-container-screen-sharing-mode"
		document.getElementById("screen-sharing-video").srcObject = parameter.screensharing.stream
		slideUserVideoButton({ status: true })
		let chatButton = document.getElementById("user-chat-button")
		if (userListButton.classList[1] == "button-small-custom-clicked" || chatButton.classList[1] == "button-small-custom-clicked") {
			screenSharingContainer.style.minWidth = "75%"
			screenSharingContainer.style.maxWidth = "75%"
		}
	} else {
		if (parameter.screensharing.stream) {
			parameter.screensharing.stream.getTracks().forEach((track) => track.stop())
		}
		let screenSharingContainer = document.getElementById("screen-sharing-container")
		if (screenSharingContainer) screenSharingContainer.remove()
		parameter.screensharing.stream = null
		parameter.isScreenSharing.isScreenSharing = false
		parameter.isScreenSharing.socketId = undefined
		videoContainer.removeAttribute("class")
		slideUserVideoButton({ status: false })
	}
}

const slideUserVideoButton = ({ status }) => {
	let bottomContainer = document.getElementById("bottom-container")
	if (status) {
		if (document.getElementById("user-video-display-button")) return
		let userVideoButton = document.createElement("button")
		userVideoButton.className = "btn button-small-custom"
		userVideoButton.id = "user-video-display-button"
		userVideoButton.innerHTML = `<span id="user-video-display-button-tooltip">Display Video</span><i class="fas fa-tv" style="color: #ffffff;"></i>`
		bottomContainer.insertBefore(userVideoButton, bottomContainer.firstChild)

		userVideoButton.addEventListener("click", () => {
			let videoContainer = document.getElementById("video-container")
			if (userVideoButton.classList[1] == "button-small-custom") {
				userVideoButton.classList.remove("button-small-custom")
				userVideoButton.classList.add("button-small-custom-clicked")
				videoContainer.style.left = "0"
			} else {
				userVideoButton.classList.remove("button-small-custom-clicked")
				userVideoButton.classList.add("button-small-custom")
				videoContainer.style.left = "100%"
			}
		})
	} else {
		let userVideoButton = document.getElementById("user-video-display-button")
		let videoContainer = document.getElementById("video-container")
		videoContainer.removeAttribute("style")
		if (userVideoButton) userVideoButton.remove()
	}
}

const recordVideo = async ({ parameter }) => {
	try {
		let recordButton = document.getElementById("user-record-button")

		if (recordButton.classList[1] == "button-small-custom") {
			recordButton.classList.remove("button-small-custom")
			recordButton.classList.add("button-small-custom-clicked")
			const videoStream = await navigator.mediaDevices.getDisplayMedia({
				video: {
					cursor: "always",
					displaySurface: "monitor",
					chromeMediaSource: "desktop",
				},
			})

			let screenSharingStream = new MediaStream()
			videoStream.getVideoTracks().forEach((track) => screenSharingStream.addTrack(track))

			let allAudio = []

			parameter.allUsers.forEach((data) => {
				for (const key in data) {
					console.log(key, "KEY")
					if (typeof data[key] == "object" && (key == "audio" || key == "screensharingaudio") && data[key]) {
						allAudio.push(data[key].track)
					}
				}
			})
			let allAudioFlat = allAudio.flatMap((track) => track)

			parameter.record.audioContext = new (window.AudioContext || window.webkitAudioContext)()
			parameter.record.audioDestination = parameter.record.audioContext.createMediaStreamDestination()

			allAudioFlat.forEach((track) => {
				const audioSource = parameter.record.audioContext.createMediaStreamSource(new MediaStream([track]))
				audioSource.connect(parameter.record.audioDestination)
			})

			screenSharingStream.addTrack(parameter.record.audioDestination.stream.getAudioTracks()[0])
			parameter.record.recordedStream = screenSharingStream
			parameter.record.recordedMedia = new RecordRTC(parameter.record.recordedStream, {
				type: "video",
				getNativeBlob: true,
				timeSlice: 5000,
				ondataavailable: (blob) => {
					// socket.send({ type: 'collecting', data: blob })
					console.log("- Blob : ", blob)
				},
			})

			parameter.record.recordedMedia.startRecording()
			parameter.record.recordedStream.getAudioTracks()[0].onended = () => {
				console.log("- Reset Audio Recording")
				parameter.record.audioContext = null
				parameter.record.audioDestination = null
			}

			parameter.record.recordedStream.getVideoTracks()[0].onended = () => {
				parameter.record.recordedMedia.stopRecording(() => {
					// socket.send({ type: 'uploading' })
					timerLayout({ status: false })
					parameter.record.isRecording = false
					let blob = parameter.record.recordedMedia.getBlob()

					// require('recordrtc').getSeekableBlob(recordedMediaRef.current.getBlob(), (seekable) => {
					//     console.log("- SeekableBlob : ", seekable)
					//     downloadRTC(seekable)
					// })
					// downloadRTC(blob)
					const currentDate = new Date()
					const formattedDate = currentDate
						.toLocaleDateString("en-GB", {
							day: "2-digit",
							month: "2-digit",
							year: "numeric",
						})
						.replace(/\//g, "") // Remove slashes from the formatted date

					const file = new File([blob], formattedDate, {
						type: "video/mp4",
					})
					require("recordrtc").invokeSaveAsDialog(file, file.name)
					parameter.record.recordedStream.getTracks().forEach((track) => track.stop())
					parameter.record.recordedStream = null
					parameter.record.recordedMedia.reset()
					parameter.record.recordedMedia = null
				})
			}

			parameter.record.isRecording = true

			timerLayout({ status: true })
		} else {
			recordButton.classList.remove("button-small-custom-clicked")
			recordButton.classList.add("button-small-custom")
			parameter.record.recordedMedia.stopRecording(() => {
				// socket.send({ type: 'uploading' })
				timerLayout({ status: false })
				parameter.record.isRecording = false
				let blob = parameter.record.recordedMedia.getBlob()
				// require('recordrtc').getSeekableBlob(recordedMedia.getBlob(), (seekable) => {
				//     console.log("- SeekableBlob : ", seekable)
				//     downloadRTC(seekable)
				// })
				// downloadRTC(blob)
				const currentDate = new Date()
				const formattedDate = currentDate
					.toLocaleDateString("en-GB", {
						day: "2-digit",
						month: "2-digit",
						year: "numeric",
					})
					.replace(/\//g, "") // Remove slashes from the formatted date

				const file = new File([blob], formattedDate, {
					type: "video/mp4",
				})

				require("recordrtc").invokeSaveAsDialog(file, file.name)
				parameter.record.recordedStream.getTracks().forEach((track) => track.stop())
				parameter.record.recordedStream = null
				parameter.record.recordedMedia.reset()
				parameter.record.recordedMedia = null
			})
		}
	} catch (error) {
		console.log("- Error Recording : ", error)
		// socket.send({ type: 'uploading' })
		timerLayout({ status: false })
		if (parameter.record.recordedStream) {
			parameter.record.recordedStream.getTracks().forEach((track) => track.stop())
			parameter.record.recordedStream = null
		}
		if (parameter.record.recordedMedia) {
			parameter.record.isRecording = false
			let blob = parameter.record.recordedMedia.getBlob()
			// require('recordrtc').getSeekableBlob(recordedMedia.getBlob(), (seekable) => {
			//     console.log("- SeekableBlob : ", seekable)
			//     downloadRTC(seekable)
			// })
			// downloadRTC(blob)
			const currentDate = new Date()
			const formattedDate = currentDate
				.toLocaleDateString("en-GB", {
					day: "2-digit",
					month: "2-digit",
					year: "numeric",
				})
				.replace(/\//g, "") // Remove slashes from the formatted date

			const file = new File([blob], formattedDate, {
				type: "video/mp4",
			})

			require("recordrtc").invokeSaveAsDialog(file, file.name)
			parameter.record.recordedStream.getTracks().forEach((track) => track.stop())
			parameter.record.recordedStream = null
			parameter.record.recordedMedia.reset()
			parameter.record.recordedMedia = null
		}
	}
}

const addMuteAllButton = ({ parameter, socket }) => {
	try {
		let allOptionMenu = document.getElementById("all-option-menu")
		let isExist = document.getElementById("mute-all")
		parameter.micCondition.socketId = parameter.socketId
		if (!isExist) {
			const newElement = document.createElement("li")
			newElement.id = "mute-all"
			newElement.style.fontSize = "13px"
			newElement.innerHTML = "Mute All Participants"
			allOptionMenu.appendChild(newElement)
			newElement.addEventListener("click", () => {
				if (newElement.innerHTML == "Mute All Participants") {
					muteAllParticipants({ parameter, socket })
					parameter.micCondition.isLocked = true
					newElement.innerHTML = "Unmute All Participants"
				} else if (newElement.innerHTML == "Unmute All Participants") {
					parameter.micCondition.isLocked = false
					unlockAllMic({ parameter, socket })
					newElement.innerHTML = "Mute All Participants"
				} else {
					let ae = document.getElementById("alert-error")
					ae.className = "show"
					ae.innerHTML = `You're Not Host`
					// Show Warning
					setTimeout(() => {
						ae.className = ae.className.replace("show", "")
						ae.innerHTML = ``
					}, 3000)
				}
			})
		}
	} catch (error) {
		console.log("- Error Adding Mute All Button : ", error)
	}
}

module.exports = {
	changeMic,
	turnOffOnCamera,
	switchCamera,
	getScreenSharing,
	changeLayoutScreenSharing,
	changeLayoutScreenSharingClient,
	recordVideo,
	addMuteAllButton,
}
