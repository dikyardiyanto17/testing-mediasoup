const { default: Swal } = require("sweetalert2")

const baseurl = window.location.origin
const nikInputForm = document.getElementById("nik-id")
const submitButton = document.getElementById("submit-button")
const joinRoomForm = document.getElementById("join-room")
const videoContainer = document.getElementById("video-container")
let localStream = document.getElementById("local-video")
const canvasElement = document.getElementById("canvas-element")
const recaptureButton = document.getElementById("recapture-button-id")
const userPicture = document.getElementById("user-picture-id")
// const captureButton = document.getElementById("capture-button-id")
const url = window.location.pathname
const parts = url.split("/")
const roomName = parts[2]
let image_data_url
let image_data_url_server
const loader = document.getElementById("loading-id")

const threshold = 0.6
let descriptors = { desc1: null, desc2: null }

let intervalFR

const goToRoom = () => {
	try {
		localStorage.setItem("nik", nikInputForm.value)
		const newURL = window.location.origin + "/" + "room/" + roomName
		window.location.href = newURL
	} catch (error) {
		console.log("- Error Go To Room : ", error)
	}
}
nikInputForm.addEventListener("input", (e) => {
	if (!e.target.value) {
		submitButton.setAttribute("disabled", "true")
	} else {
		submitButton.removeAttribute("disabled")
	}
})

const createFaceBox = async ({ width, height }) => {
	try {
		const canvas = document.getElementById("face-matcher-box")
		canvas.style.position = "absolute"
		canvas.height = height
		canvas.width = width
		const ctx = canvas.getContext("2d")
		const boxHeight = height / 2
		const boxWidth = width / 3
		const xPosition = width / 3
		const yPosition = height / 6

		ctx.strokeStyle = "white"
		ctx.strokeRect(xPosition, yPosition, boxWidth, boxHeight)

		ctx.fillStyle = "rgba(0, 0, 0, 0.3)"
		ctx.fillRect(xPosition, yPosition, boxWidth, boxHeight)

		return { boxHeight, boxWidth, xPosition, yPosition }
	} catch (error) {
		console.log("- Error Creating Box Canvas : ", error)
	}
}

const startFR = async () => {
	try {
		const video = document.getElementById("local-video")
		const canvas = faceapi.createCanvasFromMedia(video)
		canvas.id = "fr-box-id"
		document.getElementById("face-recognition-id").appendChild(canvas)
		const displaySize = { width: video.videoWidth, height: video.videoHeight }
		faceapi.matchDimensions(canvas, displaySize)
		const boxCoordination = await createFaceBox({
			width: canvas.clientWidth,
			height: canvas.clientHeight,
		})
		let isValidPosition = []
		intervalFR = setInterval(async () => {
			const detections = await faceapi.detectAllFaces(video, new faceapi.SsdMobilenetv1Options())
			const resizedDetections = faceapi.resizeResults(detections, displaySize)
			canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height)
			faceapi.draw.drawDetections(canvas, resizedDetections)

			let xCalculation = boxCoordination.xPosition - resizedDetections[0]?.box?.x
			let yCalculation = boxCoordination.yPosition - resizedDetections[0]?.box?.y
			let widthCalculation = boxCoordination.boxWidth - resizedDetections[0]?.box?.width
			let heightCalculation = boxCoordination.boxHeight - resizedDetections[0]?.box?.height
			if (isValidPosition.length >= 20 && !image_data_url) {
				await capturePicture()
				NProgress.done()
				Swal.fire({
					icon: "success",
					title: "Photo successfully taken",
					showConfirmButton: false,
					timer: 2000,
				})
				isValidPosition = []
			}
			// console.log(Math.abs(xCalculation), Math.abs(yCalculation), Math.abs(widthCalculation), Math.abs(heightCalculation), resizedDetections[0].score)
			if (
				!image_data_url &&
				isValidPosition.length < 20 &&
				Math.abs(xCalculation) <= 27 &&
				Math.abs(yCalculation) <= 27 &&
				Math.abs(widthCalculation) <= 150 &&
				Math.abs(heightCalculation) <= 150 &&
				resizedDetections[0].score >= 0.95
			) {
				NProgress.set(isValidPosition.length / 20)
				isValidPosition.push(true)
			} else if (image_data_url) {
			} else {
				isValidPosition = []
				NProgress.done()
			}
		}, 100)
	} catch (error) {
		console.log("- Error Starting Face Recognition : ", error)
	}
}

