const { ipcRenderer } = require('electron');

let beatsFolder = null;
let loopsFolder = null;

// Load saved folders from localStorage
function loadSavedFolders() {
    const savedBeatsFolder = localStorage.getItem('beatsFolder');
    const savedLoopsFolder = localStorage.getItem('loopsFolder');

    if (savedBeatsFolder) {
        beatsFolder = savedBeatsFolder;
        document.getElementById('beats-folder-path').textContent = beatsFolder;
        updateBeatsCount();
    }

    if (savedLoopsFolder) {
        loopsFolder = savedLoopsFolder;
        document.getElementById('loops-folder-path').textContent = loopsFolder;
        updateLoopsCount();
    }
}

// Update dates
function updateDates() {
    const today = new Date().toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    document.getElementById('beats-date').textContent = today;
    document.getElementById('loops-date').textContent = today;
}

// Select folder using Electron dialog
async function selectFolder(type) {
    const folderPath = await ipcRenderer.invoke('select-folder');

    if (folderPath) {
        if (type === 'beats') {
            beatsFolder = folderPath;
            localStorage.setItem('beatsFolder', folderPath);
            document.getElementById('beats-folder-path').textContent = folderPath;
            updateBeatsCount();
        } else if (type === 'loops') {
            loopsFolder = folderPath;
            localStorage.setItem('loopsFolder', folderPath);
            document.getElementById('loops-folder-path').textContent = folderPath;
            updateLoopsCount();
        }
    }
}

// Update beats count
async function updateBeatsCount() {
    if (beatsFolder) {
        const count = await ipcRenderer.invoke('count-files', beatsFolder, ['.wav']);
        document.getElementById('beats-count').textContent = count;
    }
}

// Update loops count
async function updateLoopsCount() {
    if (loopsFolder) {
        const count = await ipcRenderer.invoke('count-files', loopsFolder, ['.mp3', '.wav']);
        document.getElementById('loops-count').textContent = count;
    }
}

// Refresh all counts
function refreshCounts() {
    updateBeatsCount();
    updateLoopsCount();
}

// Event listeners
document.getElementById('select-beats-folder').addEventListener('click', () => {
    selectFolder('beats');
});

document.getElementById('select-loops-folder').addEventListener('click', () => {
    selectFolder('loops');
});

document.getElementById('refresh-btn').addEventListener('click', refreshCounts);

// Initialize
updateDates();
loadSavedFolders();
