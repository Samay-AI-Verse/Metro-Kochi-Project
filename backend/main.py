import json
import os
import shutil
from fastapi import FastAPI, HTTPException, status, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel
from typing import List, Dict

# --- Path Configuration ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, '..', 'frontend')
DB_FILE = os.path.join(FRONTEND_DIR, "notebooks.json") 
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads") # NEW: Folder to store files

# --- App Setup ---
app = FastAPI(title="MetroDocAI Backend")

# Create the uploads directory if it doesn't exist
os.makedirs(UPLOADS_DIR, exist_ok=True)

# Mount directories
app.mount("/static", StaticFiles(directory=FRONTEND_DIR, html=True), name="static")
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads") # NEW: Make uploads accessible

# --- Models ---
class Notebook(BaseModel):
    id: int
    title: str
    date: str
    sources: List[Dict[str, str]] = [] # MODIFIED: Changed from int to a list of source objects
    category: str | None = None
    description: str | None = None

# --- Helpers ---
def load_notebooks():
    """Loads all notebooks from the JSON file."""
    if not os.path.exists(DB_FILE):
        return []
    try:
        with open(DB_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError:
        print(f"Warning: {DB_FILE} is corrupted or empty. Starting with an empty list.")
        save_notebooks([])
        return []

def save_notebooks(data):
    """Saves the list of notebooks back to the JSON file."""
    os.makedirs(os.path.dirname(DB_FILE), exist_ok=True)
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

# --- Routes (No changes to existing routes) ---
@app.get("/", response_class=HTMLResponse)
async def serve_index():
    """Serves the main index.html file from the frontend directory."""
    index_path = os.path.join(FRONTEND_DIR, "index.html")
    if not os.path.exists(index_path):
        raise HTTPException(status_code=404, detail=f"Index page not found at {index_path}")
    with open(index_path, "r", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())

@app.get("/document/{notebook_id}", response_class=HTMLResponse)
async def serve_document(notebook_id: int):
    """Serves the actual document.html file for a specific notebook."""
    document_path = os.path.join(FRONTEND_DIR, "document.html")
    if not os.path.exists(document_path):
        raise HTTPException(status_code=404, detail="document.html not found")
    with open(document_path, "r", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())

# --- API for notebooks (No changes to existing API endpoints) ---
@app.post("/api/notebooks", response_model=Notebook, status_code=status.HTTP_201_CREATED)
async def create_notebook(nb: Notebook):
    """Creates a new notebook and saves it to the database."""
    notebooks = load_notebooks()
    notebooks.insert(0, nb.model_dump())
    save_notebooks(notebooks)
    return nb

@app.get("/api/notebooks")
async def list_notebooks():
    """Returns the full list of notebooks."""
    return load_notebooks()

@app.get("/api/notebooks/{notebook_id}", response_model=Notebook)
async def get_notebook(notebook_id: int):
    """Retrieves a single notebook by ID."""
    notebooks = load_notebooks()
    for nb in notebooks:
        if nb.get("id") == notebook_id:
            return nb
    raise HTTPException(status_code=404, detail="Notebook not found")

@app.delete("/api/notebooks/{notebook_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notebook(notebook_id: int):
    """Deletes a notebook by ID."""
    notebooks = load_notebooks()
    initial_length = len(notebooks)
    notebooks[:] = [nb for nb in notebooks if nb.get("id") != notebook_id]
    if len(notebooks) == initial_length:
        raise HTTPException(status_code=404, detail="Notebook not found")
    save_notebooks(notebooks)
    return JSONResponse(status_code=status.HTTP_204_NO_CONTENT, content={})

# --- NEW: Endpoint for File Uploads ---
@app.post("/api/notebooks/{notebook_id}/sources")
async def upload_source(notebook_id: int, file: UploadFile = File(...)):
    """Uploads a file and associates it with a specific notebook."""
    notebooks = load_notebooks()
    # Find the specific notebook to update
    notebook_to_update = next((nb for nb in notebooks if nb.get("id") == notebook_id), None)
    
    if not notebook_to_update:
        raise HTTPException(status_code=404, detail="Notebook not found")

    # Create a dedicated folder for the notebook's uploads to keep files organized
    notebook_upload_dir = os.path.join(UPLOADS_DIR, str(notebook_id))
    os.makedirs(notebook_upload_dir, exist_ok=True)
    
    file_path = os.path.join(notebook_upload_dir, file.filename)
    
    # Save the file to the server's disk
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Create metadata to save in the JSON database
    source_metadata = {
        "name": file.filename,
        "path": f"/uploads/{notebook_id}/{file.filename}", # URL path to access the file
        "size": str(file.size),
        "type": file.content_type
    }

    # Add the file metadata to the notebook's sources list
    if "sources" not in notebook_to_update:
        notebook_to_update["sources"] = []
    
    notebook_to_update["sources"].append(source_metadata)
    save_notebooks(notebooks)
    
    return {"message": "File uploaded successfully", "source": source_metadata}