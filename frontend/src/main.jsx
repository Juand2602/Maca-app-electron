import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom' // ← Cambiado de BrowserRouter
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './styles/globals.css'

console.log('✅ main.jsx loaded')
console.log('🔍 Environment:', {
  isElectron: !!window.electronAPI,
  protocol: window.location.protocol,
  href: window.location.href
})

const rootElement = document.getElementById('root')
if (!rootElement) {
  console.error('❌ ERROR: No se encontró el elemento #root')
  throw new Error('Root element not found')
} else {
  console.log('✅ Root element found')
}

try {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <HashRouter>
        <App />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#22c55e',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </HashRouter>
    </React.StrictMode>,
  )
  console.log('✅ React app rendered successfully')
} catch (error) {
  console.error('❌ Error rendering React app:', error)
  document.getElementById('root').innerHTML = `
    <div style="padding: 20px; color: red; font-family: monospace;">
      <h1>Error al iniciar la aplicación</h1>
      <pre>${error.message}</pre>
      <pre>${error.stack}</pre>
    </div>
  `
}