import { useRef, useEffect, useState } from 'react';
import Map, { NavigationControl, GeolocateControl } from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// Luxury Obsidian Map Style
const DARK_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

export default function MapLibreMap() {
    return (
        <Map
            mapLib={maplibregl}
            initialViewState={{
                longitude: 37.6173, // Moscow (Yandex home)
                latitude: 55.7558,
                zoom: 12,
                pitch: 45, // 3D feel
            }}
            style={{ width: '100%', height: '100%' }}
            mapStyle={DARK_STYLE}
            attributionControl={false} // Minimalist
        >
            <GeolocateControl position="top-right" className="!bg-[#121216]/80 !text-[#d4a574]" />
            <NavigationControl position="bottom-right" showCompass={true} />

            {/* 
        Here we would add sources and layers for offline bus data.
        For now, it's just the base map.
      */}
        </Map>
    );
}
