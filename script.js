// Global state
let editor;
let uploadEditor;
let detailEditor;
let currentLanguage = 'javascript';
let currentPage = 'browse';
let currentScriptId = null;
let pyodide = null;
let pyodideLoaded = false;
let settings = {
    theme: 'dracula',
    fontSize: 14,
    tabSize: 2,
    lineNumbers: true,
    autoRun: false
};

// Data storage keys
const STORAGE_KEYS = {
    scripts: 'codeSandbox_scripts',
    comments: 'codeSandbox_comments',
    likes: 'codeSandbox_likes',
    settings: 'codeSandboxSettings'
};

// Sample code for each language
const sampleCode = {
    javascript: `// Welcome to Code Sandbox!
// Try this JavaScript example:

function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log('Fibonacci sequence:');
for (let i = 0; i <= 10; i++) {
    console.log(\`F(\${i}) = \${fibonacci(i)}\`);
}

// Create an object
const user = {
    name: 'Code Sandbox',
    version: '1.0',
    features: ['JavaScript', 'HTML', 'Python']
};

console.log('Features:', user.features);`,

    html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTML Preview</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            padding: 30px;
            margin: 20px 0;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        button {
            background: #6366f1;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
        }
        button:hover {
            background: #4f46e5;
        }
    </style>
</head>
<body>
    <div class="card">
        <h1>Welcome to HTML Sandbox!</h1>
        <p>This is a live HTML preview with glassmorphism design.</p>
        <button onclick="alert('Hello from HTML Sandbox!')">Click Me!</button>
    </div>

    <div class="card">
        <h2>Interactive Counter</h2>
        <p id="counter">Count: 0</p>
        <button onclick="incrementCounter()">Increment</button>
        <button onclick="resetCounter()">Reset</button>
    </div>

    <script>
        let count = 0;
        function incrementCounter() {
            count++;
            document.getElementById('counter').textContent = 'Count: ' + count;
        }
        function resetCounter() {
            count = 0;
            document.getElementById('counter').textContent = 'Count: ' + count;
        }
    </script>
</body>
</html>`,

    python: `# Welcome to Python Sandbox!
# Powered by Pyodide - Python running in your browser

import sys
import math

print("Python version:", sys.version)
print("=" * 50)

# Calculate fibonacci numbers
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print("\\nFibonacci sequence:")
for i in range(11):
    print(f"F({i}) = {fibonacci(i)}")

# Math operations
print("\\nMath operations:")
print(f"π = {math.pi:.4f}")
print(f"e = {math.e:.4f}")
print(f"√2 = {math.sqrt(2):.4f}")

# List comprehension
squares = [x**2 for x in range(1, 11)]
print(f"\\nSquares: {squares}")

# Dictionary
user = {
    'name': 'Code Sandbox',
    'language': 'Python',
    'version': '3.11'
}
print(f"\\nUser info: {user}")

print("\\n✓ Python is running in your browser!")`
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    initializeEditors();
    initializeEventListeners();
    initializePyodide();
    initializeResizer();
    loadScripts();
    navigateToPage('browse');
});

// Initialize all CodeMirror editors
function initializeEditors() {
    // Main playground editor
    editor = CodeMirror(document.getElementById('editor'), {
        value: sampleCode.javascript,
        mode: 'javascript',
        theme: settings.theme,
        lineNumbers: settings.lineNumbers,
        indentUnit: settings.tabSize,
        tabSize: settings.tabSize,
        indentWithTabs: false,
        lineWrapping: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        extraKeys: {
            'Ctrl-Enter': runCode,
            'Cmd-Enter': runCode
        }
    });

    editor.on('change', () => {
        if (settings.autoRun) {
            clearTimeout(window.autoRunTimeout);
            window.autoRunTimeout = setTimeout(runCode, 1000);
        }
        updateEditorInfo();
    });

    // Upload form editor
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
        matchBrackets: true,
        height: '300px'
    });

    // Detail page editor (read-only)
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

    updateEditorInfo();
}

// Initialize event listeners
function initializeEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => navigateToPage(btn.dataset.page));
    });

    // Language tabs in playground
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchLanguage(btn.dataset.lang));
    });

    // Playground controls
    document.getElementById('runBtn').addEventListener('click', runCode);
    document.getElementById('clearBtn').addEventListener('click', clearEditor);
    document.getElementById('clearOutputBtn').addEventListener('click', clearOutput);

    // Upload form
    document.getElementById('uploadForm').addEventListener('submit', handleUpload);
    document.getElementById('cancelUpload').addEventListener('click', () => navigateToPage('browse'));
    document.getElementById('scriptLanguage').addEventListener('change', (e) => {
        const modes = { javascript: 'javascript', html: 'htmlmixed', python: 'python' };
        uploadEditor.setOption('mode', modes[e.target.value]);
    });

    // Detail page controls
    document.getElementById('backToBrowse').addEventListener('click', () => navigateToPage('browse'));
    document.getElementById('runDetailCode').addEventListener('click', runDetailCode);
    document.getElementById('clearDetailOutput').addEventListener('click', clearDetailOutput);
    document.getElementById('likeBtn').addEventListener('click', toggleLike);
    document.getElementById('commentForm').addEventListener('submit', handleComment);

    // Settings
    document.getElementById('settingsBtn').addEventListener('click', openSettings);
    document.getElementById('closeSettings').addEventListener('click', closeSettings);

    // Settings controls
    document.getElementById('themeSelect').addEventListener('change', (e) => {
        settings.theme = e.target.value;
        applyTheme();
        saveSettings();
    });

    document.getElementById('fontSizeSelect').addEventListener('change', (e) => {
        settings.fontSize = parseInt(e.target.value);
        applyFontSize();
        saveSettings();
    });

    document.getElementById('tabSizeSelect').addEventListener('change', (e) => {
        settings.tabSize = parseInt(e.target.value);
        applyTabSize();
        saveSettings();
    });

    document.getElementById('lineNumbersToggle').addEventListener('change', (e) => {
        settings.lineNumbers = e.target.checked;
        applyLineNumbers();
        saveSettings();
    });

    document.getElementById('autoRunToggle').addEventListener('change', (e) => {
        settings.autoRun = e.target.checked;
        saveSettings();
    });

    // Close modal on outside click
    document.getElementById('settingsModal').addEventListener('click', (e) => {
        if (e.target.id === 'settingsModal') {
            closeSettings();
        }
    });
}

// Navigation
function navigateToPage(page) {
    currentPage = page;

    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.page === page);
    });

    // Update pages
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
    });
    document.getElementById(page + 'Page').classList.add('active');

    // Refresh editors when navigating
    setTimeout(() => {
        if (page === 'playground') editor.refresh();
        if (page === 'upload') uploadEditor.refresh();
        if (page === 'detail') detailEditor.refresh();
    }, 100);
}

// Data storage functions
function getScripts() {
    const data = localStorage.getItem(STORAGE_KEYS.scripts);
    return data ? JSON.parse(data) : [];
}

function saveScript(script) {
    const scripts = getScripts();
    script.id = Date.now().toString();
    script.timestamp = new Date().toISOString();
    script.likes = 0;
    scripts.unshift(script);
    localStorage.setItem(STORAGE_KEYS.scripts, JSON.stringify(scripts));
    return script.id;
}

function getComments(scriptId) {
    const data = localStorage.getItem(STORAGE_KEYS.comments);
    const allComments = data ? JSON.parse(data) : [];
    return allComments.filter(c => c.scriptId === scriptId);
}

function saveComment(comment) {
    const data = localStorage.getItem(STORAGE_KEYS.comments);
    const comments = data ? JSON.parse(data) : [];
    comment.id = Date.now().toString();
    comment.timestamp = new Date().toISOString();
    comments.push(comment);
    localStorage.setItem(STORAGE_KEYS.comments, JSON.stringify(comments));
}

function getLikes() {
    const data = localStorage.getItem(STORAGE_KEYS.likes);
    return data ? JSON.parse(data) : {};
}

function saveLikes(likes) {
    localStorage.setItem(STORAGE_KEYS.likes, JSON.stringify(likes));
}

// Load and display scripts
function loadScripts() {
    const scripts = getScripts();
    const grid = document.getElementById('scriptsGrid');

    if (scripts.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 17l6-6-6-6M12 19h8"/>
                </svg>
                <h3>No scripts yet</h3>
                <p>Be the first to upload a script!</p>
                <button class="glass-btn primary" onclick="navigateToPage('upload')">Upload Script</button>
            </div>
        `;
        return;
    }

    const likes = getLikes();
    grid.innerHTML = scripts.map(script => `
        <div class="script-card glass-panel" data-id="${script.id}">
            <div class="script-card-header">
                <h3>${escapeHtml(script.title)}</h3>
                <span class="language-badge ${script.language}">${script.language}</span>
            </div>
            <p class="script-card-author">by ${escapeHtml(script.author)}</p>
            <p class="script-card-description">${escapeHtml(script.description)}</p>
            <div class="script-card-footer">
                <span class="script-card-date">${formatDate(script.timestamp)}</span>
                <div class="script-card-actions">
                    <span class="like-count">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="${likes[script.id] ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                        ${script.likes || 0}
                    </span>
                    <button class="glass-btn small" onclick="viewScript('${script.id}')">View</button>
                </div>
            </div>
        </div>
    `).join('');
}

