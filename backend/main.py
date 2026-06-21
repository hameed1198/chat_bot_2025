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
    latitude: float = None
    longitude: float = None

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
        "appointments": """You are a doctor appointment coordinator for MediCare AI. When a user asks about finding a nearby doctor or hospital, ALWAYS respond with a structured list of well-known hospitals and clinics. Format your response as follows:
1. List 5-7 hospitals/clinics with these details for each:
   - Hospital name with emoji
   - Address
   - Phone number
   - Availability hours (e.g., Mon-Fri 8AM-8PM, Sat 9AM-5PM, Emergency 24/7)
   - Specialties offered
   - How to book (walk-in / call / online)
2. After the list, add tips for choosing and booking.
3. Always end with a medical disclaimer.
Note: State clearly these are representative examples and users should verify current details. Help with appointment scheduling and preparation for medical visits.""",
        "general": "You are a general health advisor. Provide information about medications, health tips, and preventive care.",
        "emergency": "You are an emergency guidance specialist. Provide first aid information, emergency contacts, and urgent care guidance.",
        "chat": "You are a comprehensive healthcare assistant. Answer any health-related questions with professional medical guidance."
    }
    return service_contexts.get(service, "You are a healthcare assistant providing general medical information.")

def get_location_name(latitude: float, longitude: float) -> str:
    """Reverse-geocode coordinates to a human-readable city name using Nominatim."""
    try:
        url = f"https://nominatim.openstreetmap.org/reverse?lat={latitude}&lon={longitude}&format=json"
        resp = requests.get(url, headers={"User-Agent": "MediCareAI/1.0"}, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            addr = data.get("address", {})
            city = (
                addr.get("city")
                or addr.get("town")
                or addr.get("village")
                or addr.get("county", "")
            )
            state = addr.get("state", "")
            country = addr.get("country", "")
            parts = [p for p in [city, state, country] if p]
            return ", ".join(parts)
    except Exception as e:
        print(f"⚠️ Nominatim geocode failed: {e}")
    return ""

async def get_gemini_response(message: str, user_name: str = "", service: str = "", latitude: float = None, longitude: float = None) -> str:
    """Get response from Gemini API."""
    if not GEMINI_API_KEY:
        return get_fallback_response(message, user_name, service)
    
    # Handle greetings first
    message_lower = message.lower().strip()
    greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'howdy', 'hola']
    if message_lower in greetings or message_lower.rstrip('!') in greetings:
        return f"""👋 **Hello {user_name}!**

Welcome to MediCare AI! I'm your healthcare companion powered by Gemini 2.5 Flash.

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
    
    # Build location context for the prompt
    location_context = ""
    if latitude is not None and longitude is not None:
        location_name = get_location_name(latitude, longitude)
        if location_name:
            location_context = f"""
USER LOCATION (from GPS): {location_name} (coordinates: {latitude:.4f}°, {longitude:.4f}°)
🚨 CRITICAL: The user is physically located in {location_name}. You MUST provide hospitals/clinics 
that are actually in or near {location_name}. DO NOT use US, California, or any other country's hospitals 
unless the user is actually there. Provide real, well-known hospitals specific to this city/region."""
        else:
            location_context = f"""
USER LOCATION (GPS coordinates): {latitude:.4f}°N, {longitude:.4f}°E
🚨 CRITICAL: Use these GPS coordinates to determine the user's city and country. 
Provide hospitals/clinics that are actually near these coordinates. DO NOT default to US addresses."""
    
    prompt = f"""You are MediCare AI, a friendly and knowledgeable healthcare assistant.

User Name: {user_name if user_name else "User"}
Service: {service if service else "General Health"}
{location_context}

{service_context}

User Question: {message}

IMPORTANT GUIDELINES:
1. Provide SPECIFIC, DETAILED answers to the user's exact question
2. If asking about medications (like paracetamol), explain dosage, usage, side effects, and precautions
3. If asking about symptoms (like fever), give specific treatment advice and when to see a doctor
4. Be warm, professional, and thorough
5. Use clear formatting with headers, bullet points, and emojis
6. Always include a medical disclaimer at the end
7. If location is provided, ONLY suggest hospitals/clinics in that actual city/region

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
    
    elif service == "appointments":
        return f"""📅 **Nearest Hospitals & Clinics for {user_name}**

For your query: "{message}"

*Note: These are representative hospitals. Please verify current details before visiting.*

---

🏥 **1. City General Hospital**
📍 123 Main Street, Downtown
📞 (555) 100-2000
🕐 Mon–Fri: 8:00 AM – 8:00 PM | Sat: 9:00 AM – 5:00 PM | Emergency: 24/7
🩺 Specialties: General Medicine, Cardiology, Orthopedics, Pediatrics
📝 Booking: Walk-in or call to schedule

---

🏥 **2. Metro Medical Center**
📍 456 Oak Avenue, Midtown
📞 (555) 200-3000
🕐 Mon–Sat: 7:00 AM – 9:00 PM | Sunday: 9:00 AM – 5:00 PM | Emergency: 24/7
🩺 Specialties: Internal Medicine, Neurology, Dermatology, Surgery
📝 Booking: Online portal or phone

---

🏥 **3. Community Health Clinic**
📍 789 Elm Road, Westside
📞 (555) 300-4000
🕐 Mon–Fri: 9:00 AM – 6:00 PM | Sat: 10:00 AM – 2:00 PM
🩺 Specialties: Family Medicine, Women's Health, Vaccinations
📝 Booking: Walk-in accepted, appointments preferred

---

🏥 **4. Sunrise Urgent Care**
📍 321 Pine Street, Eastside
📞 (555) 400-5000
🕐 Daily: 8:00 AM – 10:00 PM (No appointment needed)
🩺 Specialties: Urgent Care, Minor Injuries, X-Ray, Lab Services
📝 Booking: Walk-in only

---

🏥 **5. St. Mary's Specialty Hospital**
📍 654 Maple Drive, North District
📞 (555) 500-6000
🕐 Mon–Fri: 8:00 AM – 7:00 PM | Emergency: 24/7
🩺 Specialties: Oncology, Cardiology, Neurosurgery, Transplants
📝 Booking: Referral or direct appointment by phone

---

**📋 Tips for Booking:**
• Call ahead to confirm availability and insurance acceptance
• Bring your ID, insurance card, and list of current medications
• Mention urgency when booking — same-day slots may be available
• For non-emergency visits, morning slots are usually less busy

⚠️ **Medical Disclaimer**: This is educational information only. Always verify hospital details directly. For emergencies, call 911 immediately."""

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
            request.selectedService,
            request.latitude,
            request.longitude
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
