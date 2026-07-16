const fs = require('fs');
const files = fs.readFileSync('all_api_routes.txt', 'utf8').split('\n').filter(Boolean);
const result = {};

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const methods = [];
  if (content.match(/export (?:async )?function GET/)) methods.push('GET');
  if (content.match(/export (?:async )?function POST/)) methods.push('POST');
  if (content.match(/export (?:async )?function PUT/)) methods.push('PUT');
  if (content.match(/export (?:async )?function PATCH/)) methods.push('PATCH');
  if (content.match(/export (?:async )?function DELETE/)) methods.push('DELETE');
  
  let endpoint = file.replace('src/app/api', '/api').replace('/route.ts', '').replace('/route.js', '');
  if (endpoint === '') endpoint = '/api';
  result[endpoint] = methods;
}

const sortedEndpoints = Object.keys(result).sort();
for (const endpoint of sortedEndpoints) {
  console.log(`- \`${endpoint}\` [${result[endpoint].join(', ')}]`);
}
