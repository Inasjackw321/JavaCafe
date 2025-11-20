// Data storage keys
const STORAGE_KEYS = {
    scripts: 'codeSandbox_scripts',
    likes: 'codeSandbox_likes'
};

// Get scripts from localStorage
function getScripts() {
    const data = localStorage.getItem(STORAGE_KEYS.scripts);
    return data ? JSON.parse(data) : [];
}

// Get likes from localStorage
function getLikes() {
    const data = localStorage.getItem(STORAGE_KEYS.likes);
    return data ? JSON.parse(data) : {};
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
                <a href="upload.html" class="glass-btn primary">Upload Script</a>
            </div>
        `;
        return;
    }

    const likes = getLikes();
    grid.innerHTML = scripts.map(script => `
        <div class="script-card glass-panel" onclick="viewScript('${script.id}')">
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
                </div>
            </div>
        </div>
    `).join('');
}

// View script - navigate to detail page
function viewScript(scriptId) {
    window.location.href = `detail.html?id=${scriptId}`;
}

// Utility: Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Utility: Format date
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
document.addEventListener('DOMContentLoaded', loadScripts);
