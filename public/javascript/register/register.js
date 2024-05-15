const { default: Swal } = require("sweetalert2")

const baseurl = window.location.origin
const registerButton = document.getElementById("register-form")
const cameraContainer = document.getElementById("camera-container-id")
const localVideo = document.getElementById("local-video")
// const captureButton = document.getElementById("capture-button-id")
const canvasElement = document.getElementById("canvas-element")
const previewButton = document.getElementById("preview-button-id")
const confirmPicture = document.getElementById("confirm-button-id")
const imageOutput = document.getElementById("image--output")
const fullNameForm = document.getElementById("fullname-id")
const nikForm = document.getElementById("nik-id")
const recaptureButton = document.getElementById("recapture-button-id")
const loader = document.getElementById("loading-id")
let picture
let pictureBlob
let image_data_url

Promise.all([
	faceapi.nets.ssdMobilenetv1.loadFromUri("../javascript/room/face-api/models"),
	faceapi.nets.faceRecognitionNet.loadFromUri("../javascript/room/face-api/models"),
	faceapi.nets.faceLandmark68Net.loadFromUri("../javascript/room/face-api/models"),
	faceapi.nets.tinyFaceDetector.loadFromUri("../javascript/room/face-api/models"),
]).then((_) => {
	loader.className = "loading-hide"
})
const startFR = async () => {
	try {
		const video = document.getElementById("local-video")
		const canvas = faceapi.createCanvasFromMedia(video)
		document.getElementById("face-recognition-id").appendChild(canvas)
		const displaySize = { width: video.videoWidth, height: video.videoHeight }
		faceapi.matchDimensions(canvas, displaySize)
		const boxCoordination = await createFaceBox({
			width: canvas.clientWidth,
			height: canvas.clientHeight,
		})
		let isValidPosition = []
		setInterval(async () => {
			const detections = await faceapi.detectAllFaces(video, new faceapi.SsdMobilenetv1Options())
			const resizedDetections = faceapi.resizeResults(detections, displaySize)
			// console.log(resizedDetections[0].score)
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
				console.log(isValidPosition.length)
				NProgress.set(isValidPosition.length / 20)
				isValidPosition.push(true)
			} else if (image_data_url) {
				console.log("Already Take A Photo")
			} else {
				console.log("Is Not Valid")
				isValidPosition = []
				NProgress.done()
			}
		}, 100)
	} catch (error) {
		console.log("- Error Starting Face Recognition : ", error)
	}
}

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

localVideo?.addEventListener("play", startFR)
registerButton.addEventListener("submit", (e) => {
	e.preventDefault()
	try {
		if (!fullNameForm.value || !nikForm.value) {
			Swal.fire({
				icon: "error",
				title: "Data is not valid!",
				text: "Please make sure your id is valid!",
				showConfirmButton: false,
				timer: 3000,
			})
			return
		}
		cameraContainer.style.top = "0"
		getCameraReady()
	} catch (error) {
		console.log("- Error Registering Data : ", error)
	}
})

const getCameraReady = async () => {
	try {
		const config = {
			video: true,
		}
		const stream = await navigator.mediaDevices.getUserMedia(config)
		localVideo.srcObject = stream
	} catch (error) {
		console.log("- Error Getting Camera : ", error)
	}
}

const capturePicture = async () => {
	try {
		canvasElement.width = localVideo.videoWidth
		canvasElement.height = localVideo.videoHeight
		canvasElement.getContext("2d").drawImage(localVideo, 0, 0)
		image_data_url = canvasElement.toDataURL("image/png")
		imageOutput.src = image_data_url
		previewButton.removeAttribute("disabled")
		confirmPicture.removeAttribute("disabled")
		recaptureButton.removeAttribute("disabled")
	} catch (error) {
		console.error("Error capturing picture:", error)
	}
}

const deletePhoto = () => {
	try {
		image_data_url = undefined
		previewButton.setAttribute("disabled", true)
		confirmPicture.setAttribute("disabled", true)
		recaptureButton.setAttribute("disabled", true)
	} catch (error) {
		console.log("- Error Deleting Photo : ", error)
	}
}

// captureButton.addEventListener("click", capturePicture)
recaptureButton.addEventListener("click", deletePhoto)

confirmPicture.addEventListener("click", async () => {
	try {
		const formData = {
			username: fullNameForm.value,
			nik: nikForm.value,
			base64data: image_data_url,
		}

		loader.className = "loading"

		const response = await fetch(`${baseurl}/user/${nikForm.value}`, {
			method: "post",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(formData),
		})
		const data = await response.json()
		if (data.status) {
			Swal.fire({
				icon: "success",
				title: "Successfully Register",
				showConfirmButton: false,
				timer: 3000,
			})
				.then((_) => {
					setTimeout(() => {
						const newURL = window.location.origin
						window.location.href = newURL
					}, 1000)
				})
				.finally((_) => {
					loader.className = "loading-hide"
				})
		}
	} catch (error) {
		console.log("- Error Send Picture : ", error)
	}
})
