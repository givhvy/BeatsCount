const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        icon: path.join(__dirname, 'icon.png')
    });

    mainWindow.loadFile('index.html');

    // Open DevTools in development
    // mainWindow.webContents.openDevTools();
}

// Check if file was modified today
function isModifiedToday(stats) {
    const today = new Date();
    const modified = new Date(stats.mtime);

    return today.getFullYear() === modified.getFullYear() &&
           today.getMonth() === modified.getMonth() &&
           today.getDate() === modified.getDate();
}

// Count files with specific extensions modified today
async function countFilesInFolder(folderPath, extensions) {
    try {
        const files = await fs.readdir(folderPath);
        let count = 0;

        for (const file of files) {
            const filePath = path.join(folderPath, file);
            const stats = await fs.stat(filePath);

            if (stats.isFile()) {
                const ext = path.extname(file).toLowerCase();
                if (extensions.includes(ext) && isModifiedToday(stats)) {
                    count++;
                }
            }
        }

        return count;
    } catch (error) {
        console.error('Error counting files:', error);
        return 0;
    }
}

// Handle folder selection
ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    });

    if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths[0];
    }
    return null;
});

// Handle file counting
ipcMain.handle('count-files', async (event, folderPath, extensions) => {
    return await countFilesInFolder(folderPath, extensions);
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
