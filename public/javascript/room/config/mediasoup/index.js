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
	mid    : "1",
	encodings: [
		{ active: true, scaleResolutionDownBy: 4, maxBitRate: 250000, rid: "0", scalabilityMode: "S3T3" },
		{ active: true, scaleResolutionDownBy: 2, maxBitRate: 500000, rid: "1", scalabilityMode: "S3T3" },
		{ active: true, scaleResolutionDownBy: 1, maxBitRate: 750000, rid: "2", scalabilityMode: "S3T3" },
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
