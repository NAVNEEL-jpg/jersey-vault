const fs = require('fs');

let appContent = fs.readFileSync('client/src/App.js', 'utf8');

// Replace synchronous imports with React.lazy
appContent = appContent.replace(/import ([A-Za-z0-9_]+) from "\.\/pages\/guides\/([^"]+)";/g, 'const $1 = lazy(() => import("./pages/guides/$2"));');

fs.writeFileSync('client/src/App.js', appContent);
console.log('Successfully lazy loaded all guides!');
