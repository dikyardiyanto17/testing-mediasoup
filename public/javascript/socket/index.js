const {
	changeUserListMicIcon,
	sendMessage,
	receiveMessage,
	hideOptionMenu,
	showOptionMenu,
	scrollToBottom,
	checkLocalStorage,
	changeAppData,
	newUserNotification,
	showMicOptionsMenu,
	hideMicOptionsMenu,
	hideVideoOptionsMenu,
	timerLayout,
} = require("../room/function")
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
	changeMicCondition,
	videoDisplayModeScreenSharing,
} = require("../room/ui/button")
const {
	createMyVideo,
	removeVideoAndAudio,
	updatingLayout,
	changeLayout,
	changeUserMic,
	removeUserList,
	changeUsername,
	startSpeechToText,
} = require("../room/ui/video")

let isDisconnected = 0

let parameter

// const socket = require("socket.io-client")("/")

// socket.on("connect_error", (err) => {
// 	console.log(`connect_error due to ${err.message}`)
// })

// socket.on("connect_failed", (err) => {
// 	console.log(`connect_error due to ${err.message}`)
// })

const socket = io("/")

// socket.io.on("error", (error) => {
// 	console.log("-Socket Error : ", error)
// })
// socket.io.on("ping", () => {
// 	console.log("- Ping Socket")
// })

socket.on("connection-success", async ({ socketId }) => {
	try {
		if (isDisconnected >= 1) window.location.reload()
		isDisconnected++
		if (sessionStorage.getItem("socket_id")) {
			socket.emit("manually-turn-off-video", { socketId: sessionStorage.getItem("socket_id") })
			sessionStorage.setItem("socket_id", socketId)
		} else {
			sessionStorage.setItem("socket_id", socketId)
		}
		const isMobile = /Mobi|Android/i.test(navigator.userAgent)
		if (isMobile) {
			const screenSharingButton = document.getElementById("user-screen-share-button")
			const recordButton = document.getElementById("record-video")
			const optionalMenu = document.getElementById("optional-button-id")
			screenSharingButton.style.display = "none"
			recordButton.style.display = "none"

			// const switchCameraButton = document.getElementById("user-switch-camera-button")
			// switchCameraButton.style.marginLeft = "30px"
			// switchCameraButton.style.marginRight = "30px"
			const userListButton = document.getElementById("user-list-button")
			userListButton.style.marginLeft = "30px"
			userListButton.style.marginRight = "30px"
			const chatButton = document.getElementById("user-chat-button")
			chatButton.style.marginLeft = "30px"
			chatButton.style.marginRight = "30px"
			const shareLinkButton = document.getElementById("share-link-button")
			shareLinkButton.style.marginLeft = "30px"
			shareLinkButton.style.marginRight = "30px"
		}

		console.log("- Id : ", socketId)
		parameter = new Parameters()
		parameter.username = "Diky"
		parameter.socketId = socketId
		parameter.isVideo = true
		parameter.isAudio = true
		await getRoomId(parameter)
		await checkLocalStorage({ parameter })
		await getMyStream({ parameter, socket })
		await createMyVideo(parameter)
		await joinRoom({ socket, parameter })
	} catch (error) {
		console.log("- Error On Connecting : ", error)
	}
})

socket.on("new-producer", ({ producerId, socketId }) => {
	try {
		signalNewConsumerTransport({ remoteProducerId: producerId, socket, parameter, socketId })
	} catch (error) {
		console.log("- Error Receiving New Producer : ", error)
	}
})

socket.on("new-user-notification", ({ username, picture }) => {
	newUserNotification({ username, picture })
})

