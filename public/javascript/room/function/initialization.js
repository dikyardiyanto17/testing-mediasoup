const { createUserList } = require(".")
const { socket } = require("../../socket")
const { createDevice } = require("./mediasoup")

const getMyStream = async (parameter) => {
	try {
		let config = {
			video: localStorage.getItem("is_video_active") == "true" ? { deviceId: { exact: localStorage.getItem("selectedVideoDevices") }, frameRate: { ideal: 25, max: 30 } } : false,
			audio: localStorage.getItem("selectedVideoDevices")
				? {
						deviceId: { exact: localStorage.getItem("selectedAudioDevices") },
						autoGainControl: false,
						noiseSuppression: true,
						echoCancellation: true,
				  }
				: {
						autoGainControl: false,
						noiseSuppression: true,
						echoCancellation: true,
				  },
		}

		let username = localStorage.getItem("username")
		parameter.username = username

		let stream = await navigator.mediaDevices.getUserMedia(config)
		let picture = localStorage.getItem("picture") ? localStorage.getItem("picture") : "/assets/pictures/unknown.jpg"

		let audioCondition
		let videoCondition
		parameter.initialVideo = true
		parameter.initialAudio = true
		if (localStorage.getItem("is_mic_active") == "false") {
			document.getElementById("mic-image").src = "/assets/pictures/micOff.png"
			document.getElementById("user-mic-button").className = "button-small-custom-clicked"
			parameter.initialAudio = false
			audioCondition = false
		} else audioCondition = true
		if (localStorage.getItem("is_video_active") == "false") {
			document.getElementById("turn-on-off-camera-icons").className = "fas fa-video-slash"
			document.getElementById("user-turn-on-off-camera-button").className = "button-small-custom-clicked"
			videoCondition = false
			parameter.initialVideo = false
		} else {
			videoCondition = true
			parameter.videoParams.track = stream.getVideoTracks()[0]
		}
		stream.getAudioTracks()[0].enabled = audioCondition
		let user = {
			username,
			socketId: parameter.socketId,
			picture,
			audio: {
				isActive: audioCondition,
				track: stream.getAudioTracks()[0],
				producerId: undefined,
				transportId: undefined,
				consumerId: undefined,
			},
		}

		if (videoCondition) {
			user.video = {
				isActive: videoCondition,
				track: stream.getVideoTracks()[0],
				producerId: undefined,
				transportId: undefined,
				consumerId: undefined,
			}
		}

		parameter.picture = picture

		parameter.audioParams.appData.isMicActive = audioCondition
		parameter.audioParams.appData.isVideoActive = videoCondition
		parameter.videoParams.appData.isMicActive = audioCondition
		parameter.videoParams.appData.isVideoActive = videoCondition

		parameter.audioParams.appData.isActive = audioCondition
		parameter.videoParams.appData.isActive = videoCondition

		parameter.videoParams.appData.picture = picture
		parameter.audioParams.appData.picture = picture

		parameter.allUsers = [...parameter.allUsers, user]
		parameter.localStream = stream
		parameter.audioParams.track = stream.getAudioTracks()[0]
		createUserList({ username: "Diky", socketId: parameter.socketId, cameraTrigger: videoCondition, picture, micTrigger: audioCondition })
	} catch (error) {
		console.log("- Error Getting My Stream : ", error)
	}
}

const getRoomId = async (parameter) => {
	try {
		const url = window.location.pathname
		const parts = url.split("/")
		const roomName = parts[2]
		parameter.roomName = roomName
	} catch (error) {
		console.log("- Error Getting Room Id : ", error)
	}
}

const joinRoom = async ({ parameter, socket }) => {
	try {
		parameter.totalUsers++
		parameter.previousVideoLayout = "user-video-container-1"
		parameter.videoLayout = "user-video-container-1"
		socket.emit("joinRoom", { roomName: parameter.roomName, username: parameter.username }, (data) => {
			parameter.rtpCapabilities = data.rtpCapabilities
			createDevice({ parameter, socket })
		})
	} catch (error) {
		console.log("- Error Joining Room : ", error)
	}
}

module.exports = { getMyStream, getRoomId, joinRoom }
