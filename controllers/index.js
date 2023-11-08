const { OAuth2Client } = require("google-auth-library")
const client = new OAuth2Client()

class Controller {
	static room(req, res) {
		try {
			res.render("home")
			// res.render("room")
		} catch (error) {
			console.log(error)
		}
	}

	static home(req, res) {
		try {
			res.render("home")
		} catch (error) {
			console.log(error)
		}
	}

	static lobby(req, res) {
		try {
			res.render("lobby")
		} catch (error) {
			console.log(error)
		}
	}

	static async googleAuth(req, res) {
		try {
			const ticket = await client.verifyIdToken({
				idToken: req.body.credential,
				audience: "623403491943-290gkq7bnqtgeprtfaci3u76vtb39bjl.apps.googleusercontent.com", // Specify the CLIENT_ID of the app that accesses the backend
			})
			const payload = ticket.getPayload()
			res.status(200).json({ name: `${payload.given_name} ${payload.family_name}`, picture: payload.picture })
		} catch (error) {
			console.log(error)
		}
	}
}
module.exports = Controller
