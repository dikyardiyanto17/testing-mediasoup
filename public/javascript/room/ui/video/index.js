const createMyVideo = async (parameter) => {
	try {
		let picture = `<div class="${parameter.initialVideo ? "video-on" : "video-off"}" id="user-picture-container-${parameter.socketId}"><img src="${
			parameter.picture
		}" class="image-turn-off" id="user-picture-${parameter.socketId}""/></div>`
		let videoContainer = document.getElementById("video-container")
		let userVideoContainer = document.createElement("div")
		userVideoContainer.id = "vc-" + parameter.socketId
		userVideoContainer.className = "user-video-container-1"
		userVideoContainer.style.zIndex = "4"
		const micIcons = `<div class="icons-mic"><img src="/assets/pictures/mic${
			parameter.initialAudio ? "On" : "Off"
		}.png" class="mic-image" id="user-mic-${parameter.socketId}"></div>`
		// userVideoContainer.innerHTML = `${micIcons}<video id="v-${parameter.socketId}" muted autoplay class="user-video"></video>${picture}<div class="username">${parameter.username}</div>`
		userVideoContainer.innerHTML = `<div class="outside-video-user">${micIcons}<video id="v-${parameter.socketId}" muted autoplay class="user-video"></video>${picture}<div class="username" id="username-${parameter.socketId}">${parameter.username}</div></div>`
		videoContainer.appendChild(userVideoContainer)
		parameter.userVideoElements.push(userVideoContainer)
		// document.getElementById(`v-${parameter.socketId}`).style.transform = "rotateY(0deg)"
		document.getElementById(`v-${parameter.socketId}`).srcObject = parameter.localStream
		createAudioVisualizer({ id: parameter.socketId, track: parameter.localStream.getAudioTracks()[0] })
	} catch (error) {
		console.log("- Error Creating Video : ", error)
	}
}

const createVideo = ({ id, videoClassName, picture, username, micTrigger, parameter }) => {
	try {
		let isVideoExist = document.getElementById("vc-" + id)
		let addPicture = `<div class="video-on" id="user-picture-container-${id}"><img src="${picture}" class="image-turn-off" id="user-picture-${id}""/></div>`
		if (!isVideoExist) {
			let videoContainer = document.getElementById("video-container")
			let userVideoContainer = document.createElement("div")
			userVideoContainer.id = "vc-" + id
			userVideoContainer.className = videoClassName
			const micIcons = `<div class="icons-mic"><img src="/assets/pictures/mic${
				micTrigger ? "On" : "Off"
			}.png" class="mic-image" id="user-mic-${id}"/></div>`
			// userVideoContainer.innerHTML = `${micIcons}<video id="v-${id}" class="user-video" autoplay></video>${addPicture}<div class="username">${username}</div>`
			userVideoContainer.innerHTML = `<div class="outside-video-user">${micIcons}<video id="v-${id}" class="user-video" autoplay></video>${addPicture}<div class="username" id="username-${id}">${username}</div></div>`
			videoContainer.appendChild(userVideoContainer)
			parameter.userVideoElements.push(userVideoContainer)
		}
	} catch (error) {
		console.log("- Error Creating User Video : ", error)
	}
}

