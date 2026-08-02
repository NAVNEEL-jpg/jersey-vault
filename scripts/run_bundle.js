const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const dom = new JSDOM(`<!DOCTYPE html><div id="root"></div>`, {
  url: "http://localhost/",
  runScripts: "dangerously",
  resources: "usable"
});

const window = dom.window;
global.window = window;
global.document = window.document;
global.navigator = window.navigator;

const files = fs.readdirSync('client/build/static/js').filter(f => f.startsWith('main.') && f.endsWith('.js'));
const bundlePath = 'client/build/static/js/' + files[0];

const scriptEl = window.document.createElement('script');
scriptEl.textContent = fs.readFileSync(bundlePath, 'utf8');
window.document.body.appendChild(scriptEl);

setTimeout(() => {
  console.log("Root HTML:");
  console.log(window.document.getElementById('root').innerHTML.substring(0, 500));
}, 2000);
