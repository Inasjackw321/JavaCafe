// Data storage keys
const STORAGE_KEYS = {
    scripts: 'codeSandbox_scripts',
    settings: 'codeSandboxSettings'
};

let uploadEditor;
let settings = {
    theme: 'dracula',
    fontSize: 14,
    tabSize: 2,
    lineNumbers: true
};

// Load settings
function loadSettings() {
    const saved = localStorage.getItem(STORAGE_KEYS.settings);
    if (saved) {
        settings = { ...settings, ...JSON.parse(saved) };
    }
}

// Initialize editor
function initializeEditor() {
    uploadEditor = CodeMirror(document.getElementById('uploadEditor'), {
        value: '',
        mode: 'javascript',
        theme: settings.theme,
        lineNumbers: settings.lineNumbers,
        indentUnit: settings.tabSize,
        tabSize: settings.tabSize,
        indentWithTabs: false,
        lineWrapping: true,
        autoCloseBrackets: true,
        matchBrackets: true
    });

    // Apply font size
    document.querySelector('.CodeMirror').style.fontSize = settings.fontSize + 'px';
}

// Handle language change
function handleLanguageChange() {
    const lang = document.getElementById('scriptLanguage').value;
    const modes = { javascript: 'javascript', html: 'htmlmixed', python: 'python' };
    uploadEditor.setOption('mode', modes[lang]);
}

// Save script
function saveScript(script) {
    const scripts = getScripts();
    script.id = Date.now().toString();
    script.timestamp = new Date().toISOString();
    script.likes = 0;
    scripts.unshift(script);
    localStorage.setItem(STORAGE_KEYS.scripts, JSON.stringify(scripts));
    return script.id;
}

// Get scripts
function getScripts() {
    const data = localStorage.getItem(STORAGE_KEYS.scripts);
    return data ? JSON.parse(data) : [];
}

// Handle form submission
function handleSubmit(e) {
    e.preventDefault();

    const script = {
        title: document.getElementById('scriptTitle').value.trim(),
        author: document.getElementById('scriptAuthor').value.trim(),
        description: document.getElementById('scriptDescription').value.trim(),
        language: document.getElementById('scriptLanguage').value,
        code: uploadEditor.getValue()
    };

    if (!script.title || !script.author || !script.description || !script.code) {
        alert('Please fill in all fields');
        return;
    }

    saveScript(script);

    // Redirect to browse page
    window.location.href = 'index.html';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    initializeEditor();

    // Event listeners
    document.getElementById('scriptLanguage').addEventListener('change', handleLanguageChange);
    document.getElementById('uploadForm').addEventListener('submit', handleSubmit);
});
