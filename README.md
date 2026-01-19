# Loppa Map

🗺️ Офлайн навигатор с красивым дизайном

## Функции

- 📍 **GPS + IP геолокация** — находит тебя везде
- 🗺️ **Офлайн карты** — скачивай регионы
- 🌤️ **Погода** — показывает для текущего вида
- 🌙 **Тёмная/светлая тема** — авто-определение
- 🌐 **5 языков** — RU, EN, UK, DE, FR
- 🔍 **Быстрый поиск** — авто-подсказки
- 📍 **Маркер поиска** — красный пин с закрытием

## Технологии

- React + Vite
- MapLibre GL JS
- Capacitor (Android)
- PWA

## Источники данных

| Сервис | Описание | Лицензия |
|--------|----------|----------|
| [CARTO](https://carto.com) | Базовые карты | [CC BY 4.0](https://carto.com/attribution/) |
| [OpenStreetMap](https://openstreetmap.org) | Данные карт | [ODbL](https://www.openstreetmap.org/copyright) |
| [Open-Meteo](https://open-meteo.com) | Погода | [CC BY 4.0](https://open-meteo.com/en/terms) |
| [Nominatim](https://nominatim.org) | Геокодинг | [ODbL](https://nominatim.org/release-docs/latest/admin/Installation/#prerequisites) |

## Установка

```bash
npm install
npm run dev
```

## Сборка APK

```bash
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```

APK: `android/app/build/outputs/apk/debug/app-debug.apk`

## Лицензия

MIT
