const { getMyStream, getRoomId, joinRoom } = require("../room/function/initialization")
const { signalNewConsumerTransport } = require("../room/function/mediasoup")
const { Parameters } = require("../room/function/parameter")
const {
	changeMic,
	turnOffOnCamera,
	switchCamera,
	getScreenSharing,
	changeLayoutScreenSharing,
	changeLayoutScreenSharingClient,
	recordVideo,
} = require("../room/ui/button")
const { createMyVideo, removeVideoAndAudio, updatingLayout, changeLayout, changeUserMic } = require("../room/ui/video")

let parameter

const socket = io("/")

socket.on("connection-success", async ({ socketId }) => {
	console.log("- Id : ", socketId)
	parameter = new Parameters()
	parameter.username = "Diky"
	parameter.socketId = socketId
	parameter.isVideo = true
	parameter.isAudio = true
	await getRoomId(parameter)
	await getMyStream(parameter)
	await createMyVideo(parameter)
	await joinRoom({ socket, parameter })
	console.log("- Parameter : ", parameter.allUsers)
})

socket.on("new-producer", ({ producerId, socketId }) => {
	try {
		signalNewConsumerTransport({ remoteProducerId: producerId, socket, parameter, socketId })
	} catch (error) {
		console.log("- Error Receiving New Producer : ", error)
	}
})

socket.on("producer-closed", ({ remoteProducerId, socketId }) => {
	const producerToClose = parameter.consumerTransports.find((transportData) => transportData.producerId === remoteProducerId)
	producerToClose.consumerTransport.close()
	producerToClose.consumer.close()

	let checkData = parameter.allUsers.find((data) => data.socketId === socketId)

	let kind

	for (const key in checkData) {
		if (typeof checkData[key] == "object" && checkData[key]) {
			if (checkData[key].producerId == remoteProducerId) {
				kind = key
			}
		}
	}

	if (kind == "video") {
		turnOffOnCamera({ id: socketId, status: false })
	}

	if (kind == "screensharing") {
		changeLayoutScreenSharingClient({ track: null, id: checkData.socketId, parameter, status: false })
	}

	if (kind == "screensharingaudio") {
		let screensharingAudio = document.getElementById(`${socketId}screensharingaudio`)
		if (screensharingAudio) screensharingAudio.remove()
	}

	if (kind) {
		delete checkData[kind]
	}

	if (checkData && !checkData.audio && !checkData.video) {
		parameter.allUsers = parameter.allUsers.filter((data) => data.socketId !== socketId)
		parameter.totalUsers--
		updatingLayout({ parameter })
		changeLayout({ parameter })
		removeVideoAndAudio({ socketId })
		if (checkData.screensharing) {
			changeLayoutScreenSharingClient({ track: null, id: checkData.socketId, parameter, status: false })
		}
	}
})

socket.on("mic-config", ({ id, isMicActive }) => {
	changeUserMic({ parameter, isMicActive, id })
})

/**  EVENT LISTENER  **/

let micButton = document.getElementById("user-mic-button")
micButton.addEventListener("click", () => {
	console.log(parameter.allUsers)
	// let isActive = micButton.querySelector("img").src.split('/').pop();
	let isActive = micButton.querySelector("img").src.includes("micOn.png")
	let myIconMic = document.getElementById(`user-mic-${socket.id}`)
	let user = parameter.allUsers.find((data) => data.socketId == socket.id)
	if (isActive) {
		user.audio.track.enabled = false
		user.audio.isActive = false
		myIconMic.src = "/assets/pictures/micOff.png"
		micButton.querySelector("img").src = "/assets/pictures/micOff.png"
		changeMic({ parameter, status: false, socket })
	} else {
		user.audio.track.enabled = true
		user.audio.isActive = true
		myIconMic.src = "/assets/pictures/micOn.png"
		micButton.querySelector("img").src = "/assets/pictures/micOn.png"
		changeMic({ parameter, status: true, socket })
	}
})

let cameraButton = document.getElementById("user-turn-on-off-camera-button")
cameraButton.addEventListener("click", async () => {
	try {
		let isActive = document.getElementById("turn-on-off-camera-icons").classList
		let myData = parameter.allUsers.find((data) => data.socketId == parameter.socketId)

		if (isActive[1] == "fa-video") {
			isActive.add("fa-video-slash")
			isActive.remove("fa-video")
			turnOffOnCamera({ id: socket.id, status: false })
			await socket.emit("close-producer-from-client", { id: parameter.videoProducer.id })
			parameter.videoProducer.close()
			parameter.videoProducer = null
			myData.video.producerId = undefined
			myData.video.isActive = false
		} else {
			let newStream = await navigator.mediaDevices.getUserMedia({ video: true })
			parameter.localStream.removeTrack(parameter.localStream.getVideoTracks()[0])
			parameter.localStream.addTrack(newStream.getVideoTracks()[0])
			parameter.videoParams.track = newStream.getVideoTracks()[0]
			isActive.add("fa-video")
			isActive.remove("fa-video-slash")
			parameter.videoProducer = await parameter.producerTransport.produce(parameter.videoParams)
			myData.video.producerId = parameter.videoProducer.id
			myData.video.isActive = true
			turnOffOnCamera({ id: socket.id, status: true })
		}
	} catch (error) {
		console.log("- Error Turning Off Camera : ", error)
	}
})

