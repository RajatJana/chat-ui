import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ApprovalPage from './ApprovalPage.jsx'
import EpisodesPage from './EpisodesPage.jsx'

const path = window.location.pathname;
const isApproval = path.startsWith('/approval');
const isEpisodes = path.startsWith('/episodes');

let Component = App;
if (isApproval) Component = ApprovalPage;
if (isEpisodes) Component = EpisodesPage;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Component />
  </StrictMode>,
)
