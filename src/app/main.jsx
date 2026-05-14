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

// Remove the pre-React inline loader once React has completed its first paint.
// Double rAF: rAF-1 queues before paint, rAF-2 queues after — by which point
// React's own Suspense fallback (PageLoader) is already visible, so there is
// no flash between the HTML spinner and the React spinner.
{
  let r1, r2;
  r1 = requestAnimationFrame(() => {
    r2 = requestAnimationFrame(() => {
      const el = document.getElementById('initial-loader');
      if (!el) return;
      el.style.transition = 'opacity 0.15s';
      el.style.opacity = '0';
      el.addEventListener('transitionend', () => el.remove(), { once: true });
    });
  });
}

