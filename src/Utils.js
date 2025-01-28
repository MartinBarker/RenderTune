const os = require('os');

const platform = os.platform();
const arch = os.arch();

const isWindows = platform === 'win32';
const isMac = platform === 'darwin';
const isLinux = platform === 'linux';

module.exports = { platform, arch, isWindows, isMac, isLinux };
