import streamlit as st
import pandas as pd
import os
from dotenv import load_dotenv
from chatbot import MedicalChatbot

# Load environment variables
load_dotenv()

# Page config
st.set_page_config(
    page_title="MediCare AI Assistant",
    page_icon="🏥",
    layout="wide",
    initial_sidebar_state="expanded"
)

class MediCareApp:
    def __init__(self):
        self.chatbot = MedicalChatbot()
        self.initialize_session()
        
    def initialize_session(self):
        """Initialize session state variables"""
        if 'user_name' not in st.session_state:
            st.session_state.user_name = ""
        if 'service_selected' not in st.session_state:
            st.session_state.service_selected = False
        if 'conversation_started' not in st.session_state:
            st.session_state.conversation_started = False
        if 'selected_service' not in st.session_state:
            st.session_state.selected_service = ""
        if 'messages' not in st.session_state:
            st.session_state.messages = []
            
    def show_welcome_screen(self):
        """Show welcome screen and get user name"""
        st.markdown("""
        <div style='text-align: center; padding: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 15px; margin-bottom: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);'>
            <h1>🏥 MediCare AI Assistant</h1>
            <h3>Your Comprehensive Healthcare Companion</h3>
            <p style='font-size: 18px; margin-top: 20px;'>Powered by Gemini AI • Available 24/7 • Trusted Healthcare Guidance</p>
        </div>
        """, unsafe_allow_html=True)
        
        col1, col2, col3 = st.columns([1, 2, 1])
        with col2:
            st.markdown("### 👋 Welcome! Let's get started")
            name = st.text_input("", placeholder="Please enter your name to continue...", key="name_input")
            
            if st.button("🚀 Start Your Healthcare Journey", type="primary", use_container_width=True):
                if name.strip():
                    st.session_state.user_name = name.strip()
                    st.session_state.conversation_started = True
                    st.rerun()
                else:
                    st.error("Please enter your name to continue.")
                    
    def show_service_menu(self):
        """Display comprehensive service menu"""
        st.markdown(f"""
        <div style='background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 25px; border-radius: 15px; margin-bottom: 25px; color: white; text-align: center;'>
            <h2>Hello {st.session_state.user_name}! 🌟</h2>
            <p style='font-size: 18px;'>I'm your MediCare AI Assistant. Choose a service below or chat freely about any health topic.</p>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("### 🔹 Choose Your Service:")
        
        col1, col2 = st.columns(2)
        
        with col1:
            if st.button("🩺 Health Status Assessment", use_container_width=True, type="secondary"):
                st.session_state.selected_service = "Health Assessment"
                st.session_state.service_selected = True
                st.rerun()
                
            if st.button("🏥 Insurance Information", use_container_width=True, type="secondary"):
                st.session_state.selected_service = "Insurance"
                st.session_state.service_selected = True
                st.rerun()
                
            if st.button("📅 Doctor Appointment", use_container_width=True, type="secondary"):
                st.session_state.selected_service = "Appointments"
                st.session_state.service_selected = True
                st.rerun()
                
        with col2:
            if st.button("💊 General Health Queries", use_container_width=True, type="secondary"):
                st.session_state.selected_service = "General Health"
                st.session_state.service_selected = True
                st.rerun()
                
            if st.button("🚨 Emergency Guidance", use_container_width=True, type="secondary"):
                st.session_state.selected_service = "Emergency"
                st.session_state.service_selected = True
                st.rerun()
                
            if st.button("💬 Chat Freely", use_container_width=True, type="primary"):
                st.session_state.selected_service = "Chat Freely"
                st.session_state.service_selected = True
                st.rerun()
        
        # Service descriptions
        st.markdown("""
        <div style='background: #f8f9fa; padding: 20px; border-radius: 10px; margin-top: 20px;'>
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
        """, unsafe_allow_html=True)
        
    def show_chat_interface(self):
        """Show the main chat interface"""
        # Service header
        st.markdown(f"""
        <div style='background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%); padding: 15px; border-radius: 10px; margin-bottom: 20px; color: white;'>
            <h3>💬 {st.session_state.selected_service} - Chat with {st.session_state.user_name}</h3>
            <button onclick="window.location.reload()" style='float: right; background: rgba(255,255,255,0.2); border: none; color: white; padding: 5px 10px; border-radius: 5px; cursor: pointer;'>🔄 Change Service</button>
        </div>
        """, unsafe_allow_html=True)
        
        # Reset service button
        if st.button("🔄 Change Service", key="change_service"):
            st.session_state.service_selected = False
            st.session_state.messages = []
            st.rerun()
        
        # Display chat messages
        for message in st.session_state.messages:
            with st.chat_message(message["role"]):
                st.markdown(message["content"])
        
        # Chat input
        if prompt := st.chat_input(f"Ask me anything about {st.session_state.selected_service.lower()}..."):
            # Add user message
            st.session_state.messages.append({"role": "user", "content": prompt})
            with st.chat_message("user"):
                st.markdown(prompt)
            
            # Get bot response
            with st.chat_message("assistant"):
                message_placeholder = st.empty()
                message_placeholder.markdown("✨ *Analyzing with Gemini 1.5 Pro...*")
                
                response = self.chatbot.get_response(
                    prompt, 
                    st.session_state.user_name, 
                    st.session_state.selected_service
                )
                message_placeholder.markdown(response)
            
            # Add assistant response
            st.session_state.messages.append({"role": "assistant", "content": response})
    
    def run(self):
        """Run the main application"""
        # Welcome screen
        if not st.session_state.conversation_started:
            self.show_welcome_screen()
            return
        
        # Service selection
        if not st.session_state.service_selected:
            self.show_service_menu()
            return
        
        # Main chat interface
        self.show_chat_interface()

# Custom CSS for better styling
st.markdown("""
<style>
    /* Main theme colors */
    :root {
        --primary: #667eea;
        --secondary: #764ba2;
        --success: #48bb78;
        --danger: #f56565;
    }
    
    /* Button styling */
    .stButton > button {
        border-radius: 12px;
        border: none;
        padding: 12px 24px;
        font-weight: 600;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
    }
    .stButton > button:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
    }
    
    /* Input styling */
    .stTextInput > div > div > input {
        border-radius: 12px;
        border: 2px solid #e2e8f0;
        padding: 12px 16px;
        transition: all 0.3s ease;
    }
    .stTextInput > div > div > input:focus {
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
    }
    
    /* Chat message styling */
    .stChatMessage {
        border-radius: 16px;
        margin: 12px 0;
        animation: fadeIn 0.3s ease-out;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    /* Spinner enhancement */
    .stSpinner > div {
        border-color: #667eea transparent transparent transparent;
    }
    
    /* Sidebar styling */
    [data-testid="stSidebar"] {
        background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);
    }
    
    /* Success/Info boxes */
    .success-box {
        background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
        color: white;
        padding: 20px;
        border-radius: 12px;
        margin: 10px 0;
    }
    
    /* Pulse animation for loading */
    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
    .pulse { animation: pulse 1.5s infinite; }
