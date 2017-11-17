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
        exec("apt list --installed", (error, stdout, stderr) => {
			if (error !== null) {
				reject(error);
			} else {
				let allPrograms = [];
				stdout.split("\n").forEach((line) => {
					let regex = /(\S*)\/\S*,\S*\s(\S*)\s(\S*).*/;
					let groups = regex.exec(line);
					if (groups) {
						let pName = groups[1];
						let pVersion = groups[2];
						let pArch = groups[3];
						let program = {
							name : pName,
							version : pVersion,
							arch : pArch
						}
						allPrograms.push(program);
					}
				});
				resolve(allPrograms);
			}
		});
    });
}

function getMacProgs() {
    return new Promise((resolve, reject) => {
        reject("Mac platform not yet supported");
    });
}
