import React, { useEffect, useRef } from 'react';

/**
 * StoryCard Component
 * 
 * Renders AI-generated climate narrative text with smooth animations.
 * Designed for scrollytelling: text fades in/out and responds to scroll progress.
 * 
 * ANIMATION PHILOSOPHY:
 * - Subtle entrance: fade + gentle upward slide
 * - Smooth transitions: CSS transitions for state changes
 * - Progressive enhancement: opacity/scale shift with scroll progress
 * - Readable: high contrast, proper spacing, legible typography
 */

const StoryCard = ({ 
  narrativeText = '', 
  stepIndex = 0, 
  progress = 0,
  isVisible = true 
}) => {
  const textRef = useRef(null);
  const prevIndexRef = useRef(stepIndex);

  // SCROLL PROGRESS ANIMATION
  // Subtly adjusts opacity and scale as user scrolls through a step
  useEffect(() => {
    if (!textRef.current || !isVisible) return;

    const element = textRef.current;
    
    // Smooth interpolation based on scroll progress
    const opacity = 0.7 + (progress * 0.3); // 0.7 → 1.0
    const scale = 0.98 + (progress * 0.02); // 0.98 → 1.0
    const translateY = (1 - progress) * 8; // 8px → 0px

    element.style.opacity = opacity;
    element.style.transform = `scale(${scale}) translateY(${translateY}px)`;
  }, [progress, isVisible]);

  // STEP TRANSITION DETECTION
  // Triggers re-entrance animation when step index changes
  useEffect(() => {
    if (prevIndexRef.current !== stepIndex && textRef.current) {
      // Force re-animation by briefly removing then re-adding animation class
      textRef.current.classList.remove('narrative-enter');
      void textRef.current.offsetWidth; // Trigger reflow
      textRef.current.classList.add('narrative-enter');
    }
    prevIndexRef.current = stepIndex;
  }, [stepIndex]);

  if (!isVisible || !narrativeText) {
    return null;
  }

  return (
    <div 
      ref={textRef}
      className="narrative-text narrative-enter"
      data-step-index={stepIndex}
      style={storyCardStyles.container}
    >
      {narrativeText}
    </div>
  );
};

// INLINE STYLES
// Used for base structure; animations handled via CSS classes below
const storyCardStyles = {
  container: {
    padding: '32px 24px',
    margin: '0 auto',
    maxWidth: '600px',
    color: '#ffffff',
    fontSize: '18px',
    lineHeight: '1.8',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontWeight: '400',
    textShadow: '0 2px 8px rgba(0, 0, 0, 0.8), 0 4px 16px rgba(0, 0, 0, 0.6)',
    letterSpacing: '0.01em',
    position: 'relative',
    willChange: 'transform, opacity',
    transition: 'opacity 400ms cubic-bezier(0.4, 0, 0.2, 1), transform 400ms cubic-bezier(0.4, 0, 0.2, 1)'
  }
};

