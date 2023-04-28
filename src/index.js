import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Replace this line
// ReactDOM.render(<App />, document.getElementById('root'));

// With this line
const rootElement = document.getElementById('root');
const root = createRoot(rootElement);
root.render(<App />);