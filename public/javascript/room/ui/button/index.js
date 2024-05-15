const RecordRTC = require("recordrtc")
const { timerLayout, muteAllParticipants, unlockAllMic, changeAppData, changeUserListMicIcon } = require("../../function")
const { updatingLayout, changeLayout, createAudioVisualizer } = require("../video")

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
		// console.log(myVideo.srcObject.getVideoTracks()[0])
		let myData = parameter.allUsers.find((data) => data.socketId == parameter.socketId)
		// let videoDevices = (await navigator.mediaDevices.enumerateDevices()).filter((device) => device.kind === "videoinput")
		// console.log("- Parameter : ", parameter.devices)
		// parameter.devices.video.iteration++
		// if (parameter.devices.video.iteration >= videoDevices?.length) parameter.devices.video.iteration = 0
		// parameter.devices.video.id = videoDevices[parameter.devices.video.iteration].deviceId
		// let mode = await videoDevices[parameter.devices.video.iteration].getCapabilities().facingMode
		// console.log("- Mode : ", mode[0])
		// mode.length === 0 ? "environment" : mode[0]

		// console.log(parameter.devices.video, " --- ", videoDevices)

		let config = {
			video: {
				deviceId: { exact: parameter.devices.video.id },
				// video: { facingMode: { exact: mode[0] ? mode[0] : "environment" } },
			},
		}

		if (myVideo.srcObject.getVideoTracks()[0]) myVideo.srcObject.getVideoTracks()[0].stop()

		let newStream = await navigator.mediaDevices.getUserMedia(config)

		if (parameter.localStream.getVideoTracks()[0]) {
			parameter.localStream.getVideoTracks()[0].stop()
			parameter.localStream.removeTrack(parameter.localStream.getVideoTracks()[0])
		}
		parameter.localStream.addTrack(newStream.getVideoTracks()[0])

		// if (!parameter.videoProducer) {
		// 	parameter.videoParams.appData.isActive = true
		// 	parameter.videoParams.appData.isVideoActive = true
		// 	parameter.videoParams.track = newStream.getVideoTracks()[0]
		// 	parameter.videoProducer = await parameter.producerTransport.produce(parameter.videoParams)
		// 	myData.video.producerId = parameter.videoProducer.id
		// 	myData.video.isActive = true
		// } else {
		parameter.videoProducer.replaceTrack({ track: newStream.getVideoTracks()[0] })
		// }
	} catch (error) {
		console.log("- Error Switching Camera : ", error)
	}
}

const switchMicrophone = async ({ parameter, deviceId, socket }) => {
	try {
		let previousIcon = document.getElementById(`${parameter.devices.audio.id}-audio-input`).firstChild.firstChild
		previousIcon.className = `fa-regular fa-square`
		let iconCheckListMicrophone = document.getElementById(`${deviceId}-audio-input`).firstChild.firstChild
		iconCheckListMicrophone.className = `fa-regular fa-square-check`
		parameter.devices.audio.id = deviceId
		const myVideo = document.getElementById(`v-${parameter.socketId}`)
		let myData = parameter.allUsers.find((data) => data.socketId == parameter.socketId)

		let config = {
			audio: {
				deviceId: { exact: deviceId },
				autoGainControl: false,
				noiseSuppression: true,
				echoCancellation: true,
			},
		}

		myVideo.srcObject.getAudioTracks()[0].stop()

		let newStream = await navigator.mediaDevices.getUserMedia(config)
		newStream.getAudioTracks()[0].enabled = myData.audio.isActive
		parameter.localStream.getAudioTracks()[0].stop()
		parameter.localStream.removeTrack(parameter.localStream.getAudioTracks()[0])
		parameter.localStream.addTrack(newStream.getAudioTracks()[0])
		// parameter.audioParams.appData.isActive = true
		// parameter.audioParams.appData.isAudioActive = true
		// myData.audio.isActive = true
		parameter.audioProducer.replaceTrack({ track: newStream.getAudioTracks()[0] })
		// changeMicCondition({ parameter, socket, status: true })
		document.getElementById(`audio-visualizer-${parameter.socketId}`).remove()
		createAudioVisualizer({ id: parameter.socketId, track: newStream.getAudioTracks()[0] })
	} catch (error) {
		console.log("- Error Switching Microphone : ", error)
	}
}

