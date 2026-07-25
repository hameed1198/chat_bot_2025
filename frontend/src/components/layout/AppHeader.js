import React from 'react';

export default function AppHeader({
  selectedService,
  services,
  userName,
  messagesLength,
  onResetChat,
  motionOptions,
  motionPreference,
  onSetMotionPreference,
  autoMotionMode
}) {
  return (
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
        <div className="motion-governor" role="group" aria-label="Animation intensity">
          {motionOptions.map((mode) => (
            <button
              key={mode.key}
              type="button"
              className={`motion-pill${motionPreference === mode.key ? ' active' : ''}`}
              onClick={() => onSetMotionPreference(mode.key)}
              title={mode.key === 'auto' ? `Auto (${autoMotionMode})` : mode.label}
            >
              {mode.label}
            </button>
          ))}
        </div>
        <span className="user-greeting">Hello {userName}! 👋</span>
        {messagesLength > 0 && (
          <button onClick={onResetChat} className="change-service-btn">
            🔄 New Chat
          </button>
        )}
      </div>
    </div>
  );
}
