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
async function countFilesInFolder(folderPath, extensions, recursive = false) {
    try {
        const files = await fs.readdir(folderPath);
        let count = 0;

        for (const file of files) {
            const filePath = path.join(folderPath, file);
            const stats = await fs.stat(filePath);

            if (stats.isFile()) {
                const ext = path.extname(file).toLowerCase();
                // If extensions is null/empty, count all files, otherwise check extension
                const matchesExtension = !extensions || extensions.length === 0 || extensions.includes(ext);
                if (matchesExtension && isModifiedToday(stats)) {
                    count++;
                }
            } else if (stats.isDirectory() && recursive) {
                // Recursively count files in subdirectories
                count += await countFilesInFolder(filePath, extensions, recursive);
            }
        }

        return count;
    } catch (error) {
        console.error('Error counting files:', error);
        return 0;
    }
}

// Count total files with specific extensions (all time) - recursive
async function countTotalFilesInFolder(folderPath, extensions) {
    try {
        const files = await fs.readdir(folderPath);
        let count = 0;

        for (const file of files) {
            const filePath = path.join(folderPath, file);
            const stats = await fs.stat(filePath);

            if (stats.isFile()) {
                const ext = path.extname(file).toLowerCase();
                // If extensions is null/empty, count all files, otherwise check extension
                const matchesExtension = !extensions || extensions.length === 0 || extensions.includes(ext);
                if (matchesExtension) {
                    count++;
                }
            } else if (stats.isDirectory()) {
                // Recursively count files in subdirectories
                count += await countTotalFilesInFolder(filePath, extensions);
            }
        }

        return count;
    } catch (error) {
        console.error('Error counting total files:', error);
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
ipcMain.handle('count-files', async (event, folderPath, extensions, recursive = false) => {
    return await countFilesInFolder(folderPath, extensions, recursive);
});

// Handle total file counting
ipcMain.handle('count-total-files', async (_event, folderPath, extensions) => {
    return await countTotalFilesInFolder(folderPath, extensions);
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
