let findParentDir = require('find-parent-dir');

const repoName = 'bitcoin-token-smart-contracts'
const repoRootDir = findParentDir.sync(__dirname, repoName);

/*
since zeppelin js code is require from different locations depending
on coverage mode or not, it needs to be required using an absolute path.
*/
module.exports.ZEPPELIN_LOCATION = repoRootDir + repoName + '/node_modules/'

module.exports.ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';