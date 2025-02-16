const { contextBridge, ipcRenderer, webFrame, webUtils } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    sendFiles: (files) => ipcRenderer.send('files-dropped', files),
    getPathForFile: (file) => webUtils.getPathForFile(file)
});

contextBridge.exposeInMainWorld('api', {
    send: (channel, data) => {
        const validSendChannels = [
            'app_version',
            'minimize-window',
            'maximize-window',
            'unmaximize-window',
            'close-window',
            'run-ffmpeg-command',
            'get-audio-metadata',
            'open-file-dialog',
            'open-folder-dialog',
            'open-dir',
            'open-file',
            'get-path-separator',
            'set-output-folder',
            'get-color-palette',
            'stop-ffmpeg-render',
            'delete-render-file',
            'delete-file',
            'check-filepath'
        ];
        if (validSendChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    receive: (channel, func) => {
        const validReceiveChannels = [
            'app_version',
            'ffmpeg-output',
            'ffmpeg-error',
            'audio-metadata-response',
            'selected-file-paths',
            'selected-folder',
            'path-separator-response',
            'ffmpeg-progress',
            'output-folder-set',
            'ffmpeg-stop-response',
            'check-filepath-response'
        ];
        if (validReceiveChannels.includes(channel) || channel.startsWith('color-palette-response-')) {
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    },
    removeAllListeners: (channel) => {
        ipcRenderer.removeAllListeners(channel);
    }
});
