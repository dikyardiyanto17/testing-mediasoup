let params = {
	encodings: [
		{
			// rid: 'r0',
			maxBitrate: 500000,
			scalabilityMode: "S1T3",
		},
		{
			// rid: 'r1',
			maxBitrate: 700000,
			scalabilityMode: "S1T3",
		},
		{
			// rid: 'r2',
			maxBitrate: 900000,
			scalabilityMode: "S1T3",
		},
	],
	codecOptions: {
		videoGoogleStartBitrate: 1000,
	},
}

module.exports = { params }
