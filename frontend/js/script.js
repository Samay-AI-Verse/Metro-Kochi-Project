// Global variables
let uploadedFiles = []; // This will be populated from the backend, with a 'selected' state
let sourceCount = 0;
let chatActive = false;
let currentNotebookId = null;

// Demo messages for AI chat
const demoMessages = [
  {
    type: "ai",
    content: `Hello there! 

The documents I have consist of excerpts from a curriculum detailing courses offered under the CHOICE BASED CREDIT & SEMESTER SYSTEM - 2019. These documents outline the structure for various degree programs, primarily focusing on common courses. 

Would you like me to summarize the key structure, explain specific courses, or help you understand the credit system?`,
  },
];

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
  const pathParts = window.location.pathname.split("/");
  const notebookId = pathParts[pathParts.length - 1];

  if (notebookId && !isNaN(notebookId)) {
    currentNotebookId = parseInt(notebookId, 10);
    fetchAndDisplaySources(currentNotebookId);
  } else {
    console.error("Could not determine a valid Notebook ID from URL.");
  }

  setupEventListeners();

  // Sidebar Toggle Script
  const sidebar = document.getElementById("sidebar");
  const sidebarToggleBtn = document.getElementById("sidebar-toggle-btn");

  const applySavedSidebarState = () => {
    const savedState = localStorage.getItem("sidebarState");
    if (savedState === "collapsed") {
      sidebar.classList.add("collapsed");
    }
  };

  if (sidebar && sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("collapsed");
      if (sidebar.classList.contains("collapsed")) {
        localStorage.setItem("sidebarState", "collapsed");
      } else {
        localStorage.setItem("sidebarState", "expanded");
      }
    });
  }
  applySavedSidebarState();

  // Studio Toggle Script
  const studioSection = document.querySelector(".studio-section");
  const studioToggleBtn = document.getElementById("studio-toggle-btn");

  const applySavedStudioState = () => {
    const savedState = localStorage.getItem("studioState");
    if (savedState === "collapsed") {
      studioSection.classList.add("collapsed");
    }
  };

  if (studioSection && studioToggleBtn) {
    studioToggleBtn.addEventListener("click", () => {
      studioSection.classList.toggle("collapsed");
      if (studioSection.classList.contains("collapsed")) {
        localStorage.setItem("studioState", "collapsed");
      } else {
        localStorage.setItem("studioState", "expanded");
      }
    });
  }
  applySavedStudioState();

  // Theme Toggle Script
  const themeToggleBtn = document.getElementById("theme-toggle-btn");
  const body = document.body;

  const applySavedTheme = () => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      body.classList.add("dark-mode");
    } else {
      body.classList.remove("dark-mode");
    }
  };

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      body.classList.toggle("dark-mode");
      if (body.classList.contains("dark-mode")) {
        localStorage.setItem("theme", "dark");
      } else {
        localStorage.setItem("theme", "light");
      }
    });
  }
  applySavedTheme();
});

