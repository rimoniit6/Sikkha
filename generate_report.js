const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;

const files = fs.readFileSync('all_api_routes.txt', 'utf8').split('\n').filter(Boolean);
const result = {};

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const methods = [];
  if (content.includes('export async function GET')) methods.push('GET');
  if (content.includes('export async function POST')) methods.push('POST');
  if (content.includes('export async function PUT')) methods.push('PUT');
  if (content.includes('export async function PATCH')) methods.push('PATCH');
  if (content.includes('export async function DELETE')) methods.push('DELETE');
  
  const endpoint = file.replace('src/app/api', '/api').replace('/route.ts', '').replace('/route.js', '') || '/api';
  result[endpoint] = methods;
}

const sortedEndpoints = Object.keys(result).sort();
for (const endpoint of sortedEndpoints) {
  console.log(`- \`${endpoint}\` [${result[endpoint].join(', ')}]`);
}
