"use strict";
// Require module locally and log results
const p = require('./ProgListr');
p.getProgs().then(data => console.log(data));
