const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  getActivities: () => ipcRenderer.invoke('get-activities'),
  getCode: (exPath, aluno) => ipcRenderer.invoke('get-code', exPath, aluno),
  checkFpc: () => ipcRenderer.invoke('check-fpc'),
  runCode: (code) => ipcRenderer.invoke('run-code', code),
  sendInput: (data) => ipcRenderer.invoke('send-input', data),
  onOutput: (cb) => ipcRenderer.on('run-output', (_, data) => cb(data)),
  removeOutput: () => ipcRenderer.removeAllListeners('run-output'),
})