// INJECT GLOBAL ANIMATION STYLES
// Handles entrance animation when new narrative appears
if (typeof document !== 'undefined') {
  const styleId = 'storycard-animations';
  
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* ENTRANCE ANIMATION */
      /* Smooth fade-in with upward slide when text first appears */
      @keyframes narrativeFadeIn {
        from {
          opacity: 0;
          transform: translateY(30px) scale(0.97);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .narrative-text {
        /* Base state: fully visible and positioned */
        opacity: 1;
        transform: translateY(0) scale(1);
      }

      .narrative-text.narrative-enter {
        /* Trigger entrance animation on mount or step change */
        animation: narrativeFadeIn 800ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
      }

      /* RESPONSIVE TYPOGRAPHY */
      @media (max-width: 768px) {
        .narrative-text {
          font-size: 16px;
          line-height: 1.7;
          padding: 24px 16px;
        }
      }

      /* HIGH CONTRAST MODE SUPPORT */
      @media (prefers-contrast: high) {
        .narrative-text {
          text-shadow: 0 2px 12px rgba(0, 0, 0, 1), 0 4px 24px rgba(0, 0, 0, 1);
        }
      }

      /* REDUCED MOTION SUPPORT */
      /* Disable animations for users who prefer reduced motion */
      @media (prefers-reduced-motion: reduce) {
        .narrative-text,
        .narrative-text.narrative-enter {
          animation: none !important;
          transition: none !important;
          opacity: 1 !important;
          transform: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

export default StoryCard;

// ============================================================
// VANILLA JS UTILITIES FOR NON-REACT USAGE
// ============================================================

/**
 * createNarrativeRenderer
 * 
 * Factory function for rendering narrative text in vanilla JS contexts.
 * Used by ScrollContainer when working directly with DOM.
 * 
 * ANIMATION APPROACH:
 * - CSS transitions for smooth opacity/transform changes
 * - RequestAnimationFrame for triggering layout changes
 * - Cleanup timeouts to prevent memory leaks
 */
export function createNarrativeRenderer(containerSelector) {
  const container = document.querySelector(containerSelector);
  
  if (!container) {
    console.error('Narrative container not found:', containerSelector);
    return null;
  }
  
  let currentTextElement = null;
  let animationTimeout = null;
  
  function clearCurrentText() {
    if (currentTextElement) {
      // Fade out before removing
      currentTextElement.style.opacity = '0';
      currentTextElement.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        if (currentTextElement && currentTextElement.parentNode) {
          currentTextElement.remove();
        }
      }, 400);
    }
  }
  
  function renderText(text, index, options = {}) {
    const {
      animationDelay = 0,
      fadeInDuration = 800,
      slideDistance = 30,
    } = options;
    
    if (animationTimeout) {
      clearTimeout(animationTimeout);
    }
    
    clearCurrentText();
    
    animationTimeout = setTimeout(() => {
      const textElement = document.createElement('div');
      textElement.className = 'narrative-text';
      textElement.setAttribute('data-step-index', index);
      textElement.textContent = text;
      
      // INLINE STYLES FOR NARRATIVE TEXT
      // Matches StoryCard component styling
      textElement.style.cssText = `
        opacity: 0;
        transform: translateY(${slideDistance}px);
        transition: opacity ${fadeInDuration}ms cubic-bezier(0.4, 0, 0.2, 1), 
                    transform ${fadeInDuration}ms cubic-bezier(0.4, 0, 0.2, 1);
        padding: 32px 24px;
        margin: 0 auto;
        max-width: 600px;
        color: #ffffff;
        font-size: 18px;
        line-height: 1.8;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-weight: 400;
        text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8), 0 4px 16px rgba(0, 0, 0, 0.6);
        letter-spacing: 0.01em;
        will-change: transform, opacity;
      `;
      
      container.appendChild(textElement);
      currentTextElement = textElement;
      
      // TRIGGER ANIMATION VIA RAF
      // Double RAF ensures layout has been calculated
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          textElement.style.opacity = '1';
          textElement.style.transform = 'translateY(0)';
        });
      });
    }, animationDelay);
  }
  
  function updateText(text, index) {
    if (currentTextElement && currentTextElement.getAttribute('data-step-index') === String(index)) {
      // Smooth text update without re-animation
      currentTextElement.style.transition = 'opacity 300ms ease';
      currentTextElement.style.opacity = '0.5';
      
      setTimeout(() => {
        currentTextElement.textContent = text;
        currentTextElement.style.opacity = '1';
      }, 150);
    } else {
      renderText(text, index);
    }
  }
  
  function hideText() {
    clearCurrentText();
  }
  
  function destroy() {
    if (animationTimeout) {
      clearTimeout(animationTimeout);
    }
    clearCurrentText();
  }
  
  return {
    render: renderText,
    update: updateText,
    hide: hideText,
    destroy: destroy
  };
}

/**
 * createProgressiveTextRenderer
 * 
 * Alternative renderer with typewriter or word-by-word fade effects.
 * More theatrical for dramatic narrative moments.
 */
export function createProgressiveTextRenderer(containerSelector) {
  const container = document.querySelector(containerSelector);
  
  if (!container) {
    console.error('Container not found');
    return null;
  }
  
  function renderWithTypewriter(text, index, speed = 40) {
    container.innerHTML = '';
    
    const textElement = document.createElement('div');
    textElement.className = 'narrative-text';
    textElement.setAttribute('data-step-index', index);
    textElement.style.cssText = `
      opacity: 1;
      padding: 32px 24px;
      color: #ffffff;
      font-size: 18px;
      line-height: 1.8;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
    `;
    
    container.appendChild(textElement);
    
    const words = text.split(' ');
    let wordIndex = 0;
    
    function typeNextWord() {
      if (wordIndex < words.length) {
        textElement.textContent += (wordIndex > 0 ? ' ' : '') + words[wordIndex];
        wordIndex++;
        setTimeout(typeNextWord, speed);
      }
    }
    
    typeNextWord();
  }
  
  function renderWithFadeInWords(text, index, delayBetweenWords = 80) {
    container.innerHTML = '';
    
    const textElement = document.createElement('div');
    textElement.className = 'narrative-text';
    textElement.setAttribute('data-step-index', index);
    textElement.style.cssText = `
      padding: 32px 24px;
      color: #ffffff;
      font-size: 18px;
      line-height: 1.8;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
    `;
    
    container.appendChild(textElement);
    
    const words = text.split(' ');
    
    words.forEach((word, i) => {
      const wordSpan = document.createElement('span');
      wordSpan.textContent = word + ' ';
      wordSpan.style.cssText = `
        opacity: 0;
        display: inline-block;
        transition: opacity 500ms cubic-bezier(0.4, 0, 0.2, 1);
      `;
      
      textElement.appendChild(wordSpan);
      
      setTimeout(() => {
        wordSpan.style.opacity = '1';
      }, i * delayBetweenWords);
    });
  }
  
  return {
    typewriter: renderWithTypewriter,
    fadeWords: renderWithFadeInWords
  };
}

