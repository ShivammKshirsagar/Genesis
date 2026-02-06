import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Sparkles, ArrowRight, Globe2, Trophy, Dribbble, Sprout, Waves, Mountain, ShoppingBag, Camera, Bird, Thermometer, Search, X, Wind, Droplets, Sun, Activity, Flame, Loader2, ChevronRight, ChevronLeft } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = 'pk.eyJ1IjoibXZjMjQiLCJhIjoiY21sYWNxd3RyMDl5cjNocjQwNTg1dmZiaSJ9.PLmSdYIrEhtAP3HU3T3weg';

const climateImpactsDB = {
	'Cricket': { category: 'Sports', impacts: [{ type: 'heat', severity: 'high', title: 'Extreme Heat Risk', description: 'Matches increasingly interrupted by heat waves. Player safety concerns above 35°C.' }, { type: 'drought', severity: 'medium', title: 'Pitch Quality Decline', description: 'Drought conditions affect ground moisture, making pitches harder and more dangerous.' }, { type: 'rain', severity: 'high', title: 'Rain Interruptions', description: 'More frequent intense rainfall leads to match abandonments and schedule disruptions.' }], icon: Trophy, color: '#ef4444' },
	'Football': { category: 'Sports', impacts: [{ type: 'heat', severity: 'high', title: 'Player Heat Stress', description: 'Increased cooling breaks required. Higher injury rates in extreme temperatures.' }, { type: 'water', severity: 'medium', title: 'Pitch Maintenance', description: 'Water scarcity increases costs for maintaining natural grass pitches.' }, { type: 'extreme', severity: 'medium', title: 'Infrastructure Damage', description: 'Floods and storms damage stadiums and training facilities.' }], icon: Dribbble, color: '#f97316' },
	'Agriculture': { category: 'Livelihood', impacts: [{ type: 'drought', severity: 'critical', title: 'Crop Yield Decline', description: 'Changing rainfall patterns and heat stress reduce yields by 10-25% by 2050.' }, { type: 'pests', severity: 'high', title: 'Pest Proliferation', description: 'Warmer temperatures expand ranges of crop pests and diseases.' }, { type: 'water', severity: 'high', title: 'Water Scarcity', description: 'Irrigation demands increase while groundwater reserves deplete.' }], icon: Sprout, color: '#22c55e' },
	'Beach Activities': { category: 'Tourism', impacts: [{ type: 'erosion', severity: 'critical', title: 'Coastal Erosion', description: 'Sea level rise threatens beach infrastructure. Some beaches may disappear entirely.' }, { type: 'extreme', severity: 'high', title: 'Storm Surge Risk', description: 'More intense cyclones/hurricanes make beach activities dangerous during peak seasons.' }, { type: 'heat', severity: 'medium', title: 'Extreme UV Exposure', description: 'Higher UV indices increase skin cancer risks during peak hours.' }], icon: Waves, color: '#06b6d4' },
	'Hiking': { category: 'Outdoor', impacts: [{ type: 'fire', severity: 'critical', title: 'Wildfire Risk', description: 'Extended fire seasons close trails. Smoke pollution affects air quality.' }, { type: 'biodiversity', severity: 'high', title: 'Ecosystem Shifts', description: 'Alpine habitats shrink. Iconic species migrate to higher elevations or disappear.' }, { type: 'extreme', severity: 'medium', title: 'Unpredictable Weather', description: 'Flash floods and sudden storms increase backcountry dangers.' }], icon: Mountain, color: '#8b5cf6' },
	'Outdoor Markets': { category: 'Commerce', impacts: [{ type: 'heat', severity: 'high', title: 'Heat Stress', description: 'Vendor and customer comfort declines. Peak hours shift to early morning/evening.' }, { type: 'extreme', severity: 'medium', title: 'Infrastructure Damage', description: 'Storms and flooding damage market structures and goods.' }, { type: 'economy', severity: 'medium', title: 'Supply Chain Disruption', description: 'Extreme weather affects transportation of goods to markets.' }], icon: ShoppingBag, color: '#ec4899' },
	'Photography': { category: 'Creative', impacts: [{ type: 'biodiversity', severity: 'high', title: 'Changing Landscapes', description: 'Seasonal shifts alter natural colors and wildlife migration patterns.' }, { type: 'haze', severity: 'medium', title: 'Air Quality Issues', description: 'Increased wildfire smoke and dust reduce visibility and golden hour quality.' }, { type: 'extreme', severity: 'low', title: 'Equipment Risk', description: 'Sudden weather changes threaten expensive gear in remote locations.' }], icon: Camera, color: '#f59e0b' },
	'Wildlife Watching': { category: 'Nature', impacts: [{ type: 'biodiversity', severity: 'critical', title: 'Species Migration', description: 'Range shifts mean iconic species may no longer be found in traditional locations.' }, { type: 'habitat', severity: 'critical', title: 'Habitat Loss', description: 'Coral bleaching, deforestation, and wetland loss reduce wildlife populations.' }, { type: 'season', severity: 'high', title: 'Behavioral Changes', description: 'Altered breeding and migration seasons disrupt traditional viewing times.' }], icon: Bird, color: '#10b981' }
};