let switchCameraButton = document.getElementById("user-switch-camera-button")
switchCameraButton.addEventListener("click", async () => {
	let isActive = document.getElementById("turn-on-off-camera-icons").classList
	await switchCamera({ parameter })
	if (isActive[1] == "fa-video-slash") {
		isActive.add("fa-video")
		isActive.remove("fa-video-slash")
		turnOffOnCamera({ id: socket.id, status: true })
	}
})

let screenSharingButton = document.getElementById("user-screen-share-button")
screenSharingButton.addEventListener("click", () => {
	if (screenSharingButton.classList[1] == "button-small-custom") {
		screenSharingButton.classList.remove("button-small-custom")
		screenSharingButton.classList.add("button-small-custom-clicked")
		getScreenSharing({ parameter, socket })
	} else {
		let myData = parameter.allUsers.find((data) => data.socketId == parameter.socketId)
		screenSharingButton.classList.remove("button-small-custom-clicked")
		screenSharingButton.classList.add("button-small-custom")
		changeLayoutScreenSharing({ parameter, status: false })
		socket.emit("close-producer-from-client", { id: parameter.screensharing.videoProducerId })
		delete myData.screensharing
		parameter.screensharing.videoProducer.close()
		if (parameter.screensharing.audioProducerId) {
			socket.emit("close-producer-from-client", { id: parameter.screensharing.audioProducerId })
			delete myData.screensharingaudio
			parameter.screensharing.audioProducer.close()
		}
	}
})

let recordButton = document.getElementById("user-record-button")
recordButton.addEventListener("click", () => {
	recordVideo({ parameter })
})

let shareButton = document.getElementById("share-link-button")
shareButton.addEventListener("click", () => {
	try {
		shareButton.classList.replace("button-small-custom", "button-small-custom-clicked")
		let sb = document.getElementById("snackbar")

		sb.className = "show"

		setTimeout(() => {
			shareButton.classList.replace("button-small-custom-clicked", "button-small-custom")
			sb.className = sb.className.replace("show", "")
		}, 3000)
		navigator.clipboard.writeText(window.location.href)
	} catch (error) {
		console.log("- Error At Share Link Button : ", error)
	}
})

let userListButton = document.getElementById("user-list-button")
userListButton.addEventListener("click", () => {
	let upperContainer = document.getElementById("upper-container")
	let isInScreenSharingMode = upperContainer.querySelector("#screen-sharing-container")
	let videoContainer = document.getElementById("video-container")
	let userListContainer = document.getElementById("user-bar")
	if (!isInScreenSharingMode && userListButton.classList[1] == "button-small-custom") {
		userListButton.classList.remove("button-small-custom")
		userListButton.classList.add("button-small-custom-clicked")
		videoContainer.style.minWidth = "75%"
		videoContainer.style.maxWidth = "75%"
		userListContainer.className = "show-side-bar"
		userListButton.setAttribute("disabled", true)
		setTimeout(() => {
			userListButton.removeAttribute("disabled")
		}, 1000)
		userListButton.setAttribute("disabled", true)
	} else if (!isInScreenSharingMode && userListButton.classList[1] == "button-small-custom-clicked") {
		userListButton.classList.remove("button-small-custom-clicked")
		userListButton.classList.add("button-small-custom")
		videoContainer.style.minWidth = "100%"
		videoContainer.style.maxWidth = "100%"
		userListButton.setAttribute("disabled", true)
		setTimeout(() => {
			userListButton.removeAttribute("disabled")
			userListContainer.className = "hide-side-bar"
		}, 1000)
	} else if (isInScreenSharingMode && userListButton.classList[1] == "button-small-custom") {
		let screenSharingContainer = document.getElementById("screen-sharing-container")
		userListButton.classList.remove("button-small-custom")
		userListButton.classList.add("button-small-custom-clicked")
		screenSharingContainer.style.minWidth = "75%"
		screenSharingContainer.style.maxWidth = "75%"
		videoContainer.style.minWidth = "75%"
		videoContainer.style.maxWidth = "75%"
		userListContainer.className = "show-side-bar"
		userListButton.setAttribute("disabled", true)
		setTimeout(() => {
			userListButton.removeAttribute("disabled")
		}, 1000)
	} else if (isInScreenSharingMode && userListButton.classList[1] == "button-small-custom-clicked") {
		let screenSharingContainer = document.getElementById("screen-sharing-container")
		userListButton.classList.remove("button-small-custom-clicked")
		userListButton.classList.add("button-small-custom")
		screenSharingContainer.style.minWidth = "100%"
		screenSharingContainer.style.maxWidth = "100%"
		videoContainer.style.minWidth = "100%"
		videoContainer.style.maxWidth = "100%"
		userListButton.setAttribute("disabled", true)
		setTimeout(() => {
			userListButton.removeAttribute("disabled")
			userListContainer.className = "hide-side-bar"
		}, 1000)
	}
})

module.exports = { socket, parameter }
