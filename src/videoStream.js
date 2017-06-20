/* jshint node: true, esversion: 6*/

const WebSocket = require('ws');
const EventEmitter = require('events');
const STREAM_MAGIC_BYTES = "jsmp";
const Mpeg1Muxer = require('./mpeg1muxer');
class VideoStream extends EventEmitter {

    constructor(options) {
        super(options);
        this.name = options.name;
        this.url = options.url;
        this.protocol = ("protocol" in options) ? options.protocol : "tcp";
        this.frameRate = ("frameRate" in options) ? options.frameRate : "30";
        this.shutdownDelay = ("shutdownDelay" in options) ? options.shutdownDelay : 5000;
        this.hideFfmpegOutput = ("hideFfmpegOutput" in options) ? options.hideFfmpegOutput : false;
        this.width = options.width;
        this.height = options.height;
        this.port = options.port;
        this.stream = void 0;
        this.connectionCount = 0;
        this.streamActive = false;
        this.disconnectTimeout = null;
    }

    startListener() {
        console.log(`Starting WebSocket server on port ${this.port}. Waiting for connections...`);
        const server = new WebSocket.Server({ port: this.port });
        server.on('connection', (socket) => {
            if (this.connectionCount === 0) {
                if (!this.disconnectTimeout) {
                    // First connection, start the stream.
                    this.startStream();
                    this.streamActive = true;
                } else {
                    // New connection while still in shutdown timeout.
                    clearTimeout(this.disconnectTimeout);
                    this.disconnectTimeout = null;
                    this.streamActive = true;
                }
            }
            this.connectionCount++;
            console.log(`${this.name}: new connection! ${this.connectionCount} active connections.`);

            let streamHeader = new Buffer(8);
            streamHeader.write(STREAM_MAGIC_BYTES);
            streamHeader.writeUInt16BE(this.width, 4);
            streamHeader.writeUInt16BE(this.height, 6);
            socket.send(streamHeader);

            this.on('camdata', (data) => {
                server.clients.forEach((client) => {
                  if(client.readyState === WebSocket.OPEN) { client.send(data); }
                });
            });

            socket.on('close', () => { 
                this.connectionCount--;
                console.log(`${this.name} client disconnected! ${this.connectionCount} active connections.`); 
                if (this.connectionCount === 0) {
                    this.stopStream(this.shutdownDelay);
                }
            });
        });
        return this;
    }

    startStream() {    
        this.mpeg1Muxer = new Mpeg1Muxer({ url: this.url, frameRate: this.frameRate })    ;
        this.mpeg1Muxer.on('mpeg1data', (data) => { return this.emit('camdata', data); });

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
                    if (this.width === null) { this.width = parseInt(size[0], 10); }
                    if (this.height === null) { this.height = parseInt(size[1], 10); }
                }
            }
        });
        
        if (!this.hideFfmpegOutput) { this.mpeg1Muxer.on('ffmpegError', (data) => { return global.process.stderr.write(data); }); }
        return this;
    }

    stopStream(timeout) {
        console.log(`Last connection closed! Stopping stream in ${timeout/1000} seconds...`);
        this.disconnectTimeout = setTimeout(() => { 
            this.mpeg1Muxer.stream.kill('SIGINT'); 
            this.disconnectTimeout = null;
            this.streamActive = false;
            console.log("Stream closed. Server still running waiting for new connections...");
        }, timeout);
    }
}

module.exports = VideoStream;
