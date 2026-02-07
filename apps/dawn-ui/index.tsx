// Final_Dawn_of_Eideus/apps/dawn-ui/index.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { KernelProvider } from './hooks/useKernel';
import { GameProvider } from './src/context/GameContext';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <KernelProvider>
        <GameProvider>
          <App />
        </GameProvider>
      </KernelProvider>
    </BrowserRouter>
  </React.StrictMode>
);
