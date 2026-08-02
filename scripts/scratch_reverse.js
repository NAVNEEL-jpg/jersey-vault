const fs = require('fs');
let code = fs.readFileSync('client/src/utils/collection-mapping.js', 'utf8');
code += `

export const REVERSE_TEAM_MAPPING = {};
Object.entries(COLLECTION_MAPPING).forEach(([slug, data]) => {
  if (data.type === 'team') REVERSE_TEAM_MAPPING[data.matchName.toUpperCase()] = slug;
});
`;
fs.writeFileSync('client/src/utils/collection-mapping.js', code);
console.log('Reverse mapping added.');
