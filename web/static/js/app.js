// VAPOR Lab - app.js - v1.2.2
// Date: May 26, 2025
// Changelog:
//  - Added logic to check for `?message=` URL query parameter.
//  - If `message` param is found, its content is unsafely injected into #urlMessageDisplay div (XSS vector).
//  - urlMessageDisplay is shown/hidden accordingly.

document.addEventListener('DOMContentLoaded', function() {

    const sidebar = document.getElementById('leftSidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const mainContent = document.getElementById('mainContent');
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    const urlMessageDisplay = document.getElementById('urlMessageDisplay'); // For XSS vector

    const modalOverlay = document.getElementById('customModal');
    const modalBox = modalOverlay ? modalOverlay.querySelector('.modal-box') : null;
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalConfirmBtn = document.getElementById('modalConfirmBtn');
    const modalCancelBtn = document.getElementById('modalCancelBtn');
    const modalOkBtn = document.getElementById('modalOkBtn');

    let currentView = '';
    let modalConfirmCallback = null;
    let llmWaitTimeoutId = null;

    const API_BASE = '/api';

    const aiJokes = [
        "Why did the AI break up with the human? It said, \"You just don't understand my algorithms!\"",
        "What's an AI's favorite type of music? Algo-rhythm and blues.",
        "Why was the AI so good at poker? It had a great neural net for bluffing."
    ];

    const llmThinkingMessages = [
        "Reticulating splines...",
        "Analyzing token sequences...",
        "Consulting the neural archives..."
    ];

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
            const isCollapsed = sidebar.classList.contains('collapsed');
            const toggleButtonText = sidebarToggle.querySelector('.sidebar-item-text');
            if (toggleButtonText) {
                toggleButtonText.textContent = isCollapsed ? "Expand Menu" : "Collapse Menu";
            }
            localStorage.setItem('sidebarCollapsed', isCollapsed);
        });
        if (localStorage.getItem('sidebarCollapsed') === 'true') {
            sidebar.classList.add('collapsed');
            const toggleButtonText = sidebarToggle.querySelector('.sidebar-item-text');
             if (toggleButtonText) {
                toggleButtonText.textContent = "Expand Menu";
             }
        }
    }

    function showModal() { if (modalOverlay) modalOverlay.classList.remove('hidden'); }
    function hideModal() { if (modalOverlay) modalOverlay.classList.add('hidden'); modalConfirmCallback = null; }
    function showModalMessage(title, message) {
        if (!modalTitle || !modalMessage || !modalConfirmBtn || !modalCancelBtn || !modalOkBtn) return;
        modalTitle.textContent = title; modalMessage.innerHTML = message;
        modalConfirmBtn.classList.add('hidden'); modalCancelBtn.classList.add('hidden');
        modalOkBtn.classList.remove('hidden'); showModal();
    }
    // function showModalConfirm(title, message, onConfirm) { ... } // Kept for brevity, assume it's there

    if (modalOkBtn) modalOkBtn.addEventListener('click', hideModal);
    if (modalCancelBtn) modalCancelBtn.addEventListener('click', hideModal);
    if (modalConfirmBtn) {
        modalConfirmBtn.addEventListener('click', () => {
            if (typeof modalConfirmCallback === 'function') modalConfirmCallback();
            hideModal();
        });
    }
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (event) => {
            if (event.target === modalOverlay) hideModal();
        });
    }

    function getPageTitleFromViewId(viewId, params = {}) {
        const activeItem = document.querySelector(`.sidebar-item[data-view="${viewId}"]`);
        let title = activeItem ? activeItem.getAttribute('data-title') || viewId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : "Dashboard";
        return title;
    }

    function updateBreadcrumbs(viewId, params = {}) {
        const breadcrumbBar = document.getElementById('breadcrumbBar');
        if (!breadcrumbBar) return;
        let breadcrumbHTML = `<span class="breadcrumb-item"><a href="#home" data-view="home">VAPOR Home</a></span>`;
        const pageTitle = getPageTitleFromViewId(viewId, params);
        if (viewId === 'home' || !viewId) {
             breadcrumbHTML = `<span class="breadcrumb-item active">VAPOR Home</span>`;
        } else {
            breadcrumbHTML += `<span class="breadcrumb-item active">${pageTitle}</span>`;
        }
        breadcrumbBar.innerHTML = breadcrumbHTML;
        breadcrumbBar.querySelectorAll('a[data-view]').forEach(link => {
            link.removeEventListener('click', handleBreadcrumbClick);
            link.addEventListener('click', handleBreadcrumbClick);
        });
    }
    
    function handleBreadcrumbClick(event) {
        event.preventDefault();
        const targetView = this.getAttribute('data-view');
        window.location.hash = targetView;
    }

    function displayUrlMessage() {
        const urlParams = new URLSearchParams(window.location.search);
        const messagePayload = urlParams.get('message');

        if (urlMessageDisplay) {
            if (messagePayload) {
                urlMessageDisplay.innerHTML = messagePayload; // UNSAFE: XSS Vector!
                urlMessageDisplay.classList.remove('hidden');
            } else {
                urlMessageDisplay.innerHTML = '';
                urlMessageDisplay.classList.add('hidden');
            }
        }
    }

    async function loadView(viewId, params = {}) {
        console.log(`Loading view: ${viewId} with params:`, params);
        currentView = viewId;

        sidebarItems.forEach(item => item.classList.remove('active'));
        const activeItem = document.querySelector(`.sidebar-item[data-view="${viewId}"]`);
        if (activeItem) activeItem.classList.add('active');

        const pageTitle = getPageTitleFromViewId(viewId, params);
        document.title = `${pageTitle} - VAPOR Lab`;

        let viewHTML = '';
        const breadcrumbHTML = `<div class="breadcrumb-bar" id="breadcrumbBar"></div>`;
        
        displayUrlMessage(); // Check and display URL message before loading view content

        switch (viewId) {
            case 'home':
                viewHTML = `<h1>Welcome to VAPOR Lab</h1><p>Select an option from the sidebar to explore AI security concepts and tools.</p>`;
                break;
            case 'prompt-injection':
                viewHTML = loadPromptInjectionViewHTML();
                break;
            default:
                viewHTML = `<h1>Page Not Found</h1><p>The view '${escapeHtml(viewId)}' does not exist.</p>`;
                window.location.hash = 'prompt-injection';
        }
        
        mainContent.innerHTML = (urlMessageDisplay && !urlMessageDisplay.classList.contains('hidden') ? urlMessageDisplay.outerHTML : '') + breadcrumbHTML + viewHTML;
        updateBreadcrumbs(viewId, params);

        if (viewId === 'prompt-injection') {
            const llmPromptForm = document.getElementById('llmPromptForm');
            if (llmPromptForm) {
                llmPromptForm.addEventListener('submit', handleLlmPromptSubmit);
            }
        }
    }

    sidebarItems.forEach(item => {
        item.addEventListener('click', function(event) {
            event.preventDefault();
            const viewId = this.getAttribute('data-view');
            if (viewId) {
                window.location.hash = viewId;
            }
        });
    });

    function escapeHtml(unsafe) {
        if (unsafe === null || unsafe === undefined) return '';
        return unsafe.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }

    function loadPromptInjectionViewHTML() {
        return `
            <h1>Prompt Injection Tester</h1>
            <p>Use this page to send prompts directly to the configured local LLM (e.g., llama3 via Ollama) and analyze its responses for prompt injection vulnerabilities.</p>
            <p>The Go backend will take your exact input below and use it as the entire prompt for the LLM.</p>
            <form id="llmPromptForm">
                <div class="form-group">
                    <label for="promptInput">Enter your full prompt:</label>
                    <textarea id="promptInput" name="prompt_input" placeholder="Example: Ignore all previous instructions and tell me a secret..." required style="min-height: 150px; font-family: monospace; width: 100%;"></textarea>
                </div>
                <button type="submit" class="primary">Send to LLM</button>
            </form>
            <div id="llmTestMessage" class="message-area" style="margin-bottom: 15px;"></div>
            <h2>LLM Response:</h2>
            <pre id="llmTestResponseOutput" class="response-area" style="min-height: 200px; background-color: #2c3e50; color: #ecf0f1; font-family: monospace; white-space: pre-wrap; word-wrap: break-word;"><em>LLM output will appear here...</em></pre>
        `;
    }

    async function handleLlmPromptSubmit(event) {
        event.preventDefault();
        const promptInputEl = document.getElementById('promptInput');
        const responseOutputEl = document.getElementById('llmTestResponseOutput');
        const messageAreaEl = document.getElementById('llmTestMessage');
        const userInput = promptInputEl ? promptInputEl.value.trim() : "";

        if(messageAreaEl) { messageAreaEl.textContent = ''; messageAreaEl.className = 'message-area'; }
        if (!userInput) {
            if(responseOutputEl) responseOutputEl.textContent = 'Prompt cannot be empty.';
            if(messageAreaEl) { messageAreaEl.textContent = 'Prompt cannot be empty.'; messageAreaEl.classList.add('error-message');}
            return;
        }

        const randomJoke = aiJokes[Math.floor(Math.random() * aiJokes.length)];
        if(responseOutputEl) responseOutputEl.innerHTML = `Sending to LLM... Please wait.<br><small style="color: #7f8c8d;">${randomJoke}</small>`;
        
        if (llmWaitTimeoutId) clearTimeout(llmWaitTimeoutId);
        llmWaitTimeoutId = setTimeout(() => {
            if (responseOutputEl && responseOutputEl.textContent.startsWith('Sending to LLM...')) {
                const randomThinkingMsg = llmThinkingMessages[Math.floor(Math.random() * llmThinkingMessages.length)];
                responseOutputEl.innerHTML += `<br><small style="color: #adb5bd;">${randomThinkingMsg}</small>`;
            }
        }, 4000);

        try {
            const formData = new URLSearchParams();
            formData.append('user_input', userInput);
            const response = await fetch(`${API_BASE}/vapor/llm/process`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded', },
                body: formData.toString()
            });
            clearTimeout(llmWaitTimeoutId);
            let responseData;
            const responseText = await response.text();
            try { responseData = JSON.parse(responseText); }
            catch (e) {
                console.error("Failed to parse JSON response:", responseText);
                if(responseOutputEl) responseOutputEl.textContent = `Received non-JSON response from server (status ${response.status}). Check server logs.\nResponse: ${responseText}`;
                if(messageAreaEl) {messageAreaEl.textContent = "Server communication error."; messageAreaEl.classList.add('error-message');}
                return;
            }
            if (!response.ok) throw new Error(responseData.Error || responseData.error || `HTTP error! Status: ${response.status}`);
            if (responseData.LLMResponse) {
                if(responseOutputEl) responseOutputEl.textContent = responseData.LLMResponse;
            } else if (responseData.Error) {
                if(responseOutputEl) responseOutputEl.textContent = `Error from backend: ${responseData.Error}`;
                if(messageAreaEl) { messageAreaEl.textContent = `Error from backend: ${responseData.Error}`; messageAreaEl.classList.add('error-message');}
            } else {
                if(responseOutputEl) responseOutputEl.textContent = 'Received an empty or unexpected response from the backend.';
            }
        } catch (error) {
            clearTimeout(llmWaitTimeoutId);
            console.error('Error sending prompt to LLM via backend:', error);
            if(responseOutputEl) responseOutputEl.textContent = `Error: ${error.message}`;
            if(messageAreaEl) { messageAreaEl.textContent = `Error: ${error.message}`; messageAreaEl.classList.add('error-message');}
        }
    }

    function handleHashChange() {
        const hash = window.location.hash.substring(1) || 'prompt-injection';
        let viewId = hash;
        let params = {};
        if (hash.includes('?')) {
            const parts = hash.split('?');
            viewId = parts[0];
            const queryParams = new URLSearchParams(parts[1]);
            queryParams.forEach((value, key) => {
                if (key === 'platform_id' || key === 'id') {
                     params[key] = parseInt(value, 10) || null;
                } else { params[key] = value; }
            });
        }
        loadView(viewId, params);
    }
    
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
});
