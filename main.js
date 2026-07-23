const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        autoHideMenuBar: true
    });

    mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.whenReady().then(() => app.quit());
});

// פתיחת קובץ
ipcMain.handle('open-file', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
        filters: [
            { name: 'מסמכי שמעון VIP', extensions: ['shimon', 'json', 'txt'] },
            { name: 'כל הקבצים', extensions: ['*'] }
        ]
    });
    
    if (canceled || filePaths.length === 0) return null;
    
    const filePath = filePaths[0];
    const content = fs.readFileSync(filePath, 'utf-8');
    return { filePath, content };
});

// שמירת קובץ קיים
ipcMain.handle('save-file', async (event, { filePath, content }) => {
    if (!filePath) {
        const { canceled, filePath: newPath } = await dialog.showSaveDialog(mainWindow, {
            filters: [{ name: 'מסמכי שמעון VIP', extensions: ['shimon'] }]
        });
        if (canceled || !newPath) return null;
        filePath = newPath;
        if (!filePath.endsWith('.shimon')) {
            filePath += '.shimon';
        }
    }
    fs.writeFileSync(filePath, content, 'utf-8');
    return filePath;
});

// שמירה בשם חדש
ipcMain.handle('save-as-file', async (event, content) => {
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
        filters: [{ name: 'מסמכי שמעון VIP', extensions: ['shimon'] }]
    });
    
    if (canceled || !filePath) return null;
    
    let finalPath = filePath;
    if (!finalPath.endsWith('.shimon')) {
        finalPath += '.shimon';
    }
    
    fs.writeFileSync(finalPath, content, 'utf-8');
    return finalPath;
});

// ייצוא ל-PDF
ipcMain.handle('export-pdf-dialog', async () => {
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
        filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
    });

    if (canceled || !filePath) return false;

    try {
        const pdfData = await mainWindow.webContents.printToPDF({});
        fs.writeFileSync(filePath, pdfData);
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
});