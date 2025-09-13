# Medical Chatbot

A medical chatbot built with Python, LangChain, Streamlit, and React that can analyze omicron tweet data and answer medical queries using AI.

## 🎯 Live Applications

- **Backend (Streamlit)**: http://localhost:8501
- **Frontend (React)**: http://localhost:3000

## Project Structure

```
chat_bot_2025/
├── backend/
│   ├── app.py              # Main Streamlit application
│   ├── chatbot.py          # Chatbot logic with LangChain
│   ├── data_processor.py   # Omicron data processing
│   ├── api_handler.py      # Gemini/OpenAI API integration
│   ├── requirements.txt    # Python dependencies
│   └── .env.example        # Environment variables template
├── frontend/
│   ├── src/
│   │   ├── App.js          # Main React component
│   │   ├── services/       # API services
│   │   └── index.css       # Styling
│   ├── package.json        # Node.js dependencies
│   └── public/             # Static files
├── omicron_2025.csv       # Omicron tweets data (17,046 rows)
├── run_backend.bat        # Quick start script for backend
├── run_frontend.bat       # Quick start script for frontend
└── README.md
```

## Features

- 🤖 AI-powered medical chatbot using LangChain
- 📊 Analysis of 17,046 omicron tweet records
- 🔄 Fallback to Gemini/OpenAI APIs for general queries
- 🌐 **Enhanced Modern UI** with medical themes and animations
- 🎨 **Professional Healthcare Design** with medical icons and colors
- 📱 **Responsive Design** optimized for all devices
- 🚀 Streamlit deployment ready
- 📦 GitHub integration
- 🔍 Smart query routing (data vs. AI APIs)
- 📈 Sentiment analysis and statistics
- ✨ **Interactive Features**: Welcome cards, quick suggestions, animated typing
- 🏥 **Medical Dashboard** with real-time statistics and features

## 🎨 UI/UX Enhancements

### Visual Design
- **Medical-themed gradient backgrounds** with healthcare colors
- **Glass-morphism effects** with blur and transparency
- **Professional medical icons** (stethoscope, heart, virus, hospital, etc.)
- **Smooth animations** and hover effects
- **Inter font family** for modern typography

### Interactive Elements
- **Welcome screen** with feature cards and medical dashboard
- **Quick suggestion chips** for common queries
- **Animated typing indicators** with medical icons
- **Floating sidebar** with medical statistics
- **Responsive message bubbles** with speech-like design

### Color Scheme
- **Primary**: Medical blues and purples (#667eea, #764ba2)
- **Secondary**: Healthcare greens (#48bb78, #38a169)
- **Accent**: Medical red for emergency actions (#f56565)
- **Background**: Gradient overlays with subtle medical patterns

### Responsive Design
- **Mobile-first approach** with breakpoints for all devices
- **Collapsible sidebar** for smaller screens
- **Optimized touch targets** for mobile interaction
- **Adaptive layout** that scales beautifully

## Quick Start

### Option 1: Use Batch Files (Recommended)
```bash
# Start backend
run_backend.bat

# Start frontend (in new terminal)
run_frontend.bat
```

### Option 2: Manual Setup

#### Backend (Python)
```bash
cd backend
C:/Users/User/chat_bot_2025/.venv/Scripts/python.exe -m streamlit run app.py
```

#### Frontend (React)
```bash
cd frontend
npm start
```

## Data Information

Your omicron CSV file contains:
- **17,046 tweets** about omicron experiences
- **Columns**: id, user_name, user_location, date, text, hashtags, retweets, favorites, etc.
- **Date range**: Various dates with real user experiences

## Environment Variables

Create a `.env` file in the backend directory:
```
OPENAI_API_KEY=your_openai_key_here
GEMINI_API_KEY=your_gemini_key_here
```

**Note**: The app works without API keys using mock responses, but for full AI capabilities, add your keys.

## Example Queries

Try asking the chatbot:
- "Show me omicron statistics"
- "Search for tweets about fever"
- "What are common omicron symptoms?"
- "Analyze sentiment in the data"
- "Tell me about recovery experiences"

## Deployment

### Streamlit Cloud
1. Push to GitHub
2. Connect repository to Streamlit Cloud
3. Set environment variables in Streamlit dashboard
4. Deploy!

### GitHub Pages (Frontend only)
```bash
cd frontend
npm run build
# Deploy the build folder to GitHub Pages
```

## Technology Stack

**Backend:**
- Python 3.13
- Streamlit for web interface
- LangChain for AI orchestration
- Pandas for data processing
- OpenAI/Gemini APIs

**Frontend:**
- React 18
- Modern CSS with animations
- Responsive design
- Real-time chat interface

## License

MIT License
