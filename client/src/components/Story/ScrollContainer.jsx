import React, { useEffect, useRef } from 'react';
import scrollama from 'scrollama';
import {
  createNarrativeRenderer,
  synchronizeNarrativeWithScroll,
  animateTextWithProgress
} from './StoryCard';

// DEFAULT TIMELINE
// Can be overridden via props for dynamic data
const DEFAULT_TIMELINE = [
  { year: 2030, deltaValue: 20, description: "Early climate shifts" },
  { year: 2040, deltaValue: 40, description: "Moderate impacts" },
  { year: 2050, deltaValue: 60, description: "Severe degradation" },
  { year: 2060, deltaValue: 80, description: "Critical conditions" },
  { year: 2070, deltaValue: 100, description: "Extreme climate state" }
];

const ScrollContainer = ({ 
  isStoryActive = false, 
  selectedLocation = null, 
  timeline = DEFAULT_TIMELINE,
  mapInstance = null,
  onUpdateMapVisuals = null 
}) => {
  
  // REFS FOR SCROLLAMA & NARRATIVE CONTROL
  // These persist across renders but are cleaned up on unmount or story reset
  const scrollerRef = useRef(null);
  const narrativeRendererRef = useRef(null);
  const narrativeSyncRef = useRef(null);

  // MAP VISUAL UPDATE HANDLER
  // Called on scroll step entry/progress to update climate visualization
  const updateMapVisuals = (stepData) => {
    if (onUpdateMapVisuals && mapInstance) {
      onUpdateMapVisuals(stepData, mapInstance);
    } else {
      console.log('Update map visuals:', stepData);
    }
  };

  // NARRATIVE FETCHING
  // Generates location-aware narrative text for each timeline step
  const requestNarrative = (stepData, location) => {
    const { year, deltaValue, description } = stepData;
    const cityName = location?.city || location?.name || 'this location';

    console.log('Request narrative for:', { stepData, location });

    return Promise.resolve(
      `By ${year}, ${cityName} experiences ${description.toLowerCase()} ` +
      `with a climate degradation index of ${deltaValue}.`
    );
  };

  // SCROLLAMA INITIALIZATION
  // Only called when isStoryActive becomes true
  const initializeScrollama = () => {
    // CLEANUP PREVIOUS INSTANCE
    // Prevent duplicate initialization if called multiple times
    if (scrollerRef.current) {
      cleanupScrollama();
    }

    // INITIALIZE NARRATIVE RENDERER
    // Targets the #story-content container in index.html
    const narrativeRenderer = createNarrativeRenderer('#story-content');
    if (!narrativeRenderer) {
      console.error('Failed to initialize narrative renderer - #story-content not found');
      return;
    }

    // INITIALIZE NARRATIVE SYNCHRONIZER
    // Manages queuing and displaying of AI-generated text
    const narrativeSync = synchronizeNarrativeWithScroll(null, narrativeRenderer);

    // ATTACH LOCATION TO TIMELINE DATA
    // Ensures each step has access to selected location
    const stepsWithLocation = selectedLocation
      ? timeline.map(step => ({ ...step, location: selectedLocation }))
      : timeline;

    // CREATE SCROLLAMA INSTANCE
    const scroller = scrollama();

    scroller
      .setup({
        step: '.scroll-step',
        offset: 0.5,
        debug: false,
        progress: true
      })
      .onStepEnter(response => {
        const { index } = response;
        const stepData = stepsWithLocation[index];

        if (!stepData) return;

        // Update map visualization for this step
        updateMapVisuals(stepData);

        // Fetch and display narrative for this step
        const locationForStep = stepData.location || selectedLocation || null;
        const narrativePromise = requestNarrative(stepData, locationForStep);

        if (narrativeSync) {
          narrativeSync.queue(index, narrativePromise);
          narrativeSync.display(index);
        } else {
          narrativePromise
            .then(narrativeText => {
              console.log('Narrative:', narrativeText, 'for step', index);
            })
            .catch(error => {
              console.error('Failed to load narrative:', error);
            });
        }
      })
      .onStepExit(response => {
        const { index, direction } = response;
        console.log('Step exit:', index, direction);
      })
      .onStepProgress(response => {
        const { index, progress } = response;
        const stepData = stepsWithLocation[index];
        
        if (stepData) {
          const interpolatedDelta = stepData.deltaValue * progress;
          updateMapVisuals({
            ...stepData,
            deltaValue: interpolatedDelta,
            progress: progress
          });

          // Animate narrative text based on scroll progress
          const currentText = document.querySelector('.narrative-text');
          if (currentText) {
            animateTextWithProgress(currentText, progress);
          }
        }
      });

    // Handle window resize for responsive scroll triggers
    const handleResize = () => {
      if (scrollerRef.current) {
        scrollerRef.current.resize();
      }
    };
    window.addEventListener('resize', handleResize);

    // Store refs for cleanup
    scrollerRef.current = scroller;
    narrativeRendererRef.current = narrativeRenderer;
    narrativeSyncRef.current = narrativeSync;

    console.log('Scrollama initialized for location:', selectedLocation);
  };

  // SCROLLAMA CLEANUP
  // Called when story is deactivated or component unmounts
  const cleanupScrollama = () => {
    if (scrollerRef.current) {
      scrollerRef.current.destroy();
      scrollerRef.current = null;
    }

    if (narrativeRendererRef.current) {
      narrativeRendererRef.current.destroy();
      narrativeRendererRef.current = null;
    }

    narrativeSyncRef.current = null;

    window.removeEventListener('resize', () => {
      if (scrollerRef.current) {
        scrollerRef.current.resize();
      }
    });

    console.log('Scrollama cleaned up');
  };

  // LIFECYCLE EFFECT: STORY ACTIVATION
  // Initializes Scrollama when isStoryActive becomes true
  // Cleans up when isStoryActive becomes false or location changes
  useEffect(() => {
    if (isStoryActive && selectedLocation) {
      // Show story container
      const storyContainer = document.getElementById('story-container');
      if (storyContainer) {
        storyContainer.classList.add('visible');
      }

      // Initialize Scrollama after a brief delay to ensure DOM is ready
      setTimeout(() => {
        initializeScrollama();
      }, 100);
    } else {
      // Hide story container
      const storyContainer = document.getElementById('story-container');
      if (storyContainer) {
        storyContainer.classList.remove('visible');
      }

      // Cleanup Scrollama
      cleanupScrollama();
    }

    // Cleanup on unmount
    return () => {
      cleanupScrollama();
    };
  }, [isStoryActive, selectedLocation]);

  // RENDER LOGIC
  // Only render scroll steps when story is active
  if (!isStoryActive || !selectedLocation) {
    return null;
  }

  return (
    <>
      {/* Scroll steps are rendered into #story-content via portal-like behavior */}
      {/* The actual rendering happens in index.html's #story-container */}
      {/* This component just manages the Scrollama lifecycle */}
    </>
  );
};

