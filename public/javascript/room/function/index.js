const startTimer = () => {
	try {
		let startTime = Date.now()
		let timerElement = document.getElementById("realtime-timer")

		// Update the timer every second
		let intervalId = setInterval(function () {
			let currentTime = Date.now()
			let elapsedTime = currentTime - startTime
			let hours = Math.floor(elapsedTime / 3600000)
			let minutes = Math.floor((elapsedTime % 3600000) / 60000)
			let seconds = Math.floor((elapsedTime % 60000) / 1000)

			timerElement.textContent =
				(hours < 10 ? "0" : "") + hours + ":" + (minutes < 10 ? "0" : "") + minutes + ":" + (seconds < 10 ? "0" : "") + seconds
		}, 1000)
	} catch (error) {
		console.log("- Error Starting Recording Timer : ", error)
	}
}

const timerLayout = ({ status }) => {
	try {
		const fullContainer = document.getElementById("full-container")
		if (status) {
			let container = document.createElement("div")
			container.setAttribute("class", "record-timer")
			container.id = "timer"
			let timerParagraph = document.createElement("span")
			let span = document.createElement("span")
			span.id = "realtime-timer"
			span.textContent = "00:00:00"
			timerParagraph.appendChild(span)
			container.appendChild(timerParagraph)
			fullContainer.appendChild(container)
			startTimer()
		} else {
			let timerElement = document.getElementById("timer")
			if (timerElement) timerElement.remove()
			let recordButton = document.getElementById("user-record-button")
			recordButton.className = "btn button-small-custom"
		}
	} catch (error) {
		console.log("- Error At Timer Layout : ", error)
	}
}

module.exports = { startTimer, timerLayout }
