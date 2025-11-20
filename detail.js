// Data storage keys
const STORAGE_KEYS = {
    scripts: 'codeSandbox_scripts',
    comments: 'codeSandbox_comments',
    likes: 'codeSandbox_likes',
    settings: 'codeSandboxSettings'
};

let detailEditor;
let currentScriptId = null;
let currentScript = null;
let pyodide = null;
let pyodideLoaded = false;
let settings = {
    theme: 'dracula',
    fontSize: 14,
    tabSize: 2,
    lineNumbers: true
};

// Get script ID from URL
function getScriptIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// Load settings
function loadSettings() {
    const saved = localStorage.getItem(STORAGE_KEYS.settings);
    if (saved) {
        settings = { ...settings, ...JSON.parse(saved) };
    }
}

// Get scripts
function getScripts() {
    const data = localStorage.getItem(STORAGE_KEYS.scripts);
    return data ? JSON.parse(data) : [];
}

// Get comments for script
function getComments(scriptId) {
    const data = localStorage.getItem(STORAGE_KEYS.comments);
    const allComments = data ? JSON.parse(data) : [];
    return allComments.filter(c => c.scriptId === scriptId);
}

// Save comment
function saveComment(comment) {
    const data = localStorage.getItem(STORAGE_KEYS.comments);
    const comments = data ? JSON.parse(data) : [];
    comment.id = Date.now().toString();
    comment.timestamp = new Date().toISOString();
    comments.push(comment);
    localStorage.setItem(STORAGE_KEYS.comments, JSON.stringify(comments));
}

// Get likes
function getLikes() {
    const data = localStorage.getItem(STORAGE_KEYS.likes);
    return data ? JSON.parse(data) : {};
}

// Save likes
function saveLikes(likes) {
    localStorage.setItem(STORAGE_KEYS.likes, JSON.stringify(likes));
}

// Initialize editor
function initializeEditor() {
    detailEditor = CodeMirror(document.getElementById('detailEditor'), {
        value: '',
        mode: 'javascript',
        theme: settings.theme,
        lineNumbers: settings.lineNumbers,
        indentUnit: settings.tabSize,
        tabSize: settings.tabSize,
        readOnly: true,
        lineWrapping: true
    });

    document.querySelector('.CodeMirror').style.fontSize = settings.fontSize + 'px';
}

// Load script details
function loadScriptDetails() {
    currentScriptId = getScriptIdFromURL();

    if (!currentScriptId) {
        window.location.href = 'index.html';
        return;
    }

    const scripts = getScripts();
    currentScript = scripts.find(s => s.id === currentScriptId);

    if (!currentScript) {
        alert('Script not found');
        window.location.href = 'index.html';
        return;
    }

    // Populate details
    document.getElementById('detailTitle').textContent = currentScript.title;
    document.getElementById('detailAuthor').textContent = 'by ' + currentScript.author;
    document.getElementById('detailDescription').textContent = currentScript.description;
    document.getElementById('detailLanguage').textContent = currentScript.language;
    document.getElementById('detailLanguage').className = `language-badge ${currentScript.language}`;
    document.getElementById('detailDate').textContent = formatDate(currentScript.timestamp);
    document.getElementById('likeCount').textContent = currentScript.likes || 0;

    // Update like button state
    const likes = getLikes();
    const likeBtn = document.getElementById('likeBtn');
    likeBtn.classList.toggle('liked', likes[currentScriptId] === true);

    // Set editor content
    const modes = { javascript: 'javascript', html: 'htmlmixed', python: 'python' };
    detailEditor.setOption('mode', modes[currentScript.language]);
    detailEditor.setValue(currentScript.code);

    // Load comments
    loadComments();

    // Initialize Pyodide if Python
    if (currentScript.language === 'python') {
        initializePyodide();
    }
}

// Load comments
function loadComments() {
    const comments = getComments(currentScriptId);
    const commentsList = document.getElementById('commentsList');
    document.getElementById('commentCount').textContent = comments.length;

    if (comments.length === 0) {
        commentsList.innerHTML = '<p class="no-comments">No comments yet. Be the first to comment!</p>';
        return;
    }

    commentsList.innerHTML = comments.map(comment => `
        <div class="comment">
            <div class="comment-header">
                <strong>${escapeHtml(comment.author)}</strong>
                <span class="comment-date">${formatDate(comment.timestamp)}</span>
            </div>
            <p class="comment-text">${escapeHtml(comment.text)}</p>
        </div>
    `).join('');
}

// Handle comment submission
function handleComment(e) {
    e.preventDefault();

    const author = document.getElementById('commentAuthor').value.trim();
    const text = document.getElementById('commentText').value.trim();

    if (!author || !text) return;

    const comment = {
        scriptId: currentScriptId,
        author,
        text
    };

    saveComment(comment);
    loadComments();

    // Clear form
    document.getElementById('commentText').value = '';
}