// STANDALONE UTILITY FUNCTIONS
// Exported for use in other components or testing

export function mapStepToYear(stepIndex, timelineData) {
  if (stepIndex >= 0 && stepIndex < timelineData.length) {
    return timelineData[stepIndex].year;
  }
  return null;
}

export function getStepData(stepIndex, timelineData) {
  if (stepIndex >= 0 && stepIndex < timelineData.length) {
    return timelineData[stepIndex];
  }
  return null;
}

export function calculateInterpolatedState(currentStep, nextStep, progress) {
  return {
    year: Math.round(currentStep.year + (nextStep.year - currentStep.year) * progress),
    deltaValue: currentStep.deltaValue + (nextStep.deltaValue - currentStep.deltaValue) * progress,
    description: progress < 0.5 ? currentStep.description : nextStep.description
  };
}

// LEGACY EXPORT FOR BACKWARD COMPATIBILITY
// Allows initStoryForLocation to be called from MapVisualizer
export function initStoryForLocation(location) {
  console.warn('initStoryForLocation is deprecated. Use the ScrollContainer component with props instead.');
  
  if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
    console.error('initStoryForLocation requires a location with latitude and longitude.');
    return;
  }

  // Show story container
  const storyContainer = document.getElementById('story-container');
  if (storyContainer) {
    storyContainer.classList.add('visible');
  }
}

export default ScrollContainer;