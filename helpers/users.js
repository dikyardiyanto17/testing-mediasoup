class Users {
	transports = []
	producers = []
	consumers = []
	constructor(username, socketId, roomName) {
		this.username = username
		this.socketId = socketId
		this.roomName = roomName
	}
}

module.exports = { Users }
