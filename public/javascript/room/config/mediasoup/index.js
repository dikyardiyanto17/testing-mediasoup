let params = {
	encodings: [
		{
			maxBitrate: 300000,
			scalabilityMode: "S3T3",
			scaleResolutionDownBy: 4
		},
		{
			maxBitrate: 500000,
			scalabilityMode: "S3T3",
			scaleResolutionDownBy: 2
		},
		{
			maxBitrate: 700000,
			scalabilityMode: "S3T3",
			scaleResolutionDownBy: 1
		},
	],
	codecOptions: {
		videoGoogleStartBitrate: 1000,
	},
}

let audioParams = {
	codecOptions: {
		opusDtx: false,
	},
	zeroRtpOnPause: true,
}

module.exports = { params, audioParams }
