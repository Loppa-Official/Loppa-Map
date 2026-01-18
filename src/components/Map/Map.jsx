import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// Premium dark map style
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

export default function Map({ buses, selectedBus, onSelectBus, city, userLocation }) {
    const containerRef = useRef(null);
    const mapRef = useRef(null);
    const markersRef = useRef({});
    const userMarkerRef = useRef(null);
    const [ready, setReady] = useState(false);

    // Init map
    useEffect(() => {
        if (mapRef.current || !containerRef.current) return;

        mapRef.current = new maplibregl.Map({
            container: containerRef.current,
            style: MAP_STYLE,
            center: city?.center ? [city.center[1], city.center[0]] : [37.6173, 55.7558],
            zoom: city?.zoom || 12,
            attributionControl: false,
            antialias: true,
        });

        mapRef.current.on('load', () => {
            // Route source
            mapRef.current.addSource('route', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });

            // Route glow
            mapRef.current.addLayer({
                id: 'route-glow',
                type: 'line',
                source: 'route',
                paint: {
                    'line-color': ['get', 'color'],
                    'line-width': 12,
                    'line-opacity': 0.3,
                    'line-blur': 8
                }
            });

            // Route line
            mapRef.current.addLayer({
                id: 'route-line',
                type: 'line',
                source: 'route',
                paint: {
                    'line-color': ['get', 'color'],
                    'line-width': 4,
                    'line-opacity': 0.9
                },
                layout: {
                    'line-cap': 'round',
                    'line-join': 'round'
                }
            });

            setReady(true);
        });

        mapRef.current.dragRotate.disable();
        mapRef.current.touchZoomRotate.disableRotation();

        // Zoom controls
        const handleZoom = (dir) => () => dir === 'in' ? mapRef.current.zoomIn() : mapRef.current.zoomOut();
        document.getElementById('zoom-in')?.addEventListener('click', handleZoom('in'));
        document.getElementById('zoom-out')?.addEventListener('click', handleZoom('out'));

        return () => {
            mapRef.current?.remove();
            mapRef.current = null;
        };
    }, []);

    // Fly to city
    useEffect(() => {
        if (!mapRef.current || !city?.center) return;
        mapRef.current.flyTo({
            center: [city.center[1], city.center[0]],
            zoom: city.zoom || 12,
            duration: 1500
        });
    }, [city]);

    // Selected bus route
    useEffect(() => {
        if (!mapRef.current || !ready) return;

        const source = mapRef.current.getSource('route');
        if (!source) return;

        if (selectedBus?.path) {
            source.setData({
                type: 'FeatureCollection',
                features: [{
                    type: 'Feature',
                    properties: { color: selectedBus.color },
                    geometry: {
                        type: 'LineString',
                        coordinates: selectedBus.path.map(p => [p.lng, p.lat])
                    }
                }]
            });

            mapRef.current.flyTo({
                center: [selectedBus.position.lng, selectedBus.position.lat],
                zoom: 14,
                duration: 800
            });
        } else {
            source.setData({ type: 'FeatureCollection', features: [] });
        }
    }, [selectedBus, ready]);

    // Bus markers
    const updateMarkers = useCallback(() => {
        if (!mapRef.current || !ready) return;

        const ids = new Set(buses.map(b => b.id));

        // Remove old
        Object.keys(markersRef.current).forEach(id => {
            if (!ids.has(id)) {
                markersRef.current[id].remove();
                delete markersRef.current[id];
            }
        });

        // Add/update
        buses.forEach(bus => {
            const isSelected = selectedBus?.id === bus.id;

            if (markersRef.current[bus.id]) {
                markersRef.current[bus.id].setLngLat([bus.position.lng, bus.position.lat]);
                updateMarkerEl(markersRef.current[bus.id].getElement(), bus, isSelected);
            } else {
                const el = document.createElement('div');
                el.className = 'bus-marker';
                updateMarkerEl(el, bus, isSelected);
                el.onclick = () => onSelectBus(bus);

                markersRef.current[bus.id] = new maplibregl.Marker({ element: el, anchor: 'center' })
                    .setLngLat([bus.position.lng, bus.position.lat])
                    .addTo(mapRef.current);
            }
        });
    }, [buses, selectedBus, ready, onSelectBus]);

    useEffect(() => { updateMarkers(); }, [updateMarkers]);

    // User location
    useEffect(() => {
        if (!mapRef.current || !ready || !userLocation) return;

        if (userMarkerRef.current) {
            userMarkerRef.current.setLngLat([userLocation.lng, userLocation.lat]);
        } else {
            const el = document.createElement('div');
            el.className = 'user-marker';
            el.innerHTML = '<div class="user-pulse"></div><div class="user-dot"></div>';

            userMarkerRef.current = new maplibregl.Marker({ element: el, anchor: 'center' })
                .setLngLat([userLocation.lng, userLocation.lat])
                .addTo(mapRef.current);
        }
    }, [userLocation, ready]);

    return <div ref={containerRef} className="map" />;
}

function updateMarkerEl(el, bus, isSelected) {
    const size = isSelected ? 52 : 42;
    el.innerHTML = `
    <div class="marker-inner ${isSelected ? 'selected' : ''}" style="--color: ${bus.color}; --size: ${size}px;">
      <span class="marker-num">${bus.number}</span>
    </div>
  `;
}
