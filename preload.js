const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  sendVideoPath: (videoPath) => ipcRenderer.send('load-video', videoPath),
  onLoadVideo: (callback) => ipcRenderer.on('load-video', callback),
});