// --- DATA FETCHING ---
async function fetchAndDisplaySources(notebookId) {
  try {
    const response = await fetch(`/api/notebooks/${notebookId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch notebook details.");
    }
    const notebook = await response.json();

    // This line is crucial: It REPLACES the old array with the fresh one from the server.
    uploadedFiles = (notebook.sources || []).map((source) => ({
      ...source,
      id: source.name + source.size, // Create a simple unique ID for the UI
      selected: true,
    }));

    sourceCount = uploadedFiles.length;

    if (sourceCount > 0 && !chatActive) {
      activateChat();
    }

    renderUploadedFiles();
    updateUI();
  } catch (error) {
    console.error("Error fetching sources:", error);
    alert("Could not load sources for this notebook.");
  }
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
  // Modal open/close triggers
  const addSourceBtn = document.querySelector(".add-btn");
  const uploadBtn = document.querySelector(".upload-btn");
  const closeModalBtn = document.querySelector(".close-btn");
  const modal = document.getElementById("uploadModal");

  if (addSourceBtn) addSourceBtn.addEventListener("click", openUploadModal);
  if (uploadBtn) uploadBtn.addEventListener("click", openUploadModal);
  if (closeModalBtn) closeModalBtn.addEventListener("click", closeUploadModal);

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeUploadModal();
    });
  }

  // Chat input and send button
  const chatInput = document.getElementById("chatInput");
  const sendBtn = document.getElementById("sendBtn");

  if (chatInput) {
    chatInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter" && !e.shiftKey && !this.disabled) {
        e.preventDefault();
        sendMessage();
      }
    });
    chatInput.addEventListener("input", autoResizeTextarea);
  }
  if (sendBtn) sendBtn.addEventListener("click", sendMessage);

  // Studio Tool Cards - Expand to full panel for all tools
  const studioSection = document.querySelector(".studio-section");
  document.querySelectorAll(".tool-card").forEach((card) => {
    card.addEventListener("click", function () {
      const toolName = this.querySelector(".tool-name").textContent;
      console.log(`Expanding ${toolName}`);
      expandToolPanel(studioSection, toolName);
    });
  });

  // Close button for tool details
// Close button for tool details
// NOTE: We target the new ID 'closeDetailsBtn'
// Close button for tool details
const closeDetailsBtn = document.getElementById("closeDetailsBtn"); 
// const studioSection = document.querySelector(".studio-section");

if (closeDetailsBtn && studioSection) {
  closeDetailsBtn.addEventListener("click", () => {
    console.log("Closing tool details");
    studioSection.classList.remove("expanded");
    
    // Hide the main wrapper
    const toolDetailsWrapper = document.getElementById("toolDetailsWrapper");
    if (toolDetailsWrapper) toolDetailsWrapper.classList.add("hidden");
    
    // Hide specific views as a cleanup step
    document.getElementById("sarthiChatStudioView")?.classList.add("hidden");
    document.getElementById("reportBoardView")?.classList.add("hidden");
    document.getElementById("intelliAlertView")?.classList.add("hidden");
    document.getElementById("docMapView")?.classList.add("hidden");
  });
}

  // Modal Upload Zone
  const modalUploadZone = document.getElementById("modalUploadZone");
  if (modalUploadZone) {
    modalUploadZone.addEventListener("click", openFileDialog);
    modalUploadZone.addEventListener("drop", handleModalDrop);
    modalUploadZone.addEventListener("dragover", handleModalDragOver);
    modalUploadZone.addEventListener("dragleave", handleModalDragLeave);
  }

  // File input change handler
  const fileInput = document.getElementById("fileInput");
  if (fileInput) fileInput.addEventListener("change", handleFileSelect);

  // Chat refresh button
  const refreshChatBtn = document.querySelector(".chat-header-btn");
  if (refreshChatBtn) refreshChatBtn.addEventListener("click", refreshChat);

  // Source Selection Listeners
  const selectAllCheckbox = document.getElementById("selectAllCheckbox");
  const uploadedFilesList = document.getElementById("uploaded-files");

  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener("change", handleSelectAll);
  }

  if (uploadedFilesList) {
    // Listener for checkbox changes
    uploadedFilesList.addEventListener("change", (event) => {
      if (event.target.classList.contains("file-checkbox")) {
        const fileId = event.target.dataset.fileId;
        const file = uploadedFiles.find((f) => f.id == fileId);
        if (file) {
          file.selected = event.target.checked;
        }
        updateSelectAllCheckboxState();
        updateSourceCountInChat();
      }
    });

    // Listener for clicks on file actions (menu, rename, delete)
    uploadedFilesList.addEventListener("click", handleFileActions);
  }

  // Close dropdown menus when clicking outside
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".menu-btn")) {
      document.querySelectorAll(".dropdown-menu").forEach((menu) => {
        menu.classList.add("hidden");
      });
    }
  });
}


function expandToolPanel(studioSection, toolName) {
  studioSection.classList.add("expanded");
  
  const toolDetailsWrapper = document.getElementById("toolDetailsWrapper");
  const toolDetailsTitle = document.querySelector(".tool-details-title");

  // 1. Define all tool views
  const toolViews = {
    "Sarthi Chat": document.getElementById("sarthiChatStudioView"),
    "Report Board": document.getElementById("reportBoardView"),
    "IntelliAlert": document.getElementById("intelliAlertView"),
    "DocMap View": document.getElementById("docMapView"),
  };

  if (!toolDetailsWrapper || !toolDetailsTitle) return;
  
  // 2. Show the main wrapper and set the title
  toolDetailsWrapper.classList.remove("hidden");
  toolDetailsTitle.textContent = toolName;

  // 3. Hide ALL tool views
  Object.values(toolViews).forEach(view => {
    if (view) view.classList.add("hidden");
  });

  // 4. Show the selected tool view and perform initialization
  const selectedView = toolViews[toolName];
  if (selectedView) {
    selectedView.classList.remove("hidden");
  }

  // --- Tool-specific Initialization (Sarthi Chat only needs initial message) ---
  if (toolName === "Sarthi Chat") {
    const studioChat = document.getElementById("chatMessagesStudioScroll");
    if (studioChat && studioChat.children.length === 0) {
        // Only add the initial message once
        const initialMessage = demoMessages[0].content;
        const messageDiv = document.createElement("div");
        messageDiv.className = `message ai`;
        messageDiv.innerHTML = `<div class="message-content"><div class="message-text">${initialMessage.replace(/\n/g, "<br>")}</div></div>`;
        studioChat.appendChild(messageDiv);
    }
  }
}


// --- FILE HANDLING & RENDERING ---

// ✨ --- THIS IS THE CORRECTED FUNCTION TO PREVENT DUPLICATES --- ✨
async function addFile(file) {
  // ✨ --- DUPLICATE FILE CHECK --- ✨
  const fileName = file.name;
  const fileExists = uploadedFiles.some(
    (existingFile) => existingFile.name === fileName
  );

  if (fileExists) {
    alert(
      `A file named "${fileName}" already exists in this notebook. Please rename the file or upload a different one.`
    );
    return; // Stop the upload process
  }
  // ✨ --- END OF CHECK --- ✨

  if (!currentNotebookId) {
    alert("Error: Cannot upload file. No notebook is currently selected.");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    // Step 1: Upload the new file to the server.
    const response = await fetch(
      `/api/notebooks/${currentNotebookId}/sources`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`File upload failed with status: ${response.status}`);
    }

    // Step 2: After a successful upload, fetch the new, complete list of sources from the server.
    await fetchAndDisplaySources(currentNotebookId);
  } catch (error) {
    console.error("Error uploading file:", error);
    alert(
      "There was an error uploading your file. Please check the console and try again."
    );
  }
}

function renderUploadedFiles() {
  const uploadedFilesList = document.getElementById("uploaded-files");
  const emptyState = document.getElementById("empty-state");
  const sourcesHeader = document.querySelector(".sources-header");

  if (!uploadedFilesList || !emptyState || !sourcesHeader) return;

  uploadedFilesList.innerHTML = "";

  if (uploadedFiles.length === 0) {
    emptyState.classList.remove("hidden");
    uploadedFilesList.classList.add("hidden");
    sourcesHeader.classList.add("hidden");
  } else {
    emptyState.classList.add("hidden");
    uploadedFilesList.classList.remove("hidden");
    sourcesHeader.classList.remove("hidden");

    uploadedFiles.forEach((fileObj) => {
      const { iconClass, typeClass } = getFileIconDetails(fileObj.name);
      const fileItem = document.createElement("div");
      fileItem.className = `file-item ${fileObj.selected ? "selected" : ""}`;
      fileItem.dataset.fileId = fileObj.id;

      // This is the latest HTML structure for each file item
      fileItem.innerHTML = `
            <div class="file-icon ${typeClass}">
                <i class="${iconClass}"></i>
            </div>
            <div class="file-info">
                <div class="file-name" title="${fileObj.name}">${
        fileObj.name
      }</div>
                <div class="file-size">${formatFileSize(
                  parseInt(fileObj.size, 10)
                )}</div>
            </div>
            <div class="file-actions">
                <div class="file-menu-container">
                    <button class="menu-btn" title="More options">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <div class="dropdown-menu hidden">
                        <a href="#" class="dropdown-item rename-btn">
                            <i class="fas fa-pencil-alt"></i>
                            <span>Rename</span>
                        </a>
                        <div class="dropdown-divider"></div>
                        <a href="#" class="dropdown-item delete-dropdown-btn">
                            <i class="fas fa-trash-alt"></i>
                            <span>Delete</span>
                        </a>
                    </div>
                </div>
                <div class="checkbox-wrapper-31">
                    <input type="checkbox" class="file-checkbox" data-file-id="${
                      fileObj.id
                    }" ${fileObj.selected ? "checked" : ""} />
                    <svg viewBox="0 0 35.6 35.6">
                        <circle class="background" cx="17.8" cy="17.8" r="17.8"></circle>
                        <circle class="stroke" cx="17.8" cy="17.8" r="14.37"></circle>
                        <polyline class="check" points="11.78 18.12 15.55 22.23 25.17 12.87"></polyline>
                    </svg>
                </div>
            </div>
        `;
      uploadedFilesList.appendChild(fileItem);
    });
  }
  updateSelectAllCheckboxState();
  updateSourceCountInChat();
}

function handleFileSelect(event) {
  const files = Array.from(event.target.files);
  Promise.all(files.map((file) => addFile(file))).then(() => {
    closeUploadModal();
  });
}

async function deleteFile(fileName, event) {
  event.stopPropagation();

  if (!currentNotebookId) {
    alert("Error: No notebook selected.");
    return;
  }

  if (!confirm(`Are you sure you want to delete "${fileName}"?`)) {
    return;
  }

  try {
    const response = await fetch(
      `/api/notebooks/${currentNotebookId}/sources/${encodeURIComponent(
        fileName
      )}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to delete the file.");
    }

    console.log(`Successfully deleted ${fileName}`);
    await fetchAndDisplaySources(currentNotebookId);
  } catch (error) {
    console.error("Error deleting file:", error);
    alert(`Could not delete the file: ${error.message}`);
  }
}

