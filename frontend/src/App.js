import React, { useState, useRef, useEffect } from 'react';
import './index.css';

function App() {
  const [userName, setUserName] = useState('');
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
    setMessages([{
      role: 'assistant',
      content: `Hello ${userName}! 👋 I'm ready to help you with ${services[serviceKey].toLowerCase()}. What would you like to know?`
    }]);
  };

  const resetChat = () => {
    setSelectedService('');
    setMessages([]);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = { role: 'user', content: inputMessage };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    const lowerMsg = inputMessage.toLowerCase();
    const isHospitalQuery = selectedService === 'appointments' ||
      lowerMsg.includes('hospital') || lowerMsg.includes('nearest doctor') ||
      lowerMsg.includes('clinic') || lowerMsg.includes('near me') ||
      lowerMsg.includes('doctor near') || lowerMsg.includes('appointment') ||
      (lowerMsg.includes('book') && lowerMsg.includes('doctor'));

    // Auto-select service if none chosen based on message keywords
    if (!selectedService) {
      if (lowerMsg.includes('hospital') || lowerMsg.includes('appointment') || lowerMsg.includes('doctor near') || lowerMsg.includes('clinic') || lowerMsg.includes('near me')) {
        setSelectedService('appointments');
      } else if (lowerMsg.includes('emergency') || lowerMsg.includes('urgent') || lowerMsg.includes('911')) {
        setSelectedService('emergency');
      } else if (lowerMsg.includes('insurance') || lowerMsg.includes('coverage') || lowerMsg.includes('claim')) {
        setSelectedService('insurance');
      } else if (lowerMsg.includes('symptom') || lowerMsg.includes('pain') || lowerMsg.includes('fever') || lowerMsg.includes('sick')) {
        setSelectedService('health');
      } else {
        setSelectedService('chat');
      }
    }

    let locationCoords = null;

    if (isHospitalQuery) {
      try {
        const locationData = await getNearbyHospitals();
        // Always store coords so we can send them to the backend
        locationCoords = { latitude: locationData.latitude, longitude: locationData.longitude };
        const formatted = formatHospitalResults(locationData.elements, locationData.latitude, locationData.longitude);
        if (formatted) {
          setMessages(prev => [...prev, { role: 'assistant', content: formatted }]);
          setIsLoading(false);
          return;
        }
        // Overpass returned 0 named results — fall through to backend WITH coordinates
      } catch (err) {
        // Location permission denied
        if (err.code === 1) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `📍 **Location Access Required**\n\nTo show you **real nearby hospitals**, I need access to your location.\n\n**How to enable:**\n• Click the 🔒 padlock icon in your browser's address bar\n• Set **Location** to **Allow**\n• Then send your message again\n\n*Alternatively, tell me your city name and I can provide general guidance.*`
          }]);
          setIsLoading(false);
          return;
        }
        // Other errors (timeout, API down) — fall through to backend API without coordinates
      }
    }

    try {
      // API call to FastAPI backend — include location coords if available
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          userName: userName,
          selectedService: selectedService,
          ...(locationCoords && {
            latitude: locationCoords.latitude,
            longitude: locationCoords.longitude
          })
        })
      });

      let botResponse;
      if (response.ok) {
        const data = await response.json();
        botResponse = data.response;
      } else {
        botResponse = await getMockResponse(inputMessage, selectedService);
      }

      const assistantMessage = { role: 'assistant', content: botResponse };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const botResponse = await getMockResponse(inputMessage, selectedService);
      const assistantMessage = { role: 'assistant', content: botResponse };
      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch real nearby hospitals using browser geolocation + OpenStreetMap Overpass API
  const getNearbyHospitals = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const query = `[out:json][timeout:25];
(
  node["amenity"="hospital"](around:10000,${latitude},${longitude});
  way["amenity"="hospital"](around:10000,${latitude},${longitude});
  node["amenity"="clinic"](around:10000,${latitude},${longitude});
  way["amenity"="clinic"](around:10000,${latitude},${longitude});
  node["healthcare"="hospital"](around:10000,${latitude},${longitude});
  node["amenity"="doctors"](around:5000,${latitude},${longitude});
);
out center;`;
            const res = await fetch('https://overpass-api.de/api/interpreter', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: `data=${encodeURIComponent(query)}`
            });
            const data = await res.json();
            resolve({ elements: data.elements || [], latitude, longitude });
          } catch (err) {
            reject(err);
          }
        },
        (error) => reject(error),
        { timeout: 10000, maximumAge: 300000 }
      );
    });
  };

  // Format Overpass API results into a readable hospital list
  const formatHospitalResults = (elements, userLat, userLon) => {
    const getCoords = (el) => {
      if (el.type === 'node' && el.lat) return { lat: el.lat, lon: el.lon };
      if (el.center) return { lat: el.center.lat, lon: el.center.lon };
      return null;
    };

    const calcDistance = (lat, lon) => {
      const R = 6371;
      const dLat = (lat - userLat) * Math.PI / 180;
      const dLon = (lon - userLon) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(userLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
      return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
    };

    const hospitals = elements
      .filter(el => el.tags && el.tags.name)
      .map(el => {
        const coords = getCoords(el);
        const dist = coords ? parseFloat(calcDistance(coords.lat, coords.lon)) : Infinity;
        return { ...el, dist, coords };
      })
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 8);

    if (hospitals.length === 0) return null;

    let result = `📍 **Real-Time Nearby Hospitals for ${userName}**\n\n`;
    result += `*${hospitals.length} healthcare facilities found within 10km of your location*\n\n---\n\n`;

    hospitals.forEach((h, i) => {
      const t = h.tags;
      result += `🏥 **${i + 1}. ${t.name}**\n`;
      if (h.dist !== Infinity) result += `📏 **Distance:** ~${h.dist} km away\n`;

      const addrParts = [t['addr:housenumber'], t['addr:street'], t['addr:suburb'], t['addr:city']].filter(Boolean);
      if (addrParts.length) result += `📍 **Address:** ${addrParts.join(', ')}\n`;

      const phone = t.phone || t['contact:phone'];
      if (phone) result += `📞 **Phone:** ${phone}\n`;

      if (t.opening_hours) result += `⏰ **Hours:** ${t.opening_hours}\n`;
      if (t.emergency === 'yes') result += `🚨 **Emergency:** Available 24/7\n`;
      if (t.speciality) result += `🩺 **Speciality:** ${t.speciality}\n`;

      const website = t.website || t['contact:website'];
      if (website) result += `🌐 **Website:** ${website}\n`;

      if (h.coords) {
        result += `🗺️ **Map:** https://maps.google.com/?q=${h.coords.lat},${h.coords.lon}\n`;
      }
      result += `\n---\n\n`;
    });

    result += `\n💡 **Booking Tips:**\n`;
    result += `• Call ahead to confirm availability and insurance acceptance\n`;
    result += `• Bring your ID, insurance card, and current medication list\n`;
    result += `• For non-emergency visits, morning slots are usually less busy\n\n`;
    result += `⚠️ *Data from OpenStreetMap. Verify details before visiting. For emergencies, call 911 immediately.*`;
    return result;
  };

  const getMockResponse = async (message, service) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));
    
    const lowerMessage = message.toLowerCase().trim();
    
    // Handle greetings naturally
    const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'howdy'];
    if (greetings.includes(lowerMessage) || greetings.includes(lowerMessage.replace('!', ''))) {
      return `👋 **Hello ${userName}!**

Welcome to MediCare AI! I'm your healthcare companion powered by Gemini 2.5 Flash.

**How can I assist you today?**

🩺 **Health Assessment** - Describe your symptoms for guidance
💊 **Medications** - Ask about drug interactions or usage  
🏥 **General Health** - Any health-related questions
📅 **Appointments** - Help finding healthcare providers
🚨 **Emergency** - Urgent medical guidance

*Just type your question and I'll provide helpful guidance!*`;
    }
    
    // Handle thank you
    if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
      return `😊 **You're welcome, ${userName}!**

I'm happy to help! Feel free to ask if you have any more questions.

*Take care of yourself!* 💙`;
    }
    
    // Handle goodbye
    if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye')) {
      return `👋 **Goodbye ${userName}!**

Thank you for using MediCare AI. Take care of your health!

*Wishing you good health!* 🌟`;
    }
    
    const serviceName = services[service] || 'General Healthcare';
    
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

