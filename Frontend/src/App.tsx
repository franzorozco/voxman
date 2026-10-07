import { useEffect } from "react";
import AppRouter from "./routes/AppRouter";
import { Toaster } from "react-hot-toast";
import fallbackFaviconBlack from './assets/global/favicon/favicon_for_black.png';
import fallbackFaviconWhite from './assets/global/favicon/favicon_for_white.png';

function App() {
  useEffect(() => {
    // Manejar favicon dinámico según el tema del SO (claro/oscuro) con fallbacks
    const updateFavicon = (isDark: boolean) => {
      const primaryUrl = isDark 
        ? "https://pub-17cc16459862449d8dcc55ee775a8a3f.r2.dev/system/favicons/679ee54e-7196-41ff-8eba-6841f8da5c36.png"
        : "https://pub-17cc16459862449d8dcc55ee775a8a3f.r2.dev/system/favicons/96b63310-310d-498f-b7d3-eb42e069b198.png";
      const fallbackUrl = isDark ? fallbackFaviconBlack : fallbackFaviconWhite;

      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }

      // Validamos si carga de R2, si falla usamos el fallback local
      const img = new Image();
      img.onload = () => { link.href = primaryUrl; };
      img.onerror = () => { link.href = fallbackUrl; };
      img.src = primaryUrl;
    };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    updateFavicon(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => updateFavicon(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const handleGlobalImageError = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target && target.tagName === 'IMG') {
        const img = target as HTMLImageElement;
        const theme = localStorage.getItem("dashboardTheme");
        const fallbackBlack = "/system/not-found/image_not_found_black.jfif";
        const fallbackWhite = "/system/not-found/image_not_found_white.jfif";
        const fallbackUrl = theme === "dark" ? fallbackBlack : fallbackWhite;
        
        // Prevent infinite loops if the fallback itself fails
        if (!img.src.includes("image_not_found")) {
          img.src = fallbackUrl;
        }
      }
    };

    // The 'true' is important! It uses the capture phase, which is required
    // to catch non-bubbling events like 'error' from img tags.
    window.addEventListener('error', handleGlobalImageError, true);
    
    return () => {
      window.removeEventListener('error', handleGlobalImageError, true);
    };
  }, []);

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} containerStyle={{ zIndex: 999999 }} />
      <AppRouter />
    </>
  );
}
  
export default App;