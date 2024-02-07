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

const newUserNotification = ({ username, picture }) => {
	try {
		const newUserNotificationContainer = document.getElementById("new-user-join-notification-container")
		const newUserContainer = document.createElement("section")
		newUserContainer.className = "new-user-join"
		newUserContainer.innerHTML = `<img src="${picture}" alt="new-user-join" class="new-user-profile-picture"><span class="notification-text">${username} join the room</span>`
		newUserNotificationContainer.appendChild(newUserContainer)
		setTimeout(() => {
			newUserContainer.remove()
		}, 3000)
	} catch (error) {
		console.log("- Error Displaying New User Joined The Room Notification : ", error)
	}
}

// Create User Online List
const createUserList = ({ username, socketId, cameraTrigger, picture, micTrigger }) => {
	try {
		let userList = document.getElementById("user-list")
		let isExist = document.getElementById("user-" + socketId)
		let cameraInitSetting = ""
		if (cameraTrigger) {
			cameraInitSetting = "fas fa-video"
		} else {
			cameraInitSetting = "fas fa-video-slash"
		}
		if (!isExist) {
			let elementUser = document.createElement("div")
			elementUser.id = "user-" + socketId
			elementUser.className = "user-list-container"
			userList.appendChild(elementUser)
			let myUsername = document.createElement("div")
			myUsername.innerHTML = `<img src="${picture}" class="mini-picture"/><span>${username}</span>`
			myUsername.id = "ulu-" + socketId
			myUsername.className = "profile-list"
			elementUser.appendChild(myUsername)
			let icons = document.createElement("div")
			icons.className = "user-list-icons-container"
			icons.id = "uli-" + socketId
			icons.innerHTML = `<section class="user-list-microphone"><img src="/assets/pictures/mic${
				micTrigger ? "On" : "Off"
			}.png" id="ulim-${socketId}"/></section><section class="user-list-camera"><i class="${cameraInitSetting}" id="ulic-${socketId}" style="color: #ffffff;"></i></section>`
			elementUser.appendChild(icons)
		}
	} catch (error) {
		console.log("- Error Creating User List : ", error)
	}
}

const changeUserListMicIcon = ({ status, id }) => {
	let userMicIconUserList = document.getElementById("ulim-" + id)
	if (status) {
		userMicIconUserList.src = "/assets/pictures/micOff.png"
	} else {
		userMicIconUserList.src = "/assets/pictures/micOn.png"
	}
}

const scrollToBottom = () => {
	try {
		let chatMessages = document.getElementById("chat-container-id")
		chatMessages.scrollTop = chatMessages.scrollHeight
	} catch (error) {
		console.log("- Error Scrolling To Bottom : ", error)
	}
}

const compareMessageDate = (messageDate) => {
	try {
		const currentDate = new Date()
		const messageDateObj = new Date(messageDate)

		const currentYear = currentDate.getFullYear()
		const currentMonth = currentDate.getMonth()
		const currentDay = currentDate.getDate()

		const messageYear = messageDateObj.getFullYear()
		const messageMonth = messageDateObj.getMonth()
		const messageDay = messageDateObj.getDate()
		let messageHour = messageDateObj.getHours()
		let messageMinute = messageDateObj.getMinutes()
		if (messageMinute < 10) {
			messageMinute = `0${messageMinute}`
		}
		if (messageHour < 10) {
			messageHour = `0${messageHour}`
		}

		if (currentYear === messageYear && currentMonth === messageMonth && currentDay === messageDay) return `${messageHour}:${messageMinute}`
		else {
			const timeDiff = currentDate - messageDateObj
			const oneDay = 24 * 60 * 60 * 1000
			const oneYear = 365
			if (timeDiff < oneDay) return `Yesterday ${messageHour}:${messageMinute}`
			else if (timeDiff < oneYear) return `${messageMonth}:${messageDay} - ${messageHour}:${messageMinute}`
			else return `${messageYear}:${messageMonth}:${messageDay} - ${messageHour}:${messageMinute}`
		}
	} catch (error) {
		console.log("- Error Comparing Message Data : ", error)
	}
}

const messageNotification = () => {
	try {
		const chatContainer = document.getElementById("chat-bar-box-id")
		let iconsNotification = document.getElementById("notification-element-id")
		if (chatContainer.className == "hide-side-bar") {
			let isLineNewMessageExist = document.getElementById("new-message-notification")
			if (!isLineNewMessageExist) {
				let chatMessagesContainer = document.getElementById("chat-messages-id")
				let notificationElement = document.createElement("div")
				notificationElement.id = "new-message-notification"
				let newMessageTemplate = `<p class="new-message-text">New Message</p><div class="new-message-line"></div>`
				notificationElement.innerHTML = newMessageTemplate
				chatMessagesContainer.appendChild(notificationElement)
			}
			iconsNotification.className = "fas fa-envelope notification visible"
		}
	} catch (error) {
		console.log("- Error At Notificarion Message : ", error)
	}
}