⚠️ **Medical Disclaimer**: This is educational information only. Always consult healthcare professionals for proper medical evaluation.`;
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
    
    if (service === 'appointments' || lowerMessage.includes('nearest doctor') || lowerMessage.includes('hospital') || lowerMessage.includes('clinic') || lowerMessage.includes('appointment')) {
      return `� **Location Access Needed for ${userName}**

To show you **real nearby hospitals and clinics**, please allow location access in your browser when prompted.

**How to enable location:**
• Click the 🔒 padlock icon in your browser address bar
• Set **Location** to **Allow**
• Send your message again

Once location is enabled, I'll show you:
🏥 Real hospitals within 10km of you
📞 Actual phone numbers and contacts
⏰ Real availability and opening hours
📏 Distance from your current location
🗺️ Google Maps links for directions

⚠️ *For emergencies, call 911 immediately.*`;
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

⚠️ **Medical Disclaimer**: Educational information only. Always consult healthcare professionals for medical advice.

*How else can I assist with your healthcare needs?*`;
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Welcome Screen — name entry only
  if (!conversationStarted) {
    return (
      <div className="welcome-container">
        <div className="welcome-header">
          <h1>🏥 MediCare AI Assistant</h1>
          <h3>Your Comprehensive Healthcare Companion</h3>
          <p className="welcome-subtitle">Powered by Gemini 2.5 Flash AI • Available 24/7 • Trusted Healthcare Guidance</p>
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

  // ── Single-page layout: header + service pills + chat + input ──
  const suggestionChips = [
    { label: '🤒 I have a headache', service: 'health' },
    { label: '🏥 Find nearest hospital', service: 'appointments' },
    { label: '📋 Check insurance coverage', service: 'insurance' },
    { label: '🚨 Emergency guidance', service: 'emergency' },
    { label: '💊 Medication question', service: 'general' },
    { label: '💬 Chat freely', service: 'chat' },
  ];

  return (
    <div className="app">

      {/* ── Header ── */}
      <div className="chat-header">
        <div className="header-left">
          <span className="app-logo">🏥 MediCare AI</span>
          {selectedService && (
            <span className={`active-service-badge svc-${selectedService}`}>
              {services[selectedService]}
            </span>
          )}
        </div>
        <div className="header-right">
          <span className="user-greeting">Hello {userName}! 👋</span>
          {messages.length > 0 && (
            <button onClick={resetChat} className="change-service-btn">
              🔄 New Chat
            </button>
          )}
        </div>
      </div>

      {/* ── Service Pills Bar ── */}
      <div className="service-bar">
        {Object.entries(services).map(([key, label]) => (
          <button
            key={key}
            className={`service-pill svc-${key}${selectedService === key ? ' active' : ''}`}
            onClick={() => handleServiceSelect(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Chat Area ── */}
      <div className="chat-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💬</div>
            <h3>How can I help you today, {userName}?</h3>
            <p>Select a service above, click a suggestion, or type your question below</p>
            <div className="suggestion-chips">
              {suggestionChips.map(({ label, service }) => (
                <button
                  key={label}
                  className="suggestion-chip"
                  onClick={() => {
                    handleServiceSelect(service);
                    setInputMessage(label.replace(/^\S+\s/, ''));
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="messages-container">
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.role}`}>
                <div className="message-content">
                  <div className="message-text" dangerouslySetInnerHTML={{
                    __html: message.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
                      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
                      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
                      .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
                      .replace(/(https?:\/\/[^\s<"]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
                      .replace(/\n/g, '<br/>')
                  }} />
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message assistant">
                <div className="message-content">
                  <div className="typing-indicator">
                    <div className="typing-dots">
                      <span></span><span></span><span></span>
                    </div>
                    <span className="typing-text">✨ Analyzing with Gemini 2.5 Flash...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ── Input Bar ── */}
      <div className="input-container">
        <div className="input-wrapper">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              selectedService
                ? `Ask me anything about ${services[selectedService].toLowerCase()}...`
                : 'Type your health question or select a service above...'
            }
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
  );
}

export default App;