// --- Mock API Function ---
const fetchStoryData = async (payload) => {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve({
				"title": `The Future of ${payload.interest} in ${payload.city}`,
				"summary": `As the climate in ${payload.city} continues to change, the city's relationship with ${payload.interest} may struggle to adapt, forcing a shift in the way we experience this beloved activity.`,
				"chapters": [
					{ "id": 1, "title": `A Perfect Morning in ${payload.city}`, "text": `The sun rises over the bustling streets of ${payload.city}, casting a warm glow over the city's vibrant culture. The aroma of fresh air wafts through the streets. As we look at the current climate data, things seem stable, but the trends are shifting beneath the surface.`, "mapState": { "zoom": 11, "pitch": 0, "overlay": "none" } },
					{ "id": 2, "title": "The Shift Begins", "text": "As the years go by, the city's climate starts to change. The average temperature rises by 1.5°C. The heat becomes more oppressive, and outdoor activities struggle to keep up with the demand for cooling. The once-vibrant outdoor spaces become less inviting.", "mapState": { "zoom": 13, "pitch": 45, "overlay": "heat" } },
					{ "id": 3, "title": "A New Reality", "text": "By 2050, the effects of climate change are starkly apparent. Precipitation patterns have shifted drastically. The landscape has adapted, but the traditional ways of enjoying this interest have had to evolve significantly to survive the new extreme weather patterns.", "mapState": { "zoom": 15, "pitch": 60, "overlay": "drought" } }
				]
			});
		}, 1500);
	});
};