/**
 * synchronizeNarrativeWithScroll
 * 
 * Manages loading states and queuing of AI-generated narratives.
 * Ensures smooth transitions between loading and loaded states.
 */
export function synchronizeNarrativeWithScroll(scrollController, narrativeRenderer) {
  const narrativeQueue = new Map();
  const loadingStates = new Map();
  
  function queueNarrative(stepIndex, narrativePromise) {
    narrativeQueue.set(stepIndex, narrativePromise);
    loadingStates.set(stepIndex, 'loading');
    
    narrativePromise
      .then(text => {
        narrativeQueue.set(stepIndex, text);
        loadingStates.set(stepIndex, 'loaded');
      })
      .catch(error => {
        console.error(`Failed to load narrative for step ${stepIndex}:`, error);
        loadingStates.set(stepIndex, 'error');
      });
  }
  
  function displayNarrativeForStep(stepIndex) {
    const narrative = narrativeQueue.get(stepIndex);
    const loadingState = loadingStates.get(stepIndex);
    
    if (loadingState === 'loaded' && typeof narrative === 'string') {
      narrativeRenderer.render(narrative, stepIndex);
    } else if (loadingState === 'loading') {
      const loadingText = 'Loading narrative...';
      narrativeRenderer.render(loadingText, stepIndex, { fadeInDuration: 300 });
      
      const checkInterval = setInterval(() => {
        const currentState = loadingStates.get(stepIndex);
        if (currentState === 'loaded') {
          const loadedText = narrativeQueue.get(stepIndex);
          narrativeRenderer.update(loadedText, stepIndex);
          clearInterval(checkInterval);
        } else if (currentState === 'error') {
          narrativeRenderer.update('Failed to load narrative.', stepIndex);
          clearInterval(checkInterval);
        }
      }, 100);
    } else if (loadingState === 'error') {
      narrativeRenderer.render('Failed to load narrative.', stepIndex);
    }
  }
  
  function preloadNarratives(stepDataArray, narrativeFetcher) {
    stepDataArray.forEach((stepData, index) => {
      const narrativePromise = narrativeFetcher(stepData);
      queueNarrative(index, narrativePromise);
    });
  }
  
  return {
    queue: queueNarrative,
    display: displayNarrativeForStep,
    preload: preloadNarratives
  };
}

/**
 * createSmoothTextTransition
 * 
 * Crossfade effect for transitioning between narrative texts.
 * Uses absolute positioning for overlapping fade in/out.
 */
export function createSmoothTextTransition(containerSelector) {
  const container = document.querySelector(containerSelector);
  let currentElement = null;
  let nextElement = null;
  
  function crossfadeText(newText, index) {
    if (nextElement) {
      nextElement.remove();
    }
    
    nextElement = document.createElement('div');
    nextElement.className = 'narrative-text';
    nextElement.setAttribute('data-step-index', index);
    nextElement.textContent = newText;
    nextElement.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 600ms cubic-bezier(0.4, 0, 0.2, 1), 
                  transform 600ms cubic-bezier(0.4, 0, 0.2, 1);
      padding: 32px 24px;
      color: #ffffff;
      font-size: 18px;
      line-height: 1.8;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
    `;
    
    container.appendChild(nextElement);
    
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        nextElement.style.opacity = '1';
        nextElement.style.transform = 'translateY(0)';
        
        if (currentElement) {
          currentElement.style.opacity = '0';
          currentElement.style.transform = 'translateY(-20px)';
          
          setTimeout(() => {
            if (currentElement && currentElement.parentNode) {
              currentElement.remove();
            }
            currentElement = nextElement;
            nextElement = null;
          }, 600);
        } else {
          currentElement = nextElement;
          nextElement = null;
        }
      });
    });
  }
  
  return {
    transition: crossfadeText
  };
}

/**
 * animateTextWithProgress
 * 
 * Dynamically adjusts text styling based on scroll progress.
 * Creates subtle "breathing" effect as user scrolls.
 * 
 * PARAMETERS:
 * - progress: 0 (top of step) → 1 (bottom of step)
 * - Options allow customization of animation ranges
 */
export function animateTextWithProgress(element, progress, options = {}) {
  const {
    minOpacity = 0.7,
    maxOpacity = 1,
    minScale = 0.98,
    maxScale = 1,
    slideRange = 8
  } = options;
  
  const opacity = minOpacity + (maxOpacity - minOpacity) * progress;
  const scale = minScale + (maxScale - minScale) * progress;
  const translateY = slideRange * (1 - progress);
  
  element.style.opacity = opacity;
  element.style.transform = `scale(${scale}) translateY(${translateY}px)`;
}