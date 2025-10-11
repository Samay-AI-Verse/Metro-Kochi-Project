    // Global state
    let currentTab = 'all';
    let notebooks = [];

    // --- Function to fetch notebooks from the backend ---
    async function fetchNotebooks() {
        try {
            // This is a placeholder for a real API call.
            const response = await fetch('/api/notebooks');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            notebooks = await response.json();
            renderNotebooks();
        } catch (error) {
            console.error("Could not fetch notebooks:", error);
        }
    }
    
    // --- Function to delete a notebook ---
    async function deleteNotebook(notebookId, event) {
    event.stopPropagation();
    if (!confirm('Are you sure you want to delete this notebook?')) {
        return;
    }
    try {
        const response = await fetch(`/api/notebooks/${notebookId}`, { method: 'DELETE' });
        if (response.status === 204) {
            notebooks = notebooks.filter(nb => nb.id !== notebookId);
            renderNotebooks();
            // NEW: Clear chat history for this notebook from localStorage
            localStorage.removeItem(`chat_${notebookId}`);
        } else {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to delete notebook');
        }
    } catch (error) {
        console.error('Error deleting notebook:', error);
        alert('Could not delete the notebook. Please try again.');
    }
}

    // Tab switching
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            currentTab = this.dataset.tab;
            updateView();
        });
    });

    // Update view based on current tab
    function updateView() {
        const featuredSection = document.getElementById('featured-section');
        const recentSection = document.querySelector('.recent-section');
        switch(currentTab) {
            case 'all':
                featuredSection.classList.remove('hidden');
                recentSection.classList.remove('hidden');
                break;
            case 'my':
                featuredSection.classList.add('hidden');
                recentSection.classList.remove('hidden');
                break;
            case 'featured':
                featuredSection.classList.remove('hidden');
                recentSection.classList.add('hidden');
                break;
        }
    }

    // Modal functions
   // Modal functions
function openCreateModal() {
    document.getElementById('createModal').style.display = 'flex'; // ✨ Changed from 'block' to 'flex'
    document.getElementById('notebookTitle').focus();
}

    function closeModal() {
        document.getElementById('createModal').style.display = 'none';
        document.getElementById('createForm').reset();
    }

    // --- Create notebook form submission ---
    document.getElementById('createForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const title = document.getElementById('notebookTitle').value;
        const newNotebook = {
            id: Date.now(),
            title: title,
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            sources: [] // CORRECTED: Changed 0 to an empty list []
        };
        try {
            const response = await fetch('/api/notebooks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newNotebook)
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const createdNotebook = await response.json();
            notebooks.unshift(createdNotebook);
            renderNotebooks();
            closeModal();
        } catch(error) {
            console.error("Could not create notebook:", error);
            alert("Failed to create notebook. Please check the console for details.");
        }
    });

    // Render notebooks
    function renderNotebooks() {
        const grid = document.getElementById('recent-grid');
        let html = `
            <div class="recent-card create-new-card" onclick="openCreateModal()">
                <div class="plus-icon">+</div>
                <h3 class="notebook-title">Create new notebook</h3>
            </div>
        `;
        notebooks.forEach(notebook => {
            html += `
                <div class="recent-card" onclick="window.location.href='/document/${notebook.id}'">
                    <button class="options-btn" onclick="deleteNotebook(${notebook.id}, event)">🗑</button>
                    <div class="notebook-icon">📝</div>
                    <h3 class="notebook-title">${notebook.title}</h3>
                    <div class="notebook-meta">
                        <span>${notebook.date}</span>
                        <span>•</span>
                        <span>${notebook.sources.length} source${notebook.sources.length !== 1 ? 's' : ''}</span>
                    </div>
                </div>
            `;
        });
        grid.innerHTML = html;
    }

    // Featured card interactions
    document.querySelectorAll('.featured-card').forEach(card => {
        card.addEventListener('click', function() {
            const title = this.querySelector('.featured-title').textContent;
            console.log(`Opening: ${title}`);
        });
    });

    // --- POP-UPS AND DROPDOWNS LOGIC ---
    const settingsBtn = document.getElementById('settingsBtn');
    const profileBtn = document.getElementById('profileBtn');
    const createModal = document.getElementById('createModal');
    const profilePopup = document.getElementById('profilePopup');
    const settingsDropdown = document.getElementById('settingsDropdown');

    settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        settingsDropdown.classList.toggle('show');
    });

    profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = profilePopup.style.display === 'none' || profilePopup.style.display === '';
        if (settingsDropdown) settingsDropdown.classList.remove('show');
        profilePopup.style.display = isHidden ? 'block' : 'none';
    });
    
    function closeAllPopups() {
        if (profilePopup) profilePopup.style.display = 'none';
        if (settingsDropdown) settingsDropdown.classList.remove('show');
        if (createModal) closeModal();
    }

    document.querySelectorAll('.close-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllPopups();
        });
    });

    window.addEventListener('click', function(e) {
        if (settingsDropdown && settingsDropdown.classList.contains('show') && !settingsBtn.contains(e.target) && !settingsDropdown.contains(e.target)) {
            settingsDropdown.classList.remove('show');
        }
        if (profilePopup && profilePopup.style.display === 'block' && !profileBtn.contains(e.target) && !profilePopup.contains(e.target)) {
            profilePopup.style.display = 'none';
        }
        if (e.target === createModal) {
            closeModal();
        }
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllPopups();
        }
    });

    // =================================================================
    // NEW THEME TOGGLE SCRIPT
    // =================================================================
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const body = document.body;

    const applySavedTheme = () => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            body.classList.add('dark-mode');
        } else {
            body.classList.remove('dark-mode');
        }
    };

    themeToggleBtn.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        if (body.classList.contains('dark-mode')) {
            localStorage.setItem('theme', 'dark');
        } else {
            localStorage.setItem('theme', 'light');
        }
    });

    // --- Initialize Page ---
    document.addEventListener('DOMContentLoaded', function() {
        fetchNotebooks(); // Original function call
        applySavedTheme(); // New function call for theme
    });
