import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App onLandingComplete={(success) => {
      if (success) {
        const params = new URLSearchParams(window.location.search);
        // Default to G1-S1-O1 if not specified, but usually passed by Flight One
        const target = params.get('target') || params.get('address') || "G1-S1-O1";

        console.log("Landing Successful! Redirecting to Surface:", target);

        // Hard redirect to Dawn UI on Port 5173 (standard Vite port)
        // In a real build, this might need dynamic config, but for dev this bridges the apps.
        window.location.href = `http://localhost:5173/?land_at=${target}`;
      }
    }} />
  </React.StrictMode>
);