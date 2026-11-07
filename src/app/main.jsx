import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

// Self-hosted variable Inter font — eliminates Google Fonts DNS + redirect chain (saves ~600ms on cold load)
import "@fontsource-variable/inter/wght.css"

import App from './App.jsx'
import { installBulgarianValidation } from '@/lib/bgValidation'

installBulgarianValidation()

// Auto-recover от stale chunk references след deploy.
// Когато Netlify пуска нов build, старите chunk hashes изчезват от сървъра.
// User-и с cached index.html продължават да ги искат → 404 → React ErrorBoundary.
// Vite emit-ва "vite:preloadError" → reload-ваме за да вземе свежи hashes.
// `sessionStorage` guard предотвратява infinite reload loop ако грешката е реална.
window.addEventListener("vite:preloadError", (event) => {
    if (sessionStorage.getItem("__chunk_reload_attempted")) {
        // Вече сме опитали reload — оставяме ErrorBoundary да го хване
        return;
    }
    sessionStorage.setItem("__chunk_reload_attempted", "1");
    event.preventDefault();
    window.location.reload();
});

// Изчисти guard-а след успешен mount.
window.addEventListener("load", () => {
    setTimeout(() => sessionStorage.removeItem("__chunk_reload_attempted"), 2000);
});

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

