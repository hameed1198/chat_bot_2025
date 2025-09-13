import os
from typing import Optional
import requests
import json

class APIHandler:
    def __init__(self):
        """Initialize API handlers for OpenAI and Gemini."""
        self.setup_apis()
    
    def setup_apis(self):
        """Setup API clients with environment variables."""
        self.openai_api_key = os.getenv('OPENAI_API_KEY')
        self.gemini_api_key = os.getenv('GEMINI_API_KEY')
        
        if self.openai_api_key:
            print("OpenAI API key found")
        if self.gemini_api_key:
            print("Gemini API key found")
        
        if not self.openai_api_key and not self.gemini_api_key:
            print("No API keys found - will use mock responses")
    
    def get_openai_response(self, prompt: str, system_message: str = "") -> Optional[str]:
        """Get response from OpenAI API using direct HTTP requests."""
        if not self.openai_api_key:
            return None
        
        try:
            url = "https://api.openai.com/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {self.openai_api_key}",
                "Content-Type": "application/json"
            }
            
            messages = []
            if system_message:
                messages.append({"role": "system", "content": system_message})
            messages.append({"role": "user", "content": prompt})
            
            data = {
                "model": "gpt-3.5-turbo",  # Free tier model
                "messages": messages,
                "max_tokens": 1000,
                "temperature": 0.7
            }
            
            response = requests.post(url, headers=headers, json=data, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            return result['choices'][0]['message']['content'].strip()
            
        except Exception as e:
            print(f"OpenAI API error: {e}")
            return None
    
    def get_gemini_response(self, prompt: str, system_message: str = "") -> Optional[str]:
        """Get response from Gemini API using direct HTTP requests."""
        if not self.gemini_api_key:
            return None
        
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={self.gemini_api_key}"
            
            # Combine system message and prompt
            full_prompt = prompt
            if system_message:
                full_prompt = f"{system_message}\n\nUser Question: {prompt}"
            
            data = {
                "contents": [{
                    "parts": [{
                        "text": full_prompt
                    }]
                }],
                "generationConfig": {
                    "temperature": 0.7,
                    "topK": 40,
                    "topP": 0.95,
                    "maxOutputTokens": 1000,
                }
            }
            
            response = requests.post(url, json=data, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            if 'candidates' in result and len(result['candidates']) > 0:
                content = result['candidates'][0]['content']['parts'][0]['text']
                return content.strip()
            else:
                return None
                
        except Exception as e:
            print(f"Gemini API error: {e}")
            return None
    
    def get_fallback_response(self, prompt: str, system_message: str = "") -> str:
        """Get response from available APIs with intelligent fallback."""
        # Try Gemini first (more generous free tier)
        response = self.get_gemini_response(prompt, system_message)
        if response:
            return response
        
        # Fallback to OpenAI
        response = self.get_openai_response(prompt, system_message)
        if response:
            return response
        
        # If both APIs fail, provide intelligent mock response
        return self.get_intelligent_mock_response(prompt, system_message)
    
    def get_intelligent_mock_response(self, prompt: str, system_message: str = "") -> str:
        """Generate intelligent mock responses when APIs are unavailable."""
        prompt_lower = prompt.lower()
        
        # Medical/health queries
        if any(word in prompt_lower for word in ['symptom', 'omicron', 'covid', 'fever', 'cough', 'health']):
            return self.get_medical_mock_response(prompt)
        
        # Data analysis queries
        elif any(word in prompt_lower for word in ['analyze', 'data', 'statistics', 'trend']):
            return self.get_data_analysis_mock_response(prompt)
        
        # General queries
        else:
            return self.get_general_mock_response(prompt)
    
    def get_medical_mock_response(self, prompt: str) -> str:
        """Generate medical-focused mock response."""
        prompt_lower = prompt.lower()
        
        if 'omicron' in prompt_lower or 'covid' in prompt_lower:
            return """**About Omicron Variant:**

Omicron is a variant of COVID-19 that was first identified in November 2021. Based on current medical knowledge:

**Common Symptoms:**
• Sore throat (often the first symptom)
• Fatigue and body aches
• Runny or stuffy nose
• Headache
• Mild fever
• Dry cough

**Key Characteristics:**
• Generally milder symptoms compared to previous variants
• Higher transmissibility but often shorter illness duration
• Most people recover within 3-7 days
• Breakthrough infections possible even in vaccinated individuals

**Important Reminders:**
⚠️ This information is for educational purposes only
🏥 Always consult healthcare professionals for medical advice
📞 Seek immediate medical attention for severe symptoms

*Note: I'm currently running in offline mode. For real-time medical information, please add your API keys or consult current medical sources.*"""
        
        elif any(word in prompt_lower for word in ['symptom', 'fever', 'cough', 'headache']):
            return """**General Health Information:**

Common symptoms you asked about can have various causes. Here's general guidance:

**When to monitor symptoms:**
• Mild symptoms that persist or worsen
• Fever above 100.4°F (38°C)
• Difficulty breathing
• Persistent cough

**Self-care measures:**
• Rest and adequate sleep
• Stay hydrated
• Monitor temperature
• Isolate if feeling unwell

**Seek medical attention if:**
🚨 Difficulty breathing or shortness of breath
🚨 Persistent chest pain or pressure
🚨 High fever that doesn't respond to medication
🚨 Severe headache or confusion

⚠️ **Important**: This is general information only. Contact healthcare providers for personal medical advice.

*Note: For personalized AI responses, please configure API keys in the backend.*"""
        
        else:
            return """**Medical Information Request:**

I'd be happy to help with medical information! However, I'm currently running in offline mode without access to real-time AI APIs.

**What I can help with:**
• General health information
• COVID-19 and Omicron variant details
• Symptom guidance
• When to seek medical care

**For the best experience:**
1. Add your Gemini or OpenAI API key to the backend
2. This will enable real-time, personalized medical assistance

**Always remember:**
🏥 Consult healthcare professionals for medical advice
⚠️ This chatbot provides educational information only

*To enable full AI capabilities, please add API keys to your .env file.*"""
    
    def get_data_analysis_mock_response(self, prompt: str) -> str:
        """Generate data analysis mock response."""
        return """**Data Analysis Request:**

I understand you're interested in analyzing data! Here's what I can tell you:

**Current Dataset:**
📊 17,046 omicron-related tweets
📅 Various dates and timeframes
🌍 Global user experiences and reports

**Analysis Capabilities:**
• Symptom frequency analysis
• Recovery time patterns
• Geographic distribution
• Sentiment trends over time

**For Enhanced Analysis:**
To get real-time AI-powered data insights, please:
1. Add your Gemini API key (free tier available)
2. Or add OpenAI API key for detailed analysis

**Sample Insights Available:**
• Most reported symptoms: sore throat, fatigue, headache
• Average recovery time: 3-7 days
• Positive sentiment towards milder symptoms

*Enable AI APIs for dynamic, personalized data analysis and insights.*"""
    
    def get_general_mock_response(self, prompt: str) -> str:
        """Generate general mock response."""
        return f"""**AI Assistant Response:**

Thank you for your question: "{prompt[:100]}..."

I'm currently running in offline mode, but I can still help! Here's what's available:

**Current Capabilities:**
🤖 Medical information and guidance
📊 Basic data analysis from omicron dataset
🏥 Health and safety recommendations
💬 General conversation and assistance

**Enhanced Features Available:**
To unlock full AI capabilities with personalized, intelligent responses:

1. **Add Gemini API Key** (Recommended - Free tier)
   - Visit: https://makersuite.google.com/app/apikey
   - Add to backend/.env: GEMINI_API_KEY=your_key

2. **Add OpenAI API Key** (Alternative)
   - Visit: https://platform.openai.com/api-keys
   - Add to backend/.env: OPENAI_API_KEY=your_key

**Why Add API Keys?**
✨ Real-time intelligent responses
🎯 Personalized medical assistance
📈 Advanced data analysis
🔄 Dynamic conversation capabilities

*I'm here to help even in offline mode! Ask me about medical topics or omicron data.*"""
    
    def is_medical_query(self, query: str) -> bool:
        """Determine if a query is medical-related."""
        medical_keywords = [
            'symptom', 'disease', 'medicine', 'treatment', 'doctor', 'hospital',
            'health', 'medical', 'diagnosis', 'cure', 'therapy', 'medication',
            'covid', 'omicron', 'virus', 'vaccine', 'infection', 'fever',
            'cough', 'pain', 'sick', 'illness', 'patient', 'clinic'
        ]
        
        query_lower = query.lower()
        return any(keyword in query_lower for keyword in medical_keywords)
    
    def get_medical_system_message(self) -> str:
        """Get system message for medical queries."""
        return (
            "You are a helpful medical AI assistant with expertise in COVID-19 and general health. "
            "Provide accurate, helpful information about medical topics, symptoms, and health guidance. "
            "Always remind users to consult healthcare professionals for serious medical concerns. "
            "Be empathetic, informative, and professional. When discussing COVID-19 or omicron, "
            "reference current medical guidelines and evidence-based information."
        )
    
    def is_medical_query(self, query: str) -> bool:
        """Determine if a query is medical-related."""
        medical_keywords = [
            'symptom', 'disease', 'medicine', 'treatment', 'doctor', 'hospital',
            'health', 'medical', 'diagnosis', 'cure', 'therapy', 'medication',
            'covid', 'omicron', 'virus', 'vaccine', 'infection', 'fever',
            'cough', 'pain', 'sick', 'illness', 'patient', 'clinic'
        ]
        
        query_lower = query.lower()
        return any(keyword in query_lower for keyword in medical_keywords)
    
    def get_medical_system_message(self) -> str:
        """Get system message for medical queries."""
        return (
            "You are a helpful medical AI assistant. Provide accurate, helpful information "
            "about medical topics, but always remind users to consult healthcare professionals "
            "for serious medical concerns. Be empathetic and informative. "
            "If discussing COVID-19 or omicron, reference current medical guidelines."
        )
