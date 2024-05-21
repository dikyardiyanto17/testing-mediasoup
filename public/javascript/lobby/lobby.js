let localVideo = document.getElementById("local-video")
let localStream

const baseUrl = `${window.location.origin}/`

const Swal = require("sweetalert2")

const joinRoom = document.getElementById("join-room")
const url = window.location.pathname
const parts = url.split("/")
const roomName = parts[2]
const goTo = "room/" + roomName
let isReady = { video: false, audio: false }
let isAudioActive = true
let isVideoActive = true
let videoImage = document.getElementById("video-image")

const everythingIsReady = () => {
	try {
		const googleButton = document.getElementById("g-button")
		const audioButton = document.getElementById("select-audio-button")
		const videoButton = document.getElementById("select-video-button")
		const videoDropdownButton = document.getElementById("dropdownMenuButton-video")
		const audioDropdownButton = document.getElementById("dropdownMenuButton-audio")
		googleButton.removeAttribute("style")
		videoDropdownButton.removeAttribute("disabled")
		audioDropdownButton.removeAttribute("disabled")
		videoButton.removeAttribute("disabled")
		audioButton.removeAttribute("disabled")
		const submitButton = document.getElementById("submit-button")
		submitButton.removeAttribute("disabled")
	} catch (error) {
		console.log(error)
	}
}

const init = async () => {
	try {
		localStorage.setItem("room_id", roomName)
		const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
		await getMyDevices()
		await getMyMic()
		localStream = stream
		localVideo.srcObject = stream
	} catch (error) {
		Swal.fire({
			icon: "error",
			title: "Oops...",
			text: error.message,
		})
		console.log(error.message)
	}
}

const micOptions = document.getElementById("mic-options")
const getMyMic = async () => {
	try {
		localStorage.setItem("is_mic_active", true)
		let audioDevices = (await navigator.mediaDevices.enumerateDevices()).filter((device) => device.kind === "audioinput")

		audioDevices.forEach((audio, index) => {
			let newElement = document.createElement("p")
			newElement.className = "dropdown-item dropdown-select-options"
			newElement.textContent = audio.label
			newElement.setAttribute("value", audio.deviceId)
			micOptions.appendChild(newElement)
		})

		isReady.audio = true

		if (isReady.audio && isReady.video) {
			await everythingIsReady()
		}

		let audioIcons = document.getElementById("select-audio")
		audioIcons.className = "fas fa-microphone"

		localStorage.setItem("audioDevices", audioDevices)
		localStorage.setItem("selectedAudioDevices", audioDevices[0].deviceId)
	} catch (error) {
		Swal.fire({
			icon: "error",
			title: "Oops...",
			text: error.message,
		})
		console.log(error.message)
	}
}

micOptions.addEventListener("click", (e) => {
	if (e.target.tagName === "P") {
		let audioButton = document.getElementById("select-audio-button")
		let audioIcon = document.getElementById("select-audio")
		audioIcon.className = "fas fa-microphone"
		isAudioActive = true
		audioButton.style.backgroundColor = ""
		localStorage.setItem("is_mic_active", true)

		const clickedValue = e.target.getAttribute("value")
		const selectedVideoDevices = localStorage.getItem("selectedVideoDevices")
		let config = {
			audio: { deviceId: { exact: clickedValue } },
			video: { deviceId: { exact: selectedVideoDevices } },
		}
		localStorage.setItem("selectedAudioDevices", clickedValue)
		navigator.mediaDevices.getUserMedia(config).then((stream) => {
			if (localVideo.srcObject) {
				localVideo.srcObject.getTracks().forEach((track) => {
					track.stop()
				})
			}
			localVideo.srcObject = null
			localVideo.srcObject = stream
			localStream = stream
		})
	}
})

const videoOptions = document.getElementById("camera-options")
const getMyDevices = async (config) => {
	try {
		localStorage.setItem("is_video_active", true)
		let videoDevices = (await navigator.mediaDevices.enumerateDevices()).filter((device) => device.kind === "videoinput")

		videoDevices.forEach((video, index) => {
			let newElement = document.createElement("p")
			newElement.className = "dropdown-item dropdown-select-options"
			newElement.textContent = video.label
			newElement.setAttribute("value", video.deviceId)

			videoOptions.appendChild(newElement)
		})

		isReady.video = true

		if (isReady.audio && isReady.video) {
			await everythingIsReady()
		}

		let videoIcons = document.getElementById("select-video")
		videoIcons.className = "fas fa-video"

		localStorage.setItem("videoDevices", videoDevices)
		localStorage.setItem("selectedVideoDevices", videoDevices[0].deviceId)
	} catch (error) {
		Swal.fire({
			icon: "error",
			title: "Oops...",
			text: error.message,
		})
		console.log(error.message)
	}
}

