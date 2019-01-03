/* jshint node: true, esversion: 6*/

const child_process = require('child_process');
const EventEmitter = require('events');

class Mpeg1Muxer extends EventEmitter {

    constructor(options) {
        super(options);

        var ffmpegArgs = ["-rtsp_transport", options.protocol, "-r", options.frameRate, "-i", options.url, "-f", "mpegts", "-codec:v", "mpeg1video", "-bf", "0", "-"];

        if (options.enableAudio) {
            ffmpegArgs.splice(-3, 0, '-codec:a', 'mp2');
        } else {
            ffmpegArgs.splice(-3, 0, "-an");
        }
        if (options.hwAccel) {
            ffmpegArgs.splice(2, 0, "-codec:v", "h264_mmal");
            // ffmpegArgs.splice(ffmpegArgs.indexOf("mpeg1video"), 1, "h264_omx");
        }
        if (options.ffmpegCustomArgs) {
            ffmpegArgs = options.ffmpegCustomArgs;
        }

        if (!options.hideFfmpegOutput) {
            console.log("Launching ffmpeg " + ffmpegArgs.join(' '));
        }

        this.stream = child_process.spawn("ffmpeg", ffmpegArgs, {
            detached: false
        });

        this.inputStreamStarted = true;
        this.stream.stdout.on('data', (data) => {
            return this.emit('mpeg1data', data);
        });
        this.stream.stderr.on('data', (data) => {
            return this.emit('ffmpegError', data);
        });
    }

    stop() {
        this.stream.stdout.removeAllListeners();
        this.stream.stderr.removeAllListeners();
        this.stream.kill();
        this.stream = undefined;
    }
}

module.exports = Mpeg1Muxer;