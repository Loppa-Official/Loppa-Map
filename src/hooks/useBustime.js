import { useState, useEffect, useCallback, useRef } from 'react';
import { bustimeCities, groupByRoute } from '../data/bustime';

export function useBustime(cityId = 'moscow') {
    const [buses, setBuses] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(null);

    const intervalRef = useRef(null);
    const animationRef = useRef(null);
    const prevPosRef = useRef({});
    const targetPosRef = useRef({});
    const lastFetchRef = useRef(Date.now());

    const city = bustimeCities[cityId];

    // Smooth interpolation
    const animate = useCallback(() => {
        const progress = Math.min((Date.now() - lastFetchRef.current) / 10000, 1);
        const smooth = progress * progress * (3 - 2 * progress);

        setBuses(prev => prev.map(bus => {
            const from = prevPosRef.current[bus.id];
            const to = targetPosRef.current[bus.id];
            if (!from || !to) return bus;
            return {
                ...bus,
                position: {
                    lat: from.lat + (to.lat - from.lat) * smooth,
                    lng: from.lng + (to.lng - from.lng) * smooth,
                },
            };
        }));

        animationRef.current = requestAnimationFrame(animate);
    }, []);

    useEffect(() => {
        animationRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationRef.current);
    }, [animate]);

    const fetchBuses = useCallback(() => {
        if (!city) return;

        const [lat, lng] = city.center;
        const routeData = [
            {
                num: '1', name: 'Центр — Вокзал', color: '#0a84ff', speed: 0.00008, path: [
                    { lat: lat - 0.02, lng: lng - 0.03 }, { lat: lat - 0.01, lng: lng - 0.015 },
                    { lat, lng }, { lat: lat + 0.01, lng: lng + 0.015 }, { lat: lat + 0.02, lng: lng + 0.03 }
                ]
            },
            {
                num: '5', name: 'Север — Юг', color: '#30d158', speed: 0.00007, path: [
                    { lat: lat + 0.025, lng }, { lat: lat + 0.012, lng: lng + 0.008 },
                    { lat, lng }, { lat: lat - 0.012, lng: lng - 0.008 }, { lat: lat - 0.025, lng }
                ]
            },
            {
                num: '10', name: 'Кольцевой', color: '#ff9f0a', speed: 0.00006, path: [
                    { lat: lat + 0.015, lng }, { lat: lat + 0.01, lng: lng + 0.02 },
                    { lat, lng: lng + 0.025 }, { lat: lat - 0.01, lng: lng + 0.02 },
                    { lat: lat - 0.015, lng }, { lat: lat - 0.01, lng: lng - 0.02 },
                    { lat, lng: lng - 0.025 }, { lat: lat + 0.01, lng: lng - 0.02 }, { lat: lat + 0.015, lng }
                ]
            },
            {
                num: '22', name: 'Аэропорт — Центр', color: '#ff453a', speed: 0.00009, path: [
                    { lat: lat + 0.04, lng: lng + 0.05 }, { lat: lat + 0.02, lng: lng + 0.025 },
                    { lat: lat + 0.01, lng: lng + 0.01 }, { lat, lng }
                ]
            },
            {
                num: '33', name: 'Восток — Запад', color: '#bf5af2', speed: 0.00007, path: [
                    { lat, lng: lng - 0.04 }, { lat: lat + 0.005, lng: lng - 0.02 },
                    { lat, lng }, { lat: lat - 0.005, lng: lng + 0.02 }, { lat, lng: lng + 0.04 }
                ]
            },
        ];

        const time = Date.now() / 1000;
        const newBuses = [];

        routeData.forEach((route, ri) => {
            const busCount = 2 + (ri % 2);
            for (let i = 0; i < busCount; i++) {
                const t = ((time * route.speed + i / busCount) % 1);
                const segCount = route.path.length - 1;
                const seg = Math.min(Math.floor(t * segCount), segCount - 1);
                const segT = t * segCount - seg;
                const from = route.path[seg];
                const to = route.path[seg + 1];

                const pos = {
                    lat: from.lat + (to.lat - from.lat) * segT,
                    lng: from.lng + (to.lng - from.lng) * segT,
                };

                const id = `${route.num}-${i}`;
                newBuses.push({
                    id,
                    number: route.num,
                    routeName: route.name,
                    position: pos,
                    speed: Math.round(20 + Math.random() * 25),
                    color: route.color,
                    path: route.path,
                });
            }
        });

        newBuses.forEach(bus => {
            prevPosRef.current[bus.id] = targetPosRef.current[bus.id] || bus.position;
            targetPosRef.current[bus.id] = bus.position;
        });

        lastFetchRef.current = Date.now();
        setBuses(newBuses);
        setRoutes(groupByRoute(newBuses));
        setLoading(false);
        setLastUpdate(new Date());
    }, [city]);

    useEffect(() => {
        fetchBuses();
        intervalRef.current = setInterval(fetchBuses, 10000);
        return () => clearInterval(intervalRef.current);
    }, [fetchBuses]);

    useEffect(() => {
        setLoading(true);
        prevPosRef.current = {};
        targetPosRef.current = {};
        fetchBuses();
    }, [cityId, fetchBuses]);

    return { buses, routes, loading, lastUpdate, refresh: fetchBuses };
}

export default useBustime;