</style>
""", unsafe_allow_html=True)

# Run the application
if __name__ == "__main__":
    app = MediCareApp()
    app.run()

# Custom CSS
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        color: #2c3e50;
        text-align: center;
        margin-bottom: 2rem;
    }
    .chat-container {
        background-color: #f8f9fa;
        padding: 1rem;
        border-radius: 10px;
        margin: 1rem 0;
    }
    .user-message {
        background-color: #007bff;
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        margin: 0.5rem 0;
        text-align: right;
    }
    .bot-message {
        background-color: #28a745;
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        margin: 0.5rem 0;
    }
</style>
""", unsafe_allow_html=True)

def main():
    st.markdown('<h1 class="main-header">🏥 Medical AI Chatbot</h1>', unsafe_allow_html=True)
    
    # Initialize chatbot
    if 'chatbot' not in st.session_state:
        st.session_state.chatbot = MedicalChatbot()
    
    # Initialize chat history
    if 'messages' not in st.session_state:
        st.session_state.messages = []
    
    # Sidebar
    with st.sidebar:
        st.header("📊 Data Info")
        
        # Load and display omicron data info
        try:
            omicron_data = pd.read_csv("omicron_2025.csv")
            st.write(f"📈 Total tweets: {len(omicron_data)}")
            if 'date' in omicron_data.columns:
                st.write(f"📅 Date range: {omicron_data['date'].min()} - {omicron_data['date'].max()}")
        except Exception as e:
            st.warning("Could not load omicron data")
        
        st.markdown("---")
        st.header("🤖 Features")
        st.write("• Omicron data analysis")
        st.write("• Medical query assistance")
        st.write("• AI-powered responses")
        st.write("• Real-time chat interface")
        
        if st.button("Clear Chat History"):
            st.session_state.messages = []
            st.rerun()
    
    # Main chat interface
    st.header("💬 Chat Interface")
    
    # Display chat messages
    chat_container = st.container()
    with chat_container:
        for message in st.session_state.messages:
            if message["role"] == "user":
                st.markdown(f'<div class="user-message">👤 {message["content"]}</div>', unsafe_allow_html=True)
            else:
                st.markdown(f'<div class="bot-message">🤖 {message["content"]}</div>', unsafe_allow_html=True)
    
    # Chat input
    user_input = st.chat_input("Ask me about omicron data or any medical question...")
    
    if user_input:
        # Add user message to chat history
        st.session_state.messages.append({"role": "user", "content": user_input})
        
        # Get bot response
        with st.spinner("Thinking..."):
            try:
                response = st.session_state.chatbot.get_response(user_input)
                st.session_state.messages.append({"role": "assistant", "content": response})
            except Exception as e:
                error_msg = f"Sorry, I encountered an error: {str(e)}"
                st.session_state.messages.append({"role": "assistant", "content": error_msg})
        
        # Rerun to display new messages
        st.rerun()

if __name__ == "__main__":
    main()
