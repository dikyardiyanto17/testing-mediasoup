# telepathy

## Parameter Server

### Server_Parameter || serverParameter

```js
class Server_Parameter {
	allRooms: {}
	allUsers: {}
}
```

```js
const serverParameter = new Server_Parameter()
serverParameter.worker = Worker
serverParameter.allRooms[roomName] = {
	router: Router,
	participants: [{
		username: "String",
		socketId: "String",
		roomName: "String",
		transports: [transportId: "String", transportId: "String"],
		producers: [producerId: "String", producerId: "String"],
		consumers: [consumerId: "String", consumerId: "String"],
	}],
}

serverParameter.allUsers[socketId] = {
    socketId: "String",
    roomName: "String",
    socket: Socket,
    producers: [producerId: "String", producerId: "String"],
    consumers: [consumerId: "String", consumerId: "String"],
    transports: [transportId: "String", transportId: "String"] }
```

### Mediasoup_Parameter || mediasoupParameter

```js
class Mediasoup_Parameter {
	transports = []
	producers = []
	consumers = []
}

let mediasoupParameter = new Mediasoup_Parameter()
mediasoupParameter = {
    transports = [{
		socketId: "String",
		transport: Transport,
		roomName: "String",
		consumer: true || false,
	}]
    producers = [{
        producer: Producer,
        roomName: "String",
        socketId: "String",
        username: "String"
    }]
    consumers = [{
        consumer: Consumer,
        roomName: "String",
        socketId: "String",
        username: "String"
    }]
}
```

```js

```

## Parameter Client

### Parameter || parameter

```js
const { params } = require("../config/mediasoup")

class Parameters {
	localStream = null
	videoParams = { params, appData: { label: "video" } }
	audioParams = { appData: { label: "audio" } }
	consumingTransports = [],
    consumerTransports = []
}

const parameter = new Parameter()

parameter = {
    localStream: MediaStream,
    videoParams: { params, appData: { label: "video", isActive: true || false, isMicActive: true || false, isVideoActive: true || false }, track: MediaStream },
    audioParams: { appData: { label: "audio", isActive: true || false, isMicActive: true || false, isVideoActive: true || false }, track: MediaStream },
    screensharingVideoParams = { appData: { label: "screensharing" } },
	screensharingAudioParams = { appData: { label: "screensharingaudio" } },
    consumingTransports = [remoteProducerId: "String", remoteProducerId: "String"],
    username: "String",
    socketId: "String",
    isVideo: true || false,
    isAudio: true || false,
    roomName: "String",
    device: MediasoupClientDevice,
    rtpCapabilities: RTPCapabilities,
    producerTransport: ProducerTransport,
    audioProducer: ProducerAudio,
    videoProducer: ProducerVideo,
    	devices = {
		audio: {
			iteration: "Number",
			id: "String",
		},
		video: {
			iteration: "Number",
			id: "String",
		},
	},
    allUsers: [
        {
            socketId: "String",
            picture: "String",
            username: "String",
            audio: {
                isActive: true || false,
                track: MediaStream,
                producerId: "String",
                transportId: "String",
                consumerId: "String"
            },
            video: {
                isActive: true || false,
                track: MediaStream,
                producerId: "String",
                transportId: "String",
                consumerId: "String"
            }
        }
    ],
    screensharing = {
		isActive: true || false,
		videoProducerId: "String",
		audioProducerId: "String",
		transportId: "String",
		stream: MediaStream,
        audioProducer: Producer,
        videoProducer: Producer
	},
    isScreenSharing = {
		isScreenSharing: true || false,
		socketId: "String",
	},
    initialVideo: true || false,
    initialAudio: true || false,
}
```