const changeMicCondition = ({ parameter, socket, status }) => {
	try {
		console.log("- Mic Condition : ", parameter.audioParams.appData.isActive, " - ", parameter.audioParams.appData.isActive)
		const micButton = document.getElementById("user-mic-button")
		let myIconMic = document.getElementById(`user-mic-${socket.id}`)
		let user = parameter.allUsers.find((data) => data.socketId == socket.id)
		if (!status) {
			parameter.localStream.getAudioTracks()[0].enabled = false
			parameter.isAudio = false
			changeAppData({
				socket,
				data: { isActive: false, isMicActive: false, isVideoActive: parameter.videoProducer ? true : false },
				remoteProducerId: parameter.audioProducer.id,
			})
			micButton.classList.replace("button-small-custom", "button-small-custom-clicked")
			user.audio.track.enabled = false
			user.audio.isActive = false
			myIconMic.src = "/assets/pictures/micOff.png"
			micButton.querySelector("img").src = "/assets/pictures/micOff.png"
			changeMic({ parameter, status: false, socket })
			changeUserListMicIcon({ status: true, id: socket.id })
		} else {
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
			parameter.localStream.getAudioTracks()[0].enabled = true
			parameter.isAudio = true
			changeAppData({
				socket,
				data: { isActive: true, isMicActive: true, isVideoActive: parameter.videoProducer ? true : false },
				remoteProducerId: parameter.audioProducer.id,
			})
			micButton.classList.replace("button-small-custom-clicked", "button-small-custom")
			user.audio.track.enabled = true
			user.audio.isActive = true
			myIconMic.src = "/assets/pictures/micOn.png"
			micButton.querySelector("img").src = "/assets/pictures/micOn.png"
			changeMic({ parameter, status: true, socket })
			changeUserListMicIcon({ status: false, id: socket.id })
		}
	} catch (error) {
		console.log("- Error Changing Mic Conditions : ", error)
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
			parameter.screensharing.audioProducer.on("trackended", () => {
				console.log("screensharing track ended")
			})
		}

		parameter.screensharing.videoProducer = await parameter.producerTransport.produce(parameter.screensharingVideoParams)
		parameter.screensharing.videoProducer.on("trackended", () => {
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
		videoDisplayModeScreenSharing({ parameter, status: true })
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

	const mouseUpHandler = () => {
		parameter.isDragging = false
	}

	const mouseMoveHandler = (e) => {
		if (parameter.isDragging) {
			if (!parameter.isDragging) return

			const x = e.clientX - parameter.offsetX
			const y = e.clientY - parameter.offsetY

			// Ensure the div stays within the viewport
			const maxX = window.innerWidth - videoContainer.offsetWidth
			const maxY = window.innerHeight - videoContainer.offsetHeight

			const clampedX = Math.max(0, Math.min(x, maxX))
			const clampedY = Math.max(0, Math.min(y, maxY))

			videoContainer.style.left = clampedX + "px"
			videoContainer.style.top = clampedY + "px"
		}
	}

	const displayViewController = () => {
		try {
			const displayViewControllerIcon = document.getElementById("display-view-controller-icon")
			if (displayViewControllerIcon.className === "fas fa-external-link-square-alt fa-rotate-180 fa-lg") {
				displayViewControllerIcon.className = "fas fa-external-link-square-alt fa-lg"
				parameter.isScreenSharing.screenSharingUserViewCurrentDisplay = 3
				parameter.isScreenSharing.screenSharingUserViewTotalPage = Math.ceil(parameter.isScreenSharing.screenSharingUserViewTotalPage / 3)
				parameter.isScreenSharing.screenSharingUserViewCurrentPage = Math.ceil(parameter.isScreenSharing.screenSharingUserViewCurrentPage / 3)
			} else {
				displayViewControllerIcon.className = "fas fa-external-link-square-alt fa-rotate-180 fa-lg"
				parameter.isScreenSharing.screenSharingUserViewCurrentDisplay = 1
				parameter.isScreenSharing.screenSharingUserViewCurrentPage = parameter.isScreenSharing.screenSharingUserViewTotalPage * 3 - 2
				if (parameter.isScreenSharing.screenSharingUserViewCurrentPage < 1) {
					parameter.isScreenSharing.screenSharingUserViewCurrentPage = 1
				}
				parameter.isScreenSharing.screenSharingUserViewTotalPage = parameter.userVideoElements.length
			}
			console.log(parameter.isScreenSharing.screenSharingUserViewCurrentDisplay)
			videoDisplayModeScreenSharing({ parameter, status: true })
		} catch (error) {
			console.log("- Error Controlling View Controller : ", error)
		}
	}

	const minMaxDisplayButtonController = () => {
		const minMaxButton = document.getElementById("min-max-display-button")
		if (minMaxButton.className === "fa-solid fa-minimize fa-lg") {
			minMaxButton.className = "fa-solid fa-maximize fa-lg"
			parameter.userVideoElements.forEach((userVideo) => {
				userVideo.style.display = "none"
			})
			addPreviousButtonScreenSharingView({ parameter, status: false })
			addNextButtonScreenSharingView({ status: false, parameter })
		} else {
			minMaxButton.className = "fa-solid fa-minimize fa-lg"
			videoDisplayModeScreenSharing({ parameter, status: true })
		}
	}

	if (status) {
		let userListButton = document.getElementById("user-list-button")

		const usersVideoHeader = document.createElement("div")
		usersVideoHeader.id = "video-screen-sharing-header"
		usersVideoHeader.innerHTML = `<span>Users</span><div id="display-view-controller"><button class="btn"><i style="color:white;" id="min-max-display-button" class="fa-solid fa-minimize fa-lg"></i></button><button class="btn" id="button-display-view-controller"><i id="display-view-controller-icon" style="color:white;" class="fas fa-external-link-square-alt fa-lg"></i></button></div>`
		videoContainer.insertBefore(usersVideoHeader, videoContainer.firstChild)

		usersVideoHeader.addEventListener("mousedown", function (e) {
			parameter.isDragging = true
			parameter.offsetX = e.clientX - videoContainer.getBoundingClientRect().left
			parameter.offsetY = e.clientY - videoContainer.getBoundingClientRect().top
		})

		document.addEventListener("mouseup", mouseUpHandler)
		document.addEventListener("mousemove", mouseMoveHandler)

		let screenSharingContainer = document.createElement("div")
		screenSharingContainer.id = "screen-sharing-container"
		screenSharingContainer.innerHTML = `<div id="screen-sharing-video-container"><video id="screen-sharing-video" autoplay></video></div>`
		upperContainer.insertBefore(screenSharingContainer, upperContainer.firstChild)
		videoContainer.className = "video-container-screen-sharing-mode"
		document.getElementById("screen-sharing-video").srcObject = new MediaStream([track])
		parameter.isScreenSharing.isScreenSharing = true
		parameter.isScreenSharing.socketId = id
		let chatButton = document.getElementById("user-chat-button")
		if (userListButton.classList[1] == "button-small-custom-clicked" || chatButton.classList[1] == "button-small-custom-clicked") {
			screenSharingContainer.style.minWidth = "75%"
			screenSharingContainer.style.maxWidth = "75%"
		}

		const displayViewControllerIcon = document.getElementById("display-view-controller-icon")
		displayViewControllerIcon.addEventListener("click", displayViewController)

		const minMaxButtonControllerIcon = document.getElementById("min-max-display-button")
		minMaxButtonControllerIcon.addEventListener("click", minMaxDisplayButtonController)

		videoDisplayModeScreenSharing({ parameter, status: true })
		if (window.innerWidth <= 950) {
			slideUserVideoButton({ status: true })
		}
	} else {
		let screenSharingContainer = document.getElementById("screen-sharing-container")
		if (screenSharingContainer) screenSharingContainer.remove()
		parameter.isScreenSharing.isScreenSharing = false
		parameter.isScreenSharing.socketId = undefined
		videoContainer.removeAttribute("class")

		const displayViewControllerIcon = document.getElementById("display-view-controller-icon")
		displayViewControllerIcon.removeAttribute("click", displayViewController)

		const minMaxButtonControllerIcon = document.getElementById("min-max-display-button")
		minMaxButtonControllerIcon.removeEventListener("click", minMaxDisplayButtonController)

		document.getElementById("video-screen-sharing-header").remove()
		document.removeEventListener("mouseup", mouseUpHandler)
		document.removeEventListener("mousemove", mouseMoveHandler)
		addPreviousButtonScreenSharingView({ parameter, status: false })
		addNextButtonScreenSharingView({ status: false, parameter })
		if (window.innerWidth <= 950) {
			slideUserVideoButton({ status: false })
		}
	}
	updatingLayout({ parameter })
	changeLayout({ parameter })
}

const changeLayoutScreenSharing = ({ parameter, status }) => {
	let upperContainer = document.getElementById("upper-container")
	let videoContainer = document.getElementById("video-container")

	updatingLayout({ parameter })
	changeLayout({ parameter })

	const mouseUpHandler = () => {
		parameter.isDragging = false
	}

	const mouseMoveHandler = (e) => {
		if (parameter.isDragging) {
			if (!parameter.isDragging) return

			const x = e.clientX - parameter.offsetX
			const y = e.clientY - parameter.offsetY

			// Ensure the div stays within the viewport
			const maxX = window.innerWidth - videoContainer.offsetWidth
			const maxY = window.innerHeight - videoContainer.offsetHeight

			const clampedX = Math.max(0, Math.min(x, maxX))
			const clampedY = Math.max(0, Math.min(y, maxY))

			videoContainer.style.left = clampedX + "px"
			videoContainer.style.top = clampedY + "px"
		}
	}

	const displayViewController = () => {
		try {
			const displayViewControllerIcon = document.getElementById("display-view-controller-icon")
			if (displayViewControllerIcon.className === "fas fa-external-link-square-alt fa-rotate-180 fa-lg") {
				displayViewControllerIcon.className = "fas fa-external-link-square-alt fa-lg"
				parameter.isScreenSharing.screenSharingUserViewCurrentDisplay = 3
				parameter.isScreenSharing.screenSharingUserViewTotalPage = Math.ceil(parameter.isScreenSharing.screenSharingUserViewTotalPage / 3)
				parameter.isScreenSharing.screenSharingUserViewCurrentPage = Math.ceil(parameter.isScreenSharing.screenSharingUserViewCurrentPage / 3)
			} else {
				displayViewControllerIcon.className = "fas fa-external-link-square-alt fa-rotate-180 fa-lg"
				parameter.isScreenSharing.screenSharingUserViewCurrentDisplay = 1
				parameter.isScreenSharing.screenSharingUserViewCurrentPage = parameter.isScreenSharing.screenSharingUserViewTotalPage * 3 - 2
				if (parameter.isScreenSharing.screenSharingUserViewCurrentPage < 1) {
					parameter.isScreenSharing.screenSharingUserViewCurrentPage = 1
				}
				parameter.isScreenSharing.screenSharingUserViewTotalPage = parameter.userVideoElements.length
			}
			videoDisplayModeScreenSharing({ parameter, status: true })
		} catch (error) {
			console.log("- Error Controlling View Controller : ", error)
		}
	}

	const minMaxDisplayButtonController = () => {
		const minMaxButton = document.getElementById("min-max-display-button")
		if (minMaxButton.className === "fa-solid fa-minimize fa-lg") {
			minMaxButton.className = "fa-solid fa-maximize fa-lg"
			parameter.userVideoElements.forEach((userVideo) => {
				userVideo.style.display = "none"
			})
			addPreviousButtonScreenSharingView({ parameter, status: false })
			addNextButtonScreenSharingView({ status: false, parameter })
		} else {
			minMaxButton.className = "fa-solid fa-minimize fa-lg"
			videoDisplayModeScreenSharing({ parameter, status: true })
		}
	}

	if (status) {
		const usersVideoHeader = document.createElement("div")
		usersVideoHeader.id = "video-screen-sharing-header"
		usersVideoHeader.innerHTML = `<span>Users</span><div id="display-view-controller"><button class="btn"><i id="min-max-display-button" style="color:white;" class="fa-solid fa-minimize fa-lg"></i></button><button class="btn" id="button-display-view-controller"><i id="display-view-controller-icon" style="color:white;" class="fas fa-external-link-square-alt fa-lg"></i></button></div>`
		videoContainer.insertBefore(usersVideoHeader, videoContainer.firstChild)

		usersVideoHeader.addEventListener("mousedown", function (e) {
			parameter.isDragging = true
			parameter.offsetX = e.clientX - videoContainer.getBoundingClientRect().left
			parameter.offsetY = e.clientY - videoContainer.getBoundingClientRect().top
		})

		document.addEventListener("mouseup", mouseUpHandler)
		document.addEventListener("mousemove", mouseMoveHandler)

		let userListButton = document.getElementById("user-list-button")
		let screenSharingContainer = document.createElement("div")

		screenSharingContainer.id = "screen-sharing-container"
		screenSharingContainer.innerHTML = `<div id="screen-sharing-video-container"><video id="screen-sharing-video" muted autoplay></video></div>`
		upperContainer.insertBefore(screenSharingContainer, upperContainer.firstChild)
		videoContainer.className = "video-container-screen-sharing-mode"

		document.getElementById("screen-sharing-video").srcObject = parameter.screensharing.stream
		// slideUserVideoButton({ status: true })
		let chatButton = document.getElementById("user-chat-button")
		if (userListButton.classList[1] == "button-small-custom-clicked" || chatButton.classList[1] == "button-small-custom-clicked") {
			screenSharingContainer.style.minWidth = "75%"
			screenSharingContainer.style.maxWidth = "75%"
		}

		const displayViewControllerIcon = document.getElementById("display-view-controller-icon")
		displayViewControllerIcon.addEventListener("click", displayViewController)

		const minMaxButtonControllerIcon = document.getElementById("min-max-display-button")
		minMaxButtonControllerIcon.addEventListener("click", minMaxDisplayButtonController)

		videoDisplayModeScreenSharing({ parameter, status: true })
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
		// slideUserVideoButton({ status: false })

		const displayViewControllerIcon = document.getElementById("display-view-controller-icon")
		if (displayViewControllerIcon){
			displayViewControllerIcon.removeAttribute("click", displayViewController)
		}

		const minMaxButtonControllerIcon = document.getElementById("min-max-display-button")
		if (minMaxButtonControllerIcon){
			minMaxButtonControllerIcon.removeEventListener("click", minMaxDisplayButtonController)
		}

		if (document.getElementById("video-screen-sharing-header")){
			document.getElementById("video-screen-sharing-header").remove()
		}

		document.removeEventListener("mouseup", mouseUpHandler)
		document.removeEventListener("mousemove", mouseMoveHandler)

		addPreviousButtonScreenSharingView({ parameter, status: false })
		addNextButtonScreenSharingView({ status: false, parameter })
	}
	updatingLayout({ parameter })
	changeLayout({ parameter })
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

const addNextButtonScreenSharingView = ({ status, parameter }) => {
	try {
		let videoContainer = document.getElementById("video-container")
		const nextVideo = (e) => {
			try {
				if (parameter.isScreenSharing.screenSharingUserViewCurrentPage === parameter.isScreenSharing.screenSharingUserViewTotalPage) return
				parameter.isScreenSharing.screenSharingUserViewCurrentPage++

				videoDisplayModeScreenSharing({ parameter, status: true })
				addPreviousButtonScreenSharingView({ status: true, parameter })
			} catch (error) {
				console.log("- Error Displaying Next Video : ", error)
			}
		}
		if (status) {
			if (document.getElementById("next-button")) return
			const nextButton = document.createElement("button")
			nextButton.id = "next-button"
			nextButton.className = "btn"
			nextButton.innerHTML = `<i class="fas fa-chevron-right fa-lg" style="color: #ffffff;"></i>`
			nextButton.addEventListener("click", nextVideo)
			videoContainer.append(nextButton)
		} else {
			const nextButton = document.getElementById("next-button")
			if (nextButton) {
				nextButton.removeEventListener("click", nextVideo)
				nextButton.remove()
			}
		}
	} catch (error) {
		console.log("- Error Adding Next Button Screen Sharing View : ", error)
	}
}

const addPreviousButtonScreenSharingView = ({ status, parameter }) => {
	try {
		let videoContainer = document.getElementById("video-container")
		const previousVideo = (e) => {
			try {
				if (parameter.isScreenSharing.screenSharingUserViewCurrentPage <= 1) return
				parameter.isScreenSharing.screenSharingUserViewCurrentPage--
				videoDisplayModeScreenSharing({ parameter, status: true })
				addNextButtonScreenSharingView({ status: true, parameter })
			} catch (error) {
				console.log("- Error Displaying Next Video : ", error)
			}
		}
		if (status) {
			if (document.getElementById("previous-button")) return
			const previousButton = document.createElement("button")
			previousButton.id = "previous-button"
			previousButton.className = "btn"
			previousButton.innerHTML = `<i class="fas fa-chevron-left fa-lg" style="color: #ffffff;"></i>`
			previousButton.addEventListener("click", previousVideo)
			videoContainer.append(previousButton)
		} else {
			const previousButton = document.getElementById("previous-button")
			if (previousButton) {
				previousButton.removeEventListener("click", previousVideo)
				previousButton.remove()
			}
		}
	} catch (error) {
		console.log("- Error Adding Previous Button Screen Sharing View : ", error)
	}
}

const videoDisplayModeScreenSharing = ({ parameter, status }) => {
	try {
		const minMaxButton = document.getElementById("min-max-display-button")
		if (minMaxButton) {
			minMaxButton.className = "fa-solid fa-minimize fa-lg"
		}
		addPreviousButtonScreenSharingView({ parameter, status: false })
		addNextButtonScreenSharingView({ status: false, parameter })

		if (status) {
			if (parameter.isScreenSharing.screenSharingUserViewCurrentDisplay === 3) {
				if (parameter.isScreenSharing.screenSharingUserViewCurrentPage < parameter.isScreenSharing.screenSharingUserViewTotalPage) {
					addNextButtonScreenSharingView({ status: true, parameter })
				}
				if (parameter.isScreenSharing.screenSharingUserViewCurrentPage > parameter.isScreenSharing.screenSharingUserViewTotalPage) {
					parameter.isScreenSharing.screenSharingUserViewCurrentPage--
					if (parameter.isScreenSharing.screenSharingUserViewCurrentPage === 1) {
						addPreviousButtonScreenSharingView({ parameter, status: false })
					}
				}
				if (
					parameter.isScreenSharing.screenSharingUserViewCurrentPage !== 1 &&
					parameter.isScreenSharing.screenSharingUserViewCurrentPage !== parameter.isScreenSharing.screenSharingUserViewTotalPage
				) {
					addPreviousButtonScreenSharingView({ parameter, status: true })
					addNextButtonScreenSharingView({ status: true, parameter })
				}
				if (parameter.isScreenSharing.screenSharingUserViewCurrentPage !== 1 && parameter.isScreenSharing.screenSharingUserViewTotalPage > 1) {
					addPreviousButtonScreenSharingView({ parameter, status: true })
				}
				parameter.userVideoElements.forEach((userVideo, index) => {
					const endView = parameter.isScreenSharing.screenSharingUserViewCurrentPage * parameter.isScreenSharing.screenSharingUserViewCurrentDisplay
					const startView = endView - 3
					if (index >= startView && index < endView) {
						userVideo.style.display = "block"
					} else {
						userVideo.style.display = "none"
					}
				})
			} else {
				if (parameter.isScreenSharing.screenSharingUserViewCurrentPage > parameter.isScreenSharing.screenSharingUserViewTotalPage) {
					parameter.isScreenSharing.screenSharingUserViewCurrentPage--
					if (parameter.isScreenSharing.screenSharingUserViewCurrentPage === 1) {
						addPreviousButtonScreenSharingView({ parameter, status: false })
					}
				}
				if (
					parameter.isScreenSharing.screenSharingUserViewCurrentPage !== 1 &&
					parameter.isScreenSharing.screenSharingUserViewCurrentPage < parameter.isScreenSharing.screenSharingUserViewTotalPage
				) {
					addPreviousButtonScreenSharingView({ status: true, parameter })
					addNextButtonScreenSharingView({ parameter, status: true })
				}
				if (parameter.isScreenSharing.screenSharingUserViewCurrentPage < parameter.isScreenSharing.screenSharingUserViewTotalPage) {
					addNextButtonScreenSharingView({ status: true, parameter })
				}
				if (
					parameter.isScreenSharing.screenSharingUserViewCurrentPage <= parameter.isScreenSharing.screenSharingUserViewTotalPage &&
					parameter.isScreenSharing.screenSharingUserViewTotalPage > 1 &&
					parameter.isScreenSharing.screenSharingUserViewCurrentPage != 1
				) {
					addPreviousButtonScreenSharingView({ status: true, parameter })
				}
				parameter.userVideoElements.forEach((userVideo, index) => {
					if (index === parameter.isScreenSharing.screenSharingUserViewCurrentPage - 1) {
						userVideo.style.display = "block"
					} else {
						userVideo.style.display = "none"
					}
				})
			}
		} else {
			parameter.userVideoElements.forEach((userVideo) => {
				userVideo.removeAttribute("style")
			})
			console.log(parameter.userVideoElements)
		}
	} catch (error) {
		console.log("- Error Displaying Mode Screen Sharing Video : ", error)
	}
}

const recordVideo = async ({ parameter }) => {
	try {
		let recordButton = document.getElementById("record-video")

		if (recordButton.innerHTML === "Record Video") {
			// recordButton.classList.remove("button-small-custom")
			// recordButton.classList.add("button-small-custom-clicked")
			recordButton.innerHTML = "Stop Record Video"
			recordButton.style.backgroundColor = "#00ff11b2"
			recordButton.style.borderRadius = "10px"
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
			// recordButton.classList.remove("button-small-custom-clicked")
			// recordButton.classList.add("button-small-custom")
			recordButton.innerHTML = "Record Video"
			recordButton.removeAttribute("style")
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

const getCameraOptions = async ({ parameter }) => {
	try {
		const listCameraContainer = document.getElementById("video-options")
		let videoDevices = (await navigator.mediaDevices.enumerateDevices()).filter((device) => device.kind === "videoinput")
		videoDevices.forEach((videoList) => {
			let currentCameraIcons = '<i class="fa-regular fa-square"></i>'
			if (videoList.deviceId === parameter.devices.video.id) {
				currentCameraIcons = '<i class="fa-regular fa-square-check"></i>'
			}
			const cameraLabel = document.createElement("li")
			cameraLabel.innerHTML = `<span class="mic-options-icons">${currentCameraIcons}</span><span>${videoList.label}</span>`
			cameraLabel.id = videoList.deviceId
			cameraLabel.addEventListener("click", (e) => {
				e.stopPropagation()
				const currentActiveCameraIcon = document.getElementById(parameter.devices.video.id).firstChild.firstChild
				currentActiveCameraIcon.className = "fa-regular fa-square"
				parameter.devices.video.id = videoList.deviceId
				document.getElementById(parameter.devices.video.id).firstChild.firstChild.className = "fa-regular fa-square-check"
				if (parameter.videoProducer) {
					switchCamera({ parameter })
				}
			})
			listCameraContainer.appendChild(cameraLabel)
		})
	} catch (error) {
		console.log("- Error Showing Camera Options : ", error)
	}
}

const getMicOptions = async ({ parameter, socket }) => {
	try {
		let audioDevices = (await navigator.mediaDevices.enumerateDevices()).filter((device) => device.kind === "audioinput")
		let audioDevicesOutput = (await navigator.mediaDevices.enumerateDevices()).filter((device) => device.kind === "audiooutput")
		const micOptionsContainer = document.getElementById("mic-options")
		const audioOutputOptions = document.getElementById("audio-output")
		audioDevices.forEach((audio, index) => {
			let newElement = document.createElement("li")
			newElement.id = audio.deviceId + "-audio-input"
			let currentAudio = '<i class="fa-regular fa-square"></i>'
			if (audio.deviceId === parameter.devices.audio.id) {
				currentAudio = `<i class="fa-regular fa-square-check"></i>`
			}

			newElement.innerHTML = `<span class="mic-options-icons">${currentAudio}</span><span>${audio.label}</span>`
			micOptionsContainer.insertBefore(newElement, audioOutputOptions)
			newElement.addEventListener("click", (e) => {
				try {
					e.stopPropagation()
					switchMicrophone({ parameter, deviceId: audio.deviceId, socket })
				} catch (error) {
					console.log("- Error Switching Microphone : ", error)
				}
			})
		})
		audioDevicesOutput.forEach((audioDevices, index) => {
			let currentAudio = '<i class="fa-regular fa-square"></i>'
			if (index === 0) {
				currentAudio = `<i class="fa-regular fa-square-check"></i>`
				parameter.devices.speaker.id = audioDevices.deviceId
			}
			let newElement = document.createElement("li")
			newElement.id = audioDevices.deviceId + "-audio-output"
			newElement.innerHTML = `<span class="mic-options-icons">${currentAudio}</span><span>${audioDevices.label}</span>`
			micOptionsContainer.appendChild(newElement)
			newElement.addEventListener("click", (e) => {
				e.stopPropagation()
				const iconSpeaker = document.getElementById(`${parameter.devices.speaker.id}-audio-output`).firstChild.firstChild
				iconSpeaker.className = "fa-regular fa-square"
				parameter.devices.speaker.id = audioDevices.deviceId
				const currentSpeaker = document.getElementById(`${parameter.devices.speaker.id}-audio-output`).firstChild.firstChild
				currentSpeaker.className = "fa-regular fa-square-check"
				parameter.userVideoElements.forEach((videoElement) => {
					let videoId = videoElement.id.slice(3)
					let theAudio = document.getElementById(`a-${videoId}`)

					if (theAudio && typeof theAudio.sinkId !== "undefined") {
						console.log("- Sink Id Is Exist")
						theAudio
							.setSinkId(audioDevices.deviceId)
							.then(() => {
								console.log(`Success, audio output device attached: ${audioDevices.deviceId}`)
							})
							.catch((error) => {
								let errorMessage = error
								if (error.name === "SecurityError") {
									errorMessage = `You need to use HTTPS for selecting audio output device: ${error}`
								}
								console.error(errorMessage)
							})
					} else {
						console.warn("Browser does not support output device selection.")
					}
				})
				// console.log(myVideo)
				// console.log("- Sink Id", myVideo.sinkId)
				// // Get the prototype of the element
				// const proto = Object.getPrototypeOf(myVideo)

				// // Log the functions
				// console.log(proto)
			})
		})
	} catch (error) {
		console.log("- Error Getting Mic Options : ", error)
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
	getMicOptions,
	changeMicCondition,
	videoDisplayModeScreenSharing,
	getCameraOptions,
}
