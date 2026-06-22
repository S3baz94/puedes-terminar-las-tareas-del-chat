import fs from 'fs';
import * as mockData from './src/constants/mockData.ts';

const outPath = './server/mockData.js';

let content = '// Generated file. Do not edit.\n';
for (const [key, value] of Object.entries(mockData)) {
  if (key === 'default') continue;
  content += `export const ${key} = ${JSON.stringify(value, null, 2)};\n\n`;
}

fs.writeFileSync(outPath, content);
console.log('Generated server/mockData.js successfully!');
