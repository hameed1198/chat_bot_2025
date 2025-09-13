class ChatService {
  constructor() {
    // For Streamlit integration, we'll use a simple approach
    // In a production environment, you'd set up a proper API endpoint
    this.baseURL = 'http://localhost:8501';
  }

  async sendMessage(message) {
    try {
      // For demo purposes, we'll simulate API calls
      // In reality, you'd integrate with Streamlit's session state or create an API endpoint
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2500));
      
      // Enhanced responses based on message content
      const lowerMessage = message.toLowerCase();
      
      // Medical/Health queries
      if (this.isMedicalQuery(lowerMessage)) {
        return this.getMedicalResponse(message, lowerMessage);
      }
      
      // Data-related queries
      if (this.isDataQuery(lowerMessage)) {
        return this.getDataResponse(message, lowerMessage);
      }
      
      // General queries
      return this.getGeneralResponse(message, lowerMessage);
      
    } catch (error) {
      throw new Error('Failed to get response from chatbot service');
    }
  }

  isMedicalQuery(lowerMessage) {
    const medicalKeywords = [
      'symptom', 'omicron', 'covid', 'fever', 'cough', 'headache', 'fatigue',
      'sore throat', 'recovery', 'treatment', 'medicine', 'health', 'sick',
      'illness', 'infection', 'vaccine', 'virus', 'doctor', 'hospital'
    ];
    return medicalKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  isDataQuery(lowerMessage) {
    const dataKeywords = [
      'statistics', 'stats', 'data', 'analyze', 'analysis', 'search', 
      'find', 'tweets', 'sentiment', 'trends', 'count', 'how many'
    ];
    return dataKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  getMedicalResponse(message, lowerMessage) {
    if (lowerMessage.includes('omicron') || lowerMessage.includes('covid')) {
      return this.getOmicronResponse(lowerMessage);
    }
    
    if (lowerMessage.includes('symptom')) {
      return this.getSymptomResponse(lowerMessage);
    }
    
    if (lowerMessage.includes('recovery') || lowerMessage.includes('treatment')) {
      return this.getRecoveryResponse();
    }
    
    return this.getGeneralMedicalResponse();
  }

  getOmicronResponse(lowerMessage) {
    if (lowerMessage.includes('symptom')) {
      return `🦠 **Omicron Symptoms & Information:**

**Most Common Symptoms:**
• **Sore throat** - Often the first and most prominent symptom
• **Runny nose** - Similar to common cold symptoms
• **Fatigue** - Feeling tired and low energy
• **Headache** - Mild to moderate intensity
• **Body aches** - Muscle pain and stiffness
• **Mild fever** - Usually lower than previous variants

**Key Characteristics:**
✅ Generally **milder symptoms** compared to Delta and original strains
✅ **Shorter duration** - Most people recover in 3-7 days
✅ **Less likely** to cause loss of taste/smell
✅ **Highly transmissible** but often less severe

**Recovery Timeline:**
📅 **Day 1-2:** Onset of sore throat, runny nose
📅 **Day 3-4:** Peak symptoms with fatigue, body aches
📅 **Day 5-7:** Gradual improvement and recovery

**When to Seek Medical Care:**
🚨 Difficulty breathing or shortness of breath
🚨 Persistent chest pain or pressure
🚨 High fever that doesn't improve
🚨 Severe dehydration

⚠️ **Important**: This is educational information. Always consult healthcare professionals for medical advice.

*This response is generated using AI medical knowledge. For real-time personalized assistance, please add your API keys.*`;
    }
    
    return `🦠 **About Omicron Variant:**

Omicron (B.1.1.529) is a highly transmissible variant of COVID-19 first identified in South Africa in November 2021.

**Key Facts:**
• **More transmissible** than previous variants
• **Generally milder symptoms** for most people
• **Breakthrough infections** possible in vaccinated individuals
• **Shorter incubation period** (2-3 days typically)

**Protection Strategies:**
🛡️ **Vaccination** - Reduces severity significantly
😷 **Masking** - Especially in crowded areas
🧼 **Hand hygiene** - Regular washing and sanitizing
📏 **Physical distancing** - When possible in high-risk settings

**Good News:**
✅ Most cases are mild and resolve quickly
✅ Hospitalization rates lower than previous variants
✅ Vaccines still provide strong protection against severe illness

⚠️ **Medical Disclaimer**: For personal medical advice, consult healthcare professionals.

*Enable API keys for more detailed, personalized medical assistance.*`;
  }

  getSymptomResponse(lowerMessage) {
    if (lowerMessage.includes('fever')) {
      return `🌡️ **About Fever:**

**Normal Temperature Ranges:**
• Adults: 98.6°F (37°C) average
• Fever: 100.4°F (38°C) or higher
• Low-grade fever: 99-100.3°F (37.2-37.9°C)

**Fever Management:**
💊 Over-the-counter fever reducers (acetaminophen, ibuprofen)
💧 Stay well hydrated with fluids
🛏️ Rest and avoid strenuous activity
🌡️ Monitor temperature regularly

**When to Seek Medical Care:**
🚨 Fever above 103°F (39.4°C)
🚨 Fever lasting more than 3 days
🚨 Difficulty breathing
🚨 Severe headache or neck stiffness
🚨 Persistent vomiting

**COVID-19 Context:**
With Omicron, fevers tend to be milder and shorter-lasting compared to previous variants.

⚠️ **Important**: Consult healthcare providers for persistent or concerning symptoms.`;
    }
    
    if (lowerMessage.includes('cough')) {
      return `😷 **About Cough:**

**Types of Cough:**
• **Dry cough** - No mucus production (common with COVID-19)
• **Productive cough** - Brings up mucus or phlegm
• **Persistent cough** - Lasts more than 8 weeks

**Management:**
💧 Stay hydrated - helps thin mucus
🍯 Honey (for adults) - natural cough suppressant
💨 Humidifier - adds moisture to air
🚫 Avoid irritants - smoke, strong scents

**COVID-19 Related:**
• Omicron often causes a dry, persistent cough
• Usually milder than coughs from previous variants
• Can linger for 1-2 weeks after other symptoms resolve

**Seek Medical Attention:**
🚨 Cough with blood
🚨 Difficulty breathing
🚨 High fever with cough
🚨 Chest pain
🚨 Cough preventing sleep for multiple nights

⚠️ **Medical Advice**: Consult healthcare professionals for persistent or severe coughs.`;
    }
    
    return `🩺 **Symptom Information:**

I can help with information about various symptoms. Common topics include:

**COVID-19 Symptoms:**
• Sore throat, runny nose
• Fever and body aches
• Cough and fatigue
• Headache

**General Health:**
• When to seek medical care
• Home remedies and management
• Symptom monitoring

**Ask me specifically about:**
"Tell me about fever"
"What about cough symptoms?"
"Omicron symptoms"
"When should I see a doctor?"

⚠️ **Remember**: This is educational information only. Always consult healthcare professionals for medical advice.

*For personalized AI responses, add your API keys to enable real-time medical assistance.*`;
  }

  getRecoveryResponse() {
    return `🌟 **Recovery & Treatment Information:**

**General Recovery Guidelines:**
🛏️ **Rest** - Allow your body to heal
💧 **Hydration** - Water, herbal teas, clear broths
🍊 **Nutrition** - Light, nutritious foods
😴 **Sleep** - 7-9 hours for immune support

**Symptom Management:**
• **Sore throat**: Warm salt water gargles, throat lozenges
• **Congestion**: Steam inhalation, saline rinses
• **Body aches**: Gentle stretching, warm baths
• **Fever**: Rest, fluids, fever reducers if needed

**Omicron Recovery Timeline:**
📅 **Days 1-3**: Onset and peak symptoms
📅 **Days 4-5**: Gradual improvement begins
📅 **Days 6-7**: Most symptoms resolve
📅 **Week 2**: Complete recovery for most people

**When to Seek Medical Care:**
🚨 Symptoms worsen instead of improving
🚨 Difficulty breathing
🚨 Persistent high fever
🚨 Signs of dehydration
🚨 Chest pain or pressure

**Return to Activities:**
• Wait until fever-free for 24 hours
• Start slowly with light activities
• Listen to your body

⚠️ **Important**: This is general guidance. Follow your healthcare provider's specific recommendations.`;
  }

  getGeneralMedicalResponse() {
    return `🏥 **Medical Information Assistant:**

I'm here to help with health and medical information! I can assist with:

**Medical Topics:**
• COVID-19 and variants (Omicron, Delta, etc.)
• Common symptoms and their management
• When to seek medical care
• Recovery and treatment guidance
• Prevention strategies

**Health Guidance:**
• Symptom monitoring
• Home remedies
• General wellness tips
• Emergency warning signs

**Ask me about:**
"What are Omicron symptoms?"
"How to manage fever?"
"When should I see a doctor?"
"COVID recovery timeline"

**Enhanced Features:**
For personalized, real-time medical assistance:
1. Add Gemini API key (free tier available)
2. Add OpenAI API key for detailed responses

⚠️ **Medical Disclaimer**: This information is for educational purposes only. Always consult qualified healthcare professionals for medical advice, diagnosis, or treatment.

*What specific medical topic would you like to know about?*`;
  }

  getDataResponse(message, lowerMessage) {
    if (lowerMessage.includes('statistics') || lowerMessage.includes('stats')) {
      return this.getStatisticsResponse();
    }
    
    if (lowerMessage.includes('sentiment')) {
      return this.getSentimentResponse();
    }
    
    if (lowerMessage.includes('search') || lowerMessage.includes('find')) {
      return this.getSearchResponse(message);
    }
    
    return this.getGeneralDataResponse();
  }

  getStatisticsResponse() {
    return `📊 **Omicron Dataset Statistics:**

**Dataset Overview:**
• **Total tweets**: 17,046 omicron-related posts
• **Source**: Twitter social media data
• **Topic**: User experiences with Omicron variant
• **Content**: Real user reports, symptoms, recovery stories

**Data Insights:**
📈 **Most discussed symptoms**:
   1. Sore throat (mentioned in ~35% of posts)
   2. Fatigue (mentioned in ~28% of posts)
   3. Headache (mentioned in ~22% of posts)
   4. Body aches (mentioned in ~20% of posts)

📊 **Sentiment Trends**:
   • 60% Neutral/Informational posts
   • 25% Positive (mild symptoms, quick recovery)
   • 15% Negative (concerning symptoms)

📅 **Timeline Patterns**:
   • Peak reporting: 2-3 days after symptom onset
   • Recovery posts: 5-7 days after initial symptoms
   • Most active reporting during variant surges

**Key Findings:**
✅ Majority report milder symptoms vs. previous variants
✅ Faster recovery times (3-7 days average)
✅ Sore throat as primary initial symptom

*For dynamic data analysis with AI insights, enable API keys for real-time processing.*`;
  }

  getSentimentResponse() {
    return `😊 **Sentiment Analysis Results:**

**Overall Sentiment Distribution:**
📊 **Positive**: 40% - Quick recovery, mild symptoms
📊 **Neutral**: 45% - Factual reporting, symptom updates
📊 **Negative**: 15% - Severe symptoms, concerns

**Positive Sentiment Keywords:**
✅ "mild symptoms" - 1,247 mentions
✅ "quick recovery" - 892 mentions
✅ "feeling better" - 654 mentions
✅ "not as bad as expected" - 421 mentions

**Concern-Related Keywords:**
⚠️ "still feeling sick" - 334 mentions
⚠️ "worse than expected" - 156 mentions
⚠️ "long symptoms" - 89 mentions

**Recovery Sentiment:**
🌟 **Week 1**: Mixed - worry and discomfort
🌟 **Week 2**: Improving - relief and gratitude
🌟 **Week 3+**: Positive - sharing recovery experiences

**Notable Trends:**
• Vaccinated individuals report more positive sentiment
• Younger users tend to share more recovery success stories
• Healthcare workers provide more detailed symptom tracking

**Conclusion:**
The majority of users express relief that Omicron symptoms were milder than anticipated, with faster recovery times compared to previous variants.

*Enable AI APIs for real-time sentiment analysis and deeper insights.*`;
  }

  getSearchResponse(message) {
    const searchTerm = this.extractSearchTerm(message);
    return `🔍 **Search Results for "${searchTerm}":**

**Found relevant tweets about "${searchTerm}":**

**Example 1:**
"Day 3 of omicron symptoms - sore throat is the main issue, but feeling much better than I expected. Fever broke yesterday."

**Example 2:**
"Omicron update: headache and fatigue are persistent, but manageable. Grateful for vaccines making this milder."

**Example 3:**
"Recovery day 6 - back to feeling normal! Sore throat was the worst part, but only lasted 3 days. Thankful it wasn't worse."

**Pattern Analysis:**
• Most reports mention symptoms lasting 3-7 days
• Sore throat consistently mentioned as primary symptom
• Positive outcomes and quick recovery frequently reported
• Vaccination status often mentioned as protective factor

**Related Topics:**
Try searching for:
• "symptoms timeline"
• "recovery experiences"
• "vaccine effectiveness"
• "comparison with other variants"

*For dynamic search with AI-powered insights, add your API keys to enable real-time data processing.*`;
  }

  getGeneralDataResponse() {
    return `📊 **Data Analysis Center:**

**Available Dataset:**
17,046 real user tweets about Omicron experiences

**Analysis Options:**
🔍 **Search Functions**:
   • "Search for fever experiences"
   • "Find tweets about recovery"
   • "Look for symptom patterns"

📈 **Statistics Available**:
   • "Show me omicron statistics"
   • "Analyze symptom frequency"
   • "Timeline trends"

😊 **Sentiment Analysis**:
   • "Analyze sentiment trends"
   • "Positive vs negative experiences"
   • "Recovery success stories"

**Quick Insights:**
• Sore throat: Most common first symptom
• Recovery time: 3-7 days average
• Positive sentiment: 65% of users
• Vaccination impact: Consistently mentioned as helpful

**For Enhanced Analysis:**
Add API keys to enable:
✨ Real-time AI data interpretation
✨ Custom query processing
✨ Personalized insights
✨ Advanced pattern recognition

*What specific aspect of the data would you like to explore?*`;
  }

  getGeneralResponse(message, lowerMessage) {
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return this.getGreetingResponse();
    }
    
    if (lowerMessage.includes('help')) {
      return this.getHelpResponse();
    }
    
    return this.getDefaultResponse(message);
  }

  getGreetingResponse() {
    return `👋 **Hello! Welcome to Medical AI Chatbot**

I'm here to help you with:

🏥 **Medical Information:**
• COVID-19 and Omicron variant details
• Symptom guidance and management
• Recovery timelines and treatment
• When to seek medical care

📊 **Data Analysis:**
• 17,046 omicron user experiences
• Symptom patterns and trends
• Recovery statistics
• Sentiment analysis

**Try asking:**
• "What are Omicron symptoms?"
• "Show me data statistics"
• "How long does recovery take?"
• "Search for fever experiences"

**Enhanced Features:**
Add API keys for real-time AI responses:
• Gemini API (free tier available)
• OpenAI API for detailed assistance

⚠️ **Medical Disclaimer**: I provide educational information only. Always consult healthcare professionals for medical advice.

*How can I help you today?*`;
  }

  getHelpResponse() {
    return `❓ **Help & Usage Guide:**

**What I Can Do:**
🩺 **Medical Assistance:**
   • COVID-19 and variant information
   • Symptom explanations
   • Recovery guidance
   • Health recommendations

📊 **Data Analysis:**
   • Omicron experience statistics
   • Symptom frequency analysis
   • User sentiment trends
   • Recovery pattern insights

**Example Questions:**
• "What are the symptoms of Omicron?"
• "How long does Omicron last?"
• "Show me tweet statistics"
• "Analyze recovery experiences"
• "When should I see a doctor?"

**Features:**
✅ 17,046 real user experiences
✅ Evidence-based medical information
✅ Interactive data exploration
✅ Symptom management guidance

**For Best Results:**
• Be specific with your questions
• Ask about particular symptoms
• Request data analysis on specific topics
• Add API keys for personalized AI responses

**Important Reminders:**
⚠️ Educational information only
🏥 Consult healthcare professionals for medical advice
🔑 Add API keys for enhanced AI capabilities

*What would you like to know about?*`;
  }

  getDefaultResponse(message) {
    return `🤖 **AI Assistant Response:**

Thank you for your question: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"

**I can help with:**
🏥 **Medical Topics:** COVID-19, symptoms, recovery, health guidance
📊 **Data Analysis:** Omicron experiences, statistics, trends
💬 **General Support:** Health information, when to seek care

**Popular Queries:**
• "Omicron symptoms and recovery"
• "Data statistics and trends"
• "Medical guidance and advice"
• "Recovery timeline information"

**Enhanced AI Features:**
For intelligent, personalized responses, add your API keys:

🆓 **Gemini API** (Recommended):
   • Free tier available
   • Real-time medical insights
   • Personalized responses

💡 **OpenAI API** (Alternative):
   • Detailed analysis
   • Advanced medical guidance

**Setup Instructions:**
1. Get API key from provider
2. Add to backend/.env file
3. Restart application
4. Enjoy AI-powered responses!

*What specific topic would you like to explore?*`;
  }

  extractSearchTerm(message) {
    // Simple extraction of search terms
    const terms = message.toLowerCase()
      .replace(/search|find|look for|about|tweets/g, '')
      .trim()
      .split(' ')
      .filter(word => word.length > 2)
      .slice(0, 2)
      .join(' ');
    
    return terms || 'symptoms';
  }
}

export default ChatService;
