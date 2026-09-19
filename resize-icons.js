const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

async function resizeIcon(inputPath, outputPath, size) {
  const image = await loadImage(inputPath);
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0, size, size);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Created ${outputPath} (${size}x${size})`);
}

async function main() {
  const input = path.join(__dirname, 'woddi-icon.png');
  await resizeIcon(input, path.join(__dirname, 'public', 'icon-192.png'), 192);
  await resizeIcon(input, path.join(__dirname, 'public', 'icon-512.png'), 512);
  console.log('Done!');
}

main();