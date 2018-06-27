"use strict";
// Require module locally and log results
const p = require('./proglistr');
p.getProgs().then(data => console.log(data));
