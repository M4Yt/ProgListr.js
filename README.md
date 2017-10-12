# ProgListr.js

A simple node.js library for listing installed programs. Developed for [StatusPilatus](https://github.com/PilatusDevs/StatusPilatus).

----
## Getting started

One simple solution for listing all your installed programs. No npm dependencies. Currently functioning with Windows (Linux and Mac support is planned).

### Installation
To install this library, simply run
`npm install proglistr`.

### Usage
There is only one function, called `getProgs()`.
This function is asynchronous and returns a promise with an array of objects. Every object represents a program, with a name and a version. Add the library to your program by putting
`const plistr = require('proglistr');`.
From there you can call the function as `plistr.getProgs()` and then do with the data as you please.

----
## License

MIT, see LICENSE for details.