joinRoomForm.addEventListener("submit", (e) => {
	try {
		e.preventDefault()
		// NProgress.start()
		loader.className = "loading"
		if (!image_data_url || !nikInputForm.value) {
			Swal.fire({
				icon: "error",
				title: "Data is not valid!",
				text: "Please make sure your id or photo is valid!",
				showConfirmButton: false,
				timer: 3000,
			})
			loader.className = "loading-hide"
			return
		}
		fetch(`${baseurl}/check/${nikInputForm.value}`)
			.then((response) => {
				return response.json()
			})
			.then((data) => {
				if (!data.isExist) {
					Swal.fire({
						icon: "error",
						title: "Something went wrong!",
						text: "You've not registered!",
					})
					return
				}
				loader.className = "loading-hide"
				image_data_url_server = `data:image/png;base64,${data.base64data}`
				comparePicture({ picture1: image_data_url, picture2: image_data_url_server, fullName: data.fullName, nik: data.nik })
			})
	} catch (error) {
		console.log("- Error Submiting")
	}
})

const getCameraReady = async () => {
	try {
		console.log(faceapi)

		loader.className = "loading-hide"
		const config = {
			video: true,
		}
		const stream = await navigator.mediaDevices.getUserMedia(config)
		localStream.srcObject = stream
	} catch (error) {
		console.log("- Error Getting Camera : ", error)
	}
}

const capturePicture = async () => {
	try {
		canvasElement.width = localStream.videoWidth
		canvasElement.height = localStream.videoHeight
		canvasElement.getContext("2d").drawImage(localStream, 0, 0)
		image_data_url = canvasElement.toDataURL("image/png")
		userPicture.src = image_data_url
		userPicture.className = "picture"
		localStream.className = "hide-element"
		document.getElementById("fr-box-id").remove()
		clearInterval(intervalFR)
		intervalFR = null

		const canvas = document.getElementById("face-matcher-box")
		const ctx = canvas.getContext("2d")
		ctx.clearRect(0, 0, canvas.width, canvas.height)

		recaptureButton.removeAttribute("disabled")
		await localStream.srcObject.getTracks().forEach((track) => {
			track.stop()
		})

		localStream.srcObject = null
	} catch (error) {
		console.error("Error capturing picture:", error)
	}
}

const comparePicture = async ({ picture1, picture2, fullName, nik }) => {
	try {
		loader.className = "loading"
		const input1 = await faceapi.fetchImage(picture1)
		const input2 = await faceapi.fetchImage(picture2)
		descriptors.desc1 = await faceapi.computeFaceDescriptor(input1)
		descriptors.desc2 = await faceapi.computeFaceDescriptor(input2)
		const distance = faceapi.utils.round(faceapi.euclideanDistance(descriptors.desc1, descriptors.desc2))
		if (distance <= 0.3) {
			localStorage.setItem("username", fullName)
			localStorage.setItem("nik", nik)
			Swal.fire({
				icon: "success",
				title: "Verified",
				text: `Please Wait A Moment!\nYou will be forwaded to the meeting!\nDistance : ${distance}`,
				showConfirmButton: false,
				timer: 3000,
			}).then((_) => {
				setTimeout(() => {
					goToRoom()
				}, 1000)
			})
		} else {
			Swal.fire({
				icon: "error",
				title: "Failed",
				text: `Made sure to position your picture to camera to get better resutl!\nDistance : ${distance}`,
				showConfirmButton: false,
				timer: 2500,
			})
		}
		loader.className = "loading-hide"
	} catch (error) {
		console.log("- Error Comparing Picture : ", error)
	}
}

// captureButton.addEventListener("click", capturePicture)

localStream.addEventListener("play", startFR)

const deletePhoto = () => {
	try {
		image_data_url = undefined
		recaptureButton.setAttribute("disabled", true)

		userPicture.className = "hide-element"
		localStream.className = "user-video"
		recaptureButton.setAttribute("disabled", true)

		getCameraReady()
	} catch (error) {
		console.log("- Error Deleting Photo : ", error)
	}
}

recaptureButton.addEventListener("click", deletePhoto)

Promise.all([
	faceapi.nets.ssdMobilenetv1.loadFromUri("../javascript/room/face-api/models"),
	faceapi.nets.faceRecognitionNet.loadFromUri("../javascript/room/face-api/models"),
	faceapi.nets.faceLandmark68Net.loadFromUri("../javascript/room/face-api/models"),
	faceapi.loadFaceRecognitionModel("../javascript/room/face-api/models"),
]).then(getCameraReady)
