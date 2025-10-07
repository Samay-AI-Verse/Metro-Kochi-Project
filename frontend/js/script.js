// Global variables
let uploadedFiles = []; // Will now store objects with a 'selected' state
let sourceCount = 0;
let chatActive = false;

// Demo messages for AI chat
const demoMessages = [
    {
        type: 'ai',
        content: `Hello there! 

The documents I have consist of excerpts from a curriculum detailing courses offered under the CHOICE BASED CREDIT & SEMESTER SYSTEM - 2019. These documents outline the structure for various degree programs, primarily focusing on common courses. 

Would you like me to summarize the key structure, explain specific courses, or help you understand the credit system?`
    }
];

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    updateUI();
});


// --- SETUP ALL EVENT LISTENERS ---
function setupEventListeners() {
    // Modal open/close triggers
    const addSourceBtn = document.getElementById('addSourceBtn');
    const uploadBtn = document.querySelector('.upload-btn'); // From welcome state
    const closeModalBtn = document.querySelector('.close-btn');
    const modal = document.getElementById('uploadModal');
    
    if (addSourceBtn) addSourceBtn.addEventListener('click', openUploadModal);
    if (uploadBtn) uploadBtn.addEventListener('click', openUploadModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeUploadModal);
    
    // Close modal when clicking on the overlay
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeUploadModal();
        });
    }

    // Chat input and send button
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey && !this.disabled) {
                e.preventDefault();
                sendMessage();
            }
        });
        chatInput.addEventListener('input', autoResizeTextarea);
    }
    if (sendBtn) sendBtn.addEventListener('click', sendMessage);

    // Studio Tool Cards
    document.querySelectorAll('.tool-card').forEach(card => {
        card.addEventListener('click', function() {
            const toolName = this.querySelector('.tool-name').textContent;
            createTool(toolName);
        });
    });

    // Modal Upload Zone
    const modalUploadZone = document.getElementById('modalUploadZone');
    if (modalUploadZone) {
        modalUploadZone.addEventListener('click', openFileDialog);
        modalUploadZone.addEventListener('drop', handleModalDrop);
        modalUploadZone.addEventListener('dragover', handleModalDragOver);
        modalUploadZone.addEventListener('dragleave', handleModalDragLeave);
    }

    // File input change handler
    const fileInput = document.getElementById('fileInput');
    if(fileInput) fileInput.addEventListener('change', handleFileSelect);

    // Add Note button in Studio
    const addNoteBtn = document.querySelector('.add-note-btn');
    if(addNoteBtn) addNoteBtn.addEventListener('click', saveNote);

    // Chat refresh button (placeholder function)
    const refreshChatBtn = document.querySelector('.chat-header-btn');
    if(refreshChatBtn) refreshChatBtn.addEventListener('click', refreshChat);

    // ✨ --- NEW: Event Listeners for Source Selection --- ✨
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const uploadedFilesList = document.getElementById('uploaded-files');

    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', handleSelectAll);
    }
    if (uploadedFilesList) {
        // Use event delegation for individual checkboxes
        uploadedFilesList.addEventListener('change', (event) => {
            if (event.target.classList.contains('file-checkbox')) {
                const fileId = event.target.dataset.fileId;
                const file = uploadedFiles.find(f => f.id == fileId);
                if (file) {
                    file.selected = event.target.checked;
                }
                updateSelectAllCheckboxState();
            }
        });
    }
}

// --- FILE HANDLING ---

function addFile(file) {
    const fileId = Date.now() + Math.random();
    const fileObj = {
        id: fileId,
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type,
        file: file,
        selected: true // ✨ NEW: Default to selected
    };
    
    uploadedFiles.push(fileObj);
    sourceCount++;
    renderUploadedFiles(); // ✨ CHANGED: Call the new render function
    
    if (sourceCount === 1) {
        activateChat();
    }
}

