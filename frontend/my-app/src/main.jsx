import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Auth0Provider } from '@auth0/auth0-react';
import { ThemeProvider } from "./context/ThemeContext";

createRoot(document.getElementById('root')).render(
  <Auth0Provider
      domain="dev-2543cqv5siqcffcy.us.auth0.com"
      clientId="nlKbZqOSheDjlEmTtMq0jgzeZ2eD45Ws"
      authorizationParams={{
        redirect_uri: window.location.origin
      }}
    >
    <ThemeProvider>
      <App />
    </ThemeProvider>
   </Auth0Provider>
)
