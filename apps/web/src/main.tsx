import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { WsProvider } from './contexts/WsContext.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WsProvider>
      <App />
    </WsProvider>
  </React.StrictMode>,
)