socket.on("producer-closed", ({ remoteProducerId, socketId }) => {
	try {
		const producerToClose = parameter.consumerTransports.find((transportData) => transportData.producerId === remoteProducerId)
		// producerToClose.consumerTransport.close()
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
			// parameter.userVideoElements = parameter.userVideoElements.filter((userVideo) => userVideo.id !== `vc-${socketId}`)
			// parameter.isScreenSharing.screenSharingUserViewTotalPage = Math.ceil(
			// 	parameter.totalUsers / parameter.isScreenSharing.screenSharingUserViewCurrentDisplay
			// )
			videoDisplayModeScreenSharing({ parameter, status: false })
			changeLayoutScreenSharingClient({ track: null, id: checkData.socketId, parameter, status: false })
			updatingLayout({ parameter })
			changeLayout({ parameter })
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
			parameter.userVideoElements = parameter.userVideoElements.filter((userVideo) => userVideo.id !== `vc-${socketId}`)
			parameter.isScreenSharing.screenSharingUserViewTotalPage = Math.ceil(
				parameter.totalUsers / parameter.isScreenSharing.screenSharingUserViewCurrentDisplay
			)
			updatingLayout({ parameter })
			changeLayout({ parameter })
			removeVideoAndAudio({ socketId })
			removeUserList({ id: socketId })
			if (parameter.isScreenSharing.isScreenSharing) {
				videoDisplayModeScreenSharing({ parameter, status: true })
			}
			if (checkData.screensharing) {
				videoDisplayModeScreenSharing({ parameter, status: false })
				changeLayoutScreenSharingClient({ track: null, id: checkData.socketId, parameter, status: false })
				updatingLayout({ parameter })
				changeLayout({ parameter })
			}
		}
	} catch (error) {
		console.log("- Error Closing Producer : ", error)
	}
})

socket.on("mic-config", ({ id, isMicActive }) => {
	changeUserMic({ parameter, isMicActive, id, socket })
})

socket.on("receive-message", ({ message, sender, messageDate }) => {
	try {
		receiveMessage({ message, sender, date: messageDate })
	} catch (error) {
		console.log("- Error Receving Message Socker : ", error)
	}
})

