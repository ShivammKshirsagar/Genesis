import React, { useEffect } from 'react';
import MapVisualizer from './components/Map/MapVisualizer';
//import { setupViewStoryButton } from './components/Story/ScrollContainer';

function App() {
  useEffect(() => {
    // Optional: if you ever use a plain DOM "View Story" button,
    // this wires it up once on mount.
   // setupViewStoryButton();
  }, []);

  return (
    <div className="App" style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapVisualizer />

      {/* Scrollytelling UI overlay (hidden until a story is started) */}
      <div
        id="scrollytelling-ui"
        className="is-hidden"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '32%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.75)',
          color: '#fff',
          overflowY: 'auto',
          padding: '16px',
          boxSizing: 'border-box'
        }}
      >
        <div
          id="narrative-container"
          style={{
            minHeight: '30vh',
            marginBottom: '24px',
            fontSize: '14px',
            lineHeight: 1.6
          }}
        />

        <div id="story-steps">
          <div className="scroll-step" style={{ minHeight: '80vh' }} />
          <div className="scroll-step" style={{ minHeight: '80vh' }} />
          <div className="scroll-step" style={{ minHeight: '80vh' }} />
          <div className="scroll-step" style={{ minHeight: '80vh' }} />
          <div className="scroll-step" style={{ minHeight: '80vh' }} />
        </div>
      </div>
    </div>
  );
}

export default App;