// ✨ --- NEW: Central function to render the entire file list --- ✨
function renderUploadedFiles() {
    const uploadedFilesList = document.getElementById('uploaded-files');
    const emptyState = document.getElementById('empty-state');
    const uploadedFilesContainer = document.getElementById('uploaded-files-container');
    
    if (!uploadedFilesList || !emptyState || !uploadedFilesContainer) return;

    // Clear the current list
    uploadedFilesList.innerHTML = '';

    if (uploadedFiles.length === 0) {
        emptyState.classList.remove('hidden');
        uploadedFilesContainer.classList.add('hidden');
    } else {
        emptyState.classList.add('hidden');
        uploadedFilesContainer.classList.remove('hidden');

        uploadedFiles.forEach(fileObj => {
            const { iconClass, typeClass } = getFileIconDetails(fileObj.name);

            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.dataset.fileId = fileObj.id;
            
            fileItem.innerHTML = `
                <div class="file-info">
                    <p>my </p>
                    <div class="file-icon ${typeClass}">
                        <i class="${iconClass}"></i>
                    </div>
                    <span class="file-name">${fileObj.name}</span>
                </div>
                <div class="file-actions">
                    <label class="checkbox-container">
                        <input type="checkbox" class="file-checkbox" data-file-id="${fileObj.id}" ${fileObj.selected ? 'checked' : ''}>
                        <span class="checkmark"></span>
                    </label>
                </div>
            `;
            uploadedFilesList.appendChild(fileItem);
        });
    }
    updateSelectAllCheckboxState();
}

function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    files.forEach(file => addFile(file));
    closeUploadModal();
}

// ✨ --- NEW: Functions to handle checkbox logic --- ✨
function handleSelectAll(event) {
    const isChecked = event.target.checked;
    uploadedFiles.forEach(file => file.selected = isChecked);
    renderUploadedFiles(); // Re-render to update all checkboxes
}

function updateSelectAllCheckboxState() {
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    if (!selectAllCheckbox) return;

    const totalFiles = uploadedFiles.length;
    const selectedFiles = uploadedFiles.filter(file => file.selected).length;

    if (totalFiles === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
        return;
    }
    
    if (selectedFiles === totalFiles) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
    } else if (selectedFiles > 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
    } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    }
}


// --- MODAL AND DIALOGS (No changes from here) ---

function openUploadModal() {
    const modal = document.getElementById('uploadModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.addEventListener('keydown', handleEscapeKey);
    }
}

function closeUploadModal() {
    const modal = document.getElementById('uploadModal');
    if (modal) {
        modal.classList.add('hidden');
        document.removeEventListener('keydown', handleEscapeKey);
        document.getElementById('fileInput').value = '';
    }
}

function handleEscapeKey(e) {
    if (e.key === 'Escape') {
        closeUploadModal();
    }
}

function openFileDialog() {
    document.getElementById('fileInput').click();
}

