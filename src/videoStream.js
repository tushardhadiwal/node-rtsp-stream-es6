/* jshint node: true, esversion: 6*/

const WebSocket = require('ws');
const EventEmitter = require('events');
const STREAM_MAGIC_BYTES = "jsmp";
const Mpeg1Muxer = require('./mpeg1muxer');
class VideoStream extends EventEmitter {

    constructor(options) {
        super(options);

        // Set defaults if not provided
        options.protocol = options.protocol || "tcp";
        options.frameRate = options.frameRate || "30";
        options.shutdownDelay = options.shutdownDelay || 5000;
        options.hideFfmpegOutput = ("hideFfmpegOutput" in options) ? options.hideFfmpegOutput : true;
        options.hwAccel = ("hwAccel" in options) ? options.hwAccel : false;

        console.log(JSON.stringify(options, undefined, 3));

        // Finish setup
        this.stream = void 0;
        this.connectionCount = 0;
        this.streamActive = false;
        this.disconnectTimeout = null;
        this.options = options;
        this.stream2Socket();
    }

    stream2Socket() {
        console.log(`Starting WebSocket server on port ${this.options.ffmpegPort}. Waiting for connections...`);
        this.server = new WebSocket.Server({ port: this.options.ffmpegPort });
        this.server.on('connection', (socket) => {
            if (this.connectionCount === 0) {
                if (!this.disconnectTimeout) {
                    // First connection, start the stream.
                    this.start();
                    this.streamActive = true;
                } else {
                    // New connection while still in shutdown timeout.
                    clearTimeout(this.disconnectTimeout);
                    this.disconnectTimeout = null;
                    this.streamActive = true;
                }
            }
            this.connectionCount++;
            console.log(`${this.options.name}: new connection! ${this.connectionCount} active connections.`);

            let streamHeader = new Buffer(8);
            streamHeader.write(STREAM_MAGIC_BYTES);
            streamHeader.writeUInt16BE(this.options.width, 4);
            streamHeader.writeUInt16BE(this.options.height, 6);
            socket.send(streamHeader);

            socket.on('close', () => {
                this.connectionCount--;
                console.log(`${this.options.name} client disconnected! ${this.connectionCount} active connections.`);
                if (this.connectionCount === 0) {
                    this.stopStream(this.shutdownDelay);
                }
            });
        });

        this.on('camdata', (data) => {
            this.server.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) { client.send(data); }
            });
        });
    }

    start() {
        this.mpeg1Muxer = new Mpeg1Muxer(this.options);
        this.mpeg1Muxer.on('mpeg1data', (data) => {
            return this.emit('camdata', data);
        });

        let gettingInputData = false;
        let gettingOutputData = false;
        let inputData = [];
        let outputData = [];

        this.mpeg1Muxer.on('ffmpegError', (data) => {
            data = data.toString();
            if (data.indexOf('Input #') !== -1) { gettingInputData = true; }
            if (data.indexOf('Output #') !== -1) {
                gettingInputData = false;
                gettingOutputData = true;
            }
            if (data.indexOf('frame') === 0) { gettingOutputData = false; }
            if (gettingInputData) {
                inputData.push(data.toString());
                let size = data.match(/\d+x\d+/);
                if (size !== null) {
                    size = size[0].split('x');
                    if (this.options.width === null) { this.options.width = parseInt(size[0], 10); }
                    if (this.options.height === null) { this.options.height = parseInt(size[1], 10); }
                }
            }
        });
        if (!this.options.hideFfmpegOutput) {
            this.mpeg1Muxer.on('ffmpegError', (data) => {
                return global.process.stderr.write(data);
            });
        }
        return this;
    }

    stop(serverCloseCallback) {
        this.server.close(serverCloseCallback);
        this.server.removeAllListeners();
        this.server = undefined;

        this.mpeg1Muxer.stop();
        this.mpeg1Muxer.removeAllListeners();
        this.mpeg1Muxer = undefined;
    }

    stopStream(timeout) {
        console.log(`Last connection closed! Stopping stream in ${timeout/1000} seconds...`);
        this.disconnectTimeout = setTimeout(() => {
            this.stop();
            this.disconnectTimeout = null;
            this.streamActive = false;
            console.log("Stream closed. Server still running waiting for new connections...");
        }, timeout);
    }
}

module.exports = VideoStream;