videoOptions.addEventListener("click", (e) => {
	if (e.target.tagName === "P") {
		let videoButton = document.getElementById("select-video-button")
		let videoIcon = document.getElementById("select-video")
		videoIcon.className = "fas fa-video"
		isAudioActive = true
		videoButton.style.backgroundColor = ""
		const clickedValue = e.target.getAttribute("value")
		const selectedAudioDevices = localStorage.getItem("selectedAudioDevices")
		let config = {
			video: { deviceId: { exact: clickedValue } },
			audio: { deviceId: { exact: selectedAudioDevices } },
		}

		localStorage.setItem("selectedVideoDevices", clickedValue)
		let oldStream = localStream
		oldStream.getVideoTracks()[0].stop()

		navigator.mediaDevices.getUserMedia(config).then((stream) => {
			if (localVideo.srcObject) {
				localVideo.srcObject.getTracks().forEach((track) => {
					track.stop()
				})
			}
			videoImage.className = "video-on"
			localVideo.srcObject = null
			localStream = stream
			localVideo.srcObject = stream
		})
	}
})

const usernameForm = document.getElementById("username")
usernameForm.addEventListener("input", (e) => {
	let buttonSubmit = document.getElementById("submit-button")
	if (!e.target.value) {
		buttonSubmit.style.backgroundColor = "grey"
	} else {
		buttonSubmit.style.backgroundColor = "#2c99ed"
	}
	localStorage.setItem("username", e.target.value)
})

joinRoom.addEventListener("submit", (e) => {
	e.preventDefault()

	const userName = document.getElementById("username").value

	if (!userName) {
		Swal.fire({
			icon: "error",
			title: "Oops...",
			text: "Your username is empty",
		})
		return
	}

	const newURL = window.location.origin + "/" + goTo

	setTimeout(() => {
		window.location.href = newURL
	}, 1000)
})

let audioButton = document.getElementById("select-audio-button")
audioButton.addEventListener("click", (e) => {
	let audioIcon = document.getElementById("select-audio")
	if (isAudioActive) {
		audioButton.style.backgroundColor = "red"
		localStorage.setItem("is_audio_active", false)
		localStorage.setItem("is_mic_active", false)
		isAudioActive = false
		audioIcon.className = "fas fa-microphone-slash"
		if (isVideoActive) {
			const selectedVideoDevices = localStorage.getItem("selectedVideoDevices")
			let config = {
				video: { deviceId: { exact: selectedVideoDevices } },
			}
			navigator.mediaDevices.getUserMedia(config).then((stream) => {
				if (localVideo.srcObject) {
					localVideo.srcObject.getTracks().forEach((track) => {
						track.stop()
					})
				}
				videoImage.className = "video-on"
				localVideo.srcObject = null
				localStream = stream
				localVideo.srcObject = stream
			})
		} else {
			if (localVideo.srcObject) {
				localVideo.srcObject.getTracks().forEach((track) => {
					track.stop()
				})
			}
			videoImage.className = "video-off"
			localVideo.srcObject = null
			localStream = stream
		}
	} else {
		audioButton.style.backgroundColor = ""
		localStorage.setItem("is_audio_active", true)
		localStorage.setItem("is_mic_active", true)
		isAudioActive = true
		audioIcon.className = "fas fa-microphone"
		if (isVideoActive) {
			const selectedVideoDevices = localStorage.getItem("selectedVideoDevices")
			const selectedAudioDevices = localStorage.getItem("selectedAudioDevices")
			let config = {
				audio: { deviceId: { exact: selectedAudioDevices } },
				video: { deviceId: { exact: selectedVideoDevices } },
			}
			navigator.mediaDevices.getUserMedia(config).then((stream) => {
				if (localVideo.srcObject) {
					localVideo.srcObject.getTracks().forEach((track) => {
						track.stop()
					})
				}
				videoImage.className = "video-on"
				localVideo.srcObject = null
				localStream = stream
				localVideo.srcObject = stream
			})
		} else {
			const selectedAudioDevices = localStorage.getItem("selectedAudioDevices")
			let config = {
				audio: { deviceId: { exact: selectedAudioDevices } },
			}
			navigator.mediaDevices.getUserMedia(config).then((stream) => {
				if (localVideo.srcObject) {
					localVideo.srcObject.getTracks().forEach((track) => {
						track.stop()
					})
				}
				videoImage.className = "video-off"
				localVideo.srcObject = null
				localStream = stream
				localVideo.srcObject = stream
			})
		}
	}
})

