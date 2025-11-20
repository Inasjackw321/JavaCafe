# Code Sandbox - Browser-Based Code Playground

A professional, browser-based code sandbox featuring a stunning **liquid glass (glassmorphism) UI** where you can experiment with JavaScript, HTML, and Python directly in your browser.

![Code Sandbox](https://img.shields.io/badge/Version-1.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

### Multi-Language Support
- **JavaScript**: Execute JavaScript code with a sandboxed console
- **HTML**: Live preview of HTML/CSS with interactive elements
- **Python**: Run Python code in the browser using Pyodide (WebAssembly)

### Professional Glassmorphism UI
- Beautiful liquid glass design with frosted glass effects
- Animated gradient background with floating orbs
- Smooth transitions and professional aesthetics
- Fully responsive design for all screen sizes

### Code Editor
- Syntax highlighting powered by CodeMirror
- Multiple theme support (Dracula, Monokai, Material, Default)
- Line numbers and bracket matching
- Keyboard shortcuts (Ctrl/Cmd + Enter to run code)
- Auto-completion and smart indentation

### Settings & Customization
- **Editor Themes**: Choose from multiple color schemes
- **Font Size**: Adjust editor font size (12px - 20px)
- **Tab Size**: Configure indentation (2, 4, or 8 spaces)
- **Line Numbers**: Toggle line number display
- **Auto-run**: Automatically execute code on changes

### Advanced Features
- Split-pane layout with resizable panels
- Console output capture for all languages
- Error handling and display
- Sample code for each language
- Settings persistence using LocalStorage
- Keyboard shortcuts for productivity

## Getting Started

### Simple Usage
1. Open `index.html` in your web browser
2. Select a language (JavaScript, HTML, or Python)
3. Write or modify the sample code
4. Click "Run Code" or press `Ctrl/Cmd + Enter`
5. View the output in the right panel

### Using a Local Server (Recommended)

For the best experience, especially with HTML preview:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Enter` | Run code |
| `Ctrl/Cmd + /` | Toggle settings |
| `Ctrl/Cmd + S` | (Disabled to prevent browser save dialog) |

## Supported Languages

### JavaScript
Execute JavaScript code with full ES6+ support. Console methods (`console.log`, `console.error`, etc.) are captured and displayed in the output panel.

```javascript
console.log('Hello, World!');

const greet = (name) => `Hello, ${name}!`;
console.log(greet('Code Sandbox'));
```

### HTML
Create interactive HTML pages with CSS and JavaScript. The HTML is rendered in a sandboxed iframe for safety.

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        button { padding: 10px 20px; }
    </style>
</head>
<body>
    <button onclick="alert('Hello!')">Click Me</button>
</body>
</html>
```

### Python
Run Python code using Pyodide, which compiles Python to WebAssembly. Most standard library modules are supported.

```python
import math

def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print(f"Fibonacci(10) = {fibonacci(10)}")
print(f"π = {math.pi:.4f}")
```

## Technology Stack

- **CodeMirror**: Advanced code editor component
- **Pyodide**: Python runtime in WebAssembly
- **Vanilla JavaScript**: No framework dependencies
- **CSS3**: Advanced glassmorphism effects with backdrop-filter
- **HTML5**: Modern web standards

## Browser Compatibility

- Chrome/Edge 76+ (recommended)
- Firefox 70+
- Safari 14+

**Note**: The glassmorphism effects require modern browsers with `backdrop-filter` support.

## File Structure

```
Javascript-Playground/
├── index.html          # Main HTML structure
├── styles.css          # Glassmorphism UI styles
├── script.js           # Application logic
└── README.md          # Documentation
```

## Features in Detail

### Glassmorphism Design
The UI features a modern glassmorphism design with:
- Semi-transparent panels with backdrop blur
- Subtle borders and shadows
- Animated gradient background
- Smooth hover effects and transitions

### Code Execution
- **JavaScript**: Runs in a sandboxed environment with console capture
- **HTML**: Rendered in an isolated iframe
- **Python**: Executed via Pyodide with stdout/stderr capture

### Settings Persistence
All settings are saved to browser LocalStorage:
- Editor theme preference
- Font size
- Tab size
- Line numbers visibility
- Auto-run preference

## Performance Notes

- **Python Runtime**: Pyodide takes a few seconds to load on first use (3-5 seconds)
- **HTML Preview**: Renders instantly in an iframe
- **JavaScript**: Executes immediately with minimal overhead

## Security

- JavaScript code runs in a sandboxed environment
- HTML is rendered in an isolated iframe
- Python code runs in WebAssembly sandbox
- No server-side code execution

## Future Enhancements

Potential features for future versions:
- Code sharing with URL parameters
- Save/load code snippets
- More language support (TypeScript, JSON, Markdown)
- Code formatting/beautification
- Download code as files
- Themes for the UI (not just editor)
- Collaborative editing

## Contributing

Feel free to submit issues or pull requests to improve the Code Sandbox!

## License

MIT License - feel free to use this project for any purpose.

## Author

Built with passion for learning and experimentation.

---

**Enjoy coding in your beautiful glass sandbox!**
