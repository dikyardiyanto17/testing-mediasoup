# telepathy

## Scheme
![Mediasoup Scheme](https://i.imgur.com/okNFEdE.png)


## Panduan untuk menjalankan conference meeting
- Jalankan aplikasi sesuai port yang akan digunakan */app.js
```js
const port = 3001 // rubah port sesuai kebutuhan
```
- Rubah pengaturan Public IP yang akan digunakan */config/mediasoup/config.js
```js
let publicIp = "147.139.136.209" // rubah IP sesuai kebutuhan
```
- Sebelum menjalankan aplikasi, pastikan salah satu port terbuka dan bisa di akses untuk transfer udp/tcp protocol dan pastikan port tersebut sedang tidak digunakan untuk aplikasi lain */config/mediasoup/config.js
```js
const listenInfo = {
	listenInfos: [
		{
			protocol: "udp",
			ip: privateIp,
			announcedIp: publicIp,
			port: 1028 // rubah port udp sesuai pengaturan port server yang terbuka
		},
		{
			protocol: "tcp",
			ip: privateIp,
			announcedIp: publicIp,
			port: 1028 // rubah port udp sesuai pengaturan port server yang terbuka
		},
	],
}
```

## Information
- Test VPS Ram 1 Core = 8 orang = 20-35 % CPU
- Test Server Komputer = 6-8 orang = 1-10 % CPU

## Bug
- Saat User 1 membuka aplikasi HP (sedang dalam kondisi meeting) dan membuka tab/aplikasi lain, tampilan User 1 di user lain video akan freeze dan akan kembali normal jika User 1 membuka tab meeting yang sedang berlangsung

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


