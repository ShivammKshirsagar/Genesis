import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Sparkles, ArrowRight, Globe2, Trophy, Dribbble, Sprout, Waves, Mountain, ShoppingBag, Camera, Bird, Thermometer, Search, X, ChevronDown, Loader2, Plus, Wind, Droplets, Sun, AlertTriangle, TrendingUp, Clock, Shield } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = 'pk.eyJ1IjoibXZjMjQiLCJhIjoiY21sYWNxd3RyMDl5cjNocjQwNTg1dmZiaSJ9.PLmSdYIrEhtAP3HU3T3weg';

// Climate impact database by interest
const climateImpactsDB = {
	'Cricket': {
		category: 'Sports',
		impacts: [
			{ type: 'heat', severity: 'high', title: 'Extreme Heat Risk', description: 'Matches increasingly interrupted by heat waves. Player safety concerns above 35°C.' },
			{ type: 'drought', severity: 'medium', title: 'Pitch Quality Decline', description: 'Drought conditions affect ground moisture, making pitches harder and more dangerous.' },
			{ type: 'rain', severity: 'high', title: 'Rain Interruptions', description: 'More frequent intense rainfall leads to match abandonments and schedule disruptions.' }
		],
		icon: Trophy,
		color: '#ef4444'
	},
	'Football': {
		category: 'Sports',
		impacts: [
			{ type: 'heat', severity: 'high', title: 'Player Heat Stress', description: 'Increased cooling breaks required. Higher injury rates in extreme temperatures.' },
			{ type: 'water', severity: 'medium', title: 'Pitch Maintenance', description: 'Water scarcity increases costs for maintaining natural grass pitches.' },
			{ type: 'extreme', severity: 'medium', title: 'Infrastructure Damage', description: 'Floods and storms damage stadiums and training facilities.' }
		],
		icon: Dribbble,
		color: '#f97316'
	},
	'Agriculture': {
		category: 'Livelihood',
		impacts: [
			{ type: 'drought', severity: 'critical', title: 'Crop Yield Decline', description: 'Changing rainfall patterns and heat stress reduce yields by 10-25% by 2050.' },
			{ type: 'pests', severity: 'high', title: 'Pest Proliferation', description: 'Warmer temperatures expand ranges of crop pests and diseases.' },
			{ type: 'water', severity: 'high', title: 'Water Scarcity', description: 'Irrigation demands increase while groundwater reserves deplete.' }
		],
		icon: Sprout,
		color: '#22c55e'
	},
	'Beach Activities': {
		category: 'Tourism',
		impacts: [
			{ type: 'erosion', severity: 'critical', title: 'Coastal Erosion', description: 'Sea level rise threatens beach infrastructure. Some beaches may disappear entirely.' },
			{ type: 'extreme', severity: 'high', title: 'Storm Surge Risk', description: 'More intense cyclones/hurricanes make beach activities dangerous during peak seasons.' },
			{ type: 'heat', severity: 'medium', title: 'Extreme UV Exposure', description: 'Higher UV indices increase skin cancer risks during peak hours.' }
		],
		icon: Waves,
		color: '#06b6d4'
	},
	'Hiking': {
		category: 'Outdoor',
		impacts: [
			{ type: 'fire', severity: 'critical', title: 'Wildfire Risk', description: 'Extended fire seasons close trails. Smoke pollution affects air quality.' },
			{ type: 'biodiversity', severity: 'high', title: 'Ecosystem Shifts', description: 'Alpine habitats shrink. Iconic species migrate to higher elevations or disappear.' },
			{ type: 'extreme', severity: 'medium', title: 'Unpredictable Weather', description: 'Flash floods and sudden storms increase backcountry dangers.' }
		],
		icon: Mountain,
		color: '#8b5cf6'
	},
	'Outdoor Markets': {
		category: 'Commerce',
		impacts: [
			{ type: 'heat', severity: 'high', title: 'Heat Stress', description: 'Vendor and customer comfort declines. Peak hours shift to early morning/evening.' },
			{ type: 'extreme', severity: 'medium', title: 'Infrastructure Damage', description: 'Storms and flooding damage market structures and goods.' },
			{ type: 'economy', severity: 'medium', title: 'Supply Chain Disruption', description: 'Extreme weather affects transportation of goods to markets.' }
		],
		icon: ShoppingBag,
		color: '#ec4899'
	},
	'Photography': {
		category: 'Creative',
		impacts: [
			{ type: 'biodiversity', severity: 'high', title: 'Changing Landscapes', description: 'Seasonal shifts alter natural colors and wildlife migration patterns.' },
			{ type: 'haze', severity: 'medium', title: 'Air Quality Issues', description: 'Increased wildfire smoke and dust reduce visibility and golden hour quality.' },
			{ type: 'extreme', severity: 'low', title: 'Equipment Risk', description: 'Sudden weather changes threaten expensive gear in remote locations.' }
		],
		icon: Camera,
		color: '#f59e0b'
	},
	'Wildlife Watching': {
		category: 'Nature',
		impacts: [
			{ type: 'biodiversity', severity: 'critical', title: 'Species Migration', description: 'Range shifts mean iconic species may no longer be found in traditional locations.' },
			{ type: 'habitat', severity: 'critical', title: 'Habitat Loss', description: 'Coral bleaching, deforestation, and wetland loss reduce wildlife populations.' },
			{ type: 'season', severity: 'high', title: 'Behavioral Changes', description: 'Altered breeding and migration seasons disrupt traditional viewing times.' }
		],
		icon: Bird,
		color: '#10b981'
	}
};

