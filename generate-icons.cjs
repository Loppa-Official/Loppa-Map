// Конвертер SVG в PNG для иконок Android
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [
    { name: 'mdpi', size: 48 },
    { name: 'hdpi', size: 72 },
    { name: 'xhdpi', size: 96 },
    { name: 'xxhdpi', size: 144 },
    { name: 'xxxhdpi', size: 192 },
];

const svgPath = path.join(__dirname, 'public', 'logo.svg');
const svgBuffer = fs.readFileSync(svgPath);

async function convert() {
    // Основная иконка 512x512
    await sharp(svgBuffer)
        .resize(512, 512)
        .png()
        .toFile(path.join(__dirname, 'public', 'logo-512.png'));

    console.log('✓ Created logo-512.png');

    // Android иконки
    for (const { name, size } of sizes) {
        const dir = path.join(__dirname, 'android', 'app', 'src', 'main', 'res', `mipmap-${name}`);

        await sharp(svgBuffer)
            .resize(size, size)
            .png()
            .toFile(path.join(dir, 'ic_launcher.png'));

        await sharp(svgBuffer)
            .resize(Math.round(size * 1.5), Math.round(size * 1.5))
            .png()
            .toFile(path.join(dir, 'ic_launcher_foreground.png'));

        console.log(`✓ Created ${name} icons (${size}px)`);
    }

    console.log('\n✅ All icons generated!');
}

convert().catch(console.error);