// Mute All
socket.on("mute-all", async ({ hostSocketId }) => {
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
		startSpeechToText({ parameter, socket, status: false })
		await changeMic({ parameter, status: false, socket })
		await changeUserListMicIcon({ status: true, id: socket.id })
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

socket.on("transcribe", ({ id, message }) => {
	try {
		const ccDisplay = document.getElementById("text-to-speech-result")
		let checkSpeakingHistory = parameter.speechToText.words.find((data) => data.socketId == message.socketId)
		if (!checkSpeakingHistory) {
			parameter.speechToText.words.push({
				username: message.username,
				message: message.message,
				lastSpeaking: new Date(),
				socketId: message.socketId,
			})
		}
		let speakingHistory = parameter.speechToText.words.find((data) => data.socketId == message.socketId)
		speakingHistory.lastSpeaking = new Date()
		speakingHistory.message = message.message

		const formattedMessage = ({ message }) => {
			return message.split(" ").slice(-parameter.speechToText.maxWords).join(" ")
		}

		if (parameter.speechToText.words.length != 0) {
			parameter.speechToText.words.sort((a, b) => new Date(b.lastSpeaking) - new Date(a.lastSpeaking))
			if (parameter.speechToText.words.length > 1) {
				ccDisplay.textContent = `${parameter.speechToText.words[1]?.username} : ${formattedMessage({
					message: parameter.speechToText.words[1]?.message,
				})}\n${parameter.speechToText.words[0]?.username} : ${formattedMessage({
					message: parameter.speechToText.words[0]?.message,
				})}`
			} else {
				ccDisplay.textContent = `${parameter.speechToText.words[0]?.username} : ${formattedMessage({
					message: parameter.speechToText.words[0]?.message,
				})}`
			}
		}
	} catch (error) {
		console.log("- Error CC : ", error)
	}
})

socket.on("rename-user", ({ id, content }) => {
	try {
		changeUsername({ id: content.socketId, newUsername: content.newUsername, parameter })
	} catch (error) {
		console.log("- Error Renaming User : ", error)
	}
})

/**  EVENT LISTENER  **/

let micButton = document.getElementById("user-mic-button")
micButton.addEventListener("click", (e) => {
	e.stopPropagation()
	console.log(socket.id, " != ", parameter.micCondition.socketId)
	if (parameter.micCondition.isLocked && parameter.micCondition.socketId != socket.id) {
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
	if (micButton.className === "btn button-small-custom") {
		changeMicCondition({ parameter, socket, status: false })
		micButton.className = "btn button-small-custom-clicked"
	} else {
		changeMicCondition({ parameter, socket, status: true })
		micButton.className = "btn button-small-custom"
	}
	// let micOptionsIcon = document.getElementById("audio-button-options")

	// const micOptionsContainer = document.getElementById("mic-options")
	// if (micOptionsContainer.className == "invisible") {
	// 	showMicOptionsMenu()
	// } else {
	// 	hideMicOptionsMenu()
	// }
})

let micOptionsIcon = document.getElementById("audio-button-options")
micOptionsIcon.addEventListener("click", (e) => {
	e.stopPropagation()
	// let micOptionsIcon = document.getElementById("audio-button-options")
	// console.log("Icon Mic Clicked")

	const micOptionsContainer = document.getElementById("mic-options")
	if (micOptionsContainer.className == "invisible") {
		showMicOptionsMenu()
	} else {
		hideMicOptionsMenu()
	}
})

const audioInputDecoration = document.getElementById("audio-input")
const audioOutputDecoration = document.getElementById("audio-output")

audioInputDecoration.addEventListener("click", (e) => {
	e.stopPropagation()
})

audioOutputDecoration.addEventListener("click", (e) => {
	e.stopPropagation()
})

let cameraButton = document.getElementById("user-turn-on-off-camera-button")
cameraButton.addEventListener("click", async () => {
	try {
		let isActive = document.getElementById("turn-on-off-camera-icons").classList
		let myData = parameter.allUsers.find((data) => data.socketId == parameter.socketId)

		parameter.videoParams.appData.isMicActive = parameter.isAudio
		if (isActive[1] == "fa-video") {
			cameraButton.classList.replace("button-small-custom", "button-small-custom-clicked")
			isActive.add("fa-video-slash")
			isActive.remove("fa-video")
			turnOffOnCamera({ id: socket.id, status: false })
			await socket.emit("close-producer-from-client", { id: parameter.videoProducer.id })
			parameter.videoProducer.close()
			parameter.videoProducer = null
			myData.video.producerId = undefined
			myData.video.isActive = false
			parameter.videoParams.appData.isActive = false
			parameter.videoParams.appData.isVideoActive = false
		} else {
			let newStream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: parameter.devices.video.id } } })
			cameraButton.classList.replace("button-small-custom-clicked", "button-small-custom")
			if (parameter.localStream.getVideoTracks()[0]) {
				parameter.localStream.removeTrack(parameter.localStream.getVideoTracks()[0])
			}
			parameter.localStream.addTrack(newStream.getVideoTracks()[0])
			parameter.videoParams.track = newStream.getVideoTracks()[0]
			parameter.videoParams.appData.isActive = true
			parameter.videoParams.appData.isVideoActive = true
			isActive.add("fa-video")
			isActive.remove("fa-video-slash")
			parameter.videoProducer = await parameter.producerTransport.produce(parameter.videoParams)
			await parameter.videoProducer.setMaxSpatialLayer(parameter.upStreamQuality)
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

let cameraOptionIcon = document.getElementById("video-button-options")
cameraOptionIcon.addEventListener("click", (e) => {
	e.stopPropagation()
	const videoOptions = document.getElementById("video-options")
	if (videoOptions.className === "invisible") {
		videoOptions.className = "visible"
	} else {
		videoOptions.className = "invisible"
	}
})

const videoInputDecoration = document.getElementById("video-input")
videoInputDecoration.addEventListener("click", (e) => {
	e.stopPropagation()
})

// let switchCameraButton = document.getElementById("user-switch-camera-button")
// switchCameraButton.addEventListener("click", async () => {
// 	parameter.videoParams.appData.isMicActive = parameter.isAudio
// 	let isActive = document.getElementById("turn-on-off-camera-icons").classList
// 	await switchCamera({ parameter })
// 	if (isActive[1] == "fa-video-slash") {
// 		cameraButton.classList.replace("button-small-custom-clicked", "button-small-custom")
// 		isActive.add("fa-video")
// 		isActive.remove("fa-video-slash")
// 		turnOffOnCamera({ id: socket.id, status: true })
// 	}
// })

let screenSharingButton = document.getElementById("user-screen-share-button")
screenSharingButton.addEventListener("click", () => {
	if (parameter.isScreenSharing.isScreenSharing && parameter.isScreenSharing.socketId !== parameter.socketId) {
		let ae = document.getElementById("alert-error")
		ae.className = "show"
		ae.innerHTML = `Someone is already screen-sharing`
		// Show Warning
		setTimeout(() => {
			ae.className = ae.className.replace("show", "")
			ae.innerHTML = ``
		}, 3000)
		return
	}
	parameter.isScreenSharing.socketId = parameter.socketId
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

// let recordButton = document.getElementById("user-record-button")
// recordButton.addEventListener("click", () => {
// 	recordVideo({ parameter })
// })

let recordButton = document.getElementById("record-video")
recordButton.addEventListener("click", () => {
	recordVideo({ parameter })
})

let videoQualityButton = document.getElementById("video-quality")

videoQualityButton.addEventListener("click", () => {
	document.getElementById("performance-setting-id").className = "performance-setting"
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
	let sideBarContainer = document.getElementById("side-bar-container")
	if (window.innerWidth <= 950) {
		if (!isInScreenSharingMode && userListButton.classList[1] == "button-small-custom") {
			sideBarContainer.style.right = "0%"
			sideBarContainer.style.display = "block"
			chatButton.className = "btn button-small-custom"
			chatContainer.className = "hide-side-bar"
			userListButton.classList.remove("button-small-custom")
			userListButton.classList.add("button-small-custom-clicked")
			userListContainer.className = "show-side-bar"
			userListButton.setAttribute("disabled", true)
			chatButton.setAttribute("disabled", true)
			scrollToBottom()
			setTimeout(() => {
				// sideBarContainer.removeAttribute("style")
				chatButton.removeAttribute("disabled")
				userListButton.removeAttribute("disabled")
			}, 1000)
		} else if (!isInScreenSharingMode && userListButton.classList[1] == "button-small-custom-clicked") {
			sideBarContainer.style.right = "-100%"
			userListButton.classList.remove("button-small-custom-clicked")
			userListButton.classList.add("button-small-custom")
			userListButton.setAttribute("disabled", true)
			chatButton.setAttribute("disabled", true)
			setTimeout(() => {
				sideBarContainer.removeAttribute("style")
				sideBarContainer.style.display = "none"
				chatButton.removeAttribute("disabled")
				userListButton.removeAttribute("disabled")
				userListContainer.className = "hide-side-bar"
			}, 1000)
		} else if (isInScreenSharingMode && userListButton.classList[1] == "button-small-custom") {
			sideBarContainer.style.right = "0%"
			sideBarContainer.style.display = "block"
			chatButton.className = "btn button-small-custom"
			chatContainer.className = "hide-side-bar"
			userListButton.classList.remove("button-small-custom")
			userListButton.classList.add("button-small-custom-clicked")
			userListContainer.className = "show-side-bar"
			userListButton.setAttribute("disabled", true)
			chatButton.setAttribute("disabled", true)
			scrollToBottom()
			setTimeout(() => {
				// sideBarContainer.removeAttribute("style")
				chatButton.removeAttribute("disabled")
				userListButton.removeAttribute("disabled")
			}, 1000)
		} else if (isInScreenSharingMode && userListButton.classList[1] == "button-small-custom-clicked") {
			sideBarContainer.style.right = "-100%"
			userListButton.classList.remove("button-small-custom-clicked")
			userListButton.classList.add("button-small-custom")
			userListButton.setAttribute("disabled", true)
			chatButton.setAttribute("disabled", true)
			setTimeout(() => {
				sideBarContainer.removeAttribute("style")
				sideBarContainer.style.display = "block"
				chatButton.removeAttribute("disabled")
				userListButton.removeAttribute("disabled")
				userListContainer.className = "hide-side-bar"
			}, 1000)
		}
	} else {
		sideBarContainer.style.minWidth = "25%"
		if (!isInScreenSharingMode && userListButton.classList[1] == "button-small-custom") {
			sideBarContainer.style.display = "block"
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
				sideBarContainer.removeAttribute("style")
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
				sideBarContainer.removeAttribute("style")
				sideBarContainer.style.display = "none"
				chatButton.removeAttribute("disabled")
				userListButton.removeAttribute("disabled")
				userListContainer.className = "hide-side-bar"
			}, 1000)
		} else if (isInScreenSharingMode && userListButton.classList[1] == "button-small-custom") {
			let screenSharingContainer = document.getElementById("screen-sharing-container")
			sideBarContainer.style.display = "block"
			chatButton.className = "btn button-small-custom"
			chatContainer.className = "hide-side-bar"
			userListButton.classList.remove("button-small-custom")
			userListButton.classList.add("button-small-custom-clicked")
			screenSharingContainer.style.minWidth = "75%"
			screenSharingContainer.style.maxWidth = "75%"
			// videoContainer.style.minWidth = "75%"
			// videoContainer.style.maxWidth = "75%"
			userListContainer.className = "show-side-bar"
			userListButton.setAttribute("disabled", true)
			chatButton.setAttribute("disabled", true)
			scrollToBottom()
			setTimeout(() => {
				sideBarContainer.removeAttribute("style")
				chatButton.removeAttribute("disabled")
				userListButton.removeAttribute("disabled")
			}, 1000)
		} else if (isInScreenSharingMode && userListButton.classList[1] == "button-small-custom-clicked") {
			let screenSharingContainer = document.getElementById("screen-sharing-container")
			userListButton.classList.remove("button-small-custom-clicked")
			userListButton.classList.add("button-small-custom")
			screenSharingContainer.style.minWidth = "100%"
			screenSharingContainer.style.maxWidth = "100%"
			// videoContainer.style.minWidth = "100%"
			// videoContainer.style.maxWidth = "100%"
			userListButton.setAttribute("disabled", true)
			chatButton.setAttribute("disabled", true)
			setTimeout(() => {
				sideBarContainer.removeAttribute("style")
				sideBarContainer.style.display = "none"
				chatButton.removeAttribute("disabled")
				userListButton.removeAttribute("disabled")
				userListContainer.className = "hide-side-bar"
				userListContainer.removeAttribute("style")
			}, 1000)
		}
	}
})

chatButton.addEventListener("click", () => {
	let upperContainer = document.getElementById("upper-container")
	let isInScreenSharingMode = upperContainer.querySelector("#screen-sharing-container")
	let videoContainer = document.getElementById("video-container")
	let userListContainer = document.getElementById("user-bar")
	let chatContainer = document.getElementById("chat-bar-box-id")
	let iconsNotification = document.getElementById("notification-element-id")
	let sideBarContainer = document.getElementById("side-bar-container")
	if (window.innerWidth <= 950) {
		if (!isInScreenSharingMode && chatButton.classList[1] == "button-small-custom") {
			sideBarContainer.style.right = "0%"
			sideBarContainer.style.display = "block"
			userListButton.className = "btn button-small-custom"
			userListContainer.className = "hide-side-bar"
			chatButton.classList.remove("button-small-custom")
			chatButton.classList.add("button-small-custom-clicked")
			chatContainer.className = "show-side-bar"
			userListButton.setAttribute("disabled", true)
			chatButton.setAttribute("disabled", true)
			iconsNotification.className = "fas fa-envelope notification invisible"
			setTimeout(() => {
				// sideBarContainer.removeAttribute("style")
				chatButton.removeAttribute("disabled")
				userListButton.removeAttribute("disabled")
			}, 1000)
		} else if (!isInScreenSharingMode && chatButton.classList[1] == "button-small-custom-clicked") {
			sideBarContainer.style.right = "-100%"
			chatButton.classList.remove("button-small-custom-clicked")
			chatButton.classList.add("button-small-custom")
			userListButton.setAttribute("disabled", true)
			chatButton.setAttribute("disabled", true)
			let isLineNewMessageExist = document.getElementById("new-message-notification")
			if (isLineNewMessageExist) {
				isLineNewMessageExist.remove()
			}
			setTimeout(() => {
				sideBarContainer.removeAttribute("style")
				sideBarContainer.style.display = "none"
				chatButton.removeAttribute("disabled")
				userListButton.removeAttribute("disabled")
				chatContainer.className = "hide-side-bar"
			}, 1000)
		} else if (isInScreenSharingMode && chatButton.classList[1] == "button-small-custom") {
			sideBarContainer.style.right = "0%"
			sideBarContainer.style.display = "block"
			userListButton.className = "btn button-small-custom"
			userListContainer.className = "hide-side-bar"
			chatButton.classList.remove("button-small-custom")
			chatButton.classList.add("button-small-custom-clicked")
			chatContainer.className = "show-side-bar"
			userListButton.setAttribute("disabled", true)
			chatButton.setAttribute("disabled", true)
			iconsNotification.className = "fas fa-envelope notification invisible"
			setTimeout(() => {
				sideBarContainer.removeAttribute("style")
				sideBarContainer.style.display = "block"
				chatButton.removeAttribute("disabled")
				userListButton.removeAttribute("disabled")
			}, 1000)
		} else if (isInScreenSharingMode && chatButton.classList[1] == "button-small-custom-clicked") {
			sideBarContainer.style.right = "-100%"
			chatButton.classList.remove("button-small-custom-clicked")
			chatButton.classList.add("button-small-custom")
			chatContainer.className = "hide-side-bar"
			userListButton.setAttribute("disabled", true)
			chatButton.setAttribute("disabled", true)
			let isLineNewMessageExist = document.getElementById("new-message-notification")
			if (isLineNewMessageExist) {
				isLineNewMessageExist.remove()
			}
			setTimeout(() => {
				sideBarContainer.removeAttribute("style")
				sideBarContainer.style.display = "none"
				chatButton.removeAttribute("disabled")
				userListButton.removeAttribute("disabled")
				userListContainer.className = "hide-side-bar"
			}, 1000)
		}
	} else {
		sideBarContainer.style.minWidth = "25%"
		if (!isInScreenSharingMode && chatButton.classList[1] == "button-small-custom") {
			sideBarContainer.style.display = "block"
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
				sideBarContainer.removeAttribute("style")
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
				sideBarContainer.removeAttribute("style")
				sideBarContainer.style.display = "none"
				chatButton.removeAttribute("disabled")
				userListButton.removeAttribute("disabled")
				chatContainer.className = "hide-side-bar"
			}, 1000)
		} else if (isInScreenSharingMode && chatButton.classList[1] == "button-small-custom") {
			let screenSharingContainer = document.getElementById("screen-sharing-container")
			sideBarContainer.style.display = "block"
			userListButton.className = "btn button-small-custom"
			userListContainer.className = "hide-side-bar"
			chatButton.classList.remove("button-small-custom")
			chatButton.classList.add("button-small-custom-clicked")
			screenSharingContainer.style.minWidth = "75%"
			screenSharingContainer.style.maxWidth = "75%"
			// videoContainer.style.minWidth = "75%"
			// videoContainer.style.maxWidth = "75%"
			chatContainer.className = "show-side-bar"
			userListButton.setAttribute("disabled", true)
			chatButton.setAttribute("disabled", true)
			iconsNotification.className = "fas fa-envelope notification invisible"
			setTimeout(() => {
				sideBarContainer.removeAttribute("style")
				chatButton.removeAttribute("disabled")
				userListButton.removeAttribute("disabled")
			}, 1000)
		} else if (isInScreenSharingMode && chatButton.classList[1] == "button-small-custom-clicked") {
			let screenSharingContainer = document.getElementById("screen-sharing-container")
			chatButton.classList.remove("button-small-custom-clicked")
			chatButton.classList.add("button-small-custom")
			screenSharingContainer.style.minWidth = "100%"
			screenSharingContainer.style.maxWidth = "100%"
			// videoContainer.style.minWidth = "100%"
			// videoContainer.style.maxWidth = "100%"
			userListButton.setAttribute("disabled", true)
			chatButton.setAttribute("disabled", true)
			chatContainer.style.transform = "translateX(100%)"
			let isLineNewMessageExist = document.getElementById("new-message-notification")
			if (isLineNewMessageExist) {
				isLineNewMessageExist.remove()
			}
			setTimeout(() => {
				sideBarContainer.removeAttribute("style")
				sideBarContainer.style.display = "none"
				chatButton.removeAttribute("disabled")
				userListButton.removeAttribute("disabled")
				userListContainer.className = "hide-side-bar"
				chatContainer.className = "hide-side-bar"
				chatContainer.removeAttribute("style")
			}, 1000)
		}
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
		event.stopPropagation()
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
const optionalMenuTrigger = () => {
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
		console.log("- Error At Optional Menu : ", error)
	}
}
optionalButtonTrigger.addEventListener("click", (e) => {
	try {
		e.stopPropagation()
		optionalMenuTrigger()
	} catch (error) {
		console.log("- Error At Optional Button Trigger : ", error)
	}
})

const hangUpButton = document.getElementById("user-hang-up-button")
hangUpButton.addEventListener("click", () => {
	try {
		socket.close()
		localStorage.clear()
		window.location.href = window.location.origin
	} catch (error) {
		console.log("- Error At Hang Up Button : ", error)
	}
})

const videoUpStreamSettingInput = document.getElementById("video-quality-input-up-stream")
const videoDownStreamSettingInput = document.getElementById("video-quality-input-down-stream")
const videoQualityConfirmButton = document.getElementById("video-quality-confirm-button-id")
videoQualityConfirmButton.addEventListener("click", () => {
	try {
		document.getElementById("performance-setting-id").className = "performance-box-hide"
	} catch (error) {
		console.log("- Error Closing Video Quality Settings : ", error)
	}
})

videoUpStreamSettingInput.addEventListener("input", async () => {
	try {
		if (typeof videoUpStreamSettingInput.value == "string") {
			const inputStringToNumber = Number(videoUpStreamSettingInput.value)
			parameter.upStreamQuality = inputStringToNumber
			if (parameter.videoProducer) {
				await parameter.videoProducer.setMaxSpatialLayer(parameter.upStreamQuality)
			}
		} else if (typeof videoUpStreamSettingInput.value == "number") {
			parameter.upStreamQuality = videoUpStreamSettingInput.value
			if (parameter.videoProducer) {
				await parameter.videoProducer.setMaxSpatialLayer(parameter.upStreamQuality)
			}
		} else {
			throw { name: "Invalid Input", message: "Input is not number" }
		}
	} catch (error) {
		console.log("- Error Changing Up Stream : ", error)
	}
})

videoDownStreamSettingInput.addEventListener("input", async () => {
	try {
		if (typeof videoDownStreamSettingInput.value == "string") {
			const inputStringToNumber = Number(videoDownStreamSettingInput.value)
			parameter.downStreamQuality = inputStringToNumber
			parameter.allUsers.forEach((user) => {
				if (user.socketId != socket.id) {
					socket.emit("set-consumer-quality", { consumerId: user.video.consumerId, SL: parameter.downStreamQuality, TL: 2 })
				}
			})
		} else if (typeof videoDownStreamSettingInput.value == "number") {
			parameter.downStreamQuality = videoDownStreamSettingInput.value
			parameter.allUsers.forEach((user) => {
				if (user.socketId != socket.id) {
					socket.emit("set-consumer-quality", { consumerId: user.video.consumerId, SL: parameter.downStreamQuality, TL: 2 })
				}
			})
		} else {
			throw { name: "Invalid Input", message: "Input is not number" }
		}
	} catch (error) {
		console.log("- Error : ", error)
	}
})

window.addEventListener("beforeunload", function (event) {
	try {
		if (parameter.record.recordedStream) {
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
			let confirmationMessage = "Anda yakin ingin menutup tab ini?"
			// (Standar) For modern browsers
			event.returnValue = confirmationMessage

			// (IE) For Internet Explorer
			return confirmationMessage
		}
		window.location.href = window.location.origin
		socket.close()
	} catch (error) {}
})

const displayCCButton = document.getElementById("display-cc")
const displayCC = document.getElementById("text-to-speech-id")
displayCCButton.addEventListener("click", () => {
	if (displayCCButton.innerHTML == "Display CC") {
		displayCC.className = "text-to-speech"
		displayCCButton.innerHTML = "Hide CC"
	} else {
		displayCC.className = "text-to-speech-hide"
		displayCCButton.innerHTML = "Display CC"
	}
})

const renameButton = document.getElementById("rename")
renameButton.addEventListener("click", (event) => {
	try {
		event.stopPropagation()
	} catch (error) {
		console.log("- Error Renaming : ", error)
	}
})

const renameInput = document.getElementById("rename-input")
renameInput.addEventListener("input", (event) => {
	event.stopPropagation()
})

renameInput.addEventListener("keydown", (event) => {
	if (event.key === " ") {
		event.stopPropagation()
	}
})

renameInput.addEventListener("keyup", (event) => {
	event.preventDefault()
})

const submitRenameButton = document.getElementById("submit-rename")
submitRenameButton.addEventListener("click", () => {
	try {
		const newUsername = document.getElementById("rename-input").value
		changeUsername({ id: socket.id, parameter, newUsername })

		localStorage.setItem("username", newUsername)
		parameter.allUsers.forEach((data) => {
			if (data.socketId == socket.id) {
				console.log(data)
				changeAppData({ socket, data: { username: newUsername }, remoteProducerId: parameter.audioProducer.id })
				if (parameter.videoProducerId) {
					changeAppData({ socket, data: { username: newUsername }, remoteProducerId: parameter.videoProducer.id })
				}
			}
			if (data.socketId != socket.id) {
				socket.emit("rename-user", {
					sendTo: data.socketId,
					id: socket.id,
					content: {
						socketId: socket.id,
						newUsername,
					},
				})
				// changeAppData({socket, })
			}
		})
	} catch (error) {
		console.log("- Error Submitting New Name : ", error)
	}
})

window.addEventListener("online", function () {
	console.log("Network is online")
	window.location.reload()
})

window.addEventListener("offline", function () {
	console.log("Network is offline")
	// window.location.reload()
	// socket.close()
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
document.addEventListener("click", function (e) {
	hideOptionMenu()
	hideMicOptionsMenu()
	hideVideoOptionsMenu()
	const optionalMenus = document.getElementById("optional-button-id")
	// const micOptionsMenus = this.doctype.getElementById("mic-options")
	if (window.innerWidth <= 950 && optionalMenuId.className == "optional-button-menu-show" && !optionalMenus.contains(e.target)) {
		let optionalButtonIcon = document.getElementById("optional-button-trigger-icon")
		optionalMenuId.className = "optional-button-menu"
		optionalButtonIcon.className = "fas fa-sort-up"
	}
})

module.exports = { socket, parameter }