const EnhancedLandingPage = () => {
	const [city, setCity] = useState('');
	const [selectedCity, setSelectedCity] = useState(null);
	const [isSearchFocused, setIsSearchFocused] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [mounted, setMounted] = useState(false);
	const [suggestions, setSuggestions] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);
	const [weatherData, setWeatherData] = useState(null);
	const [airQualityData, setAirQualityData] = useState(null);
	const [climateData, setClimateData] = useState(null);
	const [otherInterests, setOtherInterests] = useState([]);
	const [otherInterestInput, setOtherInterestInput] = useState('');
	const [interests, setInterests] = useState([]);

	// Story State
	const [storyMode, setStoryMode] = useState(false);
	const [storyData, setStoryData] = useState(null);
	const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
	const [isGenerating, setIsGenerating] = useState(false);

	const mapContainerRef = useRef(null);
	const mapRef = useRef(null);
	const searchInputRef = useRef(null);
	const searchContainerRef = useRef(null);
	const otherInterestInputRef = useRef(null);
	const abortControllerRef = useRef(null);
	const markerRef = useRef(null);
	const isRotatingRef = useRef(true);
	const isAutoPlayingRef = useRef(true);

	const useDebounce = (value, delay) => {
		const [debouncedValue, setDebouncedValue] = useState(value);
		useEffect(() => {
			const handler = setTimeout(() => setDebouncedValue(value), delay);
			return () => clearTimeout(handler);
		}, [value, delay]);
		return debouncedValue;
	};

	const debouncedSearchQuery = useDebounce(searchQuery, 300);
	const stopRotation = useCallback(() => { isRotatingRef.current = false; }, []);

	const fetchLiveClimateData = async (coords) => {
		try {
			const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords[1]}&longitude=${coords[0]}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&daily=temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_sum,precipitation_probability_max&timezone=auto`);
			const weather = await weatherResponse.json();
			setWeatherData(weather);
			const aqResponse = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${coords[1]}&longitude=${coords[0]}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,aerosol_optical_depth,dust,uv_index,us_aqi,european_aqi&timezone=auto`);
			const aq = await aqResponse.json();
			setAirQualityData(aq);
			const climateProjection = { currentAnomaly: estimateTempAnomaly(coords[1]), projections: { '2030': (parseFloat(estimateTempAnomaly(coords[1])) + 0.5).toFixed(1), '2050': (parseFloat(estimateTempAnomaly(coords[1])) + 1.2).toFixed(1), '2080': (parseFloat(estimateTempAnomaly(coords[1])) + 2.0).toFixed(1) } };
			setClimateData(climateProjection);
		} catch (err) { console.error('Error fetching climate data:', err); }
	};

	const fetchSuggestions = useCallback(async (query) => {
		if (!query || query.length < 2) { setSuggestions([]); return; }
		if (abortControllerRef.current) abortControllerRef.current.abort();
		abortControllerRef.current = new AbortController();
		setIsLoading(true);
		try {
			const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&types=place,locality,neighborhood,region,country&autocomplete=true&limit=6&language=en`, { signal: abortControllerRef.current.signal });
			const data = await response.json();
			const formattedSuggestions = data.features.map(feature => ({ id: feature.id, name: feature.text, fullName: feature.place_name, coords: feature.center, placeType: feature.place_type[0], temp: estimateTempAnomaly(feature.center[1]) }));
			setSuggestions(formattedSuggestions);
		} catch (err) { if (err.name !== 'AbortError') console.error('Geocoding error:', err); }
		finally { setIsLoading(false); }
	}, []);

	const estimateTempAnomaly = (latitude) => {
		const absLat = Math.abs(latitude);
		if (absLat < 23) return (2.8 + Math.random() * 0.6).toFixed(1);
		if (absLat < 45) return (2.2 + Math.random() * 0.6).toFixed(1);
		if (absLat < 60) return (1.8 + Math.random() * 0.5).toFixed(1);
		return (1.5 + Math.random() * 0.4).toFixed(1);
	};

	useEffect(() => { fetchSuggestions(debouncedSearchQuery); }, [debouncedSearchQuery, fetchSuggestions]);
	useEffect(() => { setMounted(true); }, []);
	useEffect(() => {
		const handleClickOutside = (event) => { if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) { setIsSearchFocused(false); } };
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	useEffect(() => {
		if (!mapContainerRef.current || mapRef.current) return;
		mapboxgl.accessToken = MAPBOX_TOKEN;
		const map = new mapboxgl.Map({ container: mapContainerRef.current, style: 'mapbox://styles/mapbox/satellite-streets-v12', center: [0, 20], zoom: 1.5, pitch: 0, bearing: 0, interactive: true, attributionControl: false, projection: 'globe' });
		mapRef.current = map;
		map.on('style.load', () => { map.setFog({ 'color': 'rgb(186, 210, 235)', 'high-color': 'rgb(36, 92, 223)', 'horizon-blend': 0.02, 'space-color': 'rgb(11, 11, 25)', 'star-intensity': 0.6 }); });
		let rotation = 0;
		const rotateMap = () => { if (isRotatingRef.current && mapRef.current) { rotation += 0.05; map.rotateTo(rotation, { duration: 0 }); } requestAnimationFrame(rotateMap); };
		rotateMap();
		map.on('mousedown', stopRotation); map.on('touchstart', stopRotation);
		return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
	}, [stopRotation]);

	useEffect(() => {
		if (storyMode && storyData && mapRef.current) {
			const chapter = storyData.chapters[currentChapterIndex];
			if (chapter && selectedCity) {
				mapRef.current.flyTo({ center: selectedCity.coords, zoom: chapter.mapState.zoom, pitch: chapter.mapState.pitch, bearing: 0, duration: 2000, essential: true });
			}
		}
	}, [currentChapterIndex, storyMode, storyData, selectedCity]);

	useEffect(() => {
		if (!storyMode || !storyData) return;
		if (!isAutoPlayingRef.current) return;
		const interval = setInterval(() => {
			setCurrentChapterIndex((prev) => {
				if (prev < storyData.chapters.length - 1) return prev + 1;
				return 0;
			});
		}, 8000);
		return () => clearInterval(interval);
	}, [storyMode, storyData, currentChapterIndex]);

	const handleCitySelect = (cityData) => {
		setSelectedCity(cityData); setCity(cityData.name); setSearchQuery(cityData.fullName); setIsSearchFocused(false); setSuggestions([]); stopRotation(); fetchLiveClimateData(cityData.coords);
		if (mapRef.current) {
			if (markerRef.current) markerRef.current.remove();
			const el = document.createElement('div');
			el.innerHTML = `<svg width="40" height="50" viewBox="0 0 48 60" fill="none"><path d="M24 0C10.7452 0 0 10.7452 0 24C0 37.2548 24 60 24 60C24 60 48 37.2548 48 24C48 10.7452 37.2548 0 24 0Z" fill="#EC4899"/><circle cx="24" cy="24" r="10" fill="white"/><circle cx="24" cy="24" r="6" fill="#EC4899"/></svg>`;
			el.style.cssText = 'width: 40px; height: 50px; cursor: pointer; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4));';
			markerRef.current = new mapboxgl.Marker({ element: el, anchor: 'bottom' }).setLngLat(cityData.coords).addTo(mapRef.current);
			mapRef.current.flyTo({ center: cityData.coords, zoom: 10, duration: 2000 });
		}
	};

	const clearSelection = () => {
		setSelectedCity(null); setCity(''); setSearchQuery(''); setSuggestions([]); setWeatherData(null); setAirQualityData(null); setClimateData(null); isRotatingRef.current = true;
		if (markerRef.current) { markerRef.current.remove(); markerRef.current = null; }
		if (mapRef.current) { mapRef.current.flyTo({ center: [0, 20], zoom: 1.5, duration: 2000 }); }
	};

	const toggleInterest = (itemName) => { setInterests(prev => prev.includes(itemName) ? prev.filter(i => i !== itemName) : [...prev, itemName]); };
	const addOtherInterest = () => { const trimmed = otherInterestInput.trim(); if (trimmed && !otherInterests.includes(trimmed) && otherInterests.length < 5) { setOtherInterests([...otherInterests, trimmed]); setOtherInterestInput(''); } };
	const removeOtherInterest = (interest) => { setOtherInterests(otherInterests.filter(i => i !== interest)); };

	const getAQILevel = (aqi) => { if (aqi <= 50) return { label: 'Good', color: '#22c55e' }; if (aqi <= 100) return { label: 'Moderate', color: '#eab308' }; if (aqi <= 150) return { label: 'Unhealthy', color: '#f97316' }; if (aqi <= 200) return { label: 'Unhealthy', color: '#ef4444' }; if (aqi <= 300) return { label: 'Very Unhealthy', color: '#dc2626' }; return { label: 'Hazardous', color: '#7f1d1d' }; };
	const getUVLevel = (uv) => { if (uv <= 2) return { label: 'Low', color: '#22c55e' }; if (uv <= 5) return { label: 'Moderate', color: '#eab308' }; if (uv <= 7) return { label: 'High', color: '#f97316' }; if (uv <= 10) return { label: 'Very High', color: '#ef4444' }; return { label: 'Extreme', color: '#dc2626' }; };

	const interestOptions = [{ name: 'Cricket', icon: Trophy }, { name: 'Football', icon: Dribbble }, { name: 'Agriculture', icon: Sprout }, { name: 'Beach Activities', icon: Waves }, { name: 'Hiking', icon: Mountain }, { name: 'Outdoor Markets', icon: ShoppingBag }, { name: 'Photography', icon: Camera }, { name: 'Wildlife Watching', icon: Bird }];
	const isFormValid = selectedCity && (interests.length > 0 || otherInterests.length > 0);

	const activeInterestName = interests[0] || otherInterests[0] || 'Your Interest';
	const activeInterestData = climateImpactsDB[activeInterestName] || { color: '#6366f1', icon: Globe2 };

	const handleGenerateStory = async () => {
		if (!isFormValid) return;
		setIsGenerating(true); stopRotation();
		const primaryInterest = interests[0] || otherInterests[0];
		try {
			const data = await fetchStoryData({ city: selectedCity.name, lat: selectedCity.coords[1], long: selectedCity.coords[0], interest: primaryInterest });
			setStoryData(data); setStoryMode(true); setCurrentChapterIndex(0); isAutoPlayingRef.current = true;
		} catch (error) { console.error("Failed to generate story", error); }
		finally { setIsGenerating(false); }
	};

	const resetStory = () => {
		setStoryMode(false); setStoryData(null); setCurrentChapterIndex(0); isAutoPlayingRef.current = false;
		if (mapRef.current && selectedCity) { mapRef.current.flyTo({ center: selectedCity.coords, zoom: 10, pitch: 0 }); }
	};

	const handleManualNav = (newIndex) => {
		isAutoPlayingRef.current = false;
		setCurrentChapterIndex(newIndex);
	};

	const getOverlayClass = () => {
		if (!storyMode || !storyData) return '';
		const overlay = storyData.chapters[currentChapterIndex].mapState.overlay;
		if (overlay === 'heat') return 'overlay-heat';
		if (overlay === 'drought') return 'overlay-drought';
		if (overlay === 'flood') return 'overlay-flood';
		return '';
	};

	return (
		<div className="landing-container">
			<style>{`
				@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
				* { margin: 0; padding: 0; box-sizing: border-box; }
				html, body { overflow-x: hidden; min-height: 100vh; font-family: 'Inter', sans-serif; background: #0a0f1c; }
				.landing-container { min-height: 100vh; width: 100vw; position: relative; }
				.mapbox-container { position: fixed; top: 0; left: 0; width: 100%; height: 100vh; z-index: 0; }
				.map-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100vh; background: radial-gradient(circle at 70% 50%, transparent 0%, rgba(10, 15, 28, 0.5) 100%); pointer-events: none; z-index: 1; transition: background 1s ease; }
				.overlay-heat { background: radial-gradient(circle at 50% 50%, rgba(255, 100, 0, 0.2) 0%, rgba(50, 0, 0, 0.6) 100%) !important; }
				.overlay-drought { background: radial-gradient(circle at 50% 50%, rgba(194, 120, 40, 0.2) 0%, rgba(60, 40, 10, 0.7) 100%) !important; }
				.overlay-flood { background: radial-gradient(circle at 50% 50%, rgba(40, 100, 255, 0.2) 0%, rgba(0, 20, 60, 0.7) 100%) !important; }
				.floating-header { position: fixed; top: 1.5rem; left: 1.5rem; z-index: 50; display: flex; align-items: center; gap: 0.75rem; opacity: ${mounted ? '1' : '0'}; transform: ${mounted ? 'translateY(0)' : 'translateY(-20px)'}; transition: all 0.8s ease; }
				.header-badge { display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1rem; background: rgba(20, 25, 40, 0.7); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 50px; color: white; font-weight: 500; font-size: 0.9rem; cursor: pointer; }
				.logo-icon { width: 24px; height: 24px; color: #60a5fa; }
				.main-content { position: fixed; top: 0; left: 0; width: 100%; height: 100vh; display: flex; align-items: center; justify-content: flex-end; padding: 2rem; z-index: 5; pointer-events: none; }
				.glass-card { background: rgba(20, 25, 40, 0.75); backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); pointer-events: auto; }
				.form-panel { width: 400px; max-height: 90vh; overflow-y: auto; padding: 1.75rem; transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
				
				/* Story Panel - Reasonable Size */
				.story-panel { 
					width: 420px; 
					display: flex; 
					flex-direction: column; 
					gap: 1.25rem; 
					padding: 1.75rem; 
					animation: slideIn 0.6s ease-out; 
				}
				@keyframes slideIn { from { opacity: 0; transform: translateX(50px); } to { opacity: 1; transform: translateX(0); } }
				
				.form-section { margin-bottom: 1.5rem; }
				.form-section:last-child { margin-bottom: 0; }
				.section-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; font-weight: 600; color: rgba(255, 255, 255, 0.9); margin-bottom: 0.75rem; }
				.section-label svg { width: 16px; height: 16px; color: #60a5fa; }
				.search-wrapper { position: relative; }
				.search-input-container { display: flex; align-items: center; gap: 0.75rem; padding: 0.875rem 1rem; background: rgba(255, 255, 255, 0.05); border: 1.5px solid rgba(255, 255, 255, 0.15); border-radius: 12px; transition: all 0.3s ease; }
				.search-input-container:focus-within { background: rgba(255, 255, 255, 0.08); border-color: rgba(96, 165, 250, 0.5); box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1); }
				.search-input { flex: 1; background: transparent; border: none; color: white; font-size: 0.95rem; outline: none; }
				.search-input::placeholder { color: rgba(255, 255, 255, 0.4); }
				.search-icon-btn { background: none; border: none; color: rgba(255, 255, 255, 0.5); cursor: pointer; padding: 0.25rem; display: flex; align-items: center; justify-content: center; }
				.search-dropdown { position: absolute; top: calc(100% + 8px); left: 0; right: 0; background: rgba(20, 25, 40, 0.95); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 16px; max-height: 280px; overflow-y: auto; z-index: 100; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5); }
				.city-option { padding: 0.875rem 1rem; cursor: pointer; display: flex; align-items: center; gap: 0.75rem; transition: background 0.2s; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
				.city-option:hover { background: rgba(255, 255, 255, 0.05); }
				.city-option-icon { width: 32px; height: 32px; background: rgba(96, 165, 250, 0.15); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #60a5fa; }
				.city-option-info { flex: 1; }
				.city-option-name { color: white; font-weight: 500; font-size: 0.9rem; }
				.city-option-full { color: rgba(255, 255, 255, 0.5); font-size: 0.75rem; margin-top: 0.125rem; }
				.city-option-temp { color: #ec4899; font-weight: 600; font-size: 0.85rem; }
				.selected-badge { display: inline-flex; align-items: center; gap: 0.375rem; margin-top: 0.75rem; padding: 0.375rem 0.875rem; background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(236, 72, 153, 0.2)); border: 1px solid rgba(167, 139, 250, 0.4); border-radius: 20px; color: white; font-size: 0.8rem; font-weight: 500; }
				.interests-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.625rem; }
				.interest-btn { display: flex; flex-direction: column; align-items: center; gap: 0.375rem; padding: 0.875rem 0.5rem; background: rgba(255, 255, 255, 0.05); border: 1.5px solid rgba(255, 255, 255, 0.12); border-radius: 12px; color: rgba(255, 255, 255, 0.7); font-size: 0.75rem; cursor: pointer; transition: all 0.2s ease; }
				.interest-btn:hover { background: rgba(255, 255, 255, 0.08); border-color: rgba(255, 255, 255, 0.2); }
				.interest-btn.selected { background: linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(236, 72, 153, 0.3)); border-color: rgba(167, 139, 250, 0.6); color: white; }
				.other-input-row { display: flex; gap: 0.5rem; margin-top: 0.75rem; }
				.other-input { flex: 1; padding: 0.625rem 0.875rem; background: rgba(255, 255, 255, 0.05); border: 1.5px solid rgba(255, 255, 255, 0.12); border-radius: 10px; color: white; font-size: 0.9rem; outline: none; }
				.other-input:focus { border-color: rgba(96, 165, 250, 0.5); }
				.other-input::placeholder { color: rgba(255, 255, 255, 0.4); }
				.add-btn { padding: 0.625rem; background: rgba(96, 165, 250, 0.2); border: none; border-radius: 10px; color: #60a5fa; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
				.add-btn:hover { background: rgba(96, 165, 250, 0.3); }
				.tags-row { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.75rem; }
				.tag { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.375rem 0.75rem; background: linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(236, 72, 153, 0.25)); border: 1px solid rgba(167, 139, 250, 0.4); border-radius: 20px; font-size: 0.8rem; color: white; }
				.tag-remove { background: none; border: none; color: white; cursor: pointer; padding: 0; display: flex; align-items: center; }
				.submit-btn { width: 100%; padding: 1rem; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%); background-size: 200% 200%; border: none; border-radius: 14px; color: white; font-size: 0.95rem; font-weight: 600; cursor: not-allowed; display: flex; align-items: center; justify-content: center; gap: 0.5rem; animation: gradient-shift 6s ease infinite; opacity: 0.6; }
				.submit-btn.active { cursor: pointer; opacity: 1; }
				.submit-btn.active:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(99, 102, 241, 0.4); }
				@keyframes gradient-shift { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
				.live-data-panel { position: fixed; bottom: 1.5rem; left: 1.5rem; z-index: 10; display: flex; flex-direction: row; flex-wrap: wrap; gap: 0.75rem; max-width: calc(100% - 450px); pointer-events: none; }
				.data-card { pointer-events: auto; min-width: 140px; padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
				.data-card-header { display: flex; align-items: center; gap: 0.5rem; color: rgba(255, 255, 255, 0.7); font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
				.data-card-value { font-size: 1.75rem; font-weight: 700; color: white; line-height: 1; }
				.data-card-unit { font-size: 0.875rem; color: rgba(255, 255, 255, 0.5); margin-left: 0.25rem; }
				.data-card-status { display: inline-flex; align-items: center; width: fit-content; padding: 0.25rem 0.625rem; border-radius: 20px; font-size: 0.7rem; font-weight: 600; margin-top: 0.25rem; }
				.data-card-sub { color: rgba(255, 255, 255, 0.5); font-size: 0.75rem; margin-top: 0.25rem; }
				.mini-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 0.5rem; }
				.mini-item { background: rgba(0, 0, 0, 0.2); padding: 0.5rem; border-radius: 8px; }
				.mini-label { color: rgba(255, 255, 255, 0.4); font-size: 0.65rem; margin-bottom: 0.125rem; }
				.mini-value { color: white; font-size: 0.85rem; font-weight: 600; }
				.uv-gauge { width: 60px; height: 60px; margin: 0.5rem auto; position: relative; }
				.uv-gauge svg { transform: rotate(-90deg); }
				.uv-gauge-bg { fill: none; stroke: rgba(255, 255, 255, 0.1); stroke-width: 8; }
				.uv-gauge-fill { fill: none; stroke-width: 8; stroke-linecap: round; transition: stroke-dashoffset 1s ease; }
				.uv-gauge-value { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 1.25rem; font-weight: 700; color: white; }
				.aqi-bar { height: 6px; background: linear-gradient(to right, #22c55e, #eab308, #f97316, #ef4444, #dc2626); border-radius: 3px; margin-top: 0.5rem; position: relative; }
				.aqi-marker { position: absolute; top: -3px; width: 4px; height: 12px; background: white; border-radius: 2px; box-shadow: 0 2px 4px rgba(0,0,0,0.3); }
				
				/* Story Mode Styles - Reasonable */
				.chapter-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
				.chapter-indicator { display: flex; gap: 0.5rem; }
				.dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.2); transition: all 0.3s; cursor: pointer; }
				.dot.active { background: white; transform: scale(1.2); box-shadow: 0 0 10px white; }
				.story-title { font-size: 1.5rem; font-weight: 700; line-height: 1.2; margin-bottom: 0.5rem; background: linear-gradient(to right, #fff, #a5b4fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
				.story-summary { font-size: 0.9rem; color: rgba(255,255,255,0.6); line-height: 1.5; margin-bottom: 0.5rem; }
				.chapter-card { background: rgba(0,0,0,0.2); border-radius: 16px; padding: 1.25rem; border: 1px solid rgba(255,255,255,0.05); }
				.chapter-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; color: #818cf8; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
				.chapter-title { font-size: 1.1rem; font-weight: 600; margin-bottom: 0.75rem; color: white; }
				.chapter-text { font-size: 0.95rem; line-height: 1.6; color: rgba(255,255,255,0.85); }
				.nav-btn { background: rgba(255,255,255,0.1); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
				.nav-btn:hover { background: rgba(255,255,255,0.2); }
				.nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }
				.reset-btn { width: 100%; padding: 0.75rem; background: transparent; border: 1px solid rgba(255,255,255,0.2); color: rgba(255,255,255,0.7); border-radius: 10px; cursor: pointer; transition: all 0.2s; font-size: 0.85rem; margin-top: 0.25rem; }
				.reset-btn:hover { background: rgba(255,255,255,0.05); color: white; }

				@media (max-width: 1024px) { .main-content { justify-content: center; padding: 1rem; } .form-panel, .story-panel { width: 100%; max-width: 420px; } .live-data-panel { position: relative; left: 1rem; bottom: 1rem; max-width: calc(100% - 2rem); margin-top: 1rem; } }
				@media (max-width: 768px) { .live-data-panel { flex-direction: column; max-width: calc(100% - 2rem); } .data-card { width: 100%; min-width: unset; } }
				@media (max-width: 640px) { .interests-grid { grid-template-columns: repeat(2, 1fr); } }
			`}</style>

			<div ref={mapContainerRef} className="mapbox-container" />
			<div className={`map-overlay ${getOverlayClass()}`} />

			<div className="floating-header">
				<div className="header-badge" onClick={resetStory}>
					<Globe2 className="logo-icon" />
					<span>Climate Story Engine</span>
				</div>
				{storyMode && (
					<div className="header-badge" style={{ background: 'rgba(236, 72, 153, 0.2)', borderColor: 'rgba(236, 72, 153, 0.4)' }}>
						<span>Auto-Playing</span>
					</div>
				)}
			</div>

			<div className="main-content">
				{!storyMode && (
					<form className="form-panel glass-card" onSubmit={(e) => e.preventDefault()}>
						<div className="form-section">
							<label className="section-label"><MapPin size={16} /> Your Location</label>
							<div className="search-wrapper" ref={searchContainerRef}>
								<div className="search-input-container">
									<Search size={18} color="rgba(255,255,255,0.5)" />
									<input ref={searchInputRef} type="text" className="search-input" placeholder="Search any city..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); stopRotation(); }} onFocus={() => { setIsSearchFocused(true); stopRotation(); }} autoComplete="off" />
									{searchQuery && (<button type="button" className="search-icon-btn" onClick={() => setSearchQuery('')}><X size={16} /></button>)}
								</div>
								{isSearchFocused && suggestions.length > 0 && (
									<div className="search-dropdown">
										{suggestions.map((cityData) => (
											<div key={cityData.id} className="city-option" onClick={() => handleCitySelect(cityData)}>
												<div className="city-option-icon"><MapPin size={16} /></div>
												<div className="city-option-info"><div className="city-option-name">{cityData.name}</div><div className="city-option-full">{cityData.fullName}</div></div>
												<div className="city-option-temp">+{cityData.temp}°C</div>
											</div>
										))}
									</div>
								)}
								{selectedCity && (<div className="selected-badge"><MapPin size={12} />{selectedCity.name}</div>)}
							</div>
						</div>

						<div className="form-section">
							<label className="section-label"><Sparkles size={16} /> Your Interests</label>
							<div className="interests-grid">
								{interestOptions.map((item) => {
									const Icon = item.icon; const isSelected = interests.includes(item.name);
									return (<button key={item.name} type="button" className={`interest-btn ${isSelected ? 'selected' : ''}`} onClick={() => toggleInterest(item.name)}><Icon size={20} /><span>{item.name}</span></button>);
								})}
							</div>
							<div className="other-input-row">
								<input ref={otherInterestInputRef} type="text" className="other-input" placeholder={otherInterests.length >= 5 ? "Max reached" : "Add custom interest..."} value={otherInterestInput} onChange={(e) => setOtherInterestInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOtherInterest())} disabled={otherInterests.length >= 5} />
								<button type="button" className="add-btn" onClick={addOtherInterest} disabled={!otherInterestInput.trim()}><Sun size={20} /></button>
							</div>
							{otherInterests.length > 0 && (<div className="tags-row">{otherInterests.map((interest) => (<span key={interest} className="tag">{interest}<button type="button" className="tag-remove" onClick={() => removeOtherInterest(interest)}><X size={12} /></button></span>))}</div>)}
						</div>

						<button type="button" className={`submit-btn ${isFormValid ? 'active' : ''}`} onClick={handleGenerateStory} disabled={isGenerating}>
							{isGenerating ? <Loader2 className="animate-spin" size={20} /> : <><span>Generate Your Story</span><ArrowRight size={18} /></>}
						</button>
					</form>
				)}

				{storyMode && storyData && (
					<div className="story-panel glass-card">
						<div className="chapter-nav">
							<button className="nav-btn" onClick={() => handleManualNav(Math.max(0, currentChapterIndex - 1))} disabled={currentChapterIndex === 0}><ChevronLeft size={18} /></button>
							<div className="chapter-indicator">
								{storyData.chapters.map((_, idx) => (<div key={idx} className={`dot ${idx === currentChapterIndex ? 'active' : ''}`} onClick={() => handleManualNav(idx)} />))}
							</div>
							<button className="nav-btn" onClick={() => handleManualNav(Math.min(storyData.chapters.length - 1, currentChapterIndex + 1))} disabled={currentChapterIndex === storyData.chapters.length - 1}><ChevronRight size={18} /></button>
						</div>

						<div>
							<h1 className="story-title">{storyData.title}</h1>
							<p className="story-summary">{storyData.summary}</p>
						</div>

						<div className="chapter-card">
							<div className="chapter-header">
								{React.createElement(activeInterestData.icon, { size: 14 })}
								<span>Chapter {currentChapterIndex + 1} of {storyData.chapters.length}</span>
							</div>
							<h2 className="chapter-title">{storyData.chapters[currentChapterIndex].title}</h2>
							<p className="chapter-text">{storyData.chapters[currentChapterIndex].text}</p>
						</div>

						<button className="reset-btn" onClick={resetStory}>Create New Story</button>
					</div>
				)}
			</div>

			{selectedCity && weatherData && (
				<div className="live-data-panel">
					<div className="data-card glass-card">
						<div className="data-card-header"><Thermometer size={14} /><span>Temperature</span></div>
						<div className="data-card-value">{Math.round(weatherData.current.temperature_2m)}<span className="data-card-unit">°C</span></div>
						<div className="data-card-status" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>Feels like {Math.round(weatherData.current.apparent_temperature)}°C</div>
						<div className="data-card-sub">H: {Math.round(weatherData.daily.temperature_2m_max[0])}° L: {Math.round(weatherData.daily.temperature_2m_min[0])}°</div>
					</div>
					<div className="data-card glass-card">
						<div className="data-card-header"><Wind size={14} /><span>Wind</span></div>
						<div className="data-card-value">{Math.round(weatherData.current.wind_speed_10m)}<span className="data-card-unit">km/h</span></div>
						<div className="mini-grid"><div className="mini-item"><div className="mini-label">Direction</div><div className="mini-value">{weatherData.current.wind_direction_10m}°</div></div><div className="mini-item"><div className="mini-label">Gusts</div><div className="mini-value">{Math.round(weatherData.current.wind_gusts_10m)}</div></div></div>
					</div>
					{weatherData.daily.uv_index_max[0] !== undefined && (
						<div className="data-card glass-card" style={{ minWidth: '140px' }}>
							<div className="data-card-header"><Sun size={14} /><span>UV Index</span></div>
							<div className="uv-gauge"><svg width="60" height="60" viewBox="0 0 60 60"><circle className="uv-gauge-bg" cx="30" cy="30" r="25" /><circle className="uv-gauge-fill" cx="30" cy="30" r="25" style={{ stroke: getUVLevel(weatherData.daily.uv_index_max[0]).color, strokeDasharray: `${(weatherData.daily.uv_index_max[0] / 12) * 157} 157` }} /></svg><div className="uv-gauge-value">{Math.round(weatherData.daily.uv_index_max[0])}</div></div>
							<div className="data-card-status" style={{ background: `${getUVLevel(weatherData.daily.uv_index_max[0]).color}30`, color: getUVLevel(weatherData.daily.uv_index_max[0]).color }}>{getUVLevel(weatherData.daily.uv_index_max[0]).label}</div>
						</div>
					)}
					{airQualityData && airQualityData.current.us_aqi !== undefined && (
						<div className="data-card glass-card" style={{ minWidth: '180px' }}>
							<div className="data-card-header"><Activity size={14} /><span>Air Quality</span></div>
							<div className="data-card-value">{Math.round(airQualityData.current.us_aqi)}<span className="data-card-unit">AQI</span></div>
							<div className="data-card-status" style={{ background: `${getAQILevel(airQualityData.current.us_aqi).color}30`, color: getAQILevel(airQualityData.current.us_aqi).color }}>{getAQILevel(airQualityData.current.us_aqi).label}</div>
							<div className="aqi-bar"><div className="aqi-marker" style={{ left: `${Math.min((airQualityData.current.us_aqi / 300) * 100, 100)}%` }} /></div>
							<div className="mini-grid" style={{ marginTop: '0.75rem' }}><div className="mini-item"><div className="mini-label">PM2.5</div><div className="mini-value">{Math.round(airQualityData.current.pm2_5)}</div></div><div className="mini-item"><div className="mini-label">PM10</div><div className="mini-value">{Math.round(airQualityData.current.pm10)}</div></div></div>
						</div>
					)}
					<div className="data-card glass-card">
						<div className="data-card-header"><Droplets size={14} /><span>Precipitation</span></div>
						<div className="data-card-value">{Math.round(weatherData.daily.precipitation_sum[0])}<span className="data-card-unit">mm</span></div>
						<div className="data-card-status" style={{ background: 'rgba(96, 165, 250, 0.2)', color: '#60a5fa' }}>{weatherData.daily.precipitation_probability_max[0]}% chance</div>
						<div className="mini-grid"><div className="mini-item"><div className="mini-label">Humidity</div><div className="mini-value">{weatherData.current.relative_humidity_2m}%</div></div><div className="mini-item"><div className="mini-label">Pressure</div><div className="mini-value">{Math.round(weatherData.current.surface_pressure)}</div></div></div>
					</div>
					{climateData && (
						<div className="data-card glass-card" style={{ minWidth: '160px' }}>
							<div className="data-card-header"><Flame size={14} /><span>Climate</span></div>
							<div className="data-card-value">+{climateData.currentAnomaly}<span className="data-card-unit">°C</span></div>
							<div className="data-card-status" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>Anomaly</div>
							<div className="data-card-sub">2050: +{climateData.projections['2050']}°C</div>
							<div className="aqi-bar" style={{ background: 'linear-gradient(to right, #3b82f6, #8b5cf6, #ec4899, #ef4444)' }}><div className="aqi-marker" style={{ left: `${(parseFloat(climateData.currentAnomaly) / 4) * 100}%` }} /></div>
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default EnhancedLandingPage;
