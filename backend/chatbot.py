from typing import Optional, List, Dict, Any
import re
import json
import os
from dotenv import load_dotenv
from data_processor import OmicronDataProcessor
from api_handler import APIHandler

# Load environment variables
load_dotenv()

class MedicalChatbot:
    def __init__(self):
        """Initialize the medical chatbot with Gemini API."""
        self.data_processor = OmicronDataProcessor()
        self.api_handler = APIHandler()
        self.conversation_history = []
        self.use_ai_primary = True
        self.gemini_api_key = os.getenv('GEMINI_API_KEY')
        
    def get_response(self, user_input: str, user_name: str = "", selected_service: str = "") -> str:
        """Get chatbot response with service-specific guidance."""
        # Add user input to conversation history
        self.conversation_history.append({"role": "user", "content": user_input})
        
        # Get AI response with service context
        response = self.get_ai_response(user_input, user_name, selected_service)
        
        # Add response to conversation history
        self.conversation_history.append({"role": "assistant", "content": response})
        
        # Keep conversation history limited
        if len(self.conversation_history) > 20:
            self.conversation_history = self.conversation_history[-20:]
        
        return response
    
    def get_ai_response(self, query: str, user_name: str = "", selected_service: str = "") -> str:
        """Get AI response prioritizing general health queries over omicron data."""
        try:
            if self.gemini_api_key:
                return self.get_gemini_response(query, user_name, selected_service)
            else:
                return self.get_fallback_response(query, user_name, selected_service)
                
        except Exception as e:
            return f"I apologize, but I encountered an error processing your request: {str(e)}. Please try again."
    
    def get_gemini_response(self, query: str, user_name: str = "", selected_service: str = "") -> str:
        """Get response from Gemini API with comprehensive medical assistance."""
        import requests
        
        # Use the correct model name for current Gemini API
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.gemini_api_key}"
        
        # Create context-aware prompt
        service_context = self.get_service_context(selected_service)
        omicron_context = self.get_minimal_omicron_context() if "omicron" in query.lower() or "covid" in query.lower() else ""
        
        prompt = f"""You are MediCare AI, a comprehensive healthcare assistant. 

User: {user_name if user_name else "User"}
Service Selected: {selected_service if selected_service else "General Consultation"}

{service_context}

PRIORITY ORDER:
1. GENERAL HEALTH QUERIES (highest priority)
2. Service-specific assistance 
3. Emergency medical guidance
4. Insurance and appointment help
5. Omicron/COVID info (lowest priority - only if specifically asked)

User Query: {query}

{omicron_context}

Instructions:
- Be professional, caring, and comprehensive
- Prioritize general health guidance and service-specific help
- Provide actionable, practical advice
- Use emojis and clear formatting
- Include appropriate medical disclaimers
- If omicron/COVID mentioned, give brief helpful info but focus on general health
- Tailor response to selected service when relevant

Response format: Professional, well-structured with clear sections and helpful guidance."""

        try:
            payload = {
                "contents": [{
                    "parts": [{
                        "text": prompt
                    }]
                }],
                "generationConfig": {
                    "temperature": 0.7,
                    "topK": 40,
                    "topP": 0.95,
                    "maxOutputTokens": 1200,
                }
            }
            
            print(f"🔍 DEBUG: Making Gemini API call for query: {query[:50]}...")
            response = requests.post(url, json=payload, timeout=30)
            print(f"🔍 DEBUG: Response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if 'candidates' in data and len(data['candidates']) > 0:
                    ai_response = data['candidates'][0]['content']['parts'][0]['text']
                    print(f"✅ DEBUG: Gemini API success - response length: {len(ai_response)}")
                    return ai_response
                else:
                    print("❌ DEBUG: No candidates in Gemini response")
            else:
                print(f"❌ DEBUG: Gemini API error - Status: {response.status_code}, Response: {response.text[:200]}")
                    
        except Exception as e:
            print(f"❌ DEBUG: Gemini API exception: {e}")
            
        print("🔄 DEBUG: Falling back to default response")
        return self.get_fallback_response(query, user_name, selected_service)
    
    def process_ai_first_query(self, query: str) -> str:
        """Process query using AI APIs as primary source with data context."""
        try:
            # Get data context if available and relevant
            data_context = self.get_data_context(query)
            
            # Determine if this is a medical/health query
            if self.is_medical_health_query(query):
                return self.handle_medical_ai_query(query, data_context)
            else:
                return self.handle_general_ai_query(query, data_context)
                
        except Exception as e:
            return f"I apologize, but I encountered an error processing your request: {str(e)}. Please try again."
    
    def get_data_context(self, query: str) -> str:
        """Get relevant data context from CSV if query is related to omicron/COVID."""
        if not self.is_data_related_query(query):
            return ""
        
        try:
            # Get basic statistics
            stats = self.data_processor.get_statistics()
            if 'error' in stats:
                return ""
            
            context = f"Dataset context: {stats['total_tweets']} omicron-related tweets available. "
            
            # Try to get relevant data samples
            if any(keyword in query.lower() for keyword in ['symptom', 'experience', 'recovery', 'fever', 'cough']):
                # Get a few relevant tweets as examples
                search_terms = self.extract_search_terms(query)
                if search_terms:
                    tweets = self.data_processor.search_tweets(search_terms[0], limit=3)
                    if tweets:
                        context += f"Sample experiences from data: "
                        for tweet in tweets[:2]:
                            text = tweet.get('text', '')[:100]
                            if text:
                                context += f'"{text}..." '
            
            return context
            
        except Exception as e:
            return ""
    
    def is_data_related_query(self, query: str) -> bool:
        """Check if query might benefit from data context."""
        data_keywords = [
            'omicron', 'covid', 'coronavirus', 'symptom', 'experience', 
            'recovery', 'people', 'tweet', 'social media', 'report'
        ]
        return any(keyword in query.lower() for keyword in data_keywords)
    
    def is_medical_health_query(self, query: str) -> bool:
        """Enhanced medical query detection."""
        medical_keywords = [
            'symptom', 'disease', 'medicine', 'treatment', 'doctor', 'hospital',
            'health', 'medical', 'diagnosis', 'cure', 'therapy', 'medication',
            'covid', 'omicron', 'virus', 'vaccine', 'infection', 'fever',
            'cough', 'pain', 'sick', 'illness', 'patient', 'clinic', 'headache',
            'fatigue', 'sore throat', 'body ache', 'recovery', 'quarantine',
            'isolation', 'test', 'positive', 'negative', 'healthcare'
        ]
        
        query_lower = query.lower()
        return any(keyword in query_lower for keyword in medical_keywords)
    
    def handle_medical_ai_query(self, query: str, data_context: str = "") -> str:
        """Handle medical queries using AI with optional data context."""
        # Create comprehensive medical system message
        system_message = self.get_enhanced_medical_system_message()
        
        # Build context-aware prompt
        full_prompt = self.build_medical_prompt(query, data_context)
        
        # Get AI response
        response = self.api_handler.get_fallback_response(full_prompt, system_message)
        
        # Add disclaimer if needed
        if any(word in query.lower() for word in ['treatment', 'cure', 'medication', 'diagnosis']):
            response += "\n\n⚠️ **Medical Disclaimer**: This information is for educational purposes only. Always consult qualified healthcare professionals for medical advice, diagnosis, or treatment."
        
        return response
    
    def handle_general_ai_query(self, query: str, data_context: str = "") -> str:
        """Handle general queries using AI."""
        system_message = (
            "You are a helpful AI assistant with knowledge about medical topics and COVID-19. "
            "Provide accurate, helpful information while being friendly and informative. "
            "If discussing health topics, always remind users to consult healthcare professionals when appropriate."
        )
        
        full_prompt = query
        if data_context:
            full_prompt = f"Context: {data_context}\n\nQuestion: {query}"
        
        response = self.api_handler.get_fallback_response(full_prompt, system_message)
        
        return response
    
    def get_enhanced_medical_system_message(self) -> str:
        """Get comprehensive system message for medical queries."""
        return (
            "You are an expert medical AI assistant with comprehensive knowledge about health, "
            "diseases, symptoms, and medical care. You have special expertise in COVID-19 variants "
            "including Omicron. Provide accurate, helpful, and empathetic medical information. "
            
            "Guidelines:\n"
            "- Provide evidence-based medical information\n"
            "- Be empathetic and supportive\n"
            "- Explain medical concepts clearly\n"
            "- Always recommend consulting healthcare professionals for serious concerns\n"
            "- Reference current medical guidelines when relevant\n"
            "- If discussing COVID-19/Omicron, provide up-to-date information about symptoms, prevention, and care\n"
            "- Be precise but accessible in your explanations\n"
            
            "Remember: You're providing educational information, not personal medical advice."
        )
    
    def build_medical_prompt(self, query: str, data_context: str = "") -> str:
        """Build a comprehensive prompt for medical queries."""
        prompt_parts = []
        
        if data_context:
            prompt_parts.append(f"Available data context: {data_context}")
        
        # Add conversation context if available
        if len(self.conversation_history) > 2:
            recent_context = self.conversation_history[-4:]  # Last 2 exchanges
            context_str = "Recent conversation:\n"
            for msg in recent_context:
                role = "User" if msg["role"] == "user" else "Assistant"
                context_str += f"{role}: {msg['content'][:100]}...\n"
            prompt_parts.append(context_str)
        
        prompt_parts.append(f"Current question: {query}")
        
        return "\n\n".join(prompt_parts)
    
    def extract_search_terms(self, query: str) -> List[str]:
        """Extract search terms from user query."""
        # Remove common question words and find meaningful terms
        stop_words = {'search', 'find', 'about', 'related', 'to', 'for', 'tweets', 'data', 'omicron', 'show', 'me', 'what', 'how', 'when', 'where', 'why'}
        words = re.findall(r'\b\w+\b', query.lower())
        terms = [word for word in words if word not in stop_words and len(word) > 2]
        
        # Also look for quoted phrases
        quoted_terms = re.findall(r'"([^"]*)"', query)
        terms.extend(quoted_terms)
        
        return terms[:3]  # Limit to 3 terms to avoid overly broad searches
    
    # Keep legacy methods for backward compatibility
    def handle_data_query(self, query: str) -> str:
        """Legacy method - now redirects to AI-first approach."""
        return self.process_ai_first_query(query)
    
    def handle_medical_query(self, query: str) -> str:
        """Legacy method - now redirects to AI-first approach."""
        return self.process_ai_first_query(query)
    
    def is_data_query(self, query: str) -> bool:
        """Check if query is about omicron data analysis."""
        data_keywords = [
            'omicron', 'tweet', 'data', 'statistics', 'how many', 'count',
            'analyze', 'search', 'find', 'show me', 'tweets about',
            'dataset', 'csv', 'trends', 'summary'
        ]
        return any(keyword in query for keyword in data_keywords)
    
    def handle_data_query(self, query: str) -> str:
        """Handle queries about omicron data."""
        query_lower = query.lower()
        
        try:
            # Statistics query
            if any(word in query_lower for word in ['statistics', 'stats', 'how many', 'count', 'total']):
                stats = self.data_processor.get_statistics()
                if 'error' in stats:
                    return "I'm sorry, I couldn't load the omicron data. Please make sure the CSV file is available."
                
                response = f"📊 **Omicron Data Statistics:**\n\n"
                response += f"• Total tweets: {stats['total_tweets']}\n"
                response += f"• Data columns: {', '.join(stats['columns'])}\n"
                
                if stats['date_range']:
                    response += f"• Date range: {stats['date_range']['start']} to {stats['date_range']['end']}\n"
                
                if stats['sample_tweet']:
                    response += f"• Sample tweet: {stats['sample_tweet']}\n"
                
                return response
            
            # Search query
            elif any(word in query_lower for word in ['search', 'find', 'about', 'related to']):
                # Extract search terms
                search_terms = self.extract_search_terms(query)
                if not search_terms:
                    return "Please specify what you'd like to search for in the omicron data."
                
                results = []
                for term in search_terms:
                    tweets = self.data_processor.search_tweets(term, limit=5)
                    if tweets:
                        results.extend(tweets)
                
                if not results:
                    return f"I couldn't find any tweets related to '{', '.join(search_terms)}' in the omicron data."
                
                # Format response
                response = f"🔍 **Found {len(results)} tweets about '{', '.join(search_terms)}':**\n\n"
                for i, tweet in enumerate(results[:3], 1):
                    text = tweet.get('text', tweet.get('text_clean', 'No text available'))
                    if isinstance(text, str) and text.strip():
                        preview = text[:150] + "..." if len(text) > 150 else text
                        response += f"{i}. {preview}\n\n"
                
                if len(results) > 3:
                    response += f"... and {len(results) - 3} more tweets found."
                
                return response
            
            # Topic summary
            elif any(word in query_lower for word in ['summary', 'summarize', 'tell me about']):
                topic = self.extract_topic(query)
                if topic:
                    summary = self.data_processor.get_topic_summary(topic)
                    return f"📝 **Summary about '{topic}':**\n\n{summary}"
                else:
                    return "Please specify what topic you'd like me to summarize from the omicron data."
            
            # Sentiment analysis
            elif any(word in query_lower for word in ['sentiment', 'feeling', 'emotion', 'positive', 'negative']):
                keywords = self.data_processor.analyze_sentiment_keywords()
                if not keywords:
                    return "I couldn't analyze sentiment from the current data."
                
                response = "😊 **Sentiment Analysis of Omicron Tweets:**\n\n"
                
                # Group keywords by type
                positive_words = ['good', 'better', 'recovered', 'healing', 'hope', 'positive', 'mild']
                negative_words = ['bad', 'worse', 'sick', 'severe', 'death', 'fear', 'worried', 'negative']
                symptom_words = ['fever', 'cough', 'tired', 'headache', 'loss', 'taste', 'smell', 'sore', 'throat']
                
                for category, words in [("Positive", positive_words), ("Negative", negative_words), ("Symptoms", symptom_words)]:
                    response += f"**{category} mentions:**\n"
                    for word in words:
                        if word in keywords and keywords[word] > 0:
                            response += f"• {word}: {keywords[word]} times\n"
                    response += "\n"
                
                return response
            
            else:
                return "I can help you analyze the omicron data. Try asking for statistics, searching for specific topics, or requesting summaries!"
        
        except Exception as e:
            return f"I encountered an error while processing the omicron data: {str(e)}"
    
    def handle_medical_query(self, query: str) -> str:
        """Handle general medical queries using AI APIs."""
        system_message = self.api_handler.get_medical_system_message()
        
        # Add context about having omicron data
        context = (
            f"Context: I also have access to omicron tweet data with {len(self.data_processor.data) if not self.data_processor.data.empty else 0} tweets. "
            "If the question relates to omicron or COVID-19 experiences, I can reference this data.\n\n"
        )
        
        full_prompt = context + query
        response = self.api_handler.get_fallback_response(full_prompt, system_message)
        
        return response
    
    def handle_general_query(self, query: str) -> str:
        """Handle general queries with medical context."""
        system_message = (
            "You are a helpful AI assistant with access to omicron tweet data. "
            "Provide helpful responses and suggest how the user might explore the medical data if relevant. "
            "Be friendly and informative."
        )
        
        response = self.api_handler.get_fallback_response(query, system_message)
        
        # Add suggestion to explore data if relevant
        if any(word in query.lower() for word in ['covid', 'pandemic', 'health', 'social media']):
            response += "\n\n💡 *Tip: I also have omicron tweet data available. You can ask me to analyze or search through this data for insights!*"
        
        return response
    
    def extract_search_terms(self, query: str) -> List[str]:
        """Extract search terms from user query."""
        # Remove common question words and find meaningful terms
        stop_words = {'search', 'find', 'about', 'related', 'to', 'for', 'tweets', 'data', 'omicron', 'show', 'me'}
        words = re.findall(r'\b\w+\b', query.lower())
        terms = [word for word in words if word not in stop_words and len(word) > 2]
        
        # Also look for quoted phrases
        quoted_terms = re.findall(r'"([^"]*)"', query)
        terms.extend(quoted_terms)
        
        return terms[:3]  # Limit to 3 terms to avoid overly broad searches
    
    def extract_topic(self, query: str) -> Optional[str]:
        """Extract topic from summary request."""
        # Look for pattern "about X" or "of X"
        patterns = [
            r'about\s+(\w+(?:\s+\w+)*)',
            r'of\s+(\w+(?:\s+\w+)*)',
            r'regarding\s+(\w+(?:\s+\w+)*)',
            r'concerning\s+(\w+(?:\s+\w+)*)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, query.lower())
            if match:
                return match.group(1).strip()
        
        # If no pattern found, look for medical keywords
        medical_terms = ['symptom', 'vaccine', 'treatment', 'recovery', 'isolation', 'testing']
        for term in medical_terms:
            if term in query.lower():
                return term
        
        return 'omicron'  # Default topic
    
    def get_service_context(self, selected_service: str) -> str:
        """Get context and guidance based on selected service."""
        service_contexts = {
            "Health Assessment": """
Service: Health Status Assessment
Focus: Analyze symptoms, provide health guidance, assess conditions
""",
            "Insurance": """
Service: Insurance Information  
Focus: Healthcare coverage and insurance assistance
""",
            "Appointments": """
Service: Doctor Appointment Assistance
Focus: Medical appointment scheduling and coordination
""",
            "General Health": """
Service: General Health Queries
Focus: Comprehensive health information and guidance
""",
            "Emergency": """
Service: Emergency Guidance
Focus: Urgent medical advice and emergency assistance
""",
            "Chat Freely": """
Service: Open Healthcare Conversation
Focus: Natural conversation about health topics
"""
        }
        return service_contexts.get(selected_service, "General healthcare assistance")
    
    def get_minimal_omicron_context(self) -> str:
        """Get minimal omicron context only when specifically requested."""
        return """
Brief Omicron Reference: Mild COVID variant with sore throat, fatigue, runny nose. Recovery in 3-7 days typically.
"""
    
    def get_fallback_response(self, query: str, user_name: str = "", selected_service: str = "") -> str:
        """Comprehensive fallback response when AI APIs are unavailable."""
        query_lower = query.lower()
        
        if selected_service == "Health Assessment":
            return f"""🩺 **Health Assessment for {user_name}**

I'm here to help analyze your health concerns. For "{query[:50]}...":

**General Guidance:**
• Track symptoms and their progression
• Note severity and triggers
• Rest and stay hydrated
• Monitor for worsening

**Seek Medical Care If:**
🚨 High fever, difficulty breathing, chest pain, or severe symptoms

⚠️ Consult healthcare professionals for proper evaluation."""
        
        elif selected_service == "Insurance":
            return f"""🏥 **Insurance Help for {user_name}**

For your insurance question: "{query[:50]}..."

**Common Services:**
• Coverage verification
• Find in-network providers  
• Claims assistance
• Benefits explanation

**Next Steps:** Contact your insurance customer service for specific coverage details."""
        
        elif selected_service == "Emergency":
            return f"""🚨 **Emergency Guidance for {user_name}**

**Call 911 immediately for:**
• Chest pain or difficulty breathing
• Severe bleeding or trauma
• Loss of consciousness
• Stroke symptoms

**Basic First Aid:** Apply pressure for bleeding, cool burns with water.

*Are you experiencing a medical emergency? Call 911 if yes.*"""
        
        # General health response
        return f"""🏥 **MediCare AI for {user_name}**

Thank you for your question about: "{query[:50]}..."

**I can help with:**
• Health assessments and symptom guidance
• Insurance and appointment assistance  
• General medical information
• Emergency guidance

**For specific medical advice, please consult healthcare professionals.**

*What specific health topic can I help you with?*"""
