import React, { Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import CinematicCarousel from '../CinematicCarousel';

function formatMessageHtml(content) {
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/(https?:\/\/[^\s<"]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\n/g, '<br/>');
}

export default function ChatStage({
  selectedService,
  effectiveMotionMode,
  messages,
  chatStageRef,
  heroService,
  HeroSceneComponent,
  userName,
  services,
  onServiceSelect,
  onServicePreview,
  onPreviewEnd,
  suggestionChips,
  onSuggestionSelect,
  activeChatMotion,
  motionProfile,
  messageItemVariants,
  isLoading,
  messagesEndRef
}) {
  return (
    <div className={`chat-container tone-${selectedService || 'chat'} motion-${effectiveMotionMode}`}>
      <AnimatePresence mode="wait" initial={false}>
        {messages.length === 0 ? (
          <motion.div
            key="empty-state"
            ref={chatStageRef}
            className="empty-state"
            initial={{ opacity: 0, y: 16, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.99 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <Suspense fallback={<div className="immersive-hero-fallback" aria-hidden="true" />}>
              <HeroSceneComponent activeService={heroService} performanceMode={effectiveMotionMode} />
            </Suspense>
            <div className="empty-state-icon">💬</div>
            <h3>How can I help you today, {userName}?</h3>
            <p>Select a service above, click a suggestion, or type your question below</p>
            <CinematicCarousel
              services={services}
              selectedService={selectedService}
              onServiceSelect={onServiceSelect}
              onServicePreview={onServicePreview}
              onPreviewEnd={onPreviewEnd}
              motionMode={effectiveMotionMode}
            />
            <div className="suggestion-chips">
              {suggestionChips.map(({ label, service }) => (
                <button
                  key={label}
                  className="suggestion-chip"
                  onClick={() => onSuggestionSelect(label, service)}
                >
                  {label}
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={`messages-state-${selectedService || 'chat'}`}
            ref={chatStageRef}
            className="messages-container"
            initial={{
              opacity: 0,
              x: activeChatMotion.containerStart.x,
              y: activeChatMotion.containerStart.y,
              scale: activeChatMotion.containerStart.scale
            }}
            animate={{
              opacity: 1,
              x: 0,
              y: 0,
              scale: 1,
              transition: {
                duration: activeChatMotion.duration,
                ease: activeChatMotion.ease,
                when: 'beforeChildren',
                staggerChildren: activeChatMotion.stagger,
                delayChildren: 0.02
              }
            }}
            exit={{
              opacity: 0,
              x: activeChatMotion.containerExit.x,
              y: activeChatMotion.containerExit.y,
              scale: 0.99,
              transition: {
                duration: 0.24 * motionProfile.durationScale,
                ease: [0.32, 0, 0.67, 0]
              }
            }}
          >
            {messages.map((message, index) => (
              <motion.div key={`${selectedService || 'chat'}-${index}`} className={`message ${message.role}`} variants={messageItemVariants}>
                <div className="message-content">
                  <div
                    className="message-text"
                    dangerouslySetInnerHTML={{
                      __html: formatMessageHtml(message.content)
                    }}
                  />
                </div>
              </motion.div>
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