function handleSelectAll(event) {
  const isChecked = event.target.checked;
  uploadedFiles.forEach((file) => (file.selected = isChecked));
  renderUploadedFiles();
}

function updateSelectAllCheckboxState() {
  const selectAllCheckbox = document.getElementById("selectAllCheckbox");
  if (!selectAllCheckbox) return;

  const totalFiles = uploadedFiles.length;
  const selectedFilesCount = uploadedFiles.filter(
    (file) => file.selected
  ).length;

  // This line removes the indeterminate state (the dash) entirely.
  selectAllCheckbox.indeterminate = false;

  // This line sets the checkbox to 'checked' if and only if the list
  // isn't empty and all items in it are selected. Otherwise, it's unchecked.
  selectAllCheckbox.checked =
    totalFiles > 0 && selectedFilesCount === totalFiles;
}

// --- MODAL AND DIALOGS ---
function openUploadModal() {
  const modal = document.getElementById("uploadModal");
  if (modal) modal.classList.remove("hidden");
}

function closeUploadModal() {
  const modal = document.getElementById("uploadModal");
  if (modal) modal.classList.add("hidden");
  document.getElementById("fileInput").value = "";
}

function openFileDialog() {
  document.getElementById("fileInput").click();
}

function showComingSoon(feature) {
  alert(`${feature} is coming soon!`);
}

