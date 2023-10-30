const { changeUserListMicIcon, sendMessage, receiveMessage, hideOptionMenu, showOptionMenu, scrollToBottom } = require("../room/function")
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
const { createMyVideo, removeVideoAndAudio, updatingLayout, changeLayout, changeUserMic, removeUserList } = require("../room/ui/video")

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
		removeUserList({ id: socketId })
		if (checkData.screensharing) {
			changeLayoutScreenSharingClient({ track: null, id: checkData.socketId, parameter, status: false })
		}
	}
})

socket.on("mic-config", ({ id, isMicActive }) => {
	changeUserMic({ parameter, isMicActive, id })
})

socket.on("receive-message", ({ message, sender, messageDate }) => {
	try {
		receiveMessage({ message, sender, date: messageDate })
	} catch (error) {
		console.log("- Error Receving Message Socker : ", error)
	}
})

// Mute All
socket.on("mute-all", ({ hostSocketId }) => {
	try {
		let micButton = document.getElementById("user-mic-button")
		let micImage = document.getElementById("mic-image")
		let myIconMic = document.getElementById(`user-mic-${socket.id}`)
		if (myIconMic) myIconMic.src = "/assets/pictures/micOff.png"
		parameter.micCondition.isLocked = true
		parameter.micCondition.socketId = hostSocketId
		micButton.classList.replace("button-small-custom", "button-small-custom-clicked")
		let user = parameter.allUsers.find((data) => data.socketId == socket.id)
		user.audio.track.enabled = false
		user.audio.isActive = false
		changeMic({ parameter, status: false, socket })
		changeUserListMicIcon({ status: true, id: socket.id })
		micImage.src = "/assets/pictures/micOff.png"
	} catch (error) {
		console.log("- Error Muting All Participants : ", error)
	}
})

socket.on("unmute-all", (data) => {
	try {
		parameter.micCondition.isLocked = false
		parameter.micCondition.socketId = undefined
	} catch (error) {
		console.log("- Error Unlocking Mic Participants Socket On : ", error)
	}
})

/**  EVENT LISTENER  **/

