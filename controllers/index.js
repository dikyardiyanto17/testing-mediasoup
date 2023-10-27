class Controller {
	static room(req, res) {
		try {
			res.render("room")
		} catch (error) {
			console.log(error)
		}
	}
}
module.exports = Controller
