"use strict";

const exec = require("child_process").exec;

exports.getProgs = getProgs;

function getProgs() {
    if (/^win/.test(process.platform)) {
        return getWinProgs();
    } else if (/^linux|^android/.test(process.platform)) {
        return getLnxProgs();
    } else if (/^darwin/.test(process.platform)) {
        return getMacProgs();
    } else {
        return new Promise((resolve, reject) => {
            reject("Platform not supported");
        });
    }
}

function getWinProgs() {
    return new Promise((resolve, reject) => {
        exec("%SystemRoot%\\System32\\Wbem\\wmic.exe product get name,version", (error, stdout) => {
            if (error !== null) {
                reject(error);
            } else {
                const allPrograms = [];
                const splitter = stdout.split("Version");
                splitter.shift();
                const allProgramlines = splitter.join("Version").split("\n");
                allProgramlines.shift();
                allProgramlines.forEach(line => {
                    const parts = line.split(/\s{2,}/);
                    parts.pop();
                    const pVersion = parts.pop();
                    const pName = parts.join(" ");
                    const program = {
                        name: pName,
                        version: pVersion
                    };
                    if (program.name !== null && program.name !== "") {
                        allPrograms.push(program);
                    }
                });
                if (allPrograms.length) {
                    resolve(allPrograms);
                } else {
                    reject("No programs found");
                }
            }
        });
    });
}

function getLnxProgs() {
    return new Promise((resolve, reject) => {
        exec(detectPackageManagerCommand, (error, pkgManager) => {
            if (error !== null) {
                reject(error);
            } else {
                pkgManager = pkgManager.trim();
                if (!(pkgManager in pkgManagers)) {
                    reject("This package manager is not yet supported");
                }
                const managerInfo = pkgManagers[pkgManager];
                exec(managerInfo.command, {maxBuffer: 1024 * 1024}, (error, stdout) => {
                    const allPrograms = [];
                    const regex = RegExp(managerInfo.regex, "gm");
                    let match = regex.exec(stdout);
                    while (match) {
                        const pName = match[managerInfo.nameGroup];
                        const pVersion = match[managerInfo.versionGroup];
                        const pArch = match[managerInfo.archGroup];
                        const program = {
                            name: pName,
                            version: pVersion,
                            arch: pArch
                        };
                        allPrograms.push(program);
                        match = regex.exec(stdout);
                    }
                    if (allPrograms.length) {
                        resolve(allPrograms);
                    } else {
                        reject("No programs found");
                    }
                });
            }
        });
    });
}

function getMacProgs() {
    return new Promise((resolve, reject) => {
        exec(`for i in ls /Applications/*; do echo "$i" && mdls -name kMDItemVersion "$i" | sed 's/kMDItemVersion =/Version/g'; done`, (error, stdout) => {
            if (error !== null) {
                reject(error);
            } else {
                const pattern = /(.*)\nVersion (.*)/mg
                const allPrograms = [];
                let match = pattern.exec(stdout);
                while (match) {
                    let pName = match[1];
                    if (pName.endsWith(".app")) {
                        pName = pName.substring(0, pName.length-4);
                    }
                    pName = pName.replace("/Applications/", "");
                    const pVersion = match[2].replace(/"/g, "");
                    allPrograms.push({
                        name: pName,
                        version: pVersion
                    });
                    match = pattern.exec(stdout);
                }
                if (allPrograms.length) {
                    resolve(allPrograms);
                } else {
                    reject("No programs found");
                }
            }
        });
    });
}

// Constants used by getLnxProgs
const detectPackageManagerCommand = `
    apt-get --version >/dev/null 2>&1
    if [ $? -eq 0 ]
    then
        echo "apt"
        exit
    fi
    dnf --version >/dev/null 2>&1
    if [ $? -eq 0 ]
    then
        echo "dnf"
        exit
    fi
    yum --version >/dev/null 2>&1
    if [ $? -eq 0 ]
    then
        echo "yum"
        exit
    fi
`;

const pkgManagers = {
    "apt": {
        "command": "apt list --installed",
        "regex": "(\\S*)\\/\\S*,\\S*\\s(\\S*)\\s(\\S*).*",
        "nameGroup": 1,
        "versionGroup": 2,
        "archGroup": 3
    },
    "dnf": {
        "command": "dnf list installed",
        "regex": "(\\S*)\\.(\\S*)\\s*(\\S*)\\.\\S*\\s*\\S*",
        "nameGroup": 1,
        "versionGroup": 3,
        "archGroup": 2
    },
    "yum": {
        "command": "yum list installed",
        "regex": "(\\S*)\\.(\\S*)\\s*(\\S*)\\.\\S*\\s*\\S*",
        "nameGroup": 1,
        "versionGroup": 3,
        "archGroup": 2
    }
};
