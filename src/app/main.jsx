import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

// Self-hosted variable Inter font — eliminates Google Fonts DNS + redirect chain (saves ~600ms on cold load)
import "@fontsource-variable/inter/wght.css"

import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
)

