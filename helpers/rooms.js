class Room {
	participants = []
	constructor(roomName, router) {
		this.roomName = roomName
		this.router = router
	}
}

module.exports = { Room }
