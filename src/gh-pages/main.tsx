import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from '../App.tsx';
import '../index.css';
import {installDemoLoginPrefill} from './prefill';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

installDemoLoginPrefill();