// Default impacts for custom interests
const defaultImpacts = [
	{ type: 'heat', severity: 'high', title: 'Extreme Heat', description: 'Rising temperatures make outdoor activities increasingly uncomfortable and potentially dangerous during peak hours.' },
	{ type: 'water', severity: 'medium', title: 'Water Scarcity', description: 'Changing precipitation patterns affect water availability for various activities and ecosystems.' },
	{ type: 'extreme', severity: 'medium', title: 'Weather Extremes', description: 'More frequent intense storms and unpredictable weather patterns disrupt plans and damage infrastructure.' }
];

const EnhancedLandingPage = () => {
	const [city, setCity] = useState('');
	const [selectedCity, setSelectedCity] = useState(null);
	const [isSearchFocused, setIsSearchFocused] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [isHovered, setIsHovered] = useState(false);
	const [mounted, setMounted] = useState(false);
	const [currentTextIndex, setCurrentTextIndex] = useState(0);
	const [highlightedIndex, setHighlightedIndex] = useState(-1);
	const [suggestions, setSuggestions] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);
	const [showStory, setShowStory] = useState(false);
	const [storyData, setStoryData] = useState(null);
	const [isGenerating, setIsGenerating] = useState(false);

	// Other interests state
	const [otherInterests, setOtherInterests] = useState([]);
	const [otherInterestInput, setOtherInterestInput] = useState('');

	const mapContainerRef = useRef(null);
	const mapRef = useRef(null);
	const searchInputRef = useRef(null);
	const searchContainerRef = useRef(null);
	const otherInterestInputRef = useRef(null);
	const storyRef = useRef(null);
	const abortControllerRef = useRef(null);
	const markerRef = useRef(null);
	const isRotatingRef = useRef(true);

	const rotatingTexts = [
		"Discover how climate change will reshape your world",
		"Your personalized climate story awaits",
		"Explore the future of your favorite activities",
		"Science-backed predictions for your city"
	];

	const useDebounce = (value, delay) => {
		const [debouncedValue, setDebouncedValue] = useState(value);
		useEffect(() => {
			const handler = setTimeout(() => setDebouncedValue(value), delay);
			return () => clearTimeout(handler);
		}, [value, delay]);
		return debouncedValue;
	};

	const debouncedSearchQuery = useDebounce(searchQuery, 300);

	const stopRotation = useCallback(() => {
		isRotatingRef.current = false;
	}, []);

	const fetchSuggestions = useCallback(async (query) => {
		if (!query || query.length < 2) {
			setSuggestions([]);
			return;
		}
		if (abortControllerRef.current) abortControllerRef.current.abort();
		abortControllerRef.current = new AbortController();
		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch(
				`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
				`access_token=${MAPBOX_TOKEN}&types=place,locality,neighborhood,region,country&autocomplete=true&limit=6&language=en`,
				{ signal: abortControllerRef.current.signal }
			);
			if (!response.ok) throw new Error('Failed to fetch suggestions');
			const data = await response.json();

			const formattedSuggestions = data.features.map(feature => ({
				id: feature.id,
				name: feature.text,
				fullName: feature.place_name,
				coords: feature.center,
				placeType: feature.place_type[0],
				context: feature.context || [],
				temp: estimateTempAnomaly(feature.center[1])
			}));
			setSuggestions(formattedSuggestions);
			setHighlightedIndex(-1);
		} catch (err) {
			if (err.name !== 'AbortError') {
				console.error('Geocoding error:', err);
				setError('Failed to load suggestions');
			}
		} finally {
			setIsLoading(false);
		}
	}, []);

	const estimateTempAnomaly = (latitude) => {
		const absLat = Math.abs(latitude);
		if (absLat < 23) return (2.8 + Math.random() * 0.6).toFixed(1);
		if (absLat < 45) return (2.2 + Math.random() * 0.6).toFixed(1);
		if (absLat < 60) return (1.8 + Math.random() * 0.5).toFixed(1);
		return (1.5 + Math.random() * 0.4).toFixed(1);
	};

	useEffect(() => {
		fetchSuggestions(debouncedSearchQuery);
	}, [debouncedSearchQuery, fetchSuggestions]);

	useEffect(() => {
		setMounted(true);
		const textInterval = setInterval(() => {
			setCurrentTextIndex((prev) => (prev + 1) % rotatingTexts.length);
		}, 4000);
		return () => clearInterval(textInterval);
	}, []);

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
				setIsSearchFocused(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	useEffect(() => {
		if (!mapContainerRef.current || mapRef.current) return;
		mapboxgl.accessToken = MAPBOX_TOKEN;

		const map = new mapboxgl.Map({
			container: mapContainerRef.current,
			style: 'mapbox://styles/mapbox/satellite-streets-v12',
			center: [0, 20],
			zoom: 1.5,
			pitch: 0,
			bearing: 0,
			interactive: true,
			attributionControl: false,
			projection: 'globe'
		});

		mapRef.current = map;

		map.on('style.load', () => {
			map.setFog({
				'color': 'rgb(186, 210, 235)',
				'high-color': 'rgb(36, 92, 223)',
				'horizon-blend': 0.02,
				'space-color': 'rgb(11, 11, 25)',
				'star-intensity': 0.6
			});

			map.addSource('mapbox-dem', {
				'type': 'raster-dem',
				'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
				'tileSize': 512,
				'maxzoom': 14
			});

			map.setTerrain({
				'source': 'mapbox-dem',
				'exaggeration': 1.5
			});

			// Climate hotspots layer
			const climateDataPoints = [
				{ coords: [-74.006, 40.7128], temp: 2.1, city: 'New York' },
				{ coords: [-0.1276, 51.5074], temp: 1.8, city: 'London' },
				{ coords: [139.6917, 35.6895], temp: 2.3, city: 'Tokyo' },
				{ coords: [72.8777, 19.0760], temp: 2.8, city: 'Mumbai' },
				{ coords: [55.2708, 25.2048], temp: 3.2, city: 'Dubai' },
				{ coords: [151.2093, -33.8688], temp: 2.9, city: 'Sydney' },
				{ coords: [-118.2437, 34.0522], temp: 2.2, city: 'Los Angeles' },
				{ coords: [18.4241, -33.9249], temp: 2.3, city: 'Cape Town' }
			];

			map.addSource('climate-data', {
				type: 'geojson',
				data: {
					type: 'FeatureCollection',
					features: climateDataPoints.map(point => ({
						type: 'Feature',
						geometry: { type: 'Point', coordinates: point.coords },
						properties: { temperature: point.temp, city: point.city }
					}))
				}
			});

			map.addLayer({
				id: 'climate-heatmap',
				type: 'circle',
				source: 'climate-data',
				paint: {
					'circle-radius': [
						'interpolate',
						['linear'],
						['get', 'temperature'],
						1.5, 25,
						3.5, 60
					],
					'circle-color': [
						'interpolate',
						['linear'],
						['get', 'temperature'],
						1.5, '#3b82f6',
						2.0, '#8b5cf6',
						2.5, '#ec4899',
						3.0, '#ef4444',
						3.5, '#dc2626'
					],
					'circle-opacity': 0.5,
					'circle-blur': 0.3
				}
			});
		});

		let rotation = 0;
		const rotateMap = () => {
			if (isRotatingRef.current && mapRef.current && !showStory) {
				rotation += 0.05;
				map.rotateTo(rotation, { duration: 0 });
			}
			requestAnimationFrame(rotateMap);
		};
		rotateMap();

		map.on('mousedown', stopRotation);
		map.on('touchstart', stopRotation);
		map.on('wheel', stopRotation);
		map.on('drag', stopRotation);

		return () => {
			if (mapRef.current) {
				mapRef.current.remove();
				mapRef.current = null;
			}
		};
	}, [showStory, stopRotation]);

	const handleCitySelect = (cityData) => {
		setSelectedCity(cityData);
		setCity(cityData.name);
		setSearchQuery(cityData.fullName);
		setIsSearchFocused(false);
		setSuggestions([]);
		stopRotation();

		if (mapRef.current && mapRef.current.loaded()) {
			// Remove existing marker if any
			if (markerRef.current) {
				markerRef.current.remove();
			}

			// Create Google Maps-style pin marker
			const el = document.createElement('div');
			el.innerHTML = `
				<svg width="48" height="60" viewBox="0 0 48 60" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M24 0C10.7452 0 0 10.7452 0 24C0 37.2548 24 60 24 60C24 60 48 37.2548 48 24C48 10.7452 37.2548 0 24 0Z" fill="#EC4899"/>
					<circle cx="24" cy="24" r="10" fill="white"/>
					<circle cx="24" cy="24" r="6" fill="#EC4899"/>
				</svg>
			`;
			el.style.cssText = `
				width: 48px;
				height: 60px;
				cursor: pointer;
				filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4));
				transition: transform 0.2s ease;
			`;

			// Add hover effect
			el.addEventListener('mouseenter', () => {
				el.style.transform = 'scale(1.1)';
			});
			el.addEventListener('mouseleave', () => {
				el.style.transform = 'scale(1)';
			});

			// Create and add marker
			markerRef.current = new mapboxgl.Marker({
				element: el,
				anchor: 'bottom'
			})
				.setLngLat(cityData.coords)
				.addTo(mapRef.current);

			// Fly to location
			mapRef.current.flyTo({
				center: cityData.coords,
				zoom: 10,
				duration: 2000,
				essential: true
			});
		} else if (mapRef.current) {
			// If map is not loaded yet, wait for it
			mapRef.current.once('load', () => {
				handleCitySelect(cityData);
			});
		}
	};

	const clearSelection = () => {
		setSelectedCity(null);
		setCity('');
		setSearchQuery('');
		setSuggestions([]);
		setHighlightedIndex(-1);
		setShowStory(false);
		setStoryData(null);
		isRotatingRef.current = true;
		searchInputRef.current?.focus();

		// Remove marker
		if (markerRef.current) {
			markerRef.current.remove();
			markerRef.current = null;
		}

		if (mapRef.current) {
			mapRef.current.flyTo({
				center: [0, 20],
				zoom: 1.5,
				duration: 2000
			});
		}
	};

	const handleKeyDown = (e) => {
		stopRotation();

		if (e.key === 'ArrowDown') {
			e.preventDefault();
			setHighlightedIndex(prev => prev < suggestions.length - 1 ? prev + 1 : prev);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
				handleCitySelect(suggestions[highlightedIndex]);
			}
		} else if (e.key === 'Escape') {
			setIsSearchFocused(false);
		}
	};

	const getPlaceTypeLabel = (type) => {
		const labels = {
			'country': 'Country',
			'region': 'Region',
			'place': 'City',
			'locality': 'Town',
			'neighborhood': 'Area',
			'address': 'Address'
		};
		return labels[type] || 'Location';
	};

	const handleOtherInterestKeyDown = (e) => {
		if (e.key === 'Enter' || e.key === ',') {
			e.preventDefault();
			addOtherInterest();
		} else if (e.key === 'Backspace' && !otherInterestInput && otherInterests.length > 0) {
			removeOtherInterest(otherInterests[otherInterests.length - 1]);
		}
	};

	const addOtherInterest = () => {
		const trimmed = otherInterestInput.trim();
		if (trimmed && !otherInterests.includes(trimmed) && otherInterests.length < 5) {
			setOtherInterests([...otherInterests, trimmed]);
			setOtherInterestInput('');
		}
	};

	const removeOtherInterest = (interest) => {
		setOtherInterests(otherInterests.filter(i => i !== interest));
	};

	const interestOptions = [
		{ name: 'Cricket', icon: Trophy },
		{ name: 'Football', icon: Dribbble },
		{ name: 'Agriculture', icon: Sprout },
		{ name: 'Beach Activities', icon: Waves },
		{ name: 'Hiking', icon: Mountain },
		{ name: 'Outdoor Markets', icon: ShoppingBag },
		{ name: 'Photography', icon: Camera },
		{ name: 'Wildlife Watching', icon: Bird }
	];

	const [interests, setInterests] = useState([]);

	const toggleInterest = (itemName) => {
		setInterests(prev =>
			prev.includes(itemName)
				? prev.filter(i => i !== itemName)
				: [...prev, itemName]
		);
	};

	const generateStory = async (e) => {
		e.preventDefault();
		const allInterests = [...interests, ...otherInterests];
		if (!selectedCity || allInterests.length === 0) return;

		setIsGenerating(true);

		// Simulate API call delay
		await new Promise(resolve => setTimeout(resolve, 1500));

		// Generate story data
		const story = {
			location: selectedCity,
			interests: allInterests,
			impacts: allInterests.map(interest => {
				const dbEntry = climateImpactsDB[interest];
				if (dbEntry) {
					return {
						interest,
						...dbEntry,
						impacts: dbEntry.impacts.map(impact => ({
							...impact,
							locationSpecific: generateLocationSpecificImpact(impact, selectedCity)
						}))
					};
				}
				// Default for custom interests
				return {
					interest,
					category: 'Activity',
					icon: Sun,
					color: '#f59e0b',
					impacts: defaultImpacts.map(impact => ({
						...impact,
						locationSpecific: generateLocationSpecificImpact(impact, selectedCity)
					}))
				};
			}),
			timeline: generateTimeline(selectedCity, allInterests),
			adaptations: generateAdaptations(allInterests)
		};

		setStoryData(story);
		setShowStory(true);
		setIsGenerating(false);

		// Fly to location with closer zoom for story
		if (mapRef.current) {
			mapRef.current.flyTo({
				center: selectedCity.coords,
				zoom: 12,
				pitch: 60,
				bearing: 30,
				duration: 2500,
				essential: true
			});
		}

		// Scroll to story after animation
		setTimeout(() => {
			storyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}, 2600);
	};

	const generateLocationSpecificImpact = (impact, city) => {
		const lat = city.coords[1];
		const isTropical = Math.abs(lat) < 23;
		const isTemperate = Math.abs(lat) >= 23 && Math.abs(lat) < 45;

		if (impact.type === 'heat') {
			if (isTropical) return `In ${city.name}, located in the tropics, temperatures could regularly exceed 40°C by 2050, making this risk particularly severe.`;
			if (isTemperate) return `By 2050, ${city.name} could experience 20-30 more days above 35°C annually compared to today.`;
			return `Even in ${city.name}'s cooler climate, heat waves are becoming more frequent and intense.`;
		}
		if (impact.type === 'drought') {
			if (isTropical) return `Changing monsoon patterns threaten ${city.name}'s water security.`;
			return `${city.name} faces increased drought risk with changing precipitation patterns.`;
		}
		if (impact.type === 'rain') {
			return `Intense rainfall events in ${city.name} are becoming more frequent, disrupting activities.`;
		}
		return `This affects ${city.name} specifically due to its geographic and climatic context.`;
	};

	const generateTimeline = (city, interests) => {
		const temp = parseFloat(city.temp);
		return [
			{ year: 'Now', temp: `+${temp}°C`, description: 'Current climate conditions with observable changes.' },
			{ year: '2030', temp: `+${(temp + 0.5).toFixed(1)}°C`, description: 'Increased frequency of extreme weather events affecting activities.' },
			{ year: '2050', temp: `+${(temp + 1.2).toFixed(1)}°C`, description: 'Significant shifts in seasonal patterns. Some activities may need fundamental adaptation.' },
			{ year: '2080', temp: `+${(temp + 2.0).toFixed(1)}°C`, description: 'Potential transformation of activity feasibility without major intervention.' }
		];
	};

	const generateAdaptations = (interests) => {
		return [
			{ icon: Clock, title: 'Time Shifting', description: 'Adjust schedules to cooler hours or different seasons.' },
			{ icon: Shield, title: 'Infrastructure', description: 'Invest in climate-resilient facilities and cooling systems.' },
			{ icon: Droplets, title: 'Water Management', description: 'Implement efficient water use and recycling systems.' },
			{ icon: TrendingUp, title: 'Policy Action', description: 'Support local and global climate mitigation efforts.' }
		];
	};

	const isFormValid = selectedCity && (interests.length > 0 || otherInterests.length > 0);

	const getSeverityColor = (severity) => {
		const colors = {
			low: '#22c55e',
			medium: '#f59e0b',
			high: '#ef4444',
			critical: '#dc2626'
		};
		return colors[severity] || '#6b7280';
	};

	const getImpactIcon = (type) => {
		const icons = {
			heat: Sun,
			water: Droplets,
			rain: Droplets,
			drought: Sun,
			fire: AlertTriangle,
			erosion: Waves,
			extreme: AlertTriangle,
			biodiversity: Bird,
			habitat: Sprout,
			season: Clock,
			pests: AlertTriangle,
			haze: Wind,
			economy: TrendingUp
		};
		return icons[type] || AlertTriangle;
	};

	return (
		<div className="landing-container">
			<style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Newsreader:wght@400;500;600&display=swap');
        @import url('https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        html, body {
          overflow-x: hidden;
          min-height: 100vh;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          background: #0a0f1c;
        }

        .landing-container {
          min-height: 100vh;
          width: 100vw;
          position: relative;
        }

        /* Map Background */
        .mapbox-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100vh;
          z-index: 0;
          transition: height 0.5s ease;
        }

        .mapbox-container.story-mode {
          height: 50vh;
        }

        .map-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100vh;
          background: radial-gradient(circle at 70% 50%, transparent 0%, rgba(10, 15, 28, 0.4) 50%, rgba(10, 15, 28, 0.7) 100%);
          pointer-events: none;
          z-index: 1;
          transition: height 0.5s ease;
        }

        /* Floating Form Card */
        .floating-card-container {
          position: fixed;
          top: 0;
          right: 0;
          width: 100%;
          height: 100vh;
          pointer-events: none;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding: 2rem;
          transition: all 0.5s ease;
        }

        .floating-card-container.hidden {
          opacity: 0;
          pointer-events: none;
          transform: translateX(100px);
        }

        .form-card {
          pointer-events: auto;
          width: 420px;
          max-width: 90vw;
          max-height: 95vh;
          overflow-y: auto;
          background: rgba(17, 24, 39, 0.6);
          backdrop-filter: blur(40px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 24px;
          padding: 2rem;
          box-shadow: 
            0 25px 50px -12px rgba(0, 0, 0, 0.5),
            0 0 0 1px rgba(255, 255, 255, 0.1) inset;
        }

        /* Story Panel */
        .story-panel {
          position: relative;
          z-index: 20;
          background: linear-gradient(to bottom, rgba(10, 15, 28, 0.95), #0a0f1c);
          backdrop-filter: blur(20px);
          min-height: 50vh;
          padding: 3rem 2rem;
          margin-top: 50vh;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .story-content {
          max-width: 1200px;
          margin: 0 auto;
        }

        .story-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .story-location {
          font-family: 'Newsreader', serif;
          font-size: 3rem;
          font-weight: 600;
          background: linear-gradient(135deg, #ffffff 0%, #60a5fa 50%, #ec4899 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 0.5rem;
        }

        .story-subtitle {
          color: rgba(255, 255, 255, 0.6);
          font-size: 1.1rem;
        }

        .impacts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .impact-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 1.5rem;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .impact-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        .impact-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .impact-icon-wrapper {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.1);
        }

        .impact-title-section h3 {
          color: white;
          font-size: 1.25rem;
          margin-bottom: 0.25rem;
        }

        .impact-category {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.85rem;
        }

        .impact-item {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
          padding: 1rem;
          margin-bottom: 0.75rem;
          border-left: 4px solid;
        }

        .impact-item-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .impact-item-title {
          color: white;
          font-weight: 600;
          font-size: 0.95rem;
        }

        .severity-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .impact-description {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.9rem;
          line-height: 1.5;
          margin-bottom: 0.5rem;
        }

        .impact-location {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.8rem;
          font-style: italic;
        }

        /* Timeline Section */
        .timeline-section {
          margin: 3rem 0;
        }

        .section-title {
          font-size: 1.5rem;
          color: white;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .timeline {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .timeline-item {
          flex: 1;
          min-width: 200px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          position: relative;
        }

        .timeline-year {
          font-size: 1.5rem;
          font-weight: 700;
          color: #60a5fa;
          margin-bottom: 0.5rem;
        }

        .timeline-temp {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
        }

        .timeline-desc {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.9rem;
          line-height: 1.5;
        }

        /* Adaptations Section */
        .adaptations-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .adaptation-card {
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.2);
          border-radius: 12px;
          padding: 1.25rem;
          display: flex;
          align-items: flex-start;
          gap: 1rem;
        }

        .adaptation-icon {
          color: #22c55e;
          flex-shrink: 0;
        }

        .adaptation-content h4 {
          color: white;
          margin-bottom: 0.25rem;
        }

        .adaptation-content p {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.85rem;
        }

        /* Back Button */
        .back-button {
          position: fixed;
          top: 2rem;
          left: 2rem;
          z-index: 30;
          background: rgba(17, 24, 39, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 0.75rem 1.25rem;
          border-radius: 50px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          transition: all 0.3s ease;
        }

        .back-button:hover {
          background: rgba(96, 165, 250, 0.2);
          border-color: rgba(96, 165, 250, 0.5);
        }

        /* Generating Overlay */
        .generating-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100vh;
          background: rgba(10, 15, 28, 0.9);
          backdrop-filter: blur(20px);
          z-index: 50;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
        }

        .generating-spinner {
          width: 60px;
          height: 60px;
          border: 3px solid rgba(96, 165, 250, 0.3);
          border-top-color: #60a5fa;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .generating-text {
          color: white;
          font-size: 1.25rem;
          font-weight: 500;
        }

        .generating-subtext {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.9rem;
        }

        /* Header & Form Styles (previous) */
        .floating-header {
          position: fixed;
          top: 2rem;
          left: 2rem;
          z-index: 5;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          opacity: ${mounted ? '1' : '0'};
          transform: ${mounted ? 'translateY(0)' : 'translateY(-20px)'};
          transition: all 1.2s cubic-bezier(0.16, 1, 0.3, 1);
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(10px);
          padding: 0.75rem 1.25rem;
          border-radius: 50px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .logo-icon {
          width: 36px;
          height: 36px;
          color: #60a5fa;
          filter: drop-shadow(0 0 15px rgba(96, 165, 250, 0.6));
          animation: float 6s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }

        .header-text {
          font-family: 'Newsreader', serif;
          font-size: 1.25rem;
          font-weight: 600;
          background: linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .climate-legend {
          position: fixed;
          bottom: 2rem;
          left: 2rem;
          z-index: 5;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          padding: 1rem 1.25rem;
        }

        .form-group { margin-bottom: 1.5rem; }
        
        .label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 0.75rem;
        }

        .label svg { width: 18px; height: 18px; color: #60a5fa; }

        .search-container { position: relative; width: 100%; }

        .search-input-wrapper {
          position: relative;
          width: 100%;
          background: rgba(255, 255, 255, 0.1);
          border: 1.5px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          overflow: hidden;
        }

        .search-input-wrapper:focus-within {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(96, 165, 250, 0.6);
        }

        .search-icon {
          position: absolute;
          left: 12px;
          color: rgba(255, 255, 255, 0.5);
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          padding: 0.875rem 2.5rem 0.875rem 2.5rem;
          background: transparent;
          border: none;
          color: white;
          font-size: 0.95rem;
          outline: none;
        }

        .search-input::placeholder { color: rgba(255, 255, 255, 0.4); }

        .search-actions {
          position: absolute;
          right: 8px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .clear-btn, .dropdown-btn {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .selected-city-badge {
          margin-top: 0.75rem;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.875rem;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(236, 72, 153, 0.2));
          border: 1px solid rgba(167, 139, 250, 0.4);
          border-radius: 20px;
          color: white;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .selected-city-badge svg {
          color: #ec4899;
        }

        .interests-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
        }

        .interest-button {
          padding: 0.875rem 0.5rem;
          background: rgba(255, 255, 255, 0.08);
          border: 1.5px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .interest-button.selected {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.35), rgba(236, 72, 153, 0.35));
          border-color: rgba(167, 139, 250, 0.6);
          color: white;
        }

        .other-interest-container { margin-top: 1rem; }

        .other-interest-input-wrapper {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.06);
          border: 1.5px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          padding: 0.5rem;
        }

        .other-interest-input {
          flex: 1;
          background: transparent;
          border: none;
          color: white;
          font-size: 0.9rem;
          outline: none;
          padding: 0.25rem 0.5rem;
        }

        .tags-container {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.75rem;
        }

        .interest-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.4rem 0.75rem;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(236, 72, 153, 0.25));
          border: 1px solid rgba(167, 139, 250, 0.4);
          border-radius: 20px;
          font-size: 0.8rem;
          color: white;
        }

        .submit-button {
          width: 100%;
          padding: 1rem 1.5rem;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);
          background-size: 200% 200%;
          border: none;
          border-radius: 14px;
          color: white;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          animation: gradient-shift 6s ease infinite;
        }

        .submit-button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .story-location { font-size: 2rem; }
          .impacts-grid { grid-template-columns: 1fr; }
          .timeline { flex-direction: column; }
          .floating-card-container { padding: 1rem; }
          .form-card { width: 100%; }
        }
      `}</style>

			{/* Map Background */}
			<div ref={mapContainerRef} className={`mapbox-container ${showStory ? 'story-mode' : ''}`} />
			<div className={`map-overlay ${showStory ? 'story-mode' : ''}`} />

			{/* Back Button (visible in story mode) */}
			{showStory && (
				<button className="back-button" onClick={clearSelection}>
					<ArrowRight size={18} style={{ transform: 'rotate(180deg)' }} />
					<span>New Search</span>
				</button>
			)}

			{/* Header */}
			{!showStory && (
				<div className="floating-header">
					<Globe2 className="logo-icon" strokeWidth={1.5} />
					<span className="header-text">Climate Story Engine</span>
				</div>
			)}

			{/* Climate Legend */}
			{!showStory && (
				<div className="climate-legend">
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.9)', marginBottom: '0.5rem' }}>
						<Thermometer size={14} color="#ec4899" />
						<span>Temp Anomaly (°C)</span>
					</div>
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>
						<span>+1.5°</span>
						<div style={{ height: 6, width: 100, borderRadius: 3, background: 'linear-gradient(to right, #3b82f6, #8b5cf6, #ec4899, #ef4444, #dc2626)' }} />
						<span>+3.5°</span>
					</div>
				</div>
			)}

			{/* Generating Overlay */}
			{isGenerating && (
				<div className="generating-overlay">
					<div className="generating-spinner" />
					<div className="generating-text">Generating Your Climate Story</div>
					<div className="generating-subtext">Analyzing {selectedCity?.name} with your interests...</div>
				</div>
			)}

			{/* Form Card */}
			<div className={`floating-card-container ${showStory ? 'hidden' : ''}`}>
				<form className="form-card" onSubmit={generateStory}>
					<div className="form-group">
						<label className="label">
							<MapPin size={18} />
							Your Location
						</label>
						<div className="search-container" ref={searchContainerRef}>
							<div className="search-input-wrapper">
								<Search size={18} className="search-icon" />
								<input
									ref={searchInputRef}
									type="text"
									className="search-input"
									placeholder="Search any city..."
									value={searchQuery}
									onChange={(e) => {
										setSearchQuery(e.target.value);
										stopRotation();
									}}
									onFocus={() => {
										setIsSearchFocused(true);
										stopRotation();
									}}
									onKeyDown={handleKeyDown}
									autoComplete="off"
								/>
								<div className="search-actions">
									{isLoading ? <Loader2 size={16} className="loading-spinner" /> : searchQuery ? (
										<button type="button" className="clear-btn" onClick={() => setSearchQuery('')}><X size={16} /></button>
									) : null}
									<button type="button" className="dropdown-btn" onClick={() => setIsSearchFocused(!isSearchFocused)}>
										<ChevronDown size={16} style={{ transform: isSearchFocused ? 'rotate(180deg)' : 'rotate(0deg)' }} />
									</button>
								</div>
							</div>

							{isSearchFocused && (
								<div className="search-dropdown active" style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, background: 'rgba(17, 24, 39, 0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, maxHeight: 300, overflow: 'auto', zIndex: 100 }}>
									{suggestions.length > 0 ? suggestions.map((cityData, index) => (
										<div key={cityData.id} className={`city-option ${index === highlightedIndex ? 'highlighted' : ''}`} onClick={() => handleCitySelect(cityData)} style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 12 }}>
											<div style={{ width: 32, height: 32, background: 'rgba(96, 165, 250, 0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}><MapPin size={16} /></div>
											<div style={{ flex: 1 }}>
												<div style={{ color: 'white', fontWeight: 500 }}>{cityData.name}</div>
												<div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>{cityData.fullName}</div>
											</div>
											<div style={{ color: '#ec4899', fontSize: '0.8rem', fontWeight: 600 }}>+{cityData.temp}°C</div>
										</div>
									)) : <div style={{ padding: 20, textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>Type to search...</div>}
								</div>
							)}

							{selectedCity && (
								<div className="selected-city-badge">
									<MapPin size={12} />
									{selectedCity.name}
								</div>
							)}
						</div>
					</div>

					<div className="form-group">
						<label className="label">
							<Sparkles size={18} />
							Your Interests
						</label>
						<div className="interests-grid">
							{interestOptions.map((item) => {
								const Icon = item.icon;
								return (
									<button key={item.name} type="button" className={`interest-button ${interests.includes(item.name) ? 'selected' : ''}`} onClick={() => toggleInterest(item.name)}>
										<Icon size={20} />
										<span>{item.name}</span>
									</button>
								);
							})}
						</div>

						<div className="other-interest-container">
							<div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
								<Plus size={14} /> Add other interests
							</div>
							<div className="other-interest-input-wrapper">
								<input
									ref={otherInterestInputRef}
									type="text"
									className="other-interest-input"
									placeholder={otherInterests.length >= 5 ? "Max reached" : "Type and press Enter"}
									value={otherInterestInput}
									onChange={(e) => setOtherInterestInput(e.target.value)}
									onKeyDown={handleOtherInterestKeyDown}
									disabled={otherInterests.length >= 5}
								/>
								<button type="button" onClick={addOtherInterest} disabled={!otherInterestInput.trim() || otherInterests.length >= 5} style={{ background: 'rgba(96, 165, 250, 0.2)', border: 'none', color: '#60a5fa', padding: '0.5rem', borderRadius: 8, cursor: 'pointer' }}>
									<Plus size={18} />
								</button>
							</div>
							<div className="tags-container">
								{otherInterests.map((interest) => (
									<span key={interest} className="interest-tag">
										{interest}
										<button type="button" onClick={() => removeOtherInterest(interest)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0 }}><X size={12} /></button>
									</span>
								))}
							</div>
						</div>
					</div>

					<button type="submit" className="submit-button" disabled={!isFormValid || isGenerating}>
						<span>Generate Your Story</span>
						<ArrowRight size={18} />
					</button>
				</form>
			</div>

			{/* Story Panel */}
			{showStory && storyData && (
				<div className="story-panel" ref={storyRef}>
					<div className="story-content">
						<div className="story-header">
							<h1 className="story-location">{storyData.location.name}</h1>
							<p className="story-subtitle">Climate Change Impact Assessment for Your Activities</p>
						</div>

						<div className="impacts-grid">
							{storyData.impacts.map((impactData, idx) => {
								const IconComponent = impactData.icon;
								return (
									<div key={idx} className="impact-card">
										<div className="impact-header">
											<div className="impact-icon-wrapper" style={{ background: `${impactData.color}20` }}>
												<IconComponent size={24} color={impactData.color} />
											</div>
											<div className="impact-title-section">
												<h3>{impactData.interest}</h3>
												<span className="impact-category">{impactData.category}</span>
											</div>
										</div>
										{impactData.impacts.map((item, i) => {
											const ItemIcon = getImpactIcon(item.type);
											return (
												<div key={i} className="impact-item" style={{ borderLeftColor: getSeverityColor(item.severity) }}>
													<div className="impact-item-header">
														<ItemIcon size={16} color={getSeverityColor(item.severity)} />
														<span className="impact-item-title">{item.title}</span>
														<span className="severity-badge" style={{ background: `${getSeverityColor(item.severity)}30`, color: getSeverityColor(item.severity) }}>{item.severity}</span>
													</div>
													<p className="impact-description">{item.description}</p>
													<p className="impact-location">{item.locationSpecific}</p>
												</div>
											);
										})}
									</div>
								);
							})}
						</div>

						<div className="timeline-section">
							<h2 className="section-title"><Clock size={24} /> Future Timeline</h2>
							<div className="timeline">
								{storyData.timeline.map((item, idx) => (
									<div key={idx} className="timeline-item">
										<div className="timeline-year">{item.year}</div>
										<div className="timeline-temp">{item.temp}</div>
										<p className="timeline-desc">{item.description}</p>
									</div>
								))}
							</div>
						</div>

						<div className="timeline-section">
							<h2 className="section-title"><Shield size={24} /> Adaptation Strategies</h2>
							<div className="adaptations-grid">
								{storyData.adaptations.map((adapt, idx) => {
									const AdaptIcon = adapt.icon;
									return (
										<div key={idx} className="adaptation-card">
											<AdaptIcon size={24} className="adaptation-icon" />
											<div className="adaptation-content">
												<h4>{adapt.title}</h4>
												<p>{adapt.description}</p>
											</div>
										</div>
									);
								})}
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default EnhancedLandingPage;