// Toggle like
function toggleLike() {
    if (!currentScriptId) return;

    const likes = getLikes();
    const scripts = getScripts();
    const script = scripts.find(s => s.id === currentScriptId);

    if (!script) return;

    if (likes[currentScriptId]) {
        delete likes[currentScriptId];
        script.likes = Math.max(0, (script.likes || 0) - 1);
    } else {
        likes[currentScriptId] = true;
        script.likes = (script.likes || 0) + 1;
    }

    saveLikes(likes);
    localStorage.setItem(STORAGE_KEYS.scripts, JSON.stringify(scripts));

    // Update UI
    document.getElementById('likeCount').textContent = script.likes;
    document.getElementById('likeBtn').classList.toggle('liked');
}

// Run code
async function runDetailCode() {
    clearDetailOutput();
    const code = detailEditor.getValue();

    if (!code.trim()) {
        appendDetailOutput('No code to execute', 'error');
        return;
    }

    try {
        switch (currentScript.language) {
            case 'javascript':
                executeJavaScript(code);
                break;
            case 'html':
                executeHTML(code);
                break;
            case 'python':
                await executePython(code);
                break;
        }
    } catch (error) {
        appendDetailOutput(`Error: ${error.message}`, 'error');
    }
}

// Execute JavaScript
function executeJavaScript(code) {
    const logs = [];
    const sandboxConsole = {
        log: (...args) => logs.push({ type: 'log', args }),
        error: (...args) => logs.push({ type: 'error', args }),
        warn: (...args) => logs.push({ type: 'warn', args }),
        info: (...args) => logs.push({ type: 'log', args })
    };

    try {
        const func = new Function('console', code);
        func(sandboxConsole);

        if (logs.length === 0) {
            appendDetailOutput('Code executed successfully (no output)', 'success');
        } else {
            logs.forEach(log => {
                const message = log.args.map(arg => {
                    if (typeof arg === 'object') {
                        return JSON.stringify(arg, null, 2);
                    }
                    return String(arg);
                }).join(' ');
                appendDetailOutput(message, log.type);
            });
        }
    } catch (error) {
        appendDetailOutput(`Error: ${error.message}`, 'error');
    }
}

// Execute HTML
function executeHTML(code) {
    const output = document.getElementById('detailOutput');
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '8px';
    iframe.style.background = 'white';

    output.innerHTML = '';
    output.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(code);
    iframeDoc.close();
}

// Execute Python
async function executePython(code) {
    if (!pyodideLoaded) {
        appendDetailOutput('Python runtime is still loading... Please wait.', 'error');
        return;
    }

    try {
        pyodide.runPython(`
sys.stdout = JSOutputStream()
sys.stderr = JSOutputStream()
        `);

        await pyodide.runPythonAsync(code);

        const stdout = pyodide.runPython('sys.stdout.getvalue()');
        const stderr = pyodide.runPython('sys.stderr.getvalue()');

        if (stdout) appendDetailOutput(stdout, 'log');
        if (stderr) appendDetailOutput(stderr, 'error');
        if (!stdout && !stderr) appendDetailOutput('Code executed successfully (no output)', 'success');
    } catch (error) {
        appendDetailOutput(`Python Error: ${error.message}`, 'error');
    }
}

// Initialize Pyodide
async function initializePyodide() {
    const loadingIndicator = document.getElementById('loadingIndicator');

    try {
        loadingIndicator.classList.add('active');
        pyodide = await loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
        });

        pyodide.runPython(`
import sys
import io

class JSOutputStream:
    def __init__(self):
        self.content = []

    def write(self, text):
        if text and text.strip():
            self.content.append(text)

    def flush(self):
        pass

    def getvalue(self):
        return ''.join(self.content)

sys.stdout = JSOutputStream()
sys.stderr = JSOutputStream()
        `);

        pyodideLoaded = true;
    } catch (error) {
        console.error('Failed to load Pyodide:', error);
    } finally {
        loadingIndicator.classList.remove('active');
    }
}

// Clear output
function clearDetailOutput() {
    document.getElementById('detailOutput').innerHTML = '';
}

// Append output
function appendDetailOutput(message, type = 'log') {
    const output = document.getElementById('detailOutput');
    const line = document.createElement('div');
    line.className = `output-line ${type}`;
    line.textContent = message;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) {
        return date.toLocaleDateString();
    } else if (days > 0) {
        return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
        return 'Just now';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    initializeEditor();
    loadScriptDetails();

    // Event listeners
    document.getElementById('likeBtn').addEventListener('click', toggleLike);
    document.getElementById('runDetailCode').addEventListener('click', runDetailCode);
    document.getElementById('clearDetailOutput').addEventListener('click', clearDetailOutput);
    document.getElementById('commentForm').addEventListener('submit', handleComment);
});