let micButton = document.getElementById("user-mic-button")
micButton.addEventListener("click", () => {
	if (parameter.micCondition.isLocked) {
		let ae = document.getElementById("alert-error")
		ae.className = "show"
		ae.innerHTML = `Mic is Locked By Host`
		// Show Warning
		setTimeout(() => {
			ae.className = ae.className.replace("show", "")
			ae.innerHTML = ``
		}, 3000)
		return
	}
	// let isActive = micButton.querySelector("img").src.split('/').pop();
	let isActive = micButton.querySelector("img").src.includes("micOn.png")
	let myIconMic = document.getElementById(`user-mic-${socket.id}`)
	let user = parameter.allUsers.find((data) => data.socketId == socket.id)
	if (isActive) {
		micButton.classList.replace("button-small-custom", "button-small-custom-clicked")
		user.audio.track.enabled = false
		user.audio.isActive = false
		myIconMic.src = "/assets/pictures/micOff.png"
		micButton.querySelector("img").src = "/assets/pictures/micOff.png"
		changeMic({ parameter, status: false, socket })
		changeUserListMicIcon({ status: true, id: socket.id })
	} else {
		micButton.classList.replace("button-small-custom-clicked", "button-small-custom")
		user.audio.track.enabled = true
		user.audio.isActive = true
		myIconMic.src = "/assets/pictures/micOn.png"
		micButton.querySelector("img").src = "/assets/pictures/micOn.png"
		changeMic({ parameter, status: true, socket })
		changeUserListMicIcon({ status: false, id: socket.id })
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
			parameter.videoParams.appData.isActive = true
			parameter.videoParams.appData.isVideoActive = true
			isActive.add("fa-video")
			isActive.remove("fa-video-slash")
			parameter.videoProducer = await parameter.producerTransport.produce(parameter.videoParams)
			if (!myData.video) {
				myData.video = {
					isActive: true,
					producerId: parameter.videoProducer.id,
					transporId: parameter.producerTransport.id,
					consumerId: undefined,
				}
			} else {
				myData.video.producerId = parameter.videoProducer.id
				myData.video.isActive = true
			}
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

let chatButton = document.getElementById("user-chat-button")
let userListButton = document.getElementById("user-list-button")
userListButton.addEventListener("click", () => {
	let upperContainer = document.getElementById("upper-container")
	let isInScreenSharingMode = upperContainer.querySelector("#screen-sharing-container")
	let videoContainer = document.getElementById("video-container")
	let userListContainer = document.getElementById("user-bar")
	let chatContainer = document.getElementById("chat-bar-box-id")
	if (!isInScreenSharingMode && userListButton.classList[1] == "button-small-custom") {
		chatButton.className = "btn button-small-custom"
		chatContainer.className = "hide-side-bar"
		userListButton.classList.remove("button-small-custom")
		userListButton.classList.add("button-small-custom-clicked")
		videoContainer.style.minWidth = "75%"
		videoContainer.style.maxWidth = "75%"
		userListContainer.className = "show-side-bar"
		userListButton.setAttribute("disabled", true)
		chatButton.setAttribute("disabled", true)
		scrollToBottom()
		setTimeout(() => {
			chatButton.removeAttribute("disabled")
			userListButton.removeAttribute("disabled")
		}, 1000)
	} else if (!isInScreenSharingMode && userListButton.classList[1] == "button-small-custom-clicked") {
		userListButton.classList.remove("button-small-custom-clicked")
		userListButton.classList.add("button-small-custom")
		videoContainer.style.minWidth = "100%"
		videoContainer.style.maxWidth = "100%"
		userListButton.setAttribute("disabled", true)
		chatButton.setAttribute("disabled", true)
		setTimeout(() => {
			chatButton.removeAttribute("disabled")
			userListButton.removeAttribute("disabled")
			userListContainer.className = "hide-side-bar"
		}, 1000)
	} else if (isInScreenSharingMode && userListButton.classList[1] == "button-small-custom") {
		let screenSharingContainer = document.getElementById("screen-sharing-container")
		chatButton.className = "btn button-small-custom"
		chatContainer.className = "hide-side-bar"
		userListButton.classList.remove("button-small-custom")
		userListButton.classList.add("button-small-custom-clicked")
		screenSharingContainer.style.minWidth = "75%"
		screenSharingContainer.style.maxWidth = "75%"
		videoContainer.style.minWidth = "75%"
		videoContainer.style.maxWidth = "75%"
		userListContainer.className = "show-side-bar"
		userListButton.setAttribute("disabled", true)
		chatButton.setAttribute("disabled", true)
		scrollToBottom()
		setTimeout(() => {
			chatButton.removeAttribute("disabled")
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
		chatButton.setAttribute("disabled", true)
		setTimeout(() => {
			chatButton.removeAttribute("disabled")
			userListButton.removeAttribute("disabled")
			userListContainer.className = "hide-side-bar"
		}, 1000)
	}
})

chatButton.addEventListener("click", () => {
	let upperContainer = document.getElementById("upper-container")
	let isInScreenSharingMode = upperContainer.querySelector("#screen-sharing-container")
	let videoContainer = document.getElementById("video-container")
	let userListContainer = document.getElementById("user-bar")
	let chatContainer = document.getElementById("chat-bar-box-id")
	let iconsNotification = document.getElementById("notification-element-id")
	if (!isInScreenSharingMode && chatButton.classList[1] == "button-small-custom") {
		userListButton.className = "btn button-small-custom"
		userListContainer.className = "hide-side-bar"
		chatButton.classList.remove("button-small-custom")
		chatButton.classList.add("button-small-custom-clicked")
		videoContainer.style.minWidth = "75%"
		videoContainer.style.maxWidth = "75%"
		chatContainer.className = "show-side-bar"
		userListButton.setAttribute("disabled", true)
		chatButton.setAttribute("disabled", true)
		iconsNotification.className = "fas fa-envelope notification invisible"
		setTimeout(() => {
			chatButton.removeAttribute("disabled")
			userListButton.removeAttribute("disabled")
		}, 1000)
	} else if (!isInScreenSharingMode && chatButton.classList[1] == "button-small-custom-clicked") {
		chatButton.classList.remove("button-small-custom-clicked")
		chatButton.classList.add("button-small-custom")
		videoContainer.style.minWidth = "100%"
		videoContainer.style.maxWidth = "100%"
		userListButton.setAttribute("disabled", true)
		chatButton.setAttribute("disabled", true)
		let isLineNewMessageExist = document.getElementById("new-message-notification")
		if (isLineNewMessageExist) {
			isLineNewMessageExist.remove()
		}
		setTimeout(() => {
			chatButton.removeAttribute("disabled")
			userListButton.removeAttribute("disabled")
			chatContainer.className = "hide-side-bar"
		}, 1000)
	} else if (isInScreenSharingMode && chatButton.classList[1] == "button-small-custom") {
		let screenSharingContainer = document.getElementById("screen-sharing-container")
		userListButton.className = "btn button-small-custom"
		userListContainer.className = "hide-side-bar"
		chatButton.classList.remove("button-small-custom")
		chatButton.classList.add("button-small-custom-clicked")
		screenSharingContainer.style.minWidth = "75%"
		screenSharingContainer.style.maxWidth = "75%"
		videoContainer.style.minWidth = "75%"
		videoContainer.style.maxWidth = "75%"
		chatContainer.className = "show-side-bar"
		userListButton.setAttribute("disabled", true)
		chatButton.setAttribute("disabled", true)
		iconsNotification.className = "fas fa-envelope notification invisible"
		setTimeout(() => {
			chatButton.removeAttribute("disabled")
			userListButton.removeAttribute("disabled")
		}, 1000)
	} else if (isInScreenSharingMode && chatButton.classList[1] == "button-small-custom-clicked") {
		let screenSharingContainer = document.getElementById("screen-sharing-container")
		chatButton.classList.remove("button-small-custom-clicked")
		chatButton.classList.add("button-small-custom")
		screenSharingContainer.style.minWidth = "100%"
		screenSharingContainer.style.maxWidth = "100%"
		videoContainer.style.minWidth = "100%"
		videoContainer.style.maxWidth = "100%"
		userListButton.setAttribute("disabled", true)
		chatButton.setAttribute("disabled", true)
		let isLineNewMessageExist = document.getElementById("new-message-notification")
		if (isLineNewMessageExist) {
			isLineNewMessageExist.remove()
		}
		setTimeout(() => {
			chatButton.removeAttribute("disabled")
			userListButton.removeAttribute("disabled")
			userListContainer.className = "hide-side-bar"
		}, 1000)
	}
})

let sendMessageButton = document.getElementById("sending-message")
sendMessageButton.addEventListener("submit", (e) => {
	try {
		e.preventDefault()
		let inputMessage = document.getElementById("message-input").value
		let sender = parameter.username
		if (!inputMessage) {
			let ae = document.getElementById("alert-error")
			ae.className = "show"
			ae.innerHTML = `You cannot send empty message`
			// Show Warning
			setTimeout(() => {
				ae.className = ae.className.replace("show", "")
				ae.innerHTML = ``
			}, 3000)
		}

		const messageDate = new Date()

		parameter.allUsers.forEach((data) => {
			if (data.socketId != socket.id) {
				console.log(data.socketId)
				socket.emit("send-message", { message: inputMessage, sendTo: data.socketId, sender, messageDate })
			}
		})

		document.getElementById("message-input").value = ""
		sendMessage({ message: inputMessage, sender, date: messageDate })
	} catch (error) {
		console.log("- Error At Send Message Button : ", error)
	}
})

let optionButton = document.getElementById("option-button")
let optionMenu = document.getElementById("option-menu")
optionButton.addEventListener("click", function (event) {
	try {
		event.stopPropagation() // Prevent the click event from propagating to the document
		// Toggle the option menu
		if (optionMenu.className === "visible") {
			hideOptionMenu()
		} else {
			showOptionMenu()
		}
	} catch (error) {
		console.log("- Error At Option Button : ", error)
	}
})

let optionalButtonTrigger = document.getElementById("optional-button-trigger")
let optionalMenuId = document.getElementById("optional-button-id")
optionalButtonTrigger.addEventListener("click", (e) => {
	try {
		let optionalButtonIcon = document.getElementById("optional-button-trigger-icon")
		if (optionalMenuId.className == "optional-button-menu") {
			optionalMenuId.className = "optional-button-menu-show"
			optionalButtonIcon.className = "fas fa-sort-down"
		} else if (optionalMenuId.className == "optional-button-menu hide") {
			optionalMenuId.className = "optional-button-menu-show"
			optionalButtonIcon.className = "fas fa-sort-down"
		} else {
			optionalMenuId.className = "optional-button-menu"
			optionalButtonIcon.className = "fas fa-sort-up"
		}
	} catch (error) {
		console.log("- Error At Optional Button Trigger : ", error)
	}
})

const hideOptionalMenu = () => {
	try {
		let optionalButtonMenu = document.getElementById("optional-button-id")
		let optionalButtonIcon = document.getElementById("optional-button-trigger-icon")
		optionalButtonMenu.className = "optional-button-menu"
		optionalButtonIcon.className = "fas fa-sort-up"
	} catch (error) {
		console.log("- Error Hiding Optional Menu : ", error)
	}
}

// Click event for the document (to hide the option menu when clicking outside)
document.addEventListener("click", function () {
	hideOptionMenu()
})

module.exports = { socket, parameter }
