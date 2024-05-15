const fs = require("fs").promises
const path = require("path")
const faceDataFolder = path.join(__dirname, "../../face-data")

class FaceApiJS {
	static async uploadUserPicture(req, res) {
		try {
			const { nik, username, base64data } = req.body
			await fs.writeFile(
				path.join(faceDataFolder, `${nik}-${username}.png`),
				new Buffer.from(base64data.replace(/^data:image\/\w+;base64,/, ""), "base64")
			)
			res.status(200).json({ message: "Success Uploading Picture", status: true })
		} catch (error) {
			console.log("- Error Uploading Picture : ", error)
			res.status(500).json({ message: "Error Uploading Picture", status: false })
		}
	}

	static async userCheckPicture(req, res) {
		try {
			let isExist
			let fullName
			const { nik } = req.params
			const files = await fs.readdir(faceDataFolder, (err, filesData) => {
				if (err) {
					console.error("Error reading directory:", err)
					return
				}
				return filesData
			})

			files.forEach((file) => {
				const extractedId = file.split("-")[0]
				if (extractedId === nik) {
					fullName = file.split("-")[1].split(".")[0]
					isExist = true
				}
			})
			if (!isExist) {
				isExist = false
				res.status(404).json({ message: "User Photo Is Not Exist!", isExist })
			}
			const faceDataPicture = await path.join(faceDataFolder, `${nik}-${fullName}.png`)

			const buffer = await fs.readFile(faceDataPicture);

			const base64data = buffer.toString("base64")

			try {
				await fs.access(faceDataPicture)
				res.status(200).json({ message: "User Photo Is Exist!", isExist: true, base64data: base64data, fullName: fullName, nik })
			} catch (error) {
				return
			}
		} catch (error) {
			console.log("- Error Checking User Picture : ", error)
		}
	}

	static async user(req, res) {
		try {
			const { nik } = req.params
			const faceDataPicture = path.join(faceDataFolder, `${nik}.png`)

			try {
				await fs.access(faceDataPicture)
			} catch (error) {
				res.status(404).json({ message: "User Photo Is Not Exist!", isExist: false })
				return
			}

			try {
				await res.sendFile(faceDataPicture, (err) => {
					if (err) {
						next(err)
					}
				})
			} catch (error) {
				console.error("Error reading file:", error)
				res.status(500).json({ message: "Internal Server Error" })
			}
		} catch (error) {
			console.error("Error:", error)
			res.status(500).json({ message: "Internal Server Error" })
		}
	}
}
module.exports = FaceApiJS
