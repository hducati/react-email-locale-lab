import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { EmailLabApp } from './App';
import config from './email-lab.config';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode><EmailLabApp config={config} /></StrictMode>,
);
