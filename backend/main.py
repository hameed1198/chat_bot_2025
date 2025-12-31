from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import requests
from dotenv import load_dotenv
import uvicorn

# Load environment variables
load_dotenv()

app = FastAPI(
    title="MediCare AI API",
    description="Healthcare Assistant API powered by Gemini AI",
    version="1.0.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:3001", 
        "http://localhost:3002",
        "https://chat-bot-2025.vercel.app",
        "https://chatbot2025.vercel.app",
        "https://*.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    userName: str = ""
    selectedService: str = ""

class ChatResponse(BaseModel):
    response: str
    success: bool = True

# Get Gemini API key
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

def get_service_context(service: str) -> str:
    """Get context for specific medical services."""
    service_contexts = {
        "health": "You are a health assessment specialist. Focus on symptom analysis, health guidance, and when to seek medical care.",
        "insurance": "You are an insurance specialist. Help with coverage questions, claims, finding providers, and understanding benefits.",
        "appointments": "You are an appointment coordinator. Help find doctors, schedule appointments, and prepare for medical visits.",
        "general": "You are a general health advisor. Provide information about medications, health tips, and preventive care.",
        "emergency": "You are an emergency guidance specialist. Provide first aid information, emergency contacts, and urgent care guidance.",
        "chat": "You are a comprehensive healthcare assistant. Answer any health-related questions with professional medical guidance."
    }
    return service_contexts.get(service, "You are a healthcare assistant providing general medical information.")

async def get_gemini_response(message: str, user_name: str = "", service: str = "") -> str:
    """Get response from Gemini API."""
    if not GEMINI_API_KEY:
        return get_fallback_response(message, user_name, service)
    
    # Handle greetings first
    message_lower = message.lower().strip()
    greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'howdy', 'hola']
    if message_lower in greetings or message_lower.rstrip('!') in greetings:
        return f"""👋 **Hello {user_name}!**

Welcome to MediCare AI! I'm your healthcare companion powered by Gemini 1.5 Pro.

**How can I assist you today?**

🩺 **Health Assessment** - Describe your symptoms for guidance
💊 **Medications** - Ask about drug interactions or usage  
🏥 **General Health** - Any health-related questions
📅 **Appointments** - Help finding healthcare providers
🚨 **Emergency** - Urgent medical guidance

*Just type your question and I'll provide helpful, professional guidance!*

⚠️ Remember: I provide educational information. Always consult healthcare professionals for medical decisions."""

    # Handle thank you
    if 'thank' in message_lower:
        return f"""😊 **You're welcome, {user_name}!**

I'm happy to help! Feel free to ask if you have any more questions.

*Take care of yourself!* 💙"""

    # Handle goodbye
    if 'bye' in message_lower or 'goodbye' in message_lower:
        return f"""👋 **Goodbye {user_name}!**

Thank you for using MediCare AI. Take care of your health!

*Wishing you good health!* 🌟"""
    
    # Use Gemini 2.5 Flash - latest available model
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    
    service_context = get_service_context(service)
    
    prompt = f"""You are MediCare AI, a friendly and knowledgeable healthcare assistant.

User Name: {user_name if user_name else "User"}
Service: {service if service else "General Health"}

{service_context}

User Question: {message}

IMPORTANT GUIDELINES:
1. Provide SPECIFIC, DETAILED answers to the user's exact question
2. If asking about medications (like paracetamol), explain dosage, usage, side effects, and precautions
3. If asking about symptoms (like fever), give specific treatment advice and when to see a doctor
4. Be warm, professional, and thorough
5. Use clear formatting with headers, bullet points, and emojis
6. Always include a medical disclaimer at the end

Respond directly and specifically to what the user asked:"""

    try:
        payload = {
            "contents": [{
                "parts": [{
                    "text": prompt
                }]
            }],
            "generationConfig": {
                "temperature": 0.6,
                "topK": 32,
                "topP": 0.9,
                "maxOutputTokens": 2048,
            }
        }
        
        print(f"🔍 DEBUG: Calling Gemini API for: {message[:50]}...")
        response = requests.post(url, json=payload, timeout=30)
        print(f"🔍 DEBUG: Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"🔍 DEBUG: Response data keys: {data.keys()}")
            if 'candidates' in data and len(data['candidates']) > 0:
                ai_response = data['candidates'][0]['content']['parts'][0]['text']
                print(f"✅ DEBUG: Got AI response, length: {len(ai_response)}")
                return ai_response
            else:
                print(f"❌ DEBUG: No candidates in response: {data}")
        else:
            print(f"❌ DEBUG: API error {response.status_code}: {response.text[:500]}")
                
    except Exception as e:
        print(f"❌ DEBUG: Gemini API exception: {e}")
        
    print("🔄 DEBUG: Falling back to template response")
    return get_fallback_response(message, user_name, service)

def get_fallback_response(message: str, user_name: str = "", service: str = "") -> str:
    """Fallback response when AI APIs are unavailable."""
    if service == "health":
        return f"""🩺 **Health Assessment for {user_name}**

For your health concern: "{message}"

**General Health Guidance:**
• **Symptom Tracking**: Monitor when symptoms started and how they progress
• **Severity Assessment**: Rate symptoms as mild, moderate, or severe
• **Associated Factors**: Consider triggers, recent activities, or exposures

**When to Seek Medical Care:**
🚨 **Immediate attention for:**
- Difficulty breathing or chest pain
- High fever (above 103°F/39.4°C)
- Severe or worsening symptoms
- Signs of dehydration

**Self-Care Measures:**
• Rest and adequate sleep (7-9 hours)
• Stay hydrated with water and clear fluids
• Monitor temperature regularly
• Avoid strenuous activities

⚠️ **Medical Disclaimer**: This is educational information only. Always consult healthcare professionals for proper medical evaluation."""
    
    elif service == "insurance":
        return f"""🏥 **Insurance Information for {user_name}**

Regarding: "{message}"

**Common Insurance Services:**
📋 **Coverage Information:**
• Verify treatment coverage and benefits
• Understand deductibles and co-pays
• Find in-network providers
• Review benefits summary

💰 **Claims Assistance:**
• Submit claims properly
• Understand Explanation of Benefits (EOB)
• Appeal denied claims
• Track claim status

**Important Contacts:**
📞 Insurance customer service
📞 Provider relations
📞 Claims department

*What specific insurance question can I help you with?*"""
    
    elif service == "emergency":
        return f"""🚨 **Emergency Guidance for {user_name}**

**🆘 Call 911 immediately for:**
• Chest pain or difficulty breathing
• Severe bleeding or injuries  
• Loss of consciousness
• Stroke symptoms (FAST test)
• Severe allergic reactions

**📞 Emergency Contacts:**
• **Emergency Services:** 911
• **Poison Control:** 1-800-222-1222
• **Crisis Hotline:** 988

⚠️ **Are you experiencing a medical emergency? If yes, call 911 immediately.**"""
    
    # General response
    return f"""🏥 **MediCare AI for {user_name}**

Thank you for your question: "{message}"

**I'm here to help with comprehensive healthcare assistance:**

🩺 **Health Services:**
• Symptom analysis and guidance
• Health condition information
• Medication questions
• Wellness recommendations

🏥 **Administrative Support:**
• Insurance coverage questions
• Finding healthcare providers
• Appointment scheduling help
• Emergency guidance

⚠️ **Medical Disclaimer**: Educational information only. Always consult healthcare professionals for medical advice.

*For enhanced AI responses, ensure your Gemini API key is configured.*"""

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "MediCare AI API is running",
        "status": "healthy",
        "endpoints": {
            "chat": "/api/chat",
            "health": "/health"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    api_status = "configured" if GEMINI_API_KEY else "not configured"
    return {
        "status": "healthy",
        "gemini_api": api_status,
        "service": "MediCare AI API"
    }

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Main chat endpoint for healthcare assistance."""
    try:
        response = await get_gemini_response(
            request.message,
            request.userName,
            request.selectedService
        )
        
        return ChatResponse(response=response, success=True)
        
    except Exception as e:
        print(f"Chat error: {e}")
        fallback = get_fallback_response(request.message, request.userName, request.selectedService)
        return ChatResponse(response=fallback, success=True)

if __name__ == "__main__":
    print("🏥 Starting MediCare AI Backend...")
    print(f"Gemini API: {'✅ Configured' if GEMINI_API_KEY else '❌ Not configured'}")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
