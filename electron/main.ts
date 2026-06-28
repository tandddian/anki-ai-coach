import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: 'Anki AI Coach',
    backgroundColor: '#f9fafb',
    show: false,
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    if (isDev) {
      mainWindow?.webContents.openDevTools({ mode: 'detach' });
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ========== IPC Handlers ==========

ipcMain.handle('open-file-dialog', async () => {
  if (!mainWindow) return [];
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Documents', extensions: ['pdf', 'docx', 'pptx', 'md', 'txt', 'csv', 'tsv', 'apkg'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  return result.canceled ? [] : result.filePaths;
});

ipcMain.handle('read-file', async (_event, filePath: string) => {
  try {
    return fs.readFileSync(filePath);
  } catch (error: any) {
    throw new Error(`Failed to read file: ${error.message}`);
  }
});

ipcMain.handle('save-file', async (_event, filePath: string, data: string) => {
  try {
    fs.writeFileSync(filePath, data, 'utf-8');
    return true;
  } catch (error: any) {
    throw new Error(`Failed to save file: ${error.message}`);
  }
});

ipcMain.handle('db-operation', async (_event, operation: string, params: any) => {
  return { success: true, operation, params };
});

ipcMain.handle('read-db-file', async () => {
  try {
    const dbPath = path.join(app.getPath('userData'), 'anki-ai-coach.db');
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath);
      return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    }
    return null;
  } catch { return null; }
});

ipcMain.handle('save-db-file', async (_event, data: ArrayBuffer) => {
  try {
    const userDataPath = app.getPath('userData');
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    const dbPath = path.join(userDataPath, 'anki-ai-coach.db');
    fs.writeFileSync(dbPath, Buffer.from(data));
    return true;
  } catch (error: any) {
    throw new Error(`Failed to save database: ${error.message}`);
  }
});

ipcMain.handle('load-wasm', async () => {
  try {
    const devWasmPath = path.join(process.cwd(), 'public', 'sql-wasm.wasm');
    if (fs.existsSync(devWasmPath)) {
      const data = fs.readFileSync(devWasmPath);
      return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    }
    const nmWasmPath = path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
    if (fs.existsSync(nmWasmPath)) {
      const data = fs.readFileSync(nmWasmPath);
      return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    }
    return null;
  } catch { return null; }
});

ipcMain.handle('get-app-path', async () => {
  return app.getPath('userData');
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});