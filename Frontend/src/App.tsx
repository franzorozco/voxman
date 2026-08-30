import { useEffect } from "react";
import AppRouter from "./routes/AppRouter";
import { Toaster } from "react-hot-toast";

function App() {
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