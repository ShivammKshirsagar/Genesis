export function applyClimateDegradation(map, lat, lng, deltaValue) {
    const normalizedDelta = Math.min(Math.max(deltaValue, 0), 100) / 100;
    
    if (map.getLayer('heatmap-layer')) {
      map.setPaintProperty('heatmap-layer', 'heatmap-intensity', 0.5 + normalizedDelta * 2.5);
      map.setPaintProperty('heatmap-layer', 'heatmap-radius', 20 + normalizedDelta * 40);
      map.setPaintProperty('heatmap-layer', 'heatmap-opacity', 0.3 + normalizedDelta * 0.7);
      
      map.setPaintProperty('heatmap-layer', 'heatmap-color', [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0, 'rgba(33,102,172,0)',
        0.2, `rgba(${103 + normalizedDelta * 60}, ${169 - normalizedDelta * 90}, 207, ${0.4 + normalizedDelta * 0.4})`,
        0.4, `rgba(${209 + normalizedDelta * 40}, ${229 - normalizedDelta * 120}, ${240 - normalizedDelta * 180}, ${0.6 + normalizedDelta * 0.4})`,
        0.6, `rgba(253, ${219 - normalizedDelta * 110}, ${199 - normalizedDelta * 160}, ${0.75 + normalizedDelta * 0.25})`,
        0.8, `rgba(${239 + normalizedDelta * 16}, ${138 - normalizedDelta * 90}, 98, ${0.85 + normalizedDelta * 0.15})`,
        1, `rgba(${178 + normalizedDelta * 77}, 24, ${43 - normalizedDelta * 43}, 1)`
      ]);
    }
  
    if (map.getLayer('flood-layer')) {
      map.setPaintProperty('flood-layer', 'raster-opacity', normalizedDelta * 0.9);
      map.setPaintProperty('flood-layer', 'raster-brightness-max', 1 - normalizedDelta * 0.4);
      map.setPaintProperty('flood-layer', 'raster-saturation', -0.3 + normalizedDelta * 0.6);
      map.setPaintProperty('flood-layer', 'raster-contrast', normalizedDelta * 0.3);
    }
  
    const fogColor = normalizedDelta < 0.5 
      ? `rgba(255, ${255 - normalizedDelta * 240}, ${255 - normalizedDelta * 240}, ${0.4 + normalizedDelta * 0.3})`
      : `rgba(${255 - (normalizedDelta - 0.5) * 120}, ${135 - (normalizedDelta - 0.5) * 135}, ${135 - (normalizedDelta - 0.5) * 135}, ${0.65 + (normalizedDelta - 0.5) * 0.35})`;
  
    if (map.getFog()) {
      map.setFog({
        range: [0.8 - normalizedDelta * 0.4, 8 - normalizedDelta * 3],
        color: fogColor,
        'horizon-blend': 0.2 + normalizedDelta * 0.4,
        'high-color': `hsl(${219 - normalizedDelta * 50}, ${73 - normalizedDelta * 40}%, ${58 + normalizedDelta * 25}%)`,
        'space-color': `hsl(0, 0%, ${0 + normalizedDelta * 20}%)`,
        'star-intensity': 0.15 - normalizedDelta * 0.12
      });
    }
  
    if (map.getLayer('background')) {
      map.setPaintProperty('background', 'background-color', 
        `hsl(${210 - normalizedDelta * 40}, ${20 - normalizedDelta * 12}%, ${10 + normalizedDelta * 8}%)`
      );
    }
  
    if (map.getLayer('3d-buildings')) {
      map.setPaintProperty('3d-buildings', 'fill-extrusion-color', 
        `hsl(${0 + normalizedDelta * 15}, ${0 + normalizedDelta * 25}%, ${67 - normalizedDelta * 35}%)`
      );
      map.setPaintProperty('3d-buildings', 'fill-extrusion-opacity', 0.6 - normalizedDelta * 0.25);
    }
  
    map.easeTo({
      center: [lng, lat],
      pitch: 45 + normalizedDelta * 25,
      bearing: map.getBearing() + normalizedDelta * 20,
      duration: 1000,
      easing: (t) => t * (2 - t)
    });
  }
  
  export function initializeClimateViz(map, lat, lng) {
    if (!map.getSource('climate-overlay')) {
      map.addSource('climate-overlay', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          properties: {
            temperature: 50,
            intensity: 1
          }
        }
      });
  
      map.addLayer({
        id: 'climate-point',
        type: 'circle',
        source: 'climate-overlay',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 15, 15, 120],
          'circle-color': 'hsl(60, 80%, 50%)',
          'circle-opacity': 0.25,
          'circle-blur': 0.9
        }
      });
    }
  }
  
  export function updateClimateOnScroll(map, lat, lng, scrollPercent) {
    const deltaValue = scrollPercent;
    applyClimateDegradation(map, lat, lng, deltaValue);
    
    if (map.getSource('climate-overlay')) {
      const hue = 60 - scrollPercent * 0.6;
      const opacity = 0.25 + (scrollPercent / 100) * 0.45;
      
      map.setPaintProperty('climate-point', 'circle-color', `hsl(${hue}, 80%, 50%)`);
      map.setPaintProperty('climate-point', 'circle-opacity', opacity);
      
      map.getSource('climate-overlay').setData({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        properties: {
          temperature: 50 + scrollPercent * 0.5,
          intensity: 1 + scrollPercent * 0.03
        }
      });
    }
  }
  
  export function resetClimateEffects(map, lat, lng) {
    applyClimateDegradation(map, lat, lng, 0);
    
    if (map.getLayer('heatmap-layer')) {
      map.setPaintProperty('heatmap-layer', 'heatmap-intensity', 0.5);
      map.setPaintProperty('heatmap-layer', 'heatmap-radius', 20);
      map.setPaintProperty('heatmap-layer', 'heatmap-opacity', 0.3);
    }
    
    if (map.getLayer('flood-layer')) {
      map.setPaintProperty('flood-layer', 'raster-opacity', 0);
    }
  
    if (map.getLayer('climate-point')) {
      map.setPaintProperty('climate-point', 'circle-color', 'hsl(60, 80%, 50%)');
      map.setPaintProperty('climate-point', 'circle-opacity', 0.25);
    }
    
    map.easeTo({
      center: [lng, lat],
      pitch: 0,
      bearing: 0,
      zoom: 10,
      duration: 1200
    });
  }
  
  export function createClimateGradient(map, lat, lng, radius) {
    if (!map.getSource('climate-gradient')) {
      const steps = 50;
      const features = [];
      
      for (let i = 0; i < steps; i++) {
        const angle = (i / steps) * Math.PI * 2;
        const distance = radius * (i / steps);
        const offsetLat = lat + (distance * Math.cos(angle)) / 111;
        const offsetLng = lng + (distance * Math.sin(angle)) / (111 * Math.cos(lat * Math.PI / 180));
        
        features.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [offsetLng, offsetLat]
          },
          properties: {
            intensity: 1 - (i / steps)
          }
        });
      }
      
      map.addSource('climate-gradient', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: features
        }
      });
      
      map.addLayer({
        id: 'climate-gradient-layer',
        type: 'circle',
        source: 'climate-gradient',
        paint: {
          'circle-radius': 8,
          'circle-color': [
            'interpolate',
            ['linear'],
            ['get', 'intensity'],
            0, 'hsl(0, 90%, 50%)',
            1, 'hsl(60, 80%, 50%)'
          ],
          'circle-opacity': ['*', ['get', 'intensity'], 0.4],
          'circle-blur': 0.8
        }
      });
    }
  }