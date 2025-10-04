let beatsFolder = null;
let loopsFolder = null;

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

// Handle folder selection from input
function handleFolderSelect(type, files) {
    if (files.length > 0) {
        const folderPath = files[0].webkitRelativePath.split('/')[0];
        const fullPath = files[0].path || files[0].webkitRelativePath;
        const actualPath = fullPath.substring(0, fullPath.lastIndexOf('\\') || fullPath.lastIndexOf('/'));

        if (type === 'beats') {
            beatsFolder = { path: actualPath, files: Array.from(files) };
            document.getElementById('beats-folder-path').textContent = actualPath;
            updateBeatsCount();
        } else if (type === 'loops') {
            loopsFolder = { path: actualPath, files: Array.from(files) };
            document.getElementById('loops-folder-path').textContent = actualPath;
            updateLoopsCount();
        }
    }
}

// Count files from browser selection
function countFilesFromSelection(files, extensions) {
    let count = 0;
    const today = new Date();

    for (const file of files) {
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        const modified = new Date(file.lastModified);

        if (extensions.includes(ext) &&
            today.getFullYear() === modified.getFullYear() &&
            today.getMonth() === modified.getMonth() &&
            today.getDate() === modified.getDate()) {
            count++;
        }
    }

    return count;
}

// Update beats count
function updateBeatsCount() {
    if (beatsFolder && beatsFolder.files) {
        const count = countFilesFromSelection(beatsFolder.files, ['.wav']);
        document.getElementById('beats-count').textContent = count;
    }
}

// Update loops count
function updateLoopsCount() {
    if (loopsFolder && loopsFolder.files) {
        const count = countFilesFromSelection(loopsFolder.files, ['.mp3', '.wav']);
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
    document.getElementById('beats-folder-input').click();
});

document.getElementById('beats-folder-input').addEventListener('change', (e) => {
    handleFolderSelect('beats', e.target.files);
});

document.getElementById('select-loops-folder').addEventListener('click', () => {
    document.getElementById('loops-folder-input').click();
});

document.getElementById('loops-folder-input').addEventListener('change', (e) => {
    handleFolderSelect('loops', e.target.files);
});

document.getElementById('refresh-btn').addEventListener('click', refreshCounts);

// Initialize
updateDates();
