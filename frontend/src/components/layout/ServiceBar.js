import React from 'react';
import { motion } from 'framer-motion';

const SERVICE_PILL_ICONS = {
  health: '🧬',
  insurance: '🛡️',
  appointments: '🩺',
  general: '🧪',
  emergency: '🚑',
  chat: '🧠'
};

export default function ServiceBar({ serviceBarRef, services, selectedService, onServiceSelect }) {
  return (
    <motion.div
      ref={serviceBarRef}
      className="service-bar"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {Object.entries(services).map(([key, label]) => (
        <button
          key={key}
          className={`service-pill svc-${key}${selectedService === key ? ' active' : ''}`}
          onClick={(event) => onServiceSelect(key, event.currentTarget)}
        >
          {selectedService === key && (
            <motion.span
              layoutId="active-pill-bg"
              className={`pill-active-bg svc-${key}`}
              transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            />
          )}
          <span className="pill-icon" aria-hidden="true">{SERVICE_PILL_ICONS[key] || '⚕️'}</span>
          <span className="pill-label">{label}</span>
        </button>
      ))}
    </motion.div>
  );
}