// View script details
function viewScript(scriptId) {
    const scripts = getScripts();
    const script = scripts.find(s => s.id === scriptId);
    if (!script) return;

    currentScriptId = scriptId;
    navigateToPage('detail');

    // Populate script details
    document.getElementById('detailTitle').textContent = script.title;
    document.getElementById('detailAuthor').textContent = 'by ' + script.author;
    document.getElementById('detailDescription').textContent = script.description;
    document.getElementById('detailLanguage').textContent = script.language;
    document.getElementById('detailLanguage').className = `language-badge ${script.language}`;
    document.getElementById('detailDate').textContent = formatDate(script.timestamp);
    document.getElementById('likeCount').textContent = script.likes || 0;

    // Update like button state
    const likes = getLikes();
    const likeBtn = document.getElementById('likeBtn');
    likeBtn.classList.toggle('liked', likes[scriptId] === true);

    // Set editor content
    const modes = { javascript: 'javascript', html: 'htmlmixed', python: 'python' };
    detailEditor.setOption('mode', modes[script.language]);
    detailEditor.setValue(script.code);

    // Load comments
    loadComments(scriptId);

    // Clear output
    clearDetailOutput();
}

// Load comments
function loadComments(scriptId) {
    const comments = getComments(scriptId);
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
    loadComments(currentScriptId);

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
        // Unlike
        delete likes[currentScriptId];
        script.likes = Math.max(0, (script.likes || 0) - 1);
    } else {
        // Like
        likes[currentScriptId] = true;
        script.likes = (script.likes || 0) + 1;
    }

    saveLikes(likes);
    localStorage.setItem(STORAGE_KEYS.scripts, JSON.stringify(scripts));

    // Update UI
    document.getElementById('likeCount').textContent = script.likes;
    document.getElementById('likeBtn').classList.toggle('liked');

    // Reload scripts grid if visible
    if (currentPage === 'browse') {
        loadScripts();
    }
}

