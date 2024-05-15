const express = require("express")
const Controller = require("../controllers/index.js")
const router = express.Router()
const multer = require("multer")
const path = require("path")
const FaceApiJS = require("../controllers/face-api-js/index.js")

const storage = multer.diskStorage({
	destination: async function (req, file, cb) {
		const directoryPath = path.join(__dirname, "..", "face-data")
		cb(null, directoryPath)
	},
	filename: function (req, file, cb) {
		const { username } = req.params
		console.log(username)
		cb(null, `${username}.png`)
	},
})

let upload = multer({ storage })

router.get("/", Controller.home)
router.get("/lobby/:room", Controller.lobby)
router.get("/check/:nik", FaceApiJS.userCheckPicture)
router.get("/user/:nik", FaceApiJS.user)
router.get("/room/:room", Controller.room)
router.get("/register", Controller.register)
router.post("/google-auth", Controller.googleAuth)
// router.post("/user/:username", upload.single("image"), Controller.uploadUserPicture)
router.post("/user/:username", FaceApiJS.uploadUserPicture)

module.exports = router
