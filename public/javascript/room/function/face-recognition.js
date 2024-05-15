async function getLabeledFaceDescriptions({ picture, name }) {
	const descriptions = []
	for (let i = 1; i <= 2; i++) {
		const img = await faceapi.fetchImage(picture, name)
		const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
		if (detections) {
			descriptions.push(detections.descriptor)
		}
	}
	return new faceapi.LabeledFaceDescriptors(name, descriptions)
}

const startFR = async ({ picture, name, id, parameter }) => {
	let user = parameter.allUsers.find((data) => data.socketId == id)
	document.getElementById(`cfr-${id}`)?.remove()
	try {
		let isCurrentUser = false
		if (user.socketId == parameter.socketId) {
			isCurrentUser = true
		}
		const video = document.getElementById(`v-${id}`)
		video.addEventListener("play", async () => {
			const labeledFaceDescriptors = await getLabeledFaceDescriptions({ picture, name })
			let faceContainer = document.getElementById(`face-recognition-${id}`)
			// const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors)
			const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.45)
			const canvas = faceapi.createCanvasFromMedia(video)
			canvas.id = `cfr-${id}`
			faceContainer.appendChild(canvas)
			const displaySize = { width: video.videoWidth, height: video.videoHeight }
			faceapi.matchDimensions(canvas, displaySize)
			user.frInterval = setInterval(async () => {
				const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors()
				const resizedDetections = faceapi.resizeResults(detections, displaySize)
				canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height)
				const results = resizedDetections.map((d) => {
					return faceMatcher.findBestMatch(d.descriptor)
				})
				results.forEach((result, i) => {
					const box = resizedDetections[i].detection.box
					const drawBox = new faceapi.draw.DrawBox(box, {
						label: result,
						boxColor: result._distance <= 0.45 ? "blue" : "red",
						drawLabelOptions: { fontSize: isCurrentUser ? 11 : 8 },
						lineWidth: isCurrentUser ? 1 : 0.2,
					})
					drawBox.draw(canvas)
				})
			}, 100)
		})
	} catch (error) {
		if (user?.frInterval) {
			clearInterval(user.frInterval)
		}
		document.getElementById(`cfr-${id}`)?.remove()
		console.log("- Error Starting Face Recognition : ", error)
	}
}

const stopFR = async ({ id, parameter }) => {
	try {
		let user = parameter.allUsers.find((data) => data.socketId == id)
		clearInterval(user?.frInterval)
		if (user.frInterval) {
			user.frInterval = null
		}
		document.getElementById(`cfr-${id}`)?.remove()
	} catch (error) {
		console.log("- Error Stopping Face Recognition : ", error)
	}
}

module.exports = { startFR, stopFR }
