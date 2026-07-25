import React, { useEffect, useMemo, useRef } from 'react';
import { gsap } from 'gsap';
import { SERVICE_DETAILS } from '../config/services';

export default function CinematicCarousel({
  services,
  selectedService,
  onServiceSelect,
  onServicePreview,
  onPreviewEnd,
  motionMode = 'balanced'
}) {
  const railRef = useRef(null);
  const cardRefs = useRef([]);

  const cards = useMemo(
    () =>
      Object.entries(services).map(([key, label]) => ({
        key,
        label,
        ...SERVICE_DETAILS[key]
      })),
    [services]
  );

  const motionScale = useMemo(() => {
    if (motionMode === 'cinematic') {
      return { tilt: 1, duration: 1, lift: 1 };
    }

    if (motionMode === 'efficient') {
      return { tilt: 0.55, duration: 0.68, lift: 0.55 };
    }

    return { tilt: 0.78, duration: 0.84, lift: 0.78 };
  }, [motionMode]);

  useEffect(() => {
    const activeIndex = cards.findIndex((card) => card.key === selectedService);
    if (!railRef.current || activeIndex < 0) {
      return;
    }

    const activeCard = cardRefs.current[activeIndex];
    if (!activeCard) {
      return;
    }

    activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [cards, selectedService]);

  useEffect(() => {
    const cleanups = [];

    cardRefs.current.forEach((card) => {
      if (!card) {
        return;
      }

      const onPointerMove = (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;

        card.style.setProperty('--pointer-x', `${(x * 100).toFixed(1)}%`);
        card.style.setProperty('--pointer-y', `${(y * 100).toFixed(1)}%`);

        gsap.to(card, {
          rotateY: (x - 0.5) * 8 * motionScale.tilt,
          rotateX: (0.5 - y) * 8 * motionScale.tilt,
          y: -4 * motionScale.lift,
          duration: 0.25 * motionScale.duration,
          ease: 'power2.out',
          transformPerspective: 700,
          transformOrigin: 'center'
        });
      };

      const onPointerLeave = () => {
        gsap.to(card, {
          rotateY: 0,
          rotateX: 0,
          y: 0,
          duration: 0.35 * motionScale.duration,
          ease: 'power3.out'
        });
      };

      card.addEventListener('pointermove', onPointerMove);
      card.addEventListener('pointerleave', onPointerLeave);

      cleanups.push(() => {
        card.removeEventListener('pointermove', onPointerMove);
        card.removeEventListener('pointerleave', onPointerLeave);
      });
    });

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, [cards, motionScale]);

  return (
    <section className={`cinematic-carousel mode-${motionMode}`} aria-label="Service highlights">
      <div className="carousel-headline">
        <span className="carousel-kicker">Interactive Guide</span>
        <h4>Pick a lane and watch the interface respond</h4>
      </div>
      <div className="carousel-rail" ref={railRef}>
        {cards.map((card, index) => {
          const isActive = selectedService === card.key;
          return (
            <button
              key={card.key}
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
              type="button"
              className={`carousel-card tone-${card.tone}${isActive ? ' active' : ''}`}
              onClick={(event) => {
                if (onPreviewEnd) {
                  onPreviewEnd();
                }
                onServiceSelect(card.key, event.currentTarget);
              }}
              onPointerEnter={(event) => {
                if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
                  onServicePreview?.(card.key);
                }
              }}
              onPointerLeave={() => onPreviewEnd?.()}
              onFocus={() => onServicePreview?.(card.key)}
              onBlur={() => onPreviewEnd?.()}
            >
              <span className="carousel-card-label">{card.label}</span>
              <strong className="carousel-card-title">{card.title}</strong>
              <p className="carousel-card-description">{card.description}</p>
              <span className="carousel-card-glare" aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </section>
  );
}
