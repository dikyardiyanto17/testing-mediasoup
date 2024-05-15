const base64ToBlob = (base64Data) => {
    console.log(base64Data)
	const byteString = atob(base64Data.split(",")[1])
	const mimeType = base64Data.split(",")[0].split(":")[1].split(";")[0]
	const arrayBuffer = new ArrayBuffer(byteString.length)
	const uint8Array = new Uint8Array(arrayBuffer)
	for (let i = 0; i < byteString.length; i++) {
		uint8Array[i] = byteString.charCodeAt(i)
	}
	return new Blob([arrayBuffer], { type: mimeType })
}

module.exports = { base64ToBlob }
