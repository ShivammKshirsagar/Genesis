import 'mapbox-gl/dist/mapbox-gl.css';
import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';

// 1. Set your access token (Use an .env variable in a real project!)
mapboxgl.accessToken = 'pk.eyJ1IjoibXZjMjQiLCJhIjoiY21sYWNxd3RyMDl5cjNocjQwNTg1dmZiaSJ9.PLmSdYIrEhtAP3HU3T3weg';

const MapVisualizer = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
 
  // Initial state for the map center and zoom
  const [lng] = useState(-73.935242);
  const [lat] = useState(40.730610);
  const [zoom] = useState(10);

  // State for fly-to inputs
  const [targetLat, setTargetLat] = useState('');
  const [targetLng, setTargetLng] = useState('');
  const [targetZoom, setTargetZoom] = useState(14);

  const toggleLayer = (layerId, isVisible) => {
    if (map.current) {
      map.current.setLayoutProperty(
        layerId,
        'visibility',
        isVisible ? 'visible' : 'none'
      );
    }
  };

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

  const handleFlyTo = () => {
    const lat = parseFloat(targetLat);
    const lng = parseFloat(targetLng);
    
    if (isNaN(lat) || isNaN(lng)) {
      alert('Please enter valid latitude and longitude values');
      return;
    }
    
    if (lat < -90 || lat > 90) {
      alert('Latitude must be between -90 and 90');
      return;
    }
    
    if (lng < -180 || lng > 180) {
      alert('Longitude must be between -180 and 180');
      return;
    }
    
    flyToLocation(lat, lng, targetZoom);
  };

  useEffect(() => {
    // If map already exists, don't do anything
    if (!mapContainer.current) return;

    // 2. THE CHECK: Don't initialize if the map already exists
    if (map.current) return;
 
    console.log("Wizard is attempting to summon the map...");
 
    // Initialize
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-73.935242, 40.730610],
      zoom: 10,
      antialias: true
    });

    map.current.setProjection('globe');
  
    // CRITICAL: Add an error listener to see WHY it might be hanging
    map.current.on('error', (e) => {
      console.error("MAPBOX ERROR DETAILS:", e.error);
    });
  
    map.current.on('load', () => {
      console.log("MAP SUCCESS: The map is fully loaded.");
      
      // Force a resize to ensure it fills the screen
      map.current.resize();

      map.current.setFog({
        range: [0.8, 8],
        color: 'white',
        'horizon-blend': 0.2,
        'high-color': '#245bde',
        'space-color': '#000000',
        'star-intensity': 0.15
      });
  
      // Prevent duplicate sources if React StrictMode triggers twice
      if (map.current.getSource('heatmap-data')) return;
  
      // --- ADD HEATMAP LAYER ---
      map.current.addSource('heatmap-data', {
        type: 'geojson',
        data: 'https://docs.mapbox.com/mapbox-gl-js/assets/earthquakes.geojson'
      });
  
      map.current.addLayer({
        id: 'heatmap-layer',
        type: 'heatmap',
        source: 'heatmap-data',
        layout: { 'visibility': 'none' },
        paint: {
          'heatmap-weight': ['interpolate', ['linear'], ['get', 'mag'], 0, 0, 6, 1],
          'heatmap-intensity': 1,
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(33,102,172,0)', 0.2, 'rgb(103,169,207)', 0.4, 'rgb(209,229,240)',
            0.6, 'rgb(253,219,199)', 0.8, 'rgb(239,138,98)', 1, 'rgb(178,24,43)'
          ],
          'heatmap-radius': 20,
          'heatmap-opacity': 0.8
        }
      });
  
      // --- ADD FLOOD LAYER (Global WMS Raster) ---
      map.current.addSource('flood-data', {
        type: 'raster',
        tiles: [
          'https://tiles.maps.eox.at/wms?service=WMS&request=GetMap&version=1.1.1&layers=coastline&styles=&format=image/png&transparent=true&srs=EPSG:3857&width=256&height=256&bbox={bbox-epsg-3857}'
        ],
        tileSize: 256
      });

      map.current.addLayer({
        id: 'flood-layer',
        type: 'raster',
        source: 'flood-data',
        layout: { 'visibility': 'none' },
        paint: {
          'raster-opacity': 0.75
        }
      });
  
      // --- 3D BUILDINGS LAYER (For the satellite/detail view) ---
      map.current.addLayer({
        'id': '3d-buildings',
        'source': 'composite',
        'source-layer': 'building',
        'filter': ['==', 'extrude', 'true'],
        'type': 'fill-extrusion',
        'minzoom': 15,
        'paint': {
          'fill-extrusion-color': '#aaa',
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': ['get', 'min_height'],
          'fill-extrusion-opacity': 0.6
        }
      });
    });
  
    // 5. CLEANUP
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      {/* Map Container */}
      <div
        ref={mapContainer}
        style={{ width: '100%', height: '100%' }}
      />
      
      {/* Control Panel */}
      <div style={{
        position: 'absolute', 
        zIndex: 10, 
        top: 10, 
        left: 10,
        background: 'rgba(0,0,0,0.7)', 
        color: 'white', 
        padding: '15px', 
        borderRadius: '5px',
        minWidth: '250px'
      }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Wizard Controls</h4>
       
        {/* Layer Toggles */}
        <div style={{ marginBottom: '8px' }}>
          <input
            type="checkbox"
            id="heat"
            onChange={(e) => toggleLayer('heatmap-layer', e.target.checked)}
          />
          <label htmlFor="heat" style={{ marginLeft: '8px' }}>Toggle Heatmap</label>
        </div>
     
        <div style={{ marginBottom: '15px' }}>
          <input
            type="checkbox"
            id="flood"
            onChange={(e) => toggleLayer('flood-layer', e.target.checked)}
          />
          <label htmlFor="flood" style={{ marginLeft: '8px' }}>Toggle Flood Zone</label>
        </div>

        {/* Fly To Location Section */}
        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.3)', margin: '15px 0' }} />
        
        <h5 style={{ margin: '0 0 10px 0' }}>Fly to Location</h5>
        
        <div style={{ marginBottom: '8px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Latitude:</label>
          <input
            type="number"
            step="any"
            placeholder="e.g., 40.730610"
            value={targetLat}
            onChange={(e) => setTargetLat(e.target.value)}
            style={{
              width: '100%',
              padding: '6px',
              borderRadius: '3px',
              border: '1px solid #555',
              background: '#222',
              color: 'white'
            }}
          />
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Longitude:</label>
          <input
            type="number"
            step="any"
            placeholder="e.g., -73.935242"
            value={targetLng}
            onChange={(e) => setTargetLng(e.target.value)}
            style={{
              width: '100%',
              padding: '6px',
              borderRadius: '3px',
              border: '1px solid #555',
              background: '#222',
              color: 'white'
            }}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Zoom Level:</label>
          <input
            type="number"
            min="0"
            max="22"
            value={targetZoom}
            onChange={(e) => setTargetZoom(parseFloat(e.target.value))}
            style={{
              width: '100%',
              padding: '6px',
              borderRadius: '3px',
              border: '1px solid #555',
              background: '#222',
              color: 'white'
            }}
          />
        </div>

        <button
          onClick={handleFlyTo}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: 'none',
            background: '#4CAF50',
            color: 'white',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
          onMouseOver={(e) => e.target.style.background = '#45a049'}
          onMouseOut={(e) => e.target.style.background = '#4CAF50'}
        >
          Fly to Location
        </button>

        {/* Quick Location Buttons */}
        <div style={{ marginTop: '15px' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '12px', opacity: 0.8 }}>Quick Locations:</p>
          <button
            onClick={() => flyToLocation(51.5074, -0.1278, 12)}
            style={{ marginRight: '5px', marginBottom: '5px', padding: '4px 8px', borderRadius: '3px', border: 'none', background: '#555', color: 'white', cursor: 'pointer', fontSize: '11px' }}
          >
            London
          </button>
          <button
            onClick={() => flyToLocation(35.6762, 139.6503, 12)}
            style={{ marginRight: '5px', marginBottom: '5px', padding: '4px 8px', borderRadius: '3px', border: 'none', background: '#555', color: 'white', cursor: 'pointer', fontSize: '11px' }}
          >
            Tokyo
          </button>
          <button
            onClick={() => flyToLocation(-33.8688, 151.2093, 12)}
            style={{ marginRight: '5px', marginBottom: '5px', padding: '4px 8px', borderRadius: '3px', border: 'none', background: '#555', color: 'white', cursor: 'pointer', fontSize: '11px' }}
          >
            Sydney
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapVisualizer;