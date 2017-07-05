/* jshint node: true, esversion: 6*/

const child_process = require('child_process');
const EventEmitter = require('events');

class Mpeg1Muxer extends EventEmitter {

    constructor(options) {
        super(options);

        this.url = options.url;
        this.frameRate = options.frameRate;
        this.protocol = options.protocol;

        var ffmpegArgs = ["-rtsp_transport", this.protocol, "-r", this.frameRate, "-i", this.url, "-f", "mpegts", "-codec:v", "mpeg1video", "-bf", "0", "-"];

        if ("ffmpegCustomArgs" in options) {
            ffmpegArgs = options.ffmpegCustomArgs;
        } else if (!("enableAudio" in options)) {
            ffmpegArgs.splice(-3, 0, "-an");
        }

        this.stream = child_process.spawn("ffmpeg", ffmpegArgs, {
            detached: false
        });

        this.inputStreamStarted = true;
        this.stream.stdout.on('data', (data) => {
            return this.emit('mpeg1data', data); });
        this.stream.stderr.on('data', (data) => {
            return this.emit('ffmpegError', data); });
    }
}

module.exports = Mpeg1Muxer;
