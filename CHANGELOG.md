### [1.1.7] Incorporate upstream changes, refactor, add harware acceleration

* Changed function names and initialization to match upstream fork
* Passed `options` object directly to mpeg1muxer instead of reassigning it several times
* Added `hwAccel` option to attempt to use hardware accelerated version of FFMPEG.

### [1.1.4] Change port parameter to ffmpegPort

* Change name of port parameter for clarification purposes.

### [1.1.3] Disable Audio and Add Custom FFMPEG Options

* Audio is disabled by default. Pass `enableAudio: true` to enable.
* To pass a custom array of FFMPEG arguements, pass `ffmpegCustomArgs` in the options.

### [1.1.2] Bug fixes

* Bug fixes from v1.1.1
* `hideFfmpegOutput` now defaults to `false` if not passed as an option

### [1.1.1] Minor update

* Added TCP/UDP Protocol Option

### [1.1.0] Initial Forked Release

* Initial release of original forked version
