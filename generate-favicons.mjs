import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// This script generates PNG favicons from the SVG for Safari compatibility
// Run with: node generate-favicons.mjs

const svgContent = readFileSync('./public/rocket.svg', 'utf8');

// Create a simple HTML page to render SVG and convert to canvas
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        canvas { display: none; }
    </style>
</head>
<body>
    <div id="svg-container">${svgContent}</div>
    <canvas id="canvas16" width="16" height="16"></canvas>
    <canvas id="canvas32" width="32" height="32"></canvas>
    <canvas id="canvas180" width="180" height="180"></canvas>
    
    <script>
        function generateFavicon(size, canvasId) {
            const canvas = document.getElementById(canvasId);
            const ctx = canvas.getContext('2d');
            const svg = document.querySelector('svg');
            
            // Create a blob from SVG
            const svgData = new XMLSerializer().serializeToString(svg);
            const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
            const url = URL.createObjectURL(svgBlob);
            
            const img = new Image();
            img.onload = function() {
                ctx.clearRect(0, 0, size, size);
                ctx.drawImage(img, 0, 0, size, size);
                
                // Convert to PNG and download
                canvas.toBlob(function(blob) {
                    const link = document.createElement('a');
                    link.download = size === 16 ? 'favicon-16x16.png' : 
                                  size === 32 ? 'favicon-32x32.png' : 'apple-touch-icon.png';
                    link.href = URL.createObjectURL(blob);
                    link.click();
                }, 'image/png');
                
                URL.revokeObjectURL(url);
            };
            img.src = url;
        }
        
        // Wait for SVG to load then generate favicons
        setTimeout(() => {
            generateFavicon(16, 'canvas16');
            setTimeout(() => generateFavicon(32, 'canvas32'), 100);
            setTimeout(() => generateFavicon(180, 'canvas180'), 200);
        }, 100);
    </script>
</body>
</html>
`;

writeFileSync('./favicon-generator.html', htmlContent);
console.log('Favicon generator created. Open favicon-generator.html in a browser to generate PNG favicons.');
console.log('After generating the PNG files, move them to the public/ directory.');
