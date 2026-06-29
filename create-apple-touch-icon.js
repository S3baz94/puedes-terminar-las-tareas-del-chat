import fs from 'node:fs';

const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
fs.writeFileSync('public/apple-touch-icon.png', Buffer.from(base64Data, 'base64'));
console.log('Successfully created public/apple-touch-icon.png');