function showComingSoon(feature) {
    const toast = document.createElement('div');
    toast.textContent = `${feature} integration coming soon!`;
    toast.style.cssText = `
        position: fixed; top: 20px; right: 20px;
        background: linear-gradient(45deg, #6366f1, #8b5cf6);
        color: white; padding: 12px 20px; border-radius: 25px;
        box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
        z-index: 10000; font-size: 14px; font-weight: 500;
        transform: translateX(400px);
        transition: transform 0.3s ease;
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.style.transform = 'translateX(0)', 100);
    setTimeout(() => {
        toast.style.transform = 'translateX(400px)';
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
}

// --- DRAG AND DROP HANDLERS ---
function handleModalDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    document.getElementById('modalUploadZone')?.classList.remove('drag-over');
    const files = Array.from(event.dataTransfer.files);
    files.forEach(file => addFile(file));
    closeUploadModal();
}

function handleModalDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    document.getElementById('modalUploadZone')?.classList.add('drag-over');
}

function handleModalDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    document.getElementById('modalUploadZone')?.classList.remove('drag-over');
}


// --- CHAT LOGIC (No changes) ---

function activateChat() {
    chatActive = true;
    const welcomeState = document.getElementById('welcomeState');
    const chatMessagesContainer = document.getElementById('chatMessagesContainer');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    
    if (welcomeState) welcomeState.classList.add('hidden');
    if (chatMessagesContainer) chatMessagesContainer.classList.remove('hidden');
    if (chatInput) {
        chatInput.disabled = false;
        chatInput.placeholder = 'Ask a question about your sources...';
        chatInput.focus();
    }
    if (sendBtn) sendBtn.disabled = false;
    
    setTimeout(() => {
        addMessage(demoMessages[0].type, demoMessages[0].content);
    }, 800);
}

function addMessage(type, content) {
    const chatMessagesContainer = document.getElementById('chatMessagesContainer');
    const chatMessages = document.getElementById('chatMessagesScroll');
    if (!chatMessages || !chatMessagesContainer) return;

    if (chatMessagesContainer.classList.contains('hidden')) {
        chatMessagesContainer.classList.remove('hidden');
        const welcomeState = document.getElementById('welcomeState');
        if (welcomeState) welcomeState.classList.add('hidden');
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    messageDiv.innerHTML = `
        <div class="message-content">
            <div class="message-text">${content.replace(/\n/g, '<br>')}</div>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    
    setTimeout(() => {
        chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
    }, 100);
}

function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    if (!chatInput) return;
    const message = chatInput.value.trim();
    if (!message || !chatActive) return;
    
    addMessage('user', message);
    chatInput.value = '';
    autoResizeTextarea();
    
    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) sendBtn.disabled = true;
    
    setTimeout(() => {
        const responses = [
            `Based on your uploaded document... **Main Structure:** The CHOICE BASED CREDIT & SEMESTER SYSTEM...`,
            `That's a great question! From what I've analyzed... **Curriculum Overview:** Published in 2019...`,
            `I can help clarify that concept. According to your document... **Credit System Benefits:** Flexibility in course selection...`,
            `Excellent question! Let me search... **Common Course Structure:** Code: MAL1A07, Credits: 4...`,
            `From the information in your sources... **Key Components:** 1. Course Catalog, 2. Learning Objectives...`
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        addMessage('ai', randomResponse);
        if (sendBtn) sendBtn.disabled = false;
    }, 1200 + Math.random() * 1500);
}

function refreshChat() {
    const chatMessages = document.getElementById('chatMessagesScroll');
    if(chatMessages) chatMessages.innerHTML = '';
    addMessage(demoMessages[0].type, demoMessages[0].content);
    showComingSoon("Chat Refreshed");
}


// --- UTILITY & HELPER FUNCTIONS ---

function saveNote() {
    showComingSoon('Note Saving');
}

function createTool(toolName) {
    showComingSoon(toolName);
}

// ✨ --- REVISED: Function to get icon classes for CSS and Font Awesome --- ✨
function getFileIconDetails(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    let iconClass = 'fas fa-file'; // Default icon
    let typeClass = 'file'; // Default color class

    if (extension === 'pdf') {
        iconClass = 'fas fa-file-pdf';
        typeClass = 'pdf';
    } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension)) {
        iconClass = 'fas fa-file-image';
        typeClass = 'image';
    } else if (['txt', 'csv', 'md'].includes(extension)) {
        iconClass = 'fas fa-file-alt';
        typeClass = 'text';
    }
    // Add more file types as needed
    return { iconClass, typeClass };
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function updateUI() {
    const sourceLimitCount = document.getElementById('sourceLimitCount');
    if (sourceLimitCount) {
        sourceLimitCount.textContent = `${sourceCount}/50`;
    }
}

function autoResizeTextarea() {
    const textarea = document.getElementById('chatInput');
    if (textarea) {
        textarea.style.height = 'auto';
        const maxHeight = 120;
        const scrollHeight = textarea.scrollHeight;
        textarea.style.height = Math.min(scrollHeight, maxHeight) + 'px';
    }
}