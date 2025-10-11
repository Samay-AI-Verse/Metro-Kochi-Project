import os
from typing import List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
# 💡 New: Import load_dotenv to read the .env file
from dotenv import load_dotenv 
from groq import Groq, APIConnectionError, AuthenticationError, RateLimitError, APIError
import uvicorn

# --- Load Environment Variables from .env file ---
load_dotenv() 

# --- Configuration ---
LLM_MODEL = "llama-3.1-8b-instant" 

# --- Pydantic Models ---
class ChatPayload(BaseModel):
    """Model for incoming chat messages."""
    message: str

class ChatResponse(BaseModel):
    """Model for outgoing chatbot replies."""
    reply: str

# --- Simple Chatbot Class ---
class SimpleChatbot:
    """A general-purpose chatbot wrapper for the Groq API."""
    
    def __init__(self, client: Groq):
        self.groq_client = client
        self.history = [] 

    def _call_groq_api(self, prompt: str) -> str:
        """
        Calls the Groq API with the system prompt and user message.
        """
        system_prompt = (
            "You are a friendly, concise, and highly intelligent conversational assistant. "
            "You can answer questions, summarize topics, assist with coding, and engage in general conversation. "
            "Keep your responses engaging and easy to understand."
        )

        try:
            chat_completion = self.groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                model=LLM_MODEL,
                temperature=0.8,
                max_tokens=2048
            )
            return chat_completion.choices[0].message.content
        
        except (APIConnectionError, AuthenticationError, RateLimitError, APIError) as e:
            print(f"Groq API Error: {e}") 
            if isinstance(e, AuthenticationError):
                return "Authentication failed. Please check the GROQ_API_KEY."
            
            return "I apologize, I'm currently experiencing a service issue. Please try again shortly."

    def process_message(self, message: str) -> str:
        """
        Main method to process a user message and get an LLM response.
        """
        reply = self._call_groq_api(message)
        return reply

# --- FastAPI App Initialization ---
app = FastAPI(
    title="Simple Conversational Chatbot",
    description="A fast, Groq-powered API for general conversation.",
    version="1.0.0"
)

# Check for API Key and initialize client
if not os.getenv("GROQ_API_KEY"):
    print("FATAL: GROQ_API_KEY environment variable not set. Chatbot will not function.")
    GROQ_CLIENT = None
else:
    # Initialize the Groq client using the environment variable
    GROQ_CLIENT = Groq(api_key=os.getenv("GROQ_API_KEY")) 

# Initialize Chatbot Instance
chatbot_instance = SimpleChatbot(client=GROQ_CLIENT) if GROQ_CLIENT else None

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# 🚀 ENDPOINTS
# =============================================================================

@app.get("/")
async def root():
    """Basic health check and welcome message."""
    return {"message": "Welcome to the Simple Chatbot API. Use the /chat endpoint to start a conversation."}


@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(payload: ChatPayload):
    """
    Receives user messages and returns a response from the Chatbot.
    """
    if not chatbot_instance or not GROQ_CLIENT:
        raise HTTPException(
            status_code=503, 
            detail="Chatbot service is unavailable. The GROQ_API_KEY may be missing or invalid."
        )
        
    user_message = payload.message.strip()

    if not user_message:
        return ChatResponse(reply="Hello! What can I help you with today? 😊")

    try:
        reply = chatbot_instance.process_message(user_message)
        return ChatResponse(reply=reply)
    
    except Exception as e:
        print(f"Internal Server Error during chat processing: {e}")
        raise HTTPException(
            status_code=500, 
            detail="An internal server error occurred while generating the reply. 😔"
        )


# --- Server Start (For local development/testing) ---
if __name__ == "__main__":
    # We default to port 8001, but allow the PORT env variable to override it.
    port = int(os.getenv("PORT", 8001)) 
    print(f"Starting Uvicorn server on http://0.0.0.0:{port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)
