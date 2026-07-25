import React, { lazy, useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import AppHeader from './components/layout/AppHeader';
import ServiceBar from './components/layout/ServiceBar';
import ChatStage from './components/layout/ChatStage';
import { SERVICE_LABELS } from './config/services';
import {
  SERVICE_CHAT_MOTION,
  MOTION_MODE_PROFILE,
  MOTION_OPTIONS,
  MOTION_PREF_STORAGE_KEY,
  detectAutoMotionMode,
  getStoredMotionPreference
} from './config/motionConfig';
import './index.css';

const ImmersiveHeroScene = lazy(() => import('./components/3d/ImmersiveHeroScene'));

function App() {
  const [userName, setUserName] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [previewService, setPreviewService] = useState('');
  const [motionPreference, setMotionPreference] = useState(getStoredMotionPreference);
  const [autoMotionMode, setAutoMotionMode] = useState(detectAutoMotionMode);
  const [conversationStarted, setConversationStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const serviceBarRef = useRef(null);
  const chatStageRef = useRef(null);

  const services = SERVICE_LABELS;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const updateAutoMode = () => {
      setAutoMotionMode(detectAutoMotionMode());
    };

    updateAutoMode();
    window.addEventListener('resize', updateAutoMode);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateAutoMode);
    } else {
      mediaQuery.addListener(updateAutoMode);
    }

    return () => {
      window.removeEventListener('resize', updateAutoMode);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', updateAutoMode);
      } else {
        mediaQuery.removeListener(updateAutoMode);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(MOTION_PREF_STORAGE_KEY, motionPreference);
    } catch {
      // Ignore storage failures to keep motion controls functional in restricted environments.
    }
  }, [motionPreference]);

  useEffect(() => {
    if (!conversationStarted) {
      return;
    }

    const effectiveMotionMode = motionPreference === 'auto' ? autoMotionMode : motionPreference;
    const motionProfile = MOTION_MODE_PROFILE[effectiveMotionMode] || MOTION_MODE_PROFILE.balanced;

    const timeline = gsap.timeline({ defaults: { ease: 'power2.out' } });

    if (serviceBarRef.current) {
      timeline.fromTo(
        serviceBarRef.current,
        { y: -8 * motionProfile.distanceScale, opacity: 0.85 },
        { y: 0, opacity: 1, duration: 0.25 * motionProfile.durationScale }
      );
    }

    if (chatStageRef.current) {
      timeline.fromTo(
        chatStageRef.current,
        {
          y: 14 * motionProfile.distanceScale,
          opacity: 0.78,
          filter: `blur(${(4 * motionProfile.blurScale).toFixed(2)}px)`
        },
        { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.45 * motionProfile.durationScale },
        '-=0.1'
      );
    }
  }, [selectedService, conversationStarted, motionPreference, autoMotionMode]);

  const handleNameSubmit = () => {
    if (userName.trim()) {
      setConversationStarted(true);
    }
  };

  const handleServiceSelect = (serviceKey, pillElement) => {
    const effectiveMotionMode = motionPreference === 'auto' ? autoMotionMode : motionPreference;
    const motionProfile = MOTION_MODE_PROFILE[effectiveMotionMode] || MOTION_MODE_PROFILE.balanced;

    if (pillElement) {
      gsap.fromTo(
        pillElement,
        { scale: 1 },
        {
          scale: 1 + (0.04 * motionProfile.distanceScale),
          duration: 0.12 * motionProfile.durationScale,
          yoyo: true,
          repeat: 1,
          ease: 'power1.inOut'
        }
      );
    }

    setSelectedService(serviceKey);
    setPreviewService('');
    setMessages([{
      role: 'assistant',
      content: `Hello ${userName}! 👋 I'm ready to help you with ${services[serviceKey].toLowerCase()}. What would you like to know?`
    }]);
  };

  const handleServicePreview = (serviceKey) => {
    if (!services[serviceKey]) {
      return;
    }

    setPreviewService(serviceKey);
  };

  const clearServicePreview = () => {
    setPreviewService('');
  };

  const handleSuggestionSelect = (label, service) => {
    handleServiceSelect(service);
    setInputMessage(label.replace(/^\S+\s/, ''));
  };

  const resetChat = () => {
    setSelectedService('');
    setPreviewService('');
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

    const locationContext = {
      isHospitalQuery,
      attemptedLookup: false,
      hasCoords: false,
      lookupError: null
    };

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
      locationContext.attemptedLookup = true;
      try {
        const locationData = await getNearbyHospitals();
        // Always store coords so we can send them to the backend
        locationCoords = { latitude: locationData.latitude, longitude: locationData.longitude };
        locationContext.hasCoords = true;
        const formatted = formatHospitalResults(locationData.elements, locationData.latitude, locationData.longitude);
        if (formatted) {
          setMessages(prev => [...prev, { role: 'assistant', content: formatted }]);
          setIsLoading(false);
          return;
        }
        locationContext.lookupError = 'no_results';
        // Overpass returned 0 named results — fall through to backend WITH coordinates
      } catch (err) {
        // Location permission denied
        if (err.code === 1) {
          locationContext.lookupError = 'permission_denied';
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `📍 **Location Access Required**\n\nTo show you **real nearby hospitals**, I need access to your location.\n\n**How to enable:**\n• Click the 🔒 padlock icon in your browser's address bar\n• Set **Location** to **Allow**\n• Then send your message again\n\n*Alternatively, tell me your city name and I can provide general guidance.*`
          }]);
          setIsLoading(false);
          return;
        }

        if (err.code === 2) {
          locationContext.lookupError = 'position_unavailable';
        } else if (err.code === 3) {
          locationContext.lookupError = 'location_timeout';
        } else if (err.code === 'UNSUPPORTED') {
          locationContext.lookupError = 'geo_unavailable';
        } else if (err.code === 'INSECURE_CONTEXT') {
          locationContext.lookupError = 'insecure_context';
        } else {
          locationContext.lookupError = 'lookup_failed';
        }
        // Other errors (timeout, API down) — fall through to backend API without coordinates
      }
    }

    try {
      // API call to FastAPI backend — include location coords if available
      const fallbackApiUrl =
        typeof window !== 'undefined' && process.env.NODE_ENV === 'production'
          ? window.location.origin
          : 'http://localhost:8000';
      const apiUrl = process.env.REACT_APP_API_URL || fallbackApiUrl;
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
        botResponse = await getMockResponse(inputMessage, selectedService, locationContext);
      }

      const assistantMessage = { role: 'assistant', content: botResponse };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const botResponse = await getMockResponse(inputMessage, selectedService, locationContext);
      const assistantMessage = { role: 'assistant', content: botResponse };
      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch real nearby hospitals using browser geolocation + OpenStreetMap Overpass API
  const getNearbyHospitals = () => {
    return new Promise((resolve, reject) => {
      const isLocalhost =
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

      if (typeof window !== 'undefined' && !window.isSecureContext && !isLocalhost) {
        reject({ code: 'INSECURE_CONTEXT', message: 'Geolocation requires HTTPS on deployed sites' });
        return;
      }

      if (!navigator.geolocation) {
        reject({ code: 'UNSUPPORTED', message: 'Geolocation not supported by this browser' });
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

  const getMockResponse = async (message, service, locationContext = {}) => {
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
      if (locationContext.lookupError === 'permission_denied') {
        return `📍 **Location Access Needed for ${userName}**

To show you **real nearby hospitals and clinics**, please allow location access in your browser when prompted.

**How to enable location:**
• Click the 🔒 padlock icon in your browser address bar
• Set **Location** to **Allow**
• Send your message again

⚠️ *For emergencies, call 911 immediately.*`;
      }

  if (locationContext.lookupError === 'insecure_context') {
    return `🔒 **Location Requires Secure Site for ${userName}**

Your browser only allows precise location on **HTTPS** sites (or localhost).

**What to do:**
• Open the deployed app using an HTTPS URL
• Avoid using plain HTTP links
• Retry **"find nearest hospital"** after opening secure URL

⚠️ *For emergencies, call 911 immediately.*`;
  }

  if (locationContext.lookupError === 'geo_unavailable') {
    return `📍 **Location Not Available in This Browser for ${userName}**

Your browser/device does not provide geolocation for this session.

**You can still continue:**
• Share your city/area for manual guidance
• Try another browser/device with location support
• Ensure browser location services are enabled

⚠️ *For emergencies, call 911 immediately.*`;
  }

  if (locationContext.lookupError === 'position_unavailable' || locationContext.lookupError === 'location_timeout') {
    return `🛰️ **Could Not Get Current Location for ${userName}**

I couldn't fetch a reliable GPS position just now.

**Try this:**
• Move to an open area / improve network signal
• Retry in a few seconds
• Share your city/area for broader hospital guidance

⚠️ *For emergencies, call 911 immediately.*`;
  }

      if (locationContext.attemptedLookup && locationContext.hasCoords) {
        if (locationContext.lookupError === 'no_results') {
          return `🏥 **Nearby Hospital Search Update for ${userName}**

I received your location, but I could not find enough named hospital/clinic results nearby right now.

**Try this:**
• Share your city/area name for a broader search
• Search again in a moment (map data services can be inconsistent)
• Ask for appointment guidance and I can still help with next steps

⚠️ *For emergencies, call 911 immediately.*`;
        }

        return `📡 **Hospital Lookup Temporarily Unavailable for ${userName}**

Your location permission is working, but the live hospital lookup service is temporarily unavailable.

**You can still continue:**
• Tell me your city/area and I can provide guidance
• Ask me to help with appointment preparation/checklist
• Retry nearby hospital search in a moment

⚠️ *For emergencies, call 911 immediately.*`;
      }

      return `📅 **Appointment Assistance for ${userName}**

I can help you with:
• Finding nearby hospitals and clinics
• Preparing for doctor appointments
• Questions to ask your provider
• Documents to carry (ID, insurance, medication list)

If you want nearby options, say: **"find nearest hospital"**.`;
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

  const heroService = previewService || selectedService || 'chat';
  const effectiveMotionMode = motionPreference === 'auto' ? autoMotionMode : motionPreference;
  const motionProfile = MOTION_MODE_PROFILE[effectiveMotionMode] || MOTION_MODE_PROFILE.balanced;
  const baseChatMotion = SERVICE_CHAT_MOTION[selectedService] || SERVICE_CHAT_MOTION.chat;
  const activeChatMotion = {
    containerStart: {
      x: baseChatMotion.containerStart.x * motionProfile.distanceScale,
      y: baseChatMotion.containerStart.y * motionProfile.distanceScale,
      scale: 1 - ((1 - baseChatMotion.containerStart.scale) * motionProfile.distanceScale)
    },
    containerExit: {
      x: baseChatMotion.containerExit.x * motionProfile.distanceScale,
      y: baseChatMotion.containerExit.y * motionProfile.distanceScale
    },
    itemOffsetX: baseChatMotion.itemOffsetX * motionProfile.distanceScale,
    ease: baseChatMotion.ease,
    duration: baseChatMotion.duration * motionProfile.durationScale,
    stagger: 0.045 * motionProfile.staggerScale,
    childDuration: 0.24 * motionProfile.durationScale
  };
  const messageItemVariants = {
    hidden: {
      opacity: 0,
      y: 14 * motionProfile.distanceScale,
      x: activeChatMotion.itemOffsetX,
      scale: 1 - ((1 - 0.992) * motionProfile.distanceScale)
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      transition: {
        duration: activeChatMotion.childDuration,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  return (
    <div className="app">

      {/* ── Header ── */}
      <AppHeader
        selectedService={selectedService}
        services={services}
        userName={userName}
        messagesLength={messages.length}
        onResetChat={resetChat}
        motionOptions={MOTION_OPTIONS}
        motionPreference={motionPreference}
        onSetMotionPreference={setMotionPreference}
        autoMotionMode={autoMotionMode}
      />

      {/* ── Service Pills Bar ── */}
      <ServiceBar
        serviceBarRef={serviceBarRef}
        services={services}
        selectedService={selectedService}
        onServiceSelect={handleServiceSelect}
      />

      {/* ── Chat Area ── */}
      <ChatStage
        selectedService={selectedService}
        effectiveMotionMode={effectiveMotionMode}
        messages={messages}
        chatStageRef={chatStageRef}
        heroService={heroService}
        HeroSceneComponent={ImmersiveHeroScene}
        userName={userName}
        services={services}
        onServiceSelect={handleServiceSelect}
        onServicePreview={handleServicePreview}
        onPreviewEnd={clearServicePreview}
        suggestionChips={suggestionChips}
        onSuggestionSelect={handleSuggestionSelect}
        activeChatMotion={activeChatMotion}
        motionProfile={motionProfile}
        messageItemVariants={messageItemVariants}
        isLoading={isLoading}
        messagesEndRef={messagesEndRef}
      />

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