const createAudio = ({ id, track, parameter }) => {
	try {
		let checkAudio = document.getElementById(`ac-${id}`)
		if (!checkAudio) {
			let audioContainer = document.getElementById("audio-collection")
			const newElem = document.createElement("div")
			newElem.id = `ac-${id}`
			newElem.innerHTML = `<audio id="a-${id}" autoplay></audio>`
			// let audio = document.createElement("audio")
			// audio.id = `a-${id}`
			// audio.setAttribute("autoplay", true)
			// audio.srcObject = new MediaStream([track])
			// newElem.appendChild(audio)
			// newElem.srcObject = new MediaStream([track])
			audioContainer.appendChild(newElem)
			// console.log("- A", document.getElementById("a-" + id))
			document.getElementById("a-" + id).srcObject = new MediaStream([track])
			if (document.getElementById("a-" + id) && typeof document.getElementById("a-" + id).sinkId !== "undefined") {
				document
					.getElementById("a-" + id)
					.setSinkId(parameter.devices.speaker.id)
					.then(() => {
						console.log(`Success, audio output device attached: ${parameter.devices.speaker.id}`)
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
		}
	} catch (error) {
		console.log("- Error Creating Audio : ", error)
	}
}

const insertVideo = ({ track, id }) => {
	try {
		if (document.getElementById("v-" + id)) document.getElementById("v-" + id).srcObject = new MediaStream([track])
	} catch (error) {
		console.log("- Error Inserting Video : ", error)
	}
}

const removeVideoAndAudio = ({ socketId }) => {
	try {
		const removeVideo = document.getElementById(`vc-${socketId}`)
		if (removeVideo) removeVideo.remove()
		const removeAudio = document.getElementById(`va-${socketId}`)
		if (removeAudio) removeAudio.remove()
	} catch (error) {
		console.log("- Error Removing Video / Audio : ", error)
	}
}

const removeUserList = ({ id }) => {
	let removeList = document.getElementById(`user-${id}`)
	removeList.remove()
}

const changeLayout = ({ parameter }) => {
	try {
		const userVideoContainer = document.getElementById("video-container")
		const firstUserVideo = userVideoContainer.firstElementChild
		const secondUserVideo = userVideoContainer.children[1]
		parameter.userVideoElements.forEach((userVideo) => {
			userVideo.removeAttribute("style")
		})
		if (parameter.videoLayout == "user-video-container-2" && window.innerWidth <= 950 && !parameter.isScreenSharing.isScreenSharing) {
			firstUserVideo.style.zIndex = "4"
			secondUserVideo.style.width = "80%"
			secondUserVideo.style.height = "80%"
			secondUserVideo.style.position = "static"
		} else {
			if (secondUserVideo) secondUserVideo.removeAttribute("style")
			if (firstUserVideo) firstUserVideo.removeAttribute("style")
		}
		const userVideoContainers = document.querySelectorAll("." + parameter.previousVideoLayout)
		userVideoContainers.forEach((container, index) => {
			container.classList.remove(parameter.previousVideoLayout)
			container.classList.add(parameter.videoLayout)
		})
	} catch (error) {
		console.log("- Error Changing Layout : ", error)
	}
}

const updatingLayout = ({ parameter }) => {
	try {
		if (parameter.isScreenSharing.isScreenSharing) {
			parameter.previousVideoLayout = parameter.videoLayout
			parameter.videoLayout = "user-video-container-screen-sharing"
			return
		}
		switch (parameter.totalUsers) {
			case 1:
				parameter.previousVideoLayout = parameter.videoLayout
				parameter.videoLayout = "user-video-container-1"
				break
			case 2:
				parameter.previousVideoLayout = parameter.videoLayout
				parameter.videoLayout = "user-video-container-2"
				break
			case 3:
				parameter.previousVideoLayout = parameter.videoLayout
				parameter.videoLayout = "user-video-container-3"
				break
			case 4:
				parameter.previousVideoLayout = parameter.videoLayout
				parameter.videoLayout = "user-video-container-4"
				break
			case 5:
				parameter.previousVideoLayout = parameter.videoLayout
				parameter.videoLayout = "user-video-container-5"
				break
			case 6:
				parameter.previousVideoLayout = parameter.videoLayout
				parameter.videoLayout = "user-video-container-6"
				break
			case 7:
				parameter.previousVideoLayout = parameter.videoLayout
				parameter.videoLayout = "user-video-container-7"
				break
			case 8:
				parameter.previousVideoLayout = parameter.videoLayout
				parameter.videoLayout = "user-video-container-8"
				break
			case 9:
				parameter.previousVideoLayout = parameter.videoLayout
				parameter.videoLayout = "user-video-container-9"
				break
			case 10:
				parameter.previousVideoLayout = parameter.videoLayout
				parameter.videoLayout = "user-video-container-10"
				break
			case 11:
				parameter.previousVideoLayout = parameter.videoLayout
				parameter.videoLayout = "user-video-container-11"
				break
			case 12:
				parameter.previousVideoLayout = parameter.videoLayout
				parameter.videoLayout = "user-video-container-12"
				break
			default:
				parameter.previousVideoLayout = parameter.videoLayout
				parameter.videoLayout = "user-video-container-12"
				break
		}
	} catch (error) {
		console.log("- Failed Updating Layout : ", error)
	}
}

const createAudioVisualizer = async ({ id, track }) => {
	try {
		const newElement = document.createElement("canvas")
		newElement.className = "audio-visualizer"
		newElement.id = "audio-visualizer-" + id
		const attachTo = document.getElementById(`vc-${id}`).firstChild
		if (attachTo) {
			attachTo.appendChild(newElement)

			const canvas = document.getElementById(`audio-visualizer-${id}`)
			const ctx = canvas.getContext("2d")

			// Access the microphone audio stream (replace with your stream source)
			const audioContext = new (window.AudioContext || window.webkitAudioContext)()
			const analyser = audioContext.createAnalyser()
			analyser.fftSize = 256
			const bufferLength = analyser.frequencyBinCount
			const dataArray = new Uint8Array(bufferLength)
			let newTheAudio = new MediaStream([track])

			const audioSource = audioContext.createMediaStreamSource(newTheAudio)
			audioSource.connect(analyser)

			// Function to draw the single audio bar
			function drawBar() {
				analyser.getByteFrequencyData(dataArray)

				const barHeight = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
				// if (document.getElementById(`a-${id}`)) {
				// 	if (barHeight < 10) {
				// 		document.getElementById(`a-${id}`).volume = 0
				// 	} else {
				// 		document.getElementById(`a-${id}`).volume = 1
				// 	}
				// }
				canvas.style.boxShadow = `inset 0 0 0 ${barHeight / 20}px green, 0 0 0 ${barHeight / 20}px green`

				requestAnimationFrame(drawBar)
			}

			// Start drawing the single bar
			drawBar()
		}
	} catch (error) {
		console.log("- Error Creating Audio Level : ", error)
	}
}

const changeUserMic = ({ parameter, isMicActive, id, socket }) => {
	let user = parameter.allUsers.find((data) => data.socketId == id)
	user.audio.track.enabled = isMicActive
	user.audio.isActive = isMicActive
	let userMicIconUserList = document.getElementById("ulim-" + id)
	let iconMic = document.getElementById(`user-mic-${id}`)
	if (isMicActive) {
		startSpeechToText({ parameter, status: true, socket })
	} else {
		startSpeechToText({ parameter, status: false, socket })
	}
	if (iconMic) {
		iconMic.src = `/assets/pictures/mic${isMicActive ? "On" : "Off"}.png`
	}
	if (userMicIconUserList) {
		userMicIconUserList.src = `/assets/pictures/mic${isMicActive ? "On" : "Off"}.png`
	}
}

const startSpeechToText = ({ parameter, socket, status }) => {
	try {
		if (!status) {
			parameter.speechToText.recognition.abort()
			parameter.speechToText.recognition = null
			parameter.speechToText.speechRecognitionList = null
			return
		}
		const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
		const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList
		const SpeechRecognitionEvent = window.SpeechRecognitionEvent || window.webkitSpeechRecognitionEvent
		parameter.speechToText.recognition = new SpeechRecognition()
		parameter.speechToText.speechRecognitionList = new SpeechGrammarList()
		parameter.speechToText.recognition.continuous = true
		parameter.speechToText.recognition.lang = "id-ID"
		parameter.speechToText.recognition.interimResults = true
		parameter.speechToText.recognition.maxAlternatives = 1
		
		const ccDisplay = document.getElementById("text-to-speech-result")
		
		let finalWords = ""
		
		parameter.speechToText.recognition.onresult = (event) => {
			let interimResults = ""
			let checkMySpeakingHistory = parameter.speechToText.words.find((data) => data.socketId == socket.id)
			if (!checkMySpeakingHistory) {
				parameter.speechToText.words.push({
					username: parameter.username,
					message: "",
					lastSpeaking: new Date(),
					socketId: socket.id,
				})
			}
			for (let i = event.resultIndex; i < event.results.length; i++) {
				const transcript = event.results[i][0].transcript
				if (event.results[i].isFinal) {
					parameter.speechToText.word.push(transcript.trim())
				} else {
					interimResults += transcript
				}
			}
			let finalWords = parameter.speechToText.word.join(" ") + " " + interimResults
			let mySpeakingHistory = parameter.speechToText.words.find((data) => data.socketId == socket.id)
			mySpeakingHistory.lastSpeaking = new Date()
			mySpeakingHistory.message = finalWords
		
			const formattedMessage = ({ message }) => {
				return message.split(" ").slice(-parameter.speechToText.maxWords).join(" ")
			}
		
			parameter.allUsers.forEach((data) => {
				if (data.socketId != socket.id) {
					socket.emit("transcribe", {
						sendTo: data.socketId,
						id: socket.id,
						message: {
							socketId: socket.id,
							message: mySpeakingHistory.message,
							username: parameter.username,
							lastSpeaking: mySpeakingHistory.lastSpeaking,
						},
					})
				}
			})
		
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
		}
		
		parameter.speechToText.recognition.onerror = (event) => {
			if (event.error == "network" || event.error == "no-speech") {
				if (parameter.speechToText.recognition){
					parameter.speechToText.recognition.start()
					console.log("Restart STT On Error")
				}
			}
		}
		
		parameter.speechToText.recognition.onend = () => {
			if (parameter.speechToText.recognition){
				parameter.speechToText.recognition.start()
			}
		}
		parameter.speechToText.recognition.start()
	} catch (error) {
		console.log("- Error Start Speech Recognition : ", error)		
	}
}

const changeUsername = ({ id, newUsername, parameter }) => {
	try {
		document.getElementById(`ul-username-${id}`).innerHTML = newUsername
		document.getElementById(`username-${id}`).innerHTML = newUsername
		let checkData = parameter.allUsers.find((data) => data.socketId === id)
		if (checkData) {
			checkData.username = newUsername
		}
	} catch (error) {
		console.log("- Error Updating Username : ", error)
	}
}

module.exports = {
	createMyVideo,
	createAudio,
	createVideo,
	insertVideo,
	removeVideoAndAudio,
	changeLayout,
	updatingLayout,
	createAudioVisualizer,
	changeUserMic,
	removeUserList,
	startSpeechToText,
	changeUsername,
}
