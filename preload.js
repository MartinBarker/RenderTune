const { contextBridge, ipcRenderer } = require('electron');

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
            'get-path-separator',
            'set-output-folder' // Add this line
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
            'output-folder-set' // Add this line
        ];
        if (validReceiveChannels.includes(channel)) {
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    },
    removeAllListeners: (channel) => {
        ipcRenderer.removeAllListeners(channel);
    }
});
