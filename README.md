# node-rtsp-stream-es6

First of all, it's a fork of a [fork](https://github.com/Wifsimster/node-rtsp-stream-es6) of [**node-rtsp-stream**](https://www.npmjs.com/package/node-rtsp-stream)

## Differences with the original modules

- Stream can be started and stopped from the browser to save resources on the server.
- Written in ES6 instead of CoffeeScript
- Github repository

## Description

Stream any RTSP stream and output to [WebSocket](https://github.com/websockets/ws) for consumption by [jsmpeg](https://github.com/phoboslab/jsmpeg).
HTML5 streaming video!

**NOTE:** This fork will automatically start/stop the FFMPEG stream on the backend server when the first client connects and the last client disconnects.  There is a delay between the last client disconnecting and the `SIGINT` being sent which can be customized in the options. If a new client reconnects within the timeout, the stream continues to run.

## Requirements

You need to download and install [FFMPEG](https://ffmpeg.org/download.html).

## Installation

```shell
npm i shbatm/node-rtsp-stream-es6
```

## Server

```javascript
Stream = require('node-rtsp-stream-es6');

const options = {
    name: 'streamName',
    url: 'rtsp://184.72.239.149/vod/mp4:BigBuckBunny_115k.mov',
    ffmpegPort: 3000,
    protocol: "tcp", // Optional "tcp" or "udp", default: "tcp"
    frameRate: "30", // Optional - use to set the frame rate of the stream
    shutdownDelay: 10000,  // Optional - delay before FFMPEG stopping after last client disconnects
    hideFfmpegOutput: false // Optional - show/hide FFMPEG console output
                            // As of v1.1.2 - default is true.
    enableAudio: false // Default is false. Set to true to enable audio in FFMPEG
    ffmpegCustomArgs: [] // Array of custom FFMPEG CLI arguments. WARNING: this will overrite all ffmpeg options and EVERYTHING must be passed as an array of strings (including stream url, protocol, and framerate). Only use if you know what you are doing!
};

stream = new Stream(options);
stream.startListener();
```

## Client

```javascript
const WebSocket = require('ws')
const ws = new WebSocket('ws://localhost:3000')

ws.on('open', () => {
  console.log('Connected to stream')
})

ws.on('message', (data, flags) => {
  console.log(data)
})
```

## Example

- Copy the `test/view-stream.html` to a web server's root on your device (e.g. `/var/www/html/`). 
- Navigate to `test/` and run `node server.js`

You can find a live stream JSMPEG example here : https://github.com/phoboslab/jsmpeg/blob/master/stream-example.html
