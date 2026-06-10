const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  getActivities: () => ipcRenderer.invoke('get-activities'),
  getCode: (disciplina, exercicio, aluno) =>
    ipcRenderer.invoke('get-code', disciplina, exercicio, aluno),
  runCode: (code) => ipcRenderer.invoke('run-code', code),
  onOutput: (callback) => ipcRenderer.on('run-output', (_, data) => callback(data))
})