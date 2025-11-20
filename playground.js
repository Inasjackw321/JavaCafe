// Global state
let editor;
let currentLanguage = 'javascript';
let pyodide = null;
let pyodideLoaded = false;
let settings = {
    theme: 'dracula',
    fontSize: 14,
    tabSize: 2,
    lineNumbers: true,
    autoRun: false
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
    initializeEditor();
    initializeEventListeners();
    initializePyodide();
    initializeResizer();
});

// Initialize CodeMirror editor
function initializeEditor() {
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

    updateEditorInfo();
}

// Initialize event listeners
function initializeEventListeners() {
    // Language tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchLanguage(btn.dataset.lang));
    });

    // Control buttons
    document.getElementById('runBtn').addEventListener('click', runCode);
    document.getElementById('saveBtn').addEventListener('click', openSaveModal);
    document.getElementById('clearBtn').addEventListener('click', clearEditor);
    document.getElementById('clearOutputBtn').addEventListener('click', clearOutput);
    document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreen);

    // Settings
    document.getElementById('settingsBtn').addEventListener('click', openSettings);
    document.getElementById('closeSettings').addEventListener('click', closeSettings);

    // Save modal
    document.getElementById('closeSave').addEventListener('click', closeSaveModal);
    document.getElementById('saveForm').addEventListener('submit', handleSave);

    // Settings controls
    document.getElementById('themeSelect').addEventListener('change', (e) => {
        settings.theme = e.target.value;
        editor.setOption('theme', settings.theme);
        saveSettings();
    });

    document.getElementById('fontSizeSelect').addEventListener('change', (e) => {
        settings.fontSize = parseInt(e.target.value);
        document.querySelector('.CodeMirror').style.fontSize = settings.fontSize + 'px';
        saveSettings();
    });

    document.getElementById('tabSizeSelect').addEventListener('change', (e) => {
        settings.tabSize = parseInt(e.target.value);
        editor.setOption('indentUnit', settings.tabSize);
        editor.setOption('tabSize', settings.tabSize);
        saveSettings();
    });

    document.getElementById('lineNumbersToggle').addEventListener('change', (e) => {
        settings.lineNumbers = e.target.checked;
        editor.setOption('lineNumbers', settings.lineNumbers);
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

    document.getElementById('saveModal').addEventListener('click', (e) => {
        if (e.target.id === 'saveModal') {
            closeSaveModal();
        }
    });
}

// Initialize Pyodide (Python runtime)
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

// Switch language
function switchLanguage(lang) {
    currentLanguage = lang;

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    const modes = {
        javascript: 'javascript',
        html: 'htmlmixed',
        python: 'python'
    };

    editor.setOption('mode', modes[lang]);

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

// Run code
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

// Clear editor
function clearEditor() {
    if (confirm('Clear the editor?')) {
        editor.setValue('');
        clearOutput();
    }
}

// Clear output
function clearOutput() {
    document.getElementById('output').innerHTML = '';
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
    localStorage.setItem('codeSandboxSettings', JSON.stringify(settings));
}

function loadSettings() {
    const saved = localStorage.getItem('codeSandboxSettings');
    if (saved) {
        settings = { ...settings, ...JSON.parse(saved) };
    }

    document.getElementById('themeSelect').value = settings.theme;
    document.getElementById('fontSizeSelect').value = settings.fontSize;
    document.getElementById('tabSizeSelect').value = settings.tabSize;
    document.getElementById('lineNumbersToggle').checked = settings.lineNumbers;
    document.getElementById('autoRunToggle').checked = settings.autoRun;
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

// Save modal functions
function openSaveModal() {
    const code = editor.getValue().trim();
    if (!code) {
        alert('Please write some code before saving!');
        return;
    }
    document.getElementById('saveModal').classList.add('active');
}

function closeSaveModal() {
    document.getElementById('saveModal').classList.remove('active');
}

function handleSave(e) {
    e.preventDefault();

    const title = document.getElementById('saveTitle').value.trim();
    const author = document.getElementById('saveAuthor').value.trim();
    const description = document.getElementById('saveDescription').value.trim();
    const code = editor.getValue();

    if (!title || !author || !description || !code) {
        alert('Please fill in all fields');
        return;
    }

    // Save script to localStorage
    const script = {
        id: Date.now().toString(),
        title,
        author,
        description,
        language: currentLanguage,
        code,
        timestamp: new Date().toISOString(),
        likes: 0
    };

    const scripts = getScripts();
    scripts.unshift(script);
    localStorage.setItem('codeSandbox_scripts', JSON.stringify(scripts));

    // Redirect to detail page
    window.location.href = `detail.html?id=${script.id}`;
}

function getScripts() {
    const data = localStorage.getItem('codeSandbox_scripts');
    return data ? JSON.parse(data) : [];
}

// Fullscreen functionality
function toggleFullscreen() {
    const editorPanel = document.getElementById('editorPanel');
    editorPanel.classList.toggle('fullscreen');

    // Update button icon
    const btn = document.getElementById('fullscreenBtn');
    if (editorPanel.classList.contains('fullscreen')) {
        btn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
            </svg>
        `;
        btn.title = 'Exit Fullscreen';
    } else {
        btn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
            </svg>
        `;
        btn.title = 'Toggle Fullscreen';
    }

    // Refresh editor after transition
    setTimeout(() => {
        editor.refresh();
    }, 300);
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        openSaveModal();
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

    // F11 to toggle fullscreen
    if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
    }

    // ESC to exit fullscreen
    if (e.key === 'Escape') {
        const editorPanel = document.getElementById('editorPanel');
        if (editorPanel.classList.contains('fullscreen')) {
            toggleFullscreen();
        }
    }
});
