const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  getActivities: () => ipcRenderer.invoke('get-activities'),
  getCode: (disciplina, exercicio, aluno) =>
    ipcRenderer.invoke('get-code', disciplina, exercicio, aluno),
  checkFpc: () => ipcRenderer.invoke('check-fpc'),
  runCode: (code) => ipcRenderer.invoke('run-code', code),
  sendInput: (data) => ipcRenderer.invoke('send-input', data),
  onOutput: (callback) => ipcRenderer.on('run-output', (_, data) => callback(data)),
  removeOutput: () => ipcRenderer.removeAllListeners('run-output')
})