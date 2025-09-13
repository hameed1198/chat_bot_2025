@echo off
echo Starting Medical AI Chatbot...
echo.
echo Backend (Streamlit) starting on http://localhost:8501
echo.
cd backend
C:/Users/User/chat_bot_2025/.venv/Scripts/python.exe -m streamlit run app.py
pause
