import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ApprovalPage from './ApprovalPage.jsx'

const path = window.location.pathname;
const isApproval = path.startsWith('/approval');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isApproval ? <ApprovalPage /> : <App />}
  </StrictMode>,
)
