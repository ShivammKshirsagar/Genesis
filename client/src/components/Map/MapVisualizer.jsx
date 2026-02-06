import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// 1. Set your access token (Use an .env variable in a real project!)
mapboxgl.accessToken = 'YOUR_MAPBOX_ACCESS_TOKEN_HERE';

const MapVisualizer = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  
  // Initial state for the map center and zoom
  const [lng] = useState(-73.935242); 
  const [lat] = useState(40.730610);
  const [zoom] = useState(10);

  // Task 3: Camera Function
  const flyToLocation = (targetLat, targetLng, targetZoom = 14) => {
    if (map.current) {
      map.current.flyTo({
        center: [targetLng, targetLat], // Mapbox uses [lng, lat]
        zoom: targetZoom,
        essential: true,
        speed: 1.2,
        curve: 1.42,
      });
    }
  };

  useEffect(() => {
    if (map.current) return; // Initialize map only once

    // Task 1 & 2: Initialization and Dark Style
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11', // Dark mode for pop
      center: [lng, lat],
      zoom: zoom,
    });

    map.current.on('load', () => {
      // Task 4: Visual Layers (Hidden by default)
      
      // HEATMAP LAYER SETUP
      map.current.addSource('heatmap-data', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] } // Placeholder
      });

      map.current.addLayer({
        id: 'heatmap-layer',
        type: 'heatmap',
        source: 'heatmap-data',
        layout: { 'visibility': 'none' }, // Hidden by default
        paint: {
          'heatmap-weight': 1,
          'heatmap-intensity': 1,
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(0,0,255,0)',
            0.5, 'rgb(255,255,0)',
            1, 'rgb(255,0,0)'
          ],
        }
      });

      // FLOOD LAYER SETUP (Blue Overlay)
      map.current.addSource('flood-data', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] } // Placeholder
      });

      map.current.addLayer({
        id: 'flood-layer',
        type: 'fill',
        source: 'flood-data',
        layout: { 'visibility': 'none' }, // Hidden by default
        paint: {
          'fill-color': '#007cbf',
          'fill-opacity': 0.5
        }
      });
    });

    // Clean up on unmount
    return () => map.current.remove();
  }, [lng, lat, zoom]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      {/* UI Controls for testing the Wizard's work */}
      <div className="wizard-controls" style={{
        position: 'absolute', zIndex: 1, top: 10, left: 10, 
        padding: '10px', background: 'rgba(255,255,255,0.8)', borderRadius: '8px'
      }}>
        <button onClick={() => flyToLocation(40.7128, -74.0060)}>Fly to NYC</button>
      </div>
      
      <div ref={mapContainer} className="map-container" style={{ height: '100%' }} />
    </div>
  );
};

export default MapVisualizer;