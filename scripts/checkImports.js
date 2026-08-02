const fs = require('fs');
const path = require('path');
const app = fs.readFileSync('client/src/App.js', 'utf8');

const imports = [];
let match;
const regex = /import ([a-zA-Z0-9_]+) from ".\/(.*?)"/g;
while ((match = regex.exec(app)) !== null) {
  imports.push({ name: match[1], path: match[2] });
}

imports.forEach(i => {
  const p = path.join('client', 'src', i.path + (i.path.endsWith('.jsx') || i.path.endsWith('.js') ? '' : '.jsx'));
  if (fs.existsSync(p)) {
    const c = fs.readFileSync(p, 'utf8');
    const hasDefault = c.includes('export default function ' + i.name) || 
                       c.includes('export default ' + i.name) || 
                       c.includes('export default class ' + i.name) || 
                       c.includes('export default function(') || 
                       c.includes('export default (');
    if (!hasDefault) {
      console.log('WARNING:', i.name, 'in', p, 'might not have default export.');
    }
  } else {
    // maybe .js
    const p2 = path.join('client', 'src', i.path + '.js');
    if (!fs.existsSync(p2)) {
      console.log('MISSING FILE:', p);
    }
  }
});
console.log('Done scanning imports.');
