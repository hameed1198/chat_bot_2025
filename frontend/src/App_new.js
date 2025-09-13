import React, { useState, useRef, useEffect } from 'react';
import './index.css';

function App() {
  const [userName, setUserName] = useState('');
  const [serviceSelected, setServiceSelected] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const [conversationStarted, setConversationStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const services = {
    'health': '🩺 Health Status Assessment',
    'insurance': '🏥 Insurance Information',
    'appointments': '📅 Doctor Appointment Assistance', 
    'general': '💊 General Health Queries',
    'emergency': '🚨 Emergency Guidance',
    'chat': '💬 Chat Freely'
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleNameSubmit = () => {
    if (userName.trim()) {
      setConversationStarted(true);
    }
  };

  const handleServiceSelect = (serviceKey) => {
    setSelectedService(serviceKey);
    setServiceSelected(true);
    // Add welcome message for the selected service
    const welcomeMessage = {
      role: 'assistant',
      content: `Hello ${userName}! 👋 I'm ready to help you with ${services[serviceKey].toLowerCase()}. What would you like to know?`
    };
    setMessages([welcomeMessage]);
  };

  const resetToServiceMenu = () => {
    setServiceSelected(false);
    setSelectedService('');
    setMessages([]);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = { role: 'user', content: inputMessage };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Try to connect to Streamlit backend
      const response = await fetch('http://localhost:8503/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          userName: userName,
          selectedService: selectedService
        })
      });

      let botResponse;
      if (response.ok) {
        const data = await response.json();
        botResponse = data.response;
      } else {
        // Fallback response
        botResponse = await getMockResponse(inputMessage, selectedService);
      }

      const assistantMessage = { role: 'assistant', content: botResponse };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      // Fallback to mock response when backend is not available
      const botResponse = await getMockResponse(inputMessage, selectedService);
      const assistantMessage = { role: 'assistant', content: botResponse };
      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const getMockResponse = async (message, service) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
    
    const serviceName = services[service] || 'General Healthcare';
    const lowerMessage = message.toLowerCase();
    
    // Service-specific responses with health focus
    if (service === 'health' || lowerMessage.includes('symptom') || lowerMessage.includes('pain') || lowerMessage.includes('fever')) {
      return `🩺 **Health Assessment for ${userName}**

For your health concern: "${message}"

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

**📞 Next Steps:**
1. Contact healthcare provider for persistent symptoms
2. Call 911 for emergencies
3. Consider telemedicine for non-urgent consultations

⚠️ **Medical Disclaimer**: This is educational information only. Always consult healthcare professionals for proper medical evaluation.

*For live AI responses with your Gemini API, ensure the Streamlit backend is running at localhost:8503*`;
    }
    
    if (service === 'insurance') {
      return `🏥 **Insurance Information for ${userName}**

Regarding: "${message}"

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

**🔍 Finding Providers:**
• Locate in-network doctors and specialists
• Verify hospital coverage
• Check pharmacy benefits

**Important Contacts:**
📞 Insurance customer service
📞 Provider relations
📞 Claims department

**💡 Tips:**
• Always verify coverage before procedures
• Keep all medical documentation
• Review plan annually during open enrollment

*What specific insurance question can I help you with?*`;
    }
    
    if (service === 'emergency') {
      return `🚨 **Emergency Guidance for ${userName}**

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

**🏥 When to use Emergency Room:**
• Life-threatening conditions
• Severe trauma
• High fever with severe symptoms
• Heart attack or stroke symptoms

**🚑 Urgent Care vs ER:**
• **Urgent Care:** Minor injuries, infections, cuts
• **Emergency Room:** Life-threatening, severe injuries

**🩹 Basic First Aid:**
• **Bleeding:** Apply direct pressure
• **Burns:** Cool with running water
• **Choking:** Heimlich maneuver
• **Allergic Reactions:** Use EpiPen, call 911

⚠️ **Are you experiencing a medical emergency? If yes, call 911 immediately.**`;
    }
    
    if (service === 'appointments') {
      return `📅 **Appointment Assistance for ${userName}**

For: "${message}"

**🏥 Finding Healthcare Providers:**
• Primary Care Physicians (PCP)
• Specialists (cardiologists, dermatologists, etc.)
• Urgent Care Centers
• Walk-in Clinics

**📍 How to Find Nearby Doctors:**
1. Use insurance provider directory
2. Check Healthgrades, Zocdoc platforms
3. Get referrals from current doctor
4. Contact insurance for recommendations

**📞 Booking Appointments:**
• Call office directly
• Use online patient portals
• Consider telemedicine options
• Ask about same-day availability

**📝 Appointment Preparation:**
• Gather insurance information
• List current medications
• Prepare questions
• Bring medical history

**⏰ Typical Wait Times:**
• Primary care: 1-2 weeks
• Specialists: 2-6 weeks
• Urgent issues: Same/next day

*What type of appointment are you looking for?*`;
    }
    
    // General health response
    return `🏥 **MediCare AI for ${userName}**

Service: ${serviceName}
Question: "${message}"

**I'm here to help with comprehensive healthcare assistance:**

**🩺 Health Services:**
• Symptom analysis and guidance
• Health condition information
• Medication questions
• Wellness recommendations

**🏥 Administrative Support:**
• Insurance coverage questions
• Finding healthcare providers
• Appointment scheduling help
• Emergency guidance

**💡 For Best Results:**
• Be specific with your health questions
• Mention any relevant symptoms or concerns
• Ask about particular medical topics

**Enhanced Features:**
For real-time AI responses using your Gemini API key:
• Backend running at localhost:8503
• Live medical guidance and assistance
• Personalized health recommendations

⚠️ **Medical Disclaimer**: Educational information only. Always consult healthcare professionals for medical advice.

*How else can I assist with your healthcare needs?*`;
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Welcome Screen
  if (!conversationStarted) {
    return (
      <div className="welcome-container">
        <div className="welcome-header">
          <h1>🏥 MediCare AI Assistant</h1>
          <h3>Your Comprehensive Healthcare Companion</h3>
          <p className="welcome-subtitle">Powered by Gemini AI • Available 24/7 • Trusted Healthcare Guidance</p>
        </div>
        
        <div className="welcome-form">
          <h3>👋 Welcome! Let's get started</h3>
          <input
            type="text"
            placeholder="Please enter your name to continue..."
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleNameSubmit()}
            className="name-input"
          />
          <button 
            onClick={handleNameSubmit}
            className="start-button"
            disabled={!userName.trim()}
          >
            🚀 Start Your Healthcare Journey
          </button>
        </div>
      </div>
    );
  }

  // Service Selection Screen
  if (!serviceSelected) {
    return (
      <div className="service-container">
        <div className="service-header">
          <h2>Hello {userName}! 🌟</h2>
          <p>I'm your MediCare AI Assistant. Choose a service below or chat freely about any health topic.</p>
        </div>
        
        <div className="service-section">
          <h3>🔹 Choose Your Service:</h3>
          
          <div className="service-grid">
            <div className="service-column">
              <button 
                onClick={() => handleServiceSelect('health')}
                className="service-button health"
              >
                🩺 Health Status Assessment
              </button>
              <button 
                onClick={() => handleServiceSelect('insurance')}
                className="service-button insurance"
              >
                🏥 Insurance Information
              </button>
              <button 
                onClick={() => handleServiceSelect('appointments')}
                className="service-button appointments"
              >
                📅 Doctor Appointment
              </button>
            </div>
            
            <div className="service-column">
              <button 
                onClick={() => handleServiceSelect('general')}
                className="service-button general"
              >
                💊 General Health Queries
              </button>
              <button 
                onClick={() => handleServiceSelect('emergency')}
                className="service-button emergency"
              >
                🚨 Emergency Guidance
              </button>
              <button 
                onClick={() => handleServiceSelect('chat')}
                className="service-button chat primary"
              >
                💬 Chat Freely
              </button>
            </div>
          </div>
          
          <div className="service-descriptions">
            <h4>📋 Service Descriptions:</h4>
            <ul>
              <li><strong>Health Assessment:</strong> Analyze symptoms, get health guidance, understand conditions</li>
              <li><strong>Insurance Info:</strong> Coverage questions, claims help, policy information</li>
              <li><strong>Doctor Appointments:</strong> Find nearby doctors, book appointments, get referrals</li>
              <li><strong>General Health:</strong> Medication info, health tips, preventive care</li>
              <li><strong>Emergency:</strong> Urgent medical advice, emergency contacts, first aid</li>
              <li><strong>Chat Freely:</strong> Ask any health-related question in natural conversation</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Chat Interface
  return (
    <div className="app">
      <div className="chat-header">
        <div className="header-content">
          <h2>💬 {services[selectedService]} - {userName}</h2>
          <button onClick={resetToServiceMenu} className="change-service-btn">
            🔄 Change Service
          </button>
        </div>
      </div>

      <div className="chat-container">
        <div className="messages-container">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.role}`}>
              <div className="message-content">
                <div className="message-text" dangerouslySetInnerHTML={{
                  __html: message.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n/g, '<br/>')
                    .replace(/• /g, '• ')
                }} />
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message assistant">
              <div className="message-content">
                <div className="typing-indicator">
                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  MediCare AI is thinking...
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-container">
          <div className="input-wrapper">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Ask me anything about ${services[selectedService].toLowerCase()}...`}
              className="message-input"
              rows="1"
              disabled={isLoading}
            />
            <button 
              onClick={sendMessage} 
              className="send-button"
              disabled={!inputMessage.trim() || isLoading}
            >
              <span className="send-icon">➤</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
