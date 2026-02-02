'use client';
import React, {useEffect, useRef, useState} from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const LandingMap = () => {
	const mapContainer = useRef(null);
	const map = useRef(null);
	const [isLoading, setIsLoading] = useState(true);
	const styleUrl = '/streets-v2-dark.json';

	// Two very close locations - like friends in different stores in a mall/market
	// Select Citywalk Mall, Saket - One friend at one end, another ~80m away
	const startPoint = [77.2167, 28.5244]; // Friend 1 - Food court area
	const endPoint = [77.2174, 28.5251]; // Friend 2 - Shopping section (~80m away)

	useEffect(() => {
		if (map.current) return;
		if (!mapContainer.current) return;

		initializeMap();

		function initializeMap() {
			// Calculate center point between the two locations
			const centerLng = (startPoint[0] + endPoint[0]) / 2;
			const centerLat = (startPoint[1] + endPoint[1]) / 2;

			map.current = new maplibregl.Map({
				container: mapContainer.current,
				style: styleUrl,
				center: [centerLng, centerLat],
				zoom: 17.5, // Very close zoom to show nearby locations clearly
				attributionControl: false,
				pitch: 0, // Slight tilt for better perspective
			});

			map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

			map.current.on('load', () => {
				// Add markers
				addMarkers();

				// Fetch and display route
				fetchRoute();
			});
		}

		function addMarkers() {
			// Friend 1 marker (purple) - slightly larger for visibility
			const marker1El = document.createElement('div');
			marker1El.style.width = '28px';
			marker1El.style.height = '28px';
			marker1El.style.backgroundColor = '#8B5CF6';
			marker1El.style.border = '4px solid white';
			marker1El.style.borderRadius = '50%';
			marker1El.style.boxShadow = '0 0 20px rgba(139,92,246,0.6)';
			marker1El.style.cursor = 'pointer';

			// Add pulse animation
			marker1El.style.animation = 'pulse 2s infinite';

			new maplibregl.Marker(marker1El)
				.setLngLat(startPoint)
				.setPopup(
					new maplibregl.Popup().setHTML(
						'<strong>Alex</strong><br/>🍕 At food court',
					),
				)
				.addTo(map.current);

			// Friend 2 marker (pink)
			const marker2El = document.createElement('div');
			marker2El.style.width = '28px';
			marker2El.style.height = '28px';
			marker2El.style.backgroundColor = '#EC4899';
			marker2El.style.border = '4px solid white';
			marker2El.style.borderRadius = '50%';
			marker2El.style.boxShadow = '0 0 20px rgba(236,72,153,0.6)';
			marker2El.style.cursor = 'pointer';

			new maplibregl.Marker(marker2El)
				.setLngLat(endPoint)
				.setPopup(
					new maplibregl.Popup().setHTML(
						'<strong>Sam</strong><br/>👕 Shopping',
					),
				)
				.addTo(map.current);

			// Friend 3 marker (cyan) - adding a third friend for realism
			const midPoint = [77.217, 28.5247];
			const marker3El = document.createElement('div');
			marker3El.style.width = '28px';
			marker3El.style.height = '28px';
			marker3El.style.backgroundColor = '#06B6D4';
			marker3El.style.border = '4px solid white';
			marker3El.style.borderRadius = '50%';
			marker3El.style.boxShadow = '0 0 20px rgba(6,182,212,0.6)';
			marker3El.style.cursor = 'pointer';

			new maplibregl.Marker(marker3El)
				.setLngLat(midPoint)
				.setPopup(
					new maplibregl.Popup().setHTML('<strong>Jordan</strong><br/>☕ Café'),
				)
				.addTo(map.current);
		}

		async function fetchRoute() {
			try {
				// OpenRouteService API endpoint
				const apiKey =
					'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjFmMTQxYTc0ZWMwOTRjZGM4MzZmZWJjOTcxN2ViZWM5IiwiaCI6Im11cm11cjY0In0='; // Replace with your API key
				const url =
					'https://api.openrouteservice.org/v2/directions/foot-walking';

				const response = await fetch(url, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: apiKey,
					},
					body: JSON.stringify({
						coordinates: [startPoint, endPoint],
					}),
				});

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const data = await response.json();
				const routeCoordinates = data.features[0].geometry.coordinates;

				// Add route as a line on the map
				map.current.addSource('route', {
					type: 'geojson',
					data: {
						type: 'Feature',
						properties: {},
						geometry: {
							type: 'LineString',
							coordinates: routeCoordinates,
						},
					},
				});

				// Dashed line to show connection
				map.current.addLayer({
					id: 'route',
					type: 'line',
					source: 'route',
					layout: {
						'line-join': 'round',
						'line-cap': 'round',
					},
					paint: {
						'line-color': '#06B6D4',
						'line-width': 2.5,
						'line-opacity': 0.8,
						'line-dasharray': [3, 3],
					},
				});

				// Glowing background
				map.current.addLayer(
					{
						id: 'route-glow',
						type: 'line',
						source: 'route',
						layout: {
							'line-join': 'round',
							'line-cap': 'round',
						},
						paint: {
							'line-color': '#06B6D4',
							'line-width': 8,
							'line-opacity': 0.15,
							'line-blur': 4,
						},
					},
					'route',
				);

				setIsLoading(false);
			} catch (error) {
				console.error('Error fetching route:', error);
				setIsLoading(false);
			}
		}

		return () => {
			if (map.current) {
				map.current.remove();
				map.current = null;
			}
		};
	}, []);

	return (
		<div style={{position: 'relative', width: '100%', height: '100%'}}>
			{isLoading && (
				<div
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						backgroundColor: 'rgba(0, 0, 0, 0.7)',
						color: 'white',
						zIndex: 1000,
					}}
				>
					Loading map...
				</div>
			)}
			<div ref={mapContainer} style={{width: '100%', height: '100%'}} />
			<style jsx>{`
				@keyframes pulse {
					0%,
					100% {
						transform: scale(1);
						opacity: 1;
					}
					50% {
						transform: scale(1.1);
						opacity: 0.8;
					}
				}
			`}</style>
		</div>
	);
};

export default LandingMap;
