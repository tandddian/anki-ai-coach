import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
  saveFile: (filePath: string, data: string) => ipcRenderer.invoke('save-file', filePath, data),
  dbOperation: (operation: string, params: any) => ipcRenderer.invoke('db-operation', operation, params),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  readDbFile: () => ipcRenderer.invoke('read-db-file'),
  saveDbFile: (data: ArrayBuffer) => ipcRenderer.invoke('save-db-file', data),
  loadWasm: () => ipcRenderer.invoke('load-wasm'),
});
