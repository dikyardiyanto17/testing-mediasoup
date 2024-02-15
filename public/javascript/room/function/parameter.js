const { params, audioParams } = require("../config/mediasoup")

class Parameters {
	localStream = null
	videoParams = { appData: { label: "video", isActive: true } }
	videoParams = { ...params, appData: { label: "video", isActive: true } }
	audioParams = { ...audioParams, appData: { label: "audio", isActive: true } }
	screensharingVideoParams = { appData: { label: "screensharing", isActive: true } }
	screensharingAudioParams = { appData: { label: "screensharingaudio", isActive: true } }
	consumingTransports = []
	consumerTransports = []
	consumerTransport = null
	totalUsers = 0
	allUsers = []
	devices = {
		audio: {
			iteration: 0,
			id: undefined,
		},
		video: {
			iteration: 0,
			id: undefined,
		},
		speaker: {
			iteration: 0,
			id: "default",
		},
	}
	screensharing = {
		isActive: false,
		videoProducerId: undefined,
		audioProducerId: undefined,
		transportId: undefined,
		stream: null,
		audioProducer: null,
		videoProducer: null,
	}
	isScreenSharing = {
		isScreenSharing: false,
		socketId: undefined,
		screenSharingUserViewCurrentPage: 1,
		screenSharingUserViewTotalPage: 1,
		screenSharingUserViewCurrentDisplay: 3,
	}
	record = {
		isRecording: false,
		stream: null,
		audioContext: null,
		audioDestination: null,
		recordedStream: null,
		recordedMedia: null,
	}
	micCondition = {
		isLocked: false,
		socketId: undefined,
	}
	offsetX
	offsetY
	isDragging = false
	userVideoElements = []
}

module.exports = { Parameters }
