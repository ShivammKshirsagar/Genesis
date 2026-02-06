import 'mapbox-gl/dist/mapbox-gl.css';
import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import {
  applyClimateDegradation,
  initializeClimateViz,
  updateClimateOnScroll,
  resetClimateEffects,
  createClimateGradient
} from '../../services/climatevisuals';

mapboxgl.accessToken = 'pk.eyJ1IjoibXZjMjQiLCJhIjoiY21sYWNxd3RyMDl5cjNocjQwNTg1dmZiaSJ9.PLmSdYIrEhtAP3HU3T3weg';

const MapVisualizer = ({ onStoryActivate }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
 
  const [lng] = useState(-73.935242);
  const [lat] = useState(40.730610);
  const [zoom] = useState(10);

  const [targetLat, setTargetLat] = useState('');
  const [targetLng, setTargetLng] = useState('');
  const [targetZoom, setTargetZoom] = useState(14);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // LOCATION SELECTION STATE
  // Tracks the user's selected location from geocoding search
  // Contains: { name, coordinates: { lat, lng } }
  const [selectedLocation, setSelectedLocation] = useState(null);

  // STORY ACTIVATION STATE
  // Tracks whether the user has clicked "View Story"
  // This determines if scrollytelling should be enabled
  const [isStoryActive, setIsStoryActive] = useState(false);

  const [climateIntensity, setClimateIntensity] = useState(0);

  const toggleLayer = (layerId, isVisible) => {
    if (map.current) {
      map.current.setLayoutProperty(
        layerId,
        'visibility',
        isVisible ? 'visible' : 'none'
      );
    }
  };

  const flyToLocation = (targetLat, targetLng, targetZoom = 14) => {
    if (map.current) {
      map.current.flyTo({
        center: [targetLng, targetLat],
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

  const searchLocation = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResults([]);

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${mapboxgl.accessToken}&limit=5`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        setSearchResults(data.features);
      } else {
        setSearchResults([]);
        alert('No locations found. Try a different search term.');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      alert('Failed to search location. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // LOCATION SELECTION HANDLER
  // Called when user clicks a search result
  // Sets the selected location and prepares the map for climate visualization
  const selectSearchResult = (result) => {
    const [lng, lat] = result.center;
    const locationName = result.place_name;

    // Store the selected location for future story activation
    setSelectedLocation({
      name: locationName,
      coordinates: { lat, lng }
    });

    // Reset story activation state when a new location is selected
    setIsStoryActive(false);

    // Update map marker
    if (marker.current) {
      marker.current.remove();
    }

    marker.current = new mapboxgl.Marker({ color: '#FF5722' })
      .setLngLat([lng, lat])
      .addTo(map.current);

    // Fly to the selected location
    flyToLocation(lat, lng, 12);
    
    // Clear search UI
    setSearchResults([]);
    setSearchQuery('');

    // Initialize climate visualization layers for this location
    if (map.current && map.current.loaded()) {
      initializeClimateViz(map.current, lat, lng);
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchLocation();
    }
  };

  const handleClimateIntensityChange = (value) => {
    setClimateIntensity(value);
    
    if (map.current && selectedLocation) {
      updateClimateOnScroll(
        map.current,
        selectedLocation.coordinates.lat,
        selectedLocation.coordinates.lng,
        value
      );
    }
  };

  const handleResetClimate = () => {
    setClimateIntensity(0);
    
    if (map.current && selectedLocation) {
      resetClimateEffects(
        map.current,
        selectedLocation.coordinates.lat,
        selectedLocation.coordinates.lng
      );
    }
  };

  // STORY ACTIVATION HANDLER
  // Triggered when user clicks "View Story" button
  // This is the critical trigger that enables scrollytelling
  const handleViewStoryClick = () => {
    if (!selectedLocation) {
      alert('Please select a location first');
      return;
    }

    // Mark story as active
    setIsStoryActive(true);

    // Prepare location data payload
    const locationData = {
      latitude: selectedLocation.coordinates.lat,
      longitude: selectedLocation.coordinates.lng,
      city: selectedLocation.name
    };

    // Notify parent component or controller that story should begin
    // Parent will handle: showing story container, initializing scrollama, fetching narratives
    if (onStoryActivate) {
      onStoryActivate(locationData, map.current);
    }

    console.log('Story activated for location:', locationData);
  };

  useEffect(() => {
    if (!mapContainer.current) return;
    if (map.current) return;
 
    console.log("Wizard is attempting to summon the map...");
 
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-73.935242, 40.730610],
      zoom: 10,
      antialias: true
    });

    map.current.setProjection('globe');
  
    map.current.on('error', (e) => {
      console.error("MAPBOX ERROR DETAILS:", e.error);
    });
  
    map.current.on('load', () => {
      console.log("MAP SUCCESS: The map is fully loaded.");
      
      map.current.resize();

      map.current.setFog({
        range: [0.8, 8],
        color: 'white',
        'horizon-blend': 0.2,
        'high-color': '#245bde',
        'space-color': '#000000',
        'star-intensity': 0.15
      });
  
      if (map.current.getSource('heatmap-data')) return;
  
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
            0, 'rgba(33,102,172,0)', 
            0.2, 'rgb(103,169,207)', 
            0.4, 'rgb(209,229,240)',
            0.6, 'rgb(253,219,199)', 
            0.8, 'rgb(239,138,98)', 
            1, 'rgb(178,24,43)'
          ],
          'heatmap-radius': 20,
          'heatmap-opacity': 0.8
        }
      });
  
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
  
    return () => {
      if (marker.current) {
        marker.current.remove();
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <div
        ref={mapContainer}
        style={{ width: '100%', height: '100%' }}
      />
      
      <div style={{
        position: 'absolute', 
        zIndex: 10, 
        top: 10, 
        left: 10,
        background: 'rgba(0,0,0,0.7)', 
        color: 'white', 
        padding: '15px', 
        borderRadius: '5px',
        minWidth: '250px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Wizard Controls</h4>
       
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Search Location</label>
          <div style={{ display: 'flex', gap: '5px' }}>
            <input
              type="text"
              placeholder="Enter city, place, or address"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '3px',
                border: '1px solid #555',
                background: '#222',
                color: 'white'
              }}
            />
            <button
              onClick={searchLocation}
              disabled={isSearching}
              style={{
                padding: '8px 12px',
                borderRadius: '3px',
                border: 'none',
                background: isSearching ? '#666' : '#2196F3',
                color: 'white',
                cursor: isSearching ? 'not-allowed' : 'pointer',
                fontWeight: 'bold'
              }}
            >
              {isSearching ? '...' : '🔍'}
            </button>
          </div>
          
          {searchResults.length > 0 && (
            <div style={{
              marginTop: '8px',
              background: '#333',
              borderRadius: '3px',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  onClick={() => selectSearchResult(result)}
                  style={{
                    padding: '10px',
                    borderBottom: index < searchResults.length - 1 ? '1px solid #444' : 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#444'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  {result.place_name}
                </div>
              ))}
            </div>
          )}

          {/* SELECTED LOCATION DISPLAY + VIEW STORY TRIGGER */}
          {/* Only shown after user selects a valid location from search */}
          {selectedLocation && (
            <div style={{
              marginTop: '10px',
              padding: '8px',
              background: '#2a2a2a',
              borderRadius: '3px',
              fontSize: '11px'
            }}>
              <strong>Selected:</strong> {selectedLocation.name}
              <br />
              <span style={{ opacity: 0.7 }}>
                Lat: {selectedLocation.coordinates.lat.toFixed(4)}, 
                Lng: {selectedLocation.coordinates.lng.toFixed(4)}
              </span>
              
              {/* VIEW STORY BUTTON */}
              {/* Critical trigger: activates scrollytelling for selected location */}
              {/* Only enabled when location is selected and story is not yet active */}
              <div style={{ marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={handleViewStoryClick}
                  disabled={isStoryActive}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    marginTop: '6px',
                    borderRadius: '3px',
                    border: 'none',
                    background: isStoryActive ? '#666' : '#FF9800',
                    color: '#fff',
                    cursor: isStoryActive ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    opacity: isStoryActive ? 0.6 : 1
                  }}
                >
                  {isStoryActive ? 'Story Active' : 'View Story'}
                </button>
              </div>
            </div>
          )}
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.3)', margin: '15px 0' }} />

        {/* MANUAL CLIMATE INTENSITY CONTROL */}
        {/* For testing climate effects without scrollytelling */}
        {selectedLocation && (
          <>
            <h5 style={{ margin: '0 0 10px 0' }}>Climate Degradation (Manual)</h5>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px' }}>
                Intensity: {climateIntensity}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={climateIntensity}
                onChange={(e) => handleClimateIntensityChange(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  marginBottom: '8px'
                }}
              />
              <button
                onClick={handleResetClimate}
                style={{
                  width: '100%',
                  padding: '6px',
                  borderRadius: '3px',
                  border: 'none',
                  background: '#f44336',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Reset Climate Effects
              </button>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.3)', margin: '15px 0' }} />
          </>
        )}

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

        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.3)', margin: '15px 0' }} />
        
        <h5 style={{ margin: '0 0 10px 0' }}>Fly to Coordinates</h5>
        
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
