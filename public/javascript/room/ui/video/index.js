const createMyVideo = async (parameter) => {
	try {
		let picture = `<div class="${parameter.initialVideo ? "video-on" : "video-off"}" id="user-picture-container-${parameter.socketId}"><img src="${parameter.picture
			}" class="image-turn-off" id="user-picture-${parameter.socketId}""/></div>`
		let videoContainer = document.getElementById("video-container")
		let userVideoContainer = document.createElement("div")
		userVideoContainer.id = "vc-" + parameter.socketId
		userVideoContainer.className = "user-video-container-1"
		userVideoContainer.style.zIndex = "2"
		const micIcons = `<div class="icons-mic"><img src="/assets/pictures/mic${parameter.initialAudio ? "On" : "Off"
			}.png" class="mic-image" id="user-mic-${parameter.socketId}"></div>`
		// userVideoContainer.innerHTML = `${micIcons}<video id="v-${parameter.socketId}" muted autoplay class="user-video"></video>${picture}<div class="username">${parameter.username}</div>`
		userVideoContainer.innerHTML = `<div class="outside-video-user">${micIcons}<video id="v-${parameter.socketId}" muted autoplay class="user-video"></video>${picture}<div class="username">${parameter.username}</div></div>`
		videoContainer.appendChild(userVideoContainer)
		document.getElementById(`v-${parameter.socketId}`).srcObject = parameter.localStream
		createAudioVisualizer({ id: parameter.socketId, track: parameter.localStream.getAudioTracks()[0] })
	} catch (error) {
		console.log("- Error Creating Video : ", error)
	}
}

const createVideo = ({ id, videoClassName, picture, username, micTrigger }) => {
	try {
		let isVideoExist = document.getElementById("vc-" + id)
		let addPicture = `<div class="video-on" id="user-picture-container-${id}"><img src="${picture}" class="image-turn-off" id="user-picture-${id}""/></div>`
		if (!isVideoExist) {
			let videoContainer = document.getElementById("video-container")
			let userVideoContainer = document.createElement("div")
			userVideoContainer.id = "vc-" + id
			userVideoContainer.className = videoClassName
			const micIcons = `<div class="icons-mic"><img src="/assets/pictures/mic${micTrigger ? "On" : "Off"
				}.png" class="mic-image" id="user-mic-${id}"/></div>`
			// userVideoContainer.innerHTML = `${micIcons}<video id="v-${id}" class="user-video" autoplay></video>${addPicture}<div class="username">${username}</div>`
			userVideoContainer.innerHTML = `<div class="outside-video-user">${micIcons}<video id="v-${id}" class="user-video" autoplay></video>${addPicture}<div class="username">${username}</div></div>`
			videoContainer.appendChild(userVideoContainer)
		}
	} catch (error) {
		console.log("- Error Creating User Video : ", error)
	}
}

const createAudio = ({ id, track }) => {
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
		// const secondUserVideo = document.getElementById(`vc-${parameter.socketId}`)
		const userVideoContainer = document.getElementById("video-container")
		const secondUserVideo = userVideoContainer.children[1]
		if (parameter.videoLayout == "user-video-container-2" && window.innerWidth <= 950) {
			secondUserVideo.style.width = "80%"
			secondUserVideo.style.height = "80%"
			secondUserVideo.style.position = "static"
		} else {
			secondUserVideo.removeAttribute("style")
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

const changeUserMic = ({ parameter, isMicActive, id }) => {
	let user = parameter.allUsers.find((data) => data.socketId == id)
	user.audio.track.enabled = isMicActive
	user.audio.isActive = isMicActive
	let userMicIconUserList = document.getElementById("ulim-" + id)
	let iconMic = document.getElementById(`user-mic-${id}`)
	if (iconMic) {
		iconMic.src = `/assets/pictures/mic${isMicActive ? "On" : "Off"}.png`
	}
	if (userMicIconUserList) {
		userMicIconUserList.src = `/assets/pictures/mic${isMicActive ? "On" : "Off"}.png`
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
}