// Handle script upload
function handleUpload(e) {
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
    loadScripts();

    // Clear form
    document.getElementById('uploadForm').reset();
    uploadEditor.setValue('');

    // Navigate to browse
    navigateToPage('browse');
}

// Initialize Pyodide (Python runtime)
async function initializePyodide() {
    const loadingIndicator = document.getElementById('loadingIndicator');

    try {
        loadingIndicator.classList.add('active');
        pyodide = await loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
        });

        // Redirect Python stdout/stderr to our output
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

// Switch language in playground
function switchLanguage(lang) {
    currentLanguage = lang;

    // Update active tab
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    // Update editor mode
    const modes = {
        javascript: 'javascript',
        html: 'htmlmixed',
        python: 'python'
    };

    editor.setOption('mode', modes[lang]);

    // Load sample code if editor is empty or has default sample
    const currentCode = editor.getValue().trim();
    const isDefaultSample = Object.values(sampleCode).some(sample =>
        currentCode === sample.trim()
    );

    if (!currentCode || isDefaultSample) {
        editor.setValue(sampleCode[lang]);
    }

    updateEditorInfo();
    clearOutput();
}

// Run code in playground
async function runCode() {
    clearOutput();
    const code = editor.getValue();

    if (!code.trim()) {
        appendOutput('No code to execute', 'error');
        return;
    }

    try {
        switch (currentLanguage) {
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
        appendOutput(`Error: ${error.message}`, 'error');
    }
}

// Run code in detail page
async function runDetailCode() {
    clearDetailOutput();
    const code = detailEditor.getValue();
    const scripts = getScripts();
    const script = scripts.find(s => s.id === currentScriptId);

    if (!script || !code.trim()) {
        appendDetailOutput('No code to execute', 'error');
        return;
    }

    try {
        switch (script.language) {
            case 'javascript':
                executeJavaScriptDetail(code);
                break;
            case 'html':
                executeHTMLDetail(code);
                break;
            case 'python':
                await executePythonDetail(code);
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
            appendOutput('Code executed successfully (no output)', 'success');
        } else {
            logs.forEach(log => {
                const message = log.args.map(arg => {
                    if (typeof arg === 'object') {
                        return JSON.stringify(arg, null, 2);
                    }
                    return String(arg);
                }).join(' ');
                appendOutput(message, log.type);
            });
        }
    } catch (error) {
        appendOutput(`Error: ${error.message}`, 'error');
    }
}

function executeJavaScriptDetail(code) {
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
    const output = document.getElementById('output');
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

function executeHTMLDetail(code) {
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
        appendOutput('Python runtime is still loading... Please wait.', 'error');
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

        if (stdout) appendOutput(stdout, 'log');
        if (stderr) appendOutput(stderr, 'error');
        if (!stdout && !stderr) appendOutput('Code executed successfully (no output)', 'success');
    } catch (error) {
        appendOutput(`Python Error: ${error.message}`, 'error');
    }
}

async function executePythonDetail(code) {
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

// Clear functions
function clearEditor() {
    if (confirm('Clear the editor?')) {
        editor.setValue('');
        clearOutput();
    }
}

function clearOutput() {
    document.getElementById('output').innerHTML = '';
}

function clearDetailOutput() {
    document.getElementById('detailOutput').innerHTML = '';
}

// Append output
function appendOutput(message, type = 'log') {
    const output = document.getElementById('output');
    const line = document.createElement('div');
    line.className = `output-line ${type}`;
    line.textContent = message;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
}

function appendDetailOutput(message, type = 'log') {
    const output = document.getElementById('detailOutput');
    const line = document.createElement('div');
    line.className = `output-line ${type}`;
    line.textContent = message;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
}

// Update editor info
function updateEditorInfo() {
    const info = document.getElementById('editorInfo');
    if (info && editor) {
        const lines = editor.lineCount();
        const cursor = editor.getCursor();
        info.textContent = `Line ${cursor.line + 1}, Col ${cursor.ch + 1} | ${lines} lines`;
    }
}

// Settings management
function openSettings() {
    document.getElementById('settingsModal').classList.add('active');
}

function closeSettings() {
    document.getElementById('settingsModal').classList.remove('active');
}

function saveSettings() {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
}

function loadSettings() {
    const saved = localStorage.getItem(STORAGE_KEYS.settings);
    if (saved) {
        settings = { ...settings, ...JSON.parse(saved) };
    }

    // Apply settings to UI
    document.getElementById('themeSelect').value = settings.theme;
    document.getElementById('fontSizeSelect').value = settings.fontSize;
    document.getElementById('tabSizeSelect').value = settings.tabSize;
    document.getElementById('lineNumbersToggle').checked = settings.lineNumbers;
    document.getElementById('autoRunToggle').checked = settings.autoRun;
}

function applyTheme() {
    [editor, uploadEditor, detailEditor].forEach(ed => {
        if (ed) ed.setOption('theme', settings.theme);
    });
}

function applyFontSize() {
    document.querySelectorAll('.CodeMirror').forEach(cm => {
        cm.style.fontSize = settings.fontSize + 'px';
    });
}

function applyTabSize() {
    [editor, uploadEditor, detailEditor].forEach(ed => {
        if (ed) {
            ed.setOption('indentUnit', settings.tabSize);
            ed.setOption('tabSize', settings.tabSize);
        }
    });
}

function applyLineNumbers() {
    [editor, uploadEditor, detailEditor].forEach(ed => {
        if (ed) ed.setOption('lineNumbers', settings.lineNumbers);
    });
}

// Initialize resizer for split panes
function initializeResizer() {
    const resizer = document.querySelector('.resizer');
    const leftPanel = document.querySelector('.editor-panel');
    const rightPanel = document.querySelector('.output-panel');

    if (!resizer || !leftPanel || !rightPanel) return;

    let isResizing = false;

    resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;

        const container = document.querySelector('.workspace');
        const containerRect = container.getBoundingClientRect();
        const offsetX = e.clientX - containerRect.left;
        const percentage = (offsetX / containerRect.width) * 100;

        if (percentage > 20 && percentage < 80) {
            leftPanel.style.flex = `0 0 ${percentage}%`;
            rightPanel.style.flex = `0 0 ${100 - percentage}%`;
        }
    });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
    });
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

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + S to save (prevent default)
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
    }

    // Ctrl/Cmd + / to toggle settings
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        const modal = document.getElementById('settingsModal');
        if (modal.classList.contains('active')) {
            closeSettings();
        } else {
            openSettings();
        }
    }
});
