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
            'stop-ffmpeg-render',
            'pause-ffmpeg-render',
            'resume-ffmpeg-render',
            'delete-render-file'
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
            'ffmpeg-stop-response',
            'ffmpeg-pause-response',
            'ffmpeg-resume-response'
        ];
        if (validReceiveChannels.includes(channel)) {
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    },
    removeAllListeners: (channel) => {
        ipcRenderer.removeAllListeners(channel);
    }
});