const receiveMessage = ({ message, sender, date }) => {
	try {
		messageNotification()
		const newDate = compareMessageDate(date)
		let chatMessagesContainer = document.getElementById("chat-messages-id")
		let messageElement = document.createElement("div")
		let chatContainer = document.getElementById("chat-messages-id")

		let allChat = chatContainer.querySelectorAll(".message-container")
		let lastChat = allChat[allChat.length - 1]
		let lastChatDetail = lastChat?.firstElementChild
		let lastChatDetailName = lastChatDetail?.firstElementChild?.innerHTML
		let lastChatDetailDate = lastChatDetail?.lastElementChild?.innerHTML
		let customDate = `<span class="message-time">${newDate}</span>`
		let customName = `<p class="sender">${sender}</p>`
		if (lastChatDetailDate == newDate && lastChatDetailName == sender && lastChatDetail) {
			customName = `<p class="sender hide-username">${sender}</p>`
			lastChatDetail.lastElementChild.remove()
		}

		messageElement.className = "message-container"
		messageElement.innerHTML = `<div class="received-messages">${customName}<div class="received-message"><div class="inside-message"><span>${message}</span></div></div>${customDate}</div>`
		chatMessagesContainer.appendChild(messageElement)
		scrollToBottom()
	} catch (error) {
		console.log("- Error Receiving Message : ", error)
	}
}

const sendMessage = ({ message, sender, date }) => {
	try {
		let chatContainer = document.getElementById("chat-messages-id")
		let allChat = chatContainer.querySelectorAll(".message-container")
		let lastChat = allChat[allChat.length - 1]
		let lastChatDetail = lastChat?.firstElementChild
		let lastChatDetailDate = lastChatDetail?.lastElementChild?.innerHTML
		const newDate = compareMessageDate(date)
		let customDate = `<span class="message-time">${newDate}</span>`
		if (lastChatDetailDate == newDate && lastChatDetail) {
			lastChatDetail.lastElementChild.remove()
		}
		let chatMessagesContainer = document.getElementById("chat-messages-id")
		let messageElement = document.createElement("div")
		messageElement.className = "message-container"
		messageElement.innerHTML = `<div class="your-messages"><p class="sender">${sender}</p><div class="your-message"><div class="inside-message"><span>${message}</span></div></div>${customDate}</div>`
		chatMessagesContainer.appendChild(messageElement)
		scrollToBottom()
	} catch (error) {
		console.log("- Error Sending Message : ", error)
	}
}

// Function to show the option menu
function showOptionMenu() {
	try {
		let optionMenu = document.getElementById("option-menu")
		optionMenu.className = "visible"
	} catch (error) {
		console.log("- Error Showing Option Menu : ", error)
	}
}

// Function to hide the option menu
function hideOptionMenu() {
	try {
		let optionMenu = document.getElementById("option-menu")
		optionMenu.className = "invisible"
	} catch (error) {
		console.log("- Error Hiding Option Menu : ", error)
	}
}

const showMicOptionsMenu = () => {
	try {
		const micOptionsContainer = document.getElementById("mic-options")
		micOptionsContainer.className = "visible"
	} catch (error) {
		console.log("- Error Hiding Options Menu")
	}
}

const hideMicOptionsMenu = () => {
	try {
		const micOptionsContainer = document.getElementById("mic-options")
		micOptionsContainer.className = "invisible"
	} catch (error) {
		console.log("- Error Hiding Options Menu")
	}
}

const muteAllParticipants = ({ parameter, socket }) => {
	parameter.allUsers.forEach((data) => {
		if (data.socketId != socket.id) {
			socket.emit("mute-all", { socketId: data.socketId })
		}
	})
}

const unlockAllMic = ({ parameter, socket }) => {
	parameter.allUsers.forEach((data) => {
		if (data.socketId != socket.id) {
			socket.emit("unmute-all", { socketId: data.socketId })
		}
	})
}

// Check Initial Configuration
const checkLocalStorage = ({ parameter }) => {
	try {
		// Set Room Id
		localStorage.setItem("room_id", parameter.roomName)
		// Check Config For Audio Devices, Selected Audio Device, Video Devices, Selected Video Devices, Room Id, Username
		if (
			!localStorage.getItem("audioDevices") ||
			!localStorage.getItem("room_id") ||
			!localStorage.getItem("selectedVideoDevices") ||
			!localStorage.getItem("videoDevices") ||
			!localStorage.getItem("username") ||
			!localStorage.getItem("selectedAudioDevices")
		) {
			goToLobby()
		}
	} catch (error) {
		console.log("- Error Checking Local Storage : ", error)
	}
}

const goToLobby = () => {
	try {
		const url = window.location.pathname
		const parts = url.split("/")
		const roomName = parts[2]
		const goTo = "lobby/" + roomName
		const newURL = window.location.origin + "/" + goTo
		// If There Is Not, It Will Redirect To Lobby
		window.location.href = newURL
	} catch (error) {
		console.log("- Error Go To Lobby : ", error)
	}
}

const changeAppData = ({ socket, data, remoteProducerId }) => {
	socket.emit("change-app-data", { data, remoteProducerId })
}

module.exports = {
	startTimer,
	timerLayout,
	createUserList,
	changeUserListMicIcon,
	sendMessage,
	receiveMessage,
	showOptionMenu,
	hideOptionMenu,
	scrollToBottom,
	muteAllParticipants,
	unlockAllMic,
	checkLocalStorage,
	changeAppData,
	goToLobby,
	newUserNotification,
	showMicOptionsMenu,
	hideMicOptionsMenu,
}
