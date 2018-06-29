"use strict";

const exec = require("child_process").exec;

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
        exec("wmic product get name,version", (error, stdout) => {
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
                exec(managerInfo.command, (error, stdout) => {
                    const allPrograms = [];
                    stdout.split("\n").forEach(line => {
                        const regex = RegExp(managerInfo.regex);
                        const groups = regex.exec(line);
                        if (groups) {
                            const pName = groups[managerInfo.nameGroup];
                            const pVersion = groups[managerInfo.versionGroup];
                            const pArch = groups[managerInfo.archGroup];
                            const program = {
                                name: pName,
                                version: pVersion,
                                arch: pArch
                            };
                            allPrograms.push(program);
                        }
                    });
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
            const pattern = /(.*)\nVersion (.*)/mg
            const allPrograms = [];
            let match = pattern.exec(stdout);
            while (match) {
                let name = match[1];
                if (name.endsWith(".app")) {
                    name = name.substring(0, name.length-4);
                }
                name = name.replace("/Applications/", "");
                const version = match[2].replace(/"/g, "");
                allPrograms.push({
                    name: name,
                    version: version
                });
                match = pattern.exec(stdout);
            }
            if (allPrograms.length) {
                resolve(allPrograms);
            } else {
                reject("No programs found");
            }
        });
    });
}

// Constants used by getLnxProgs
const detectPackageManagerCommand = `
    apt --version >/dev/null 2>&1
    if [ $? -eq 0 ]
    then
        echo "apt"
        exit
    fi
    dnf --version &>/dev/null
    if [ $? -eq 0 ]
    then
        echo "dnf"
        exit
    fi
    yum --version &>/dev/null
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
