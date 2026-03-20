import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  console.error(
    '[Chota Packet] Root element #root not found in the document. ' +
    'Ensure your index.html contains <div id="root"></div>.'
  )
  throw new Error('Root element #root is missing from the DOM.')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
