// ═══════════════════════════════════════════════════════════════
// BUSTIME DATA — Города и маршруты
// ═══════════════════════════════════════════════════════════════

export const bustimeCities = {
    moscow: { name: "Москва", center: [55.7558, 37.6173], zoom: 12 },
    spb: { name: "Санкт-Петербург", center: [59.9343, 30.3351], zoom: 12 },
    kazan: { name: "Казань", center: [55.7887, 49.1221], zoom: 13 },
    nnov: { name: "Нижний Новгород", center: [56.2965, 43.9361], zoom: 13 },
    samara: { name: "Самара", center: [53.1959, 50.1002], zoom: 13 },
    ufa: { name: "Уфа", center: [54.7388, 55.9721], zoom: 13 },
    ekb: { name: "Екатеринбург", center: [56.8389, 60.6057], zoom: 13 },
    chelyabinsk: { name: "Челябинск", center: [55.1644, 61.4368], zoom: 13 },
    perm: { name: "Пермь", center: [58.0105, 56.2502], zoom: 13 },
    novosibirsk: { name: "Новосибирск", center: [55.0084, 82.9357], zoom: 13 },
    krasnoyarsk: { name: "Красноярск", center: [56.0153, 92.8932], zoom: 13 },
    omsk: { name: "Омск", center: [54.9885, 73.3242], zoom: 13 },
    rostov: { name: "Ростов-на-Дону", center: [47.2357, 39.7015], zoom: 13 },
    krasnodar: { name: "Краснодар", center: [45.0355, 38.9753], zoom: 13 },
    sochi: { name: "Сочи", center: [43.5855, 39.7231], zoom: 13 },
    voronezh: { name: "Воронеж", center: [51.6683, 39.1919], zoom: 13 },
};

export const cityList = Object.entries(bustimeCities).map(([id, data]) => ({
    id,
    ...data,
}));

export function parseBustimeCSV(csv) {
    return csv.trim().split('\n').map(line => {
        const [id, time, lng, lat, plate, route, speed, wheelchair] = line.split(',');
        return {
            id,
            number: route?.trim() || 'N/A',
            position: { lat: parseFloat(lat), lng: parseFloat(lng) },
            speed: parseFloat(speed) || 0,
            wheelchair: wheelchair === '1',
            color: getColor(route),
        };
    }).filter(b => b.position.lat && b.position.lng);
}

function getColor(route) {
    const colors = ['#0a84ff', '#30d158', '#ff9f0a', '#ff453a', '#bf5af2', '#64d2ff'];
    if (!route) return colors[0];
    let hash = 0;
    for (let i = 0; i < route.length; i++) hash = route.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
}

export function groupByRoute(buses) {
    const routes = {};
    buses.forEach(bus => {
        if (!routes[bus.number]) routes[bus.number] = { number: bus.number, color: bus.color, buses: [] };
        routes[bus.number].buses.push(bus);
    });
    return Object.values(routes);
}
