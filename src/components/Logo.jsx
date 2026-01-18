// Loppo Map Logo — Светлый минималистичный
export default function Logo({ size = 512, className = '' }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 512 512"
            className={className}
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Фон — светлый градиент */}
            <defs>
                <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#007AFF" />
                    <stop offset="100%" stopColor="#5856D6" />
                </linearGradient>
                <linearGradient id="pin-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="100%" stopColor="#F0F0F0" />
                </linearGradient>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="8" stdDeviation="16" floodOpacity="0.25" />
                </filter>
            </defs>

            {/* Фон */}
            <rect width="512" height="512" rx="115" fill="url(#bg-gradient)" />

            {/* Пин локации */}
            <g filter="url(#shadow)">
                {/* Основа пина */}
                <path
                    d="M256 96c-66.3 0-120 53.7-120 120 0 90 120 200 120 200s120-110 120-200c0-66.3-53.7-120-120-120z"
                    fill="url(#pin-gradient)"
                />
                {/* Внутренний круг */}
                <circle cx="256" cy="216" r="48" fill="url(#bg-gradient)" />
            </g>
        </svg>
    );
}
