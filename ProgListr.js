"use strict";

const exec = require('child_process').exec;

exports.getProgs = getProgs;

function getProgs() {
    if (/^win/.test(process.platform)) {
        return getWinProgs();
    } else if (/^linux/.test(process.platform)) {
        return getLnxProgs();
    } else if (/^darwin/.test(process.platform)){
        return getMacProgs();
    }
}

function getWinProgs() {
    return new Promise((resolve, reject) => {
        exec("wmic product get name,version", (error, stdout, stderr) => {
            if (error !== null) {
                reject(error);
            } else {
                let allPrograms = [];
                let splitter = stdout.split("Version");
                splitter.shift();
                let allProgramlines = splitter.join("Version").split("\n");
                allProgramlines.shift();
                allProgramlines.forEach((line) => {
                    let parts = line.split(/\s{2,}/);
                    parts.pop();
                    let pVersion = parts.pop();
                    let pName = parts.join(" ");
                    let program = {
                        name : pName,
                        version : pVersion
                    }
                    if (program.name !== null && program.name !== "") {
                        allPrograms.push(program);
                    }
                });
                resolve(allPrograms);
            }
        });
    });
}

function getLnxProgs() {
    return new Promise((resolve, reject) => {
        reject("Linux platform not yet supported");
    });
}

function getMacProgs() {
    return new Promise((resolve, reject) => {
        reject("Mac platform not yet supported");
    });
}
