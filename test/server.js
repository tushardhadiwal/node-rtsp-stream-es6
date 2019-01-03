/* jshint node: true, esversion: 6*/
Stream = require('node-rtsp-stream-es6');

const options = {
    name: 'streamName',
    url: 'rtsp://184.72.239.149/vod/mp4:BigBuckBunny_115k.mov',
    ffmpegPort: 3000,
    frameRate: "30", // Optional - use to set the frame rate of the stream
    shutdownDelay: 10000,  // Optional - delay before FFMPEG stopping after last client disconnects
    hideFfmpegOutput: false // Optional - show/hide FFMPEG console output
};

stream = new Stream(options)

stream.start()

setTimeout(stream.stop.bind(stream), 10 * 1000)
