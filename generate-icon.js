const { createCanvas } = require('canvas');
const fs = require('fs');

const size = 1024;
const canvas = createCanvas(size, size);
const ctx = canvas.getContext('2d');

// Background - rounded rect
ctx.fillStyle = '#0b0d18';
ctx.fillRect(0, 0, size, size);

// Corner accent - top right red
ctx.fillStyle = 'rgba(247,79,106,0.7)';
ctx.beginPath();
ctx.moveTo(650, 0);
ctx.lineTo(1024, 0);
ctx.lineTo(1024, 374);
ctx.closePath();
ctx.fill();

// Corner accent - bottom left blue
ctx.fillStyle = 'rgba(79,142,247,0.5)';
ctx.beginPath();
ctx.moveTo(0, 700);
ctx.lineTo(0, 1024);
ctx.lineTo(374, 1024);
ctx.closePath();
ctx.fill();

// Thin stripe above main band
ctx.fillStyle = 'rgba(245,200,66,0.22)';
ctx.beginPath();
ctx.moveTo(-50, 330);
ctx.lineTo(1100, 30);
ctx.lineTo(1100, 80);
ctx.lineTo(-50, 380);
ctx.closePath();
ctx.fill();

// Main diagonal gold band
ctx.fillStyle = '#f5c842';
ctx.beginPath();
ctx.moveTo(-50, 385);
ctx.lineTo(1100, 85);
ctx.lineTo(1100, 420);
ctx.lineTo(-50, 720);
ctx.closePath();
ctx.fill();

// Thin stripe below main band
ctx.fillStyle = 'rgba(245,200,66,0.22)';
ctx.beginPath();
ctx.moveTo(-50, 725);
ctx.lineTo(1100, 425);
ctx.lineTo(1100, 470);
ctx.lineTo(-50, 770);
ctx.closePath();
ctx.fill();

// Color dots
const dots = [
  { x: 120, y: 130, r: 22, c: '#3dd68c', o: 0.8 },
  { x: 900, y: 880, r: 28, c: '#f74f6a', o: 0.6 },
  { x: 940, y: 120, r: 16, c: '#4f8ef7', o: 0.5 },
  { x: 130, y: 900, r: 20, c: '#f5c842', o: 0.35 },
];
dots.forEach(d => {
  ctx.save();
  ctx.globalAlpha = d.o;
  ctx.fillStyle = d.c;
  ctx.beginPath();
  ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
});

// Text — using simple bold W shape instead of Arabic since canvas Arabic is unreliable
// Draw stylized "W" as a symbol
ctx.save();
ctx.translate(512, 430);
ctx.rotate(-10 * Math.PI / 180);

// Draw bold geometric W mark
ctx.fillStyle = '#0b0d18';
ctx.strokeStyle = '#0b0d18';
ctx.lineWidth = 60;
ctx.lineCap = 'round';
ctx.lineJoin = 'round';

// W shape
ctx.beginPath();
ctx.moveTo(-200, -120);
ctx.lineTo(-120, 120);
ctx.lineTo(0, -40);
ctx.lineTo(120, 120);
ctx.lineTo(200, -120);
ctx.stroke();

ctx.restore();

// Save
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('woddi-icon.png', buffer);
console.log('Icon saved!');