// --- DRAG AND DROP HANDLERS ---
function handleModalDrop(event) {
  event.preventDefault();
  event.stopPropagation();
  document.getElementById("modalUploadZone")?.classList.remove("drag-over");
  const files = Array.from(event.dataTransfer.files);
  Promise.all(files.map((file) => addFile(file))).then(() => {
    closeUploadModal();
  });
}

function handleModalDragOver(event) {
  event.preventDefault();
  event.stopPropagation();
  document.getElementById("modalUploadZone")?.classList.add("drag-over");
}

function handleModalDragLeave(event) {
  event.preventDefault();
  event.stopPropagation();
  document.getElementById("modalUploadZone")?.classList.remove("drag-over");
}

// --- CHAT LOGIC ---
function activateChat() {
  chatActive = true;
  const welcomeState = document.getElementById("welcomeState");
  const chatMessagesContainer = document.getElementById(
    "chatMessagesContainer"
  );
  const chatInput = document.getElementById("chatInput");
  const sendBtn = document.getElementById("sendBtn");

  if (welcomeState) welcomeState.classList.add("hidden");
  if (chatMessagesContainer) chatMessagesContainer.classList.remove("hidden");
  if (chatInput) {
    chatInput.disabled = false;
    chatInput.placeholder = "Ask a question about your sources...";
    chatInput.focus();
  }
  if (sendBtn) sendBtn.disabled = false;

  setTimeout(() => {
    addMessage(demoMessages[0].type, demoMessages[0].content);
  }, 800);
}

