require('@babel/register')({
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }]
  ]
});

// Mock browser globals
global.window = {
  location: { pathname: '/', search: '' },
  webkit: { messageHandlers: {} }
};
global.document = {
  createElement: () => ({})
};

const React = require('react');
const { create } = require('react-test-renderer');

try {
  const App = require('./src/App').default;
  const root = create(React.createElement(App));
  console.log('RENDER SUCCESS');
} catch (e) {
  console.error('RENDER ERROR:', e.message);
  console.error(e.stack);
}
