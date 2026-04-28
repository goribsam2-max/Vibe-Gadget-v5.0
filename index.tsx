
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

// Override console methods to prevent any leaks to the console
console.warn = () => {};
console.error = () => {};
// Allow this specific log
console.log("%cWhole site made by “Vibe Gadget”", "color: #10b981; font-size: 16px; font-weight: bold;");

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
