import { useState, useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './index.css';

// Языки
const LANGS = {
    ru: {
        search: 'Поиск',
        searchPlace: 'Найти место',
        settings: 'Настройки',
        theme: 'Тема',
        light: 'Светлая',
        dark: 'Тёмная',
        auto: 'Авто',
        language: 'Язык',
        download: 'Скачать район',
        downloading: 'Загрузка',
        downloaded: 'Скачано',
        cancel: 'Отмена',
        noResults: 'Ничего не найдено',
        locationError: 'Не удалось определить местоположение',
        locationPermission: 'Разрешите доступ к геолокации',
    },
    en: {
        search: 'Search',
        searchPlace: 'Find a place',
        settings: 'Settings',
        theme: 'Theme',
        light: 'Light',
        dark: 'Dark',
        auto: 'Auto',
        language: 'Language',
        download: 'Download area',
        downloading: 'Downloading',
        downloaded: 'Downloaded',
        cancel: 'Cancel',
        noResults: 'No results found',
        locationError: 'Could not get location',
        locationPermission: 'Please allow location access',
    },
    uk: {
        search: 'Пошук',
        searchPlace: 'Знайти місце',
        settings: 'Налаштування',
        theme: 'Тема',
        light: 'Світла',
        dark: 'Темна',
        auto: 'Авто',
        language: 'Мова',
        download: 'Завантажити район',
        downloading: 'Завантаження',
        downloaded: 'Завантажено',
        cancel: 'Скасувати',
        noResults: 'Нічого не знайдено',
        locationError: 'Не вдалося визначити місцезнаходження',
        locationPermission: 'Дозвольте доступ до геолокації',
    },
    de: {
        search: 'Suche',
        searchPlace: 'Ort finden',
        settings: 'Einstellungen',
        theme: 'Thema',
        light: 'Hell',
        dark: 'Dunkel',
        auto: 'Auto',
        language: 'Sprache',
        download: 'Bereich laden',
        downloading: 'Wird geladen',
        downloaded: 'Geladen',
        cancel: 'Abbrechen',
        noResults: 'Keine Ergebnisse',
        locationError: 'Standort konnte nicht ermittelt werden',
        locationPermission: 'Bitte Standortzugriff erlauben',
    },
    fr: {
        search: 'Recherche',
        searchPlace: 'Trouver un lieu',
        settings: 'Paramètres',
        theme: 'Thème',
        light: 'Clair',
        dark: 'Sombre',
        auto: 'Auto',
        language: 'Langue',
        download: 'Télécharger zone',
        downloading: 'Téléchargement',
        downloaded: 'Téléchargé',
        cancel: 'Annuler',
        noResults: 'Aucun résultat',
        locationError: 'Impossible de localiser',
        locationPermission: 'Veuillez autoriser la géolocalisation',
    },
};

const LANG_NAMES = { ru: 'Русский', en: 'English', uk: 'Українська', de: 'Deutsch', fr: 'Français' };

const MAP_STYLES = {
    light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
};

// Определить системную тему
const getSystemTheme = () =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

function App() {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const userMarker = useRef(null);
    const searchMarkerRef = useRef(null);

    const [userLocation, setUserLocation] = useState(null);
    const [heading, setHeading] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [isTracking, setIsTracking] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [themeMode, setThemeMode] = useState(() => localStorage.getItem('themeMode') || 'auto');
    const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'ru');
    const [weather, setWeather] = useState(null);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isDownloaded, setIsDownloaded] = useState(() => localStorage.getItem('isDownloaded') === 'true');
    const [locationError, setLocationError] = useState(null);

    const t = LANGS[lang];

    // Вычисляем активную тему
    const activeTheme = themeMode === 'auto' ? getSystemTheme() : themeMode;

    // Слушаем изменение системной темы
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = () => {
            if (themeMode === 'auto' && map.current) {
                map.current.setStyle(MAP_STYLES[getSystemTheme()]);
            }
        };
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, [themeMode]);

    // Init map
    useEffect(() => {
        if (map.current) return;

        // Восстановить последний регион
        const savedCenter = localStorage.getItem('mapCenter');
        const savedZoom = localStorage.getItem('mapZoom');
        const defaultCenter = savedCenter ? JSON.parse(savedCenter) : [37.6173, 55.7558];
        const defaultZoom = savedZoom ? parseFloat(savedZoom) : 12;

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: MAP_STYLES[activeTheme],
            center: defaultCenter,
            zoom: defaultZoom,
            attributionControl: false,
        });

        // Погода при загрузке
        fetchWeather(defaultCenter[1], defaultCenter[0]);

        // Сохранять позицию + погода при перемещении
        let saveTimeout;
        map.current.on('moveend', () => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                const center = map.current.getCenter();
                localStorage.setItem('mapCenter', JSON.stringify([center.lng, center.lat]));
                localStorage.setItem('mapZoom', map.current.getZoom().toString());
                fetchWeather(center.lat, center.lng);
            }, 500);
        });

        return () => {
            map.current?.remove();
            map.current = null;
        };
    }, []);

    // Смена темы
    useEffect(() => {
        if (map.current) map.current.setStyle(MAP_STYLES[activeTheme]);
        localStorage.setItem('themeMode', themeMode);
    }, [themeMode, activeTheme]);

    useEffect(() => {
        localStorage.setItem('lang', lang);
    }, [lang]);

    // Погода
    const fetchWeather = async (lat, lon) => {
        try {
            const res = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`
            );
            const data = await res.json();
            setWeather({ temp: Math.round(data.current.temperature_2m), code: data.current.weather_code });
        } catch { }
    };

    // Скачать район с прогрессом
    const downloadArea = async () => {
        if (!map.current || isDownloading) return;
        setIsDownloading(true);
        setDownloadProgress(0);

        const bounds = map.current.getBounds();
        const zoom = Math.floor(map.current.getZoom());
        const tiles = [];

        for (let z = zoom; z <= Math.min(zoom + 3, 17); z++) {
            const minTile = latLngToTile(bounds.getSouth(), bounds.getWest(), z);
            const maxTile = latLngToTile(bounds.getNorth(), bounds.getEast(), z);

            for (let x = minTile.x; x <= maxTile.x; x++) {
                for (let y = maxTile.y; y <= minTile.y; y++) {
                    tiles.push({ z, x, y });
                }
            }
        }

        const cache = await caches.open('loppo-tiles-v1');
        const total = Math.min(tiles.length, 200);
        let downloaded = 0;

        const style = activeTheme === 'dark' ? 'dark_all' : 'light_all';

        for (const tile of tiles.slice(0, total)) {
            const url = `https://a.basemaps.cartocdn.com/gl/${style}/${tile.z}/${tile.x}/${tile.y}.png`;

            try {
                const response = await fetch(url);
                if (response.ok) await cache.put(url, response);
            } catch { }

            downloaded++;
            setDownloadProgress(Math.round((downloaded / total) * 100));
        }

        setIsDownloading(false);
        setIsDownloaded(true);
        localStorage.setItem('isDownloaded', 'true');
    };

    const latLngToTile = (lat, lng, zoom) => {
        const x = Math.floor((lng + 180) / 360 * Math.pow(2, zoom));
        const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
        return { x, y };
    };

    // IP геолокация как fallback
    const getLocationByIP = async () => {
        try {
            const res = await fetch('https://ipapi.co/json/');
            const data = await res.json();
            if (data.latitude && data.longitude) {
                setUserLocation({ lat: data.latitude, lng: data.longitude });
                map.current?.flyTo({ center: [data.longitude, data.latitude], zoom: 13, duration: 1500 });
                updateUserMarker(data.latitude, data.longitude);
                fetchWeather(data.latitude, data.longitude);
                setIsTracking(true);
                setLocationError(null);
            }
        } catch {
            setLocationError(t.locationError);
        }
    };

    // Локация с GPS + IP fallback
    const getLocation = useCallback(() => {
        setLocationError(null);
        setIsTracking(true);
        setIsFollowing(true);

        if (!navigator.geolocation) {
            getLocationByIP();
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                setUserLocation({ lat: latitude, lng: longitude });
                map.current?.flyTo({ center: [longitude, latitude], zoom: 15, duration: 1500 });
                updateUserMarker(latitude, longitude);
                fetchWeather(latitude, longitude);
                setLocationError(null);
            },
            (error) => {
                // Fallback на IP геолокацию без ошибки
                getLocationByIP();
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    }, [heading, t]);

    useEffect(() => {
        if (!isTracking) return;

        const watchId = navigator.geolocation?.watchPosition(
            (pos) => {
                const { latitude, longitude, heading: h } = pos.coords;
                setUserLocation({ lat: latitude, lng: longitude });
                if (h) setHeading(h);
                updateUserMarker(latitude, longitude);
                if (isFollowing) map.current?.setCenter([longitude, latitude]);
            },
            () => { },
            { enableHighAccuracy: true, maximumAge: 0 }
        );

        const handleOrientation = (e) => {
            if (e.alpha !== null) setHeading(360 - e.alpha);
        };
        window.addEventListener('deviceorientation', handleOrientation);

        const handleDrag = () => setIsFollowing(false);
        map.current?.on('dragstart', handleDrag);

        return () => {
            navigator.geolocation?.clearWatch(watchId);
            window.removeEventListener('deviceorientation', handleOrientation);
            map.current?.off('dragstart', handleDrag);
        };
    }, [isTracking, isFollowing]);

    const updateUserMarker = (lat, lng) => {
        if (!map.current) return;
        if (userMarker.current) {
            userMarker.current.setLngLat([lng, lat]);
        } else {
            const el = document.createElement('div');
            el.className = 'user-marker';
            userMarker.current = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map.current);
        }
        userMarker.current.getElement().style.setProperty('--heading', `${heading}deg`);
    };

    // Быстрый поиск с авто-подсказками
    const searchTimeoutRef = useRef(null);

    const handleSearch = async (e) => {
        e?.preventDefault();
        doSearch(searchQuery);
    };

    const doSearch = async (query) => {
        const q = query.trim();
        if (!q || q.length < 2) {
            setSearchResults([]);
            return;
        }
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&accept-language=${lang}`);
            const data = await res.json();
            setSearchResults(data);
        } catch { }
    };

    // Авто-поиск при наборе (debounce 300ms)
    useEffect(() => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => {
            if (showSearch && searchQuery.trim().length >= 2) {
                doSearch(searchQuery);
            }
        }, 300);
        return () => clearTimeout(searchTimeoutRef.current);
    }, [searchQuery, showSearch]);

    const selectResult = (r) => {
        const lng = parseFloat(r.lon);
        const lat = parseFloat(r.lat);

        map.current?.flyTo({ center: [lng, lat], zoom: 15, duration: 1500 });

        // Удалить старый маркер
        if (searchMarkerRef.current) {
            searchMarkerRef.current.remove();
        }

        // Создать новый маркер
        const el = document.createElement('div');
        el.className = 'search-marker';
        el.innerHTML = `
            <div class="search-pin"></div>
            <button class="search-marker-close">×</button>
        `;

        el.querySelector('.search-marker-close').addEventListener('click', (e) => {
            e.stopPropagation();
            searchMarkerRef.current?.remove();
            searchMarkerRef.current = null;
        });

        searchMarkerRef.current = new maplibregl.Marker({ element: el })
            .setLngLat([lng, lat])
            .addTo(map.current);

        setShowSearch(false);
        setSearchQuery('');
        setSearchResults([]);
    };

    const getWeatherIcon = (code) => {
        if (code <= 3) return '☀';
        if (code <= 48) return '☁';
        if (code <= 67) return '🌧';
        if (code <= 77) return '❄';
        return '⛈';
    };

    return (
        <div className={`app ${activeTheme}`}>
            <div ref={mapContainer} className="map" />

            {/* Top Bar */}
            <div className="top-bar">
                <button className="btn icon-btn" onClick={() => setShowSearch(true)}>
                    <svg viewBox="0 0 24 24"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>
                </button>

                {weather && (
                    <div className="weather-pill">
                        <span>{getWeatherIcon(weather.code)}</span>
                        <span>{weather.temp}°</span>
                    </div>
                )}

                <button className="btn icon-btn ml-auto" onClick={() => setShowSettings(true)}>
                    <svg viewBox="0 0 24 24"><path fill="currentColor" d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" /></svg>
                </button>
            </div>

            {/* Zoom */}
            <div className="zoom-controls">
                <button onClick={() => map.current?.zoomIn()}>+</button>
                <button onClick={() => map.current?.zoomOut()}>−</button>
            </div>

            {/* Locate */}
            <button
                className={`btn locate-btn ${isTracking ? 'active' : ''} ${isFollowing ? 'following' : ''}`}
                onClick={() => {
                    if (isTracking && !isFollowing) {
                        setIsFollowing(true);
                        if (userLocation) map.current?.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: 15 });
                    } else {
                        getLocation();
                    }
                }}
            >
                <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" /></svg>
            </button>

            {/* Location Error */}
            {locationError && (
                <div className="error-toast">{locationError}</div>
            )}

            {/* Search Modal */}
            {showSearch && (
                <div className="modal-overlay" onClick={() => setShowSearch(false)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <form onSubmit={handleSearch} className="search-form">
                            <svg className="search-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>
                            <input
                                placeholder={t.searchPlace}
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                autoFocus
                            />
                            <button type="button" className="close-btn" onClick={() => setShowSearch(false)}>
                                <svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
                            </button>
                        </form>
                        {searchResults.length > 0 ? (
                            <div className="search-results">
                                {searchResults.map((r, i) => (
                                    <button key={i} className="result-item" onClick={() => selectResult(r)}>
                                        <svg className="pin-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
                                        <span>{r.display_name}</span>
                                    </button>
                                ))}
                            </div>
                        ) : searchQuery.trim() && (
                            <div className="no-results">{t.noResults}</div>
                        )}
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {showSettings && (
                <div className="modal-overlay" onClick={() => setShowSettings(false)}>
                    <div className="modal-card settings-card" onClick={e => e.stopPropagation()}>
                        <div className="settings-header">
                            <h2>{t.settings}</h2>
                            <button className="close-btn" onClick={() => setShowSettings(false)}>
                                <svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
                            </button>
                        </div>

                        <div className="settings-section">
                            <label>{t.theme}</label>
                            <div className="toggle-group triple">
                                <button className={themeMode === 'light' ? 'active' : ''} onClick={() => setThemeMode('light')}>{t.light}</button>
                                <button className={themeMode === 'auto' ? 'active' : ''} onClick={() => setThemeMode('auto')}>{t.auto}</button>
                                <button className={themeMode === 'dark' ? 'active' : ''} onClick={() => setThemeMode('dark')}>{t.dark}</button>
                            </div>
                        </div>

                        <div className="settings-section">
                            <label>{t.language}</label>
                            <div className="lang-grid">
                                {Object.entries(LANG_NAMES).map(([code, name]) => (
                                    <button key={code} className={lang === code ? 'active' : ''} onClick={() => setLang(code)}>{name}</button>
                                ))}
                            </div>
                        </div>

                        <div className="settings-section">
                            <label>{t.download}</label>
                            <button
                                className={`download-btn ${isDownloading ? 'downloading' : ''} ${isDownloaded ? 'done' : ''}`}
                                onClick={downloadArea}
                                disabled={isDownloading}
                            >
                                {isDownloading ? (
                                    <>
                                        <span>{t.downloading}</span>
                                        <span className="progress-text">{downloadProgress}%</span>
                                    </>
                                ) : isDownloaded ? (
                                    <span>{t.downloaded}</span>
                                ) : (
                                    <span>{t.download}</span>
                                )}
                            </button>
                            {isDownloading && (
                                <div className="progress-bar">
                                    <div className="progress-fill" style={{ width: `${downloadProgress}%` }}></div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
