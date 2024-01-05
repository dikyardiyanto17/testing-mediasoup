// Used for VP9 webcam video.
const VIDEO_KSVC_ENCODINGS = [{ scalabilityMode: "S3T3_KEY" }]

// Used for VP9 desktop sharing.
const VIDEO_SVC_ENCODINGS = [{ scalabilityMode: "S3T3", dtx: true }]

const VIDEO_SIMULCAST_PROFILES = {
	3840: [
		{ scaleResolutionDownBy: 12, maxBitRate: 150000 },
		{ scaleResolutionDownBy: 6, maxBitRate: 500000 },
		{ scaleResolutionDownBy: 1, maxBitRate: 10000000 },
	],
	1920: [
		{ scaleResolutionDownBy: 6, maxBitRate: 150000 },
		{ scaleResolutionDownBy: 3, maxBitRate: 500000 },
		{ scaleResolutionDownBy: 1, maxBitRate: 3500000 },
	],
	1280: [
		{ scaleResolutionDownBy: 4, maxBitRate: 150000 },
		{ scaleResolutionDownBy: 2, maxBitRate: 500000 },
		{ scaleResolutionDownBy: 1, maxBitRate: 1200000 },
	],
	640: [
		{ scaleResolutionDownBy: 2, maxBitRate: 150000 },
		{ scaleResolutionDownBy: 1, maxBitRate: 500000 },
	],
	320: [{ scaleResolutionDownBy: 1, maxBitRate: 150000 }],
}

let params = {
	// encodings: [
	// 	{
	// 		maxBitrate: 300000,
	// 		scalabilityMode: "S3T3_KEY",
	// 		scaleResolutionDownBy: 4,
	// 	},
	// 	{
	// 		maxBitrate: 500000,
	// 		scalabilityMode: "S3T3_KEY",
	// 		scaleResolutionDownBy: 2,
	// 	},
	// 	{
	// 		maxBitrate: 700000,
	// 		scalabilityMode: "S3T3_KEY",
	// 		scaleResolutionDownBy: 1,
	// 	},
	// ],
	// encodings: [
	// 	{ scaleResolutionDownBy: 4, maxBitRate: 250000, maxFramerate: 30 },
	// 	{ scaleResolutionDownBy: 2, maxBitRate: 500000, maxFramerate: 30 },
	// 	{ scaleResolutionDownBy: 1, maxBitRate: 750000, maxFramerate: 30 },
	// ],
	// encodings: [{ ssrc: 111110 }, { ssrc: 111111 }, { ssrc: 111112 }],
	// 	encodings: [
	// 		{ maxBitRate: 250000, rid: "0" },
	// 		{ maxBitRate: 500000, rid: "1" },
	// 		{ maxBitRate: 750000, rid: "2" },
	// 	],
	// encodings: [{ scalabilityMode: "S3T3_KEY" }],
	codecOptions: {
		videoGoogleStartBitrate: 1000,
	},
}

let encodingsVP9 = [{ scalabilityMode: "S3T3" }]

let encodingVP8 = [
	{ scaleResolutionDownBy: 4, maxBitRate: 1250000, maxFramerate: 60 },
	{ scaleResolutionDownBy: 2, maxBitRate: 1500000, maxFramerate: 60 },
	{ scaleResolutionDownBy: 1, maxBitRate: 2000000, maxFramerate: 60 },
]

// let encodingVP8 = [
// 	{ rid: "r0", active: true, maxBitrate: 100000 },
// 	{ rid: "r1", active: true, maxBitrate: 300000 },
// 	{ rid: "r2", active: true, maxBitrate: 900000 },
// ]

let audioParams = {
	codecOptions: {
		opusDtx: false,
	},
	zeroRtpOnPause: true,
}

module.exports = { params, audioParams, encodingVP8, encodingsVP9 }
