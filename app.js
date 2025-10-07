const { ipcRenderer } = require('electron');

let beatsFolder = null;
let loopsFolder = null;
const BEATS_GOAL = 100;
const LOOPS_GOAL = 100;

// Get today's date key
function getTodayKey() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

// Save today's count to history
function saveToHistory(type, count) {
    const today = getTodayKey();
    const historyKey = `${type}History`;
    const history = JSON.parse(localStorage.getItem(historyKey) || '{}');
    history[today] = count;
    localStorage.setItem(historyKey, JSON.stringify(history));
}

// Load history
function loadHistory(type) {
    const historyKey = `${type}History`;
    return JSON.parse(localStorage.getItem(historyKey) || '{}');
}

// Display history
function displayHistory(type) {
    const history = loadHistory(type);
    const historyContainer = document.getElementById(`${type}-history`);
    const today = getTodayKey();

    // Get last 7 days (excluding today)
    const dates = Object.keys(history)
        .filter(date => date !== today)
        .sort()
        .reverse()
        .slice(0, 7);

    if (dates.length === 0) {
        historyContainer.innerHTML = '<div class="no-history">No history yet</div>';
        return;
    }

    let html = '';
    dates.forEach(date => {
        const count = history[date];
        const dateObj = new Date(date);
        const formattedDate = dateObj.toLocaleDateString('vi-VN', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
        html += `<div class="history-item">
            <span class="history-date">${formattedDate}</span>
            <span class="history-count">${count}</span>
        </div>`;
    });

    historyContainer.innerHTML = html;
}

// Update progress bar
function updateProgress(type, count, goal) {
    const percentage = Math.min((count / goal) * 100, 100);
    const progressFill = document.getElementById(`${type}-progress-fill`);
    const progressText = document.getElementById(`${type}-progress-text`);

    progressFill.style.width = percentage + '%';
    progressText.textContent = `${count}/${goal}`;

    // Change color based on progress
    if (percentage >= 100) {
        progressFill.style.background = 'linear-gradient(90deg, #10b981, #059669)';
    } else if (percentage >= 50) {
        progressFill.style.background = 'linear-gradient(90deg, #667eea, #764ba2)';
    } else {
        progressFill.style.background = 'linear-gradient(90deg, #f59e0b, #d97706)';
    }
}

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

    // Load history for both
    displayHistory('beats');
    displayHistory('loops');
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
        const totalCount = await ipcRenderer.invoke('count-total-files', beatsFolder, ['.wav']);
        document.getElementById('beats-count').textContent = count;
        document.getElementById('beats-total-files').textContent = `Total: ${totalCount} files`;
        updateProgress('beats', count, BEATS_GOAL);
        saveToHistory('beats', count);
        displayHistory('beats');
    }
}

// Update loops count
async function updateLoopsCount() {
    if (loopsFolder) {
        const count = await ipcRenderer.invoke('count-files', loopsFolder, null, true); // null = all files, true = recursive
        const totalCount = await ipcRenderer.invoke('count-total-files', loopsFolder, null); // null = all files
        document.getElementById('loops-count').textContent = count;
        document.getElementById('loops-total-files').textContent = `Total: ${totalCount} files`;
        updateProgress('loops', count, LOOPS_GOAL);
        saveToHistory('loops', count);
        displayHistory('loops');
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