let videoButton = document.getElementById("select-video-button")
videoButton.addEventListener("click", (e) => {
	let videoIcon = document.getElementById("select-video")
	if (isVideoActive) {
		videoButton.style.backgroundColor = "red"
		localStorage.setItem("is_video_active", false)
		isVideoActive = false
		videoIcon.className = "fas fa-video-slash"
		if (isAudioActive) {
			const selectedAudioDevices = localStorage.getItem("selectedAudioDevices")
			let config = {
				audio: { deviceId: { exact: selectedAudioDevices } },
			}
			navigator.mediaDevices.getUserMedia(config).then((stream) => {
				if (localVideo.srcObject) {
					localVideo.srcObject.getTracks().forEach((track) => {
						track.stop()
					})
				}
				videoImage.className = "video-off"
				localVideo.srcObject = null
				localStream = stream
				localVideo.srcObject = stream
			})
		} else {
			if (localVideo.srcObject) {
				localVideo.srcObject.getTracks().forEach((track) => {
					track.stop()
				})
			}
			videoImage.className = "video-off"
			localVideo.srcObject = null
			localStream = stream
		}
	} else {
		videoButton.style.backgroundColor = ""
		localStorage.setItem("is_video_active", true)
		isVideoActive = true
		videoIcon.className = "fas fa-video"
		if (isAudioActive) {
			const selectedVideoDevices = localStorage.getItem("selectedVideoDevices")
			const selectedAudioDevices = localStorage.getItem("selectedAudioDevices")
			let config = {
				audio: { deviceId: { exact: selectedAudioDevices } },
				video: { deviceId: { exact: selectedVideoDevices } },
			}
			navigator.mediaDevices.getUserMedia(config).then((stream) => {
				if (localVideo.srcObject) {
					localVideo.srcObject.getTracks().forEach((track) => {
						track.stop()
					})
				}
				videoImage.className = "video-on"
				localVideo.srcObject = null
				localStream = stream
				localVideo.srcObject = stream
			})
		} else {
			const selectedVideoDevices = localStorage.getItem("selectedVideoDevices")
			let config = {
				video: { deviceId: { exact: selectedVideoDevices } },
			}
			navigator.mediaDevices.getUserMedia(config).then((stream) => {
				if (localVideo.srcObject) {
					localVideo.srcObject.getTracks().forEach((track) => {
						track.stop()
					})
				}
				videoImage.className = "video-on"
				localVideo.srcObject = null
				localStream = stream
				localVideo.srcObject = stream
			})
		}
	}
})
let buttonSubmitHover = document.getElementById("submit-button")
let triggerInput = document.getElementById("username")
buttonSubmitHover.addEventListener("mouseover", (e) => {
	console.log(triggerInput.value)
	if (!triggerInput.value) {
		buttonSubmitHover.style.backgroundColor = "red"
	} else {
		buttonSubmitHover.style.backgroundColor = "green"
	}
})
buttonSubmitHover.addEventListener("mouseout", (e) => {
	if (!triggerInput.value) {
		buttonSubmitHover.style.backgroundColor = "grey"
	} else {
		buttonSubmitHover.style.backgroundColor = "#2c99ed"
	}
})
init()

const handleCredentialResponse = async (response) => {
	try {
		if (!isReady.video || !isReady.audio) {
			Swal.fire({
				icon: "error",
				title: "Oops...",
				text: "Your stream is not ready!",
			})
			return
		}
		const result = await fetch(baseUrl + "google-auth", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ credential: response.credential }),
		})

		const resultData = await result.json()

		localStorage.setItem("username", resultData.name)
		localStorage.setItem("picture", resultData.picture)

		const newURL = window.location.origin + "/" + goTo
		setTimeout(() => {
			window.location.href = newURL
		}, 1000)
	} catch (error) {
		console.log("- Error : ", error)
	}
}

window.onload = () => {
	google.accounts.id.initialize({
		client_id: "623403491943-290gkq7bnqtgeprtfaci3u76vtb39bjl.apps.googleusercontent.com",
		callback: handleCredentialResponse,
	})
	google.accounts.id.prompt() // also display the One Tap dialog
	// document.getElementById("loading-id").className = "loading-hide"
}

window.handleCredentialResponse = async (response) => {
	try {
		const result = await fetch(baseUrl + "google-auth", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ credential: response.credential }),
		})

		const resultData = await result.json()

		localStorage.setItem("username", resultData.name)
		localStorage.setItem("picture", resultData.picture)

		const newURL = window.location.origin + "/" + goTo
		setTimeout(() => {
			window.location.href = newURL
		}, 1000)
	} catch (error) {
		console.log("- Error : ", error)
	}
}
