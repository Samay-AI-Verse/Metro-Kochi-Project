// Global variables
let uploadedFiles = [];
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
// This single listener ensures all code runs after the HTML is fully loaded.
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    updateUI();
    // The notebook fetch logic can also be placed here if needed
    // fetchNotebookData(); 
});


// --- SETUP ALL EVENT LISTENERS ---
// Central function to manage all click/input events for the page.
function setupEventListeners() {
    // Modal open/close triggers
    const addSourceBtn = document.getElementById('addSourceBtn');
    const uploadSourceWelcomeBtn = document.getElementById('uploadSourceWelcomeBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modal = document.getElementById('uploadModal');
    const modalContent = document.querySelector('#uploadModal .modal');

    if (addSourceBtn) addSourceBtn.addEventListener('click', openUploadModal);
    if (uploadSourceWelcomeBtn) uploadSourceWelcomeBtn.addEventListener('click', openUploadModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeUploadModal);
    
    // Close modal when clicking on the overlay
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeUploadModal();
        });
    }
    if(modalContent) modalContent.addEventListener('click', (e) => e.stopPropagation());


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
    const chooseFileLink = document.getElementById('chooseFileLink');
    if (modalUploadZone) modalUploadZone.addEventListener('click', openFileDialog);
    if (chooseFileLink) {
        chooseFileLink.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevents modalUploadZone click from firing twice
            openFileDialog();
        });
    }
    
    // File input change handler
    const fileInput = document.getElementById('fileInput');
    if(fileInput) fileInput.addEventListener('change', handleFileSelect);


    // Modal "Coming Soon" buttons
    const discoverSourcesBtn = document.getElementById('discoverSourcesBtn');
    if(discoverSourcesBtn) discoverSourcesBtn.addEventListener('click', () => showComingSoon('Discover sources'));

    document.querySelectorAll('.source-option').forEach(option => {
        option.addEventListener('click', () => {
            const feature = option.querySelector('.source-option-title').textContent;
            showComingSoon(feature);
        });
    });
    
    // Add Note button in Studio
    const addNoteBtn = document.querySelector('.add-note-btn');
    if(addNoteBtn) addNoteBtn.addEventListener('click', saveNote);

    // Chat refresh button (placeholder function)
    const refreshChatBtn = document.getElementById('refreshChatBtn');
    if(refreshChatBtn) refreshChatBtn.addEventListener('click', refreshChat);
}

// --- FILE HANDLING ---

function addFile(file) {
    const fileId = Date.now() + Math.random();
    const fileObj = {
        id: fileId,
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type,
        file: file
    };
    
    uploadedFiles.push(fileObj);
    sourceCount++;
    updateUI();
    displayFile(fileObj);
    
    if (sourceCount === 1) {
        activateChat();
    }
}

function displayFile(fileObj) {
    const uploadedFilesContainer = document.getElementById('uploaded-files');
    const emptyState = document.getElementById('empty-state');
    
    if (emptyState) emptyState.classList.add('hidden');
    if (uploadedFilesContainer) uploadedFilesContainer.classList.remove('hidden');
    
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.dataset.fileId = fileObj.id;
    
    const fileIcon = getFileIcon(fileObj.type, fileObj.name);
    
    fileItem.innerHTML = `
        <div class="file-icon">${fileIcon}</div>
        <div class="file-info">
            <div class="file-name">${fileObj.name}</div>
            <div class="file-size">${fileObj.size}</div>
        </div>
        <input type="checkbox" class="file-checkbox" data-file-id="${fileObj.id}">
    `;
    
    if (uploadedFilesContainer) {
        uploadedFilesContainer.appendChild(fileItem);
    }
}

function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    files.forEach(file => addFile(file));
    closeUploadModal();
}

// --- MODAL AND DIALOGS ---

function openUploadModal() {
    const modal = document.getElementById('uploadModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.remove('hidden');
        document.addEventListener('keydown', handleEscapeKey);
    }
}

function closeUploadModal() {
    const modal = document.getElementById('uploadModal');
    if (modal) {
        modal.classList.add('hidden');
        // Use a timeout to allow the fade-out animation to finish
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
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
// (These are still attached via attributes in the HTML for simplicity, but could also be moved here)
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


// --- CHAT LOGIC ---

function activateChat() {
    chatActive = true;
    const welcomeState = document.getElementById('welcomeState');
    const chatMessagesContainer = document.getElementById('chatMessagesContainer');
    const chatInput = document.getElementById('chatInput');
    const chatInputContainer = document.getElementById('chatInputContainer');
    const sendBtn = document.getElementById('sendBtn');
    
    if (welcomeState) welcomeState.classList.add('hidden');
    if (chatMessagesContainer) chatMessagesContainer.classList.remove('hidden');
    if (chatInput) {
        chatInput.disabled = false;
        chatInput.placeholder = 'Ask a question about your sources...';
        chatInput.focus();
    }
    if (chatInputContainer) chatInputContainer.classList.add('active');
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
    // This is a placeholder. You can define what "refresh" means.
    // e.g., clear the chat and show the welcome message again.
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

function getFileIcon(type, name) {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎬';
    if (type.startsWith('audio/')) return '🎵';
    if (type.includes('pdf') || name.endsWith('.pdf')) return '📄';
    if (name.endsWith('.doc') || name.endsWith('.docx')) return '📝';
    if (type.includes('text') || name.endsWith('.txt')) return '📄';
    return '📁';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function updateUI() {
    // This function can be expanded to update more parts of the UI
    const sourceCountElement = document.getElementById('sourceCount'); // Note: This element doesn't exist in your HTML
    if (sourceCountElement) {
        sourceCountElement.textContent = `${sourceCount} source${sourceCount !== 1 ? 's' : ''}`;
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