function addMessage(type, content) {
  const chatMessages = document.getElementById("chatMessagesScroll");
  if (!chatMessages) return;

  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${type}`;

  messageDiv.innerHTML = `<div class="message-content"><div class="message-text">${content.replace(
    /\n/g,
    "<br>"
  )}</div></div>`;

  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: "smooth" });
}

function sendMessage() {
  const chatInput = document.getElementById("chatInput");
  if (!chatInput) return;
  const message = chatInput.value.trim();

  const selectedFilesCount = uploadedFiles.filter((f) => f.selected).length;
  if (!message || !chatActive || selectedFilesCount === 0) {
    if (selectedFilesCount === 0) {
      alert("Please select at least one source to chat with.");
    }
    return;
  }

  addMessage("user", message);
  chatInput.value = "";
  autoResizeTextarea();

  const sendBtn = document.getElementById("sendBtn");
  if (sendBtn) sendBtn.disabled = true;

  setTimeout(() => {
    const responses = [
      `Based on your selected document(s)... **Main Structure:** The CHOICE BASED CREDIT & SEMESTER SYSTEM...`,
      `That's a great question! From what I've analyzed in the sources... **Curriculum Overview:** Published in 2019...`,
      `I can help clarify that concept. According to the selected file(s)... **Credit System Benefits:** Flexibility in course selection...`,
    ];
    const randomResponse =
      responses[Math.floor(Math.random() * responses.length)];
    addMessage("ai", randomResponse);
    if (sendBtn) sendBtn.disabled = false;
  }, 1200 + Math.random() * 800);
}

function refreshChat() {
  const chatMessages = document.getElementById("chatMessagesScroll");
  if (chatMessages) chatMessages.innerHTML = "";
  addMessage(demoMessages[0].type, demoMessages[0].content);
}

// --- UTILITY & HELPER FUNCTIONS ---
function createTool(toolName) {
  showComingSoon(toolName);
}

function getFileIconDetails(filename) {
  const extension = filename.split(".").pop().toLowerCase();
  let iconClass = "fas fa-file";
  let typeClass = "file";

  if (extension === "pdf") {
    iconClass = "fa-regular fa-file-pdf";
    typeClass = "pdf";
  } else if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(extension)) {
    iconClass = "fas fa-file-image";
    typeClass = "image";
  } else if (["txt", "csv", "md"].includes(extension)) {
    iconClass = "fas fa-file-alt";
    typeClass = "text";
  } else if (["doc", "docx"].includes(extension)) {
    iconClass = "fas fa-file-word";
    typeClass = "word";
  } else if (["mp3", "wav", "ogg"].includes(extension)) {
    iconClass = "fas fa-file-audio";
    typeClass = "audio";
  }
  return { iconClass, typeClass };
}

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function updateSourceCountInChat() {
  const sourceCountElement = document.querySelector(".source-count");
  if (sourceCountElement) {
    const selectedCount = uploadedFiles.filter((f) => f.selected).length;
    if (selectedCount === uploadedFiles.length) {
      sourceCountElement.textContent = `Chatting with all ${selectedCount} sources`;
    } else {
      sourceCountElement.textContent = `Chatting with ${selectedCount} of ${uploadedFiles.length} sources`;
    }
  }
}

function updateUI() {
  const sourceLimitCount = document.getElementById("sourceLimitCount");
  if (sourceLimitCount) {
    sourceLimitCount.textContent = `${sourceCount}/50`;
  }
  const sidebarCount = document.querySelector(".source-count-badge");
  if (sidebarCount) {
    sidebarCount.textContent = sourceCount;
  }
  updateSourceCountInChat();
}

function autoResizeTextarea() {
  const textarea = document.getElementById("chatInput");
  if (textarea) {
    textarea.style.height = "auto";
    const maxHeight = 120;
    const scrollHeight = textarea.scrollHeight;
    textarea.style.height = Math.min(scrollHeight, maxHeight) + "px";
  }
}

// In script.js, add this new function

// In script.js, replace the entire function

// In script.js, replace your entire existing handleFileActions function

async function handleFileActions(event) {
  const target = event.target;
  const fileItem = target.closest(".file-item");
  if (!fileItem) return;

  const fileId = fileItem.dataset.fileId;
  const fileObj = uploadedFiles.find((f) => f.id === fileId);
  if (!fileObj) return;

  // --- Logic for toggling the dropdown menu ---
  if (target.closest(".menu-btn")) {
    event.stopPropagation(); // Prevents the document click listener from firing immediately
    const dropdown = fileItem.querySelector(".dropdown-menu");

    // Hide all other dropdowns before showing this one
    document.querySelectorAll(".dropdown-menu").forEach((menu) => {
      if (menu !== dropdown) menu.classList.add("hidden");
    });

    dropdown.classList.toggle("hidden");
  }

  // --- Logic for the "Delete" button ---
  if (target.closest(".delete-dropdown-btn")) {
    event.preventDefault();
    fileItem.querySelector(".dropdown-menu").classList.add("hidden"); // Close menu
    deleteFile(fileObj.name, event);
  }

  // --- Logic for the "Rename" button ---
  if (target.closest(".rename-btn")) {
    event.preventDefault();
    fileItem.querySelector(".dropdown-menu").classList.add("hidden"); // Close menu

    const fileNameDiv = fileItem.querySelector(".file-name");
    const originalName = fileObj.name;

    fileNameDiv.innerHTML = `<input type="text" class="rename-input" value="${originalName}" />`;

    const input = fileNameDiv.querySelector("input");

    // Automatically select the base name without the extension for a better user experience
    const dotIndex = originalName.lastIndexOf(".");
    const selectionEnd = dotIndex > -1 ? dotIndex : originalName.length;

    input.focus();
    input.setSelectionRange(0, selectionEnd); // Selects from start to the dot

    const saveRename = async () => {
      const newName = input.value.trim();

      if (!newName || newName === originalName) {
        fileNameDiv.textContent = originalName;
        return;
      }

      try {
        const response = await fetch(
          `/api/notebooks/${currentNotebookId}/sources/${encodeURIComponent(
            originalName
          )}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ newName: newName }),
          }
        );

        // Robust error handling for both JSON and non-JSON server responses
        if (!response.ok) {
          const errorText = await response.text();
          try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.detail || "An unknown error occurred.");
          } catch (e) {
            throw new Error(errorText); // The response was not JSON, show the raw text
          }
        }

        console.log(
          `Successfully renamed "${originalName}" to "${newName}" on the server.`
        );

        // On success, refresh the entire source list to ensure data is consistent
        await fetchAndDisplaySources(currentNotebookId);
      } catch (error) {
        console.error("Error renaming file:", error);
        alert(`Could not rename the file: ${error.message}`);
        // Revert the UI to the original name on failure
        const failedItem = document.querySelector(`[data-file-id="${fileId}"]`);
        if (failedItem) {
          failedItem.querySelector(".file-name").textContent = originalName;
        }
      }
    };

    // Detach previous listeners to be safe, then attach new ones
    input.removeEventListener("blur", saveRename);
    input.removeEventListener("keydown", handleKeydown);

    function handleKeydown(e) {
      if (e.key === "Enter") {
        input.blur(); // Triggers the saveRename on blur
      }
      if (e.key === "Escape") {
        input.removeEventListener("blur", saveRename); // Prevent saving on blur
        fileNameDiv.textContent = originalName; // Cancel on Escape
      }
    }

    input.addEventListener("blur", saveRename);
    input.addEventListener("keydown", handleKeydown);
  }
}

async function fetchNotebookDetails(notebookId) {
  try {
    const response = await fetch(`/api/notebooks/${notebookId}`);
    if (!response.ok) {
      throw new Error("Notebook details not found.");
    }
    const notebook = await response.json();

    // Find the elements by their new IDs
    const titleElement = document.getElementById("notebook-title");
    const pageTitleElement = document.getElementById("page-title");

    // Update the text with the fetched title
    if (titleElement) {
      titleElement.textContent = notebook.title;
    }
    if (pageTitleElement) {
      pageTitleElement.textContent = `${notebook.title} - MetroDocAI`;
    }
  } catch (error) {
    console.error("Failed to fetch notebook details:", error);
    // You can leave the titles as "Untitled notebook" on failure
  }
}

// =================================================================
// THEME TOGGLE SCRIPT
// =================================================================



