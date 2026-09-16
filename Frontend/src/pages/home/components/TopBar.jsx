import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import * as Icons from "lucide-react";
import "./TopBar.css";

/**
 * TopBar — Cintillo de anuncio reutilizable.
 */
export default function TopBar({ 
  id,
  text, 
  bgColor = "#000000", 
  textColor = "#ffffff", 
  linkUrl = "", 
  linkText = "",
  icon = "",
  useGradient = false,
  effect = "none",
  textSize = "13px",
  iconSize = 16,
  fontWeight = "500",
  padding = "10px 20px",
  isCloseable = false
}) {
  const [isClosed, setIsClosed] = useState(false);

  useEffect(() => {
    if (id && sessionStorage.getItem(`topbar_closed_${id}`)) {
      setIsClosed(true);
    }
  }, [id]);

  if (!text || isClosed) return null;

  const handleClose = () => {
    setIsClosed(true);
    if (id) {
      sessionStorage.setItem(`topbar_closed_${id}`, "true");
    }
  };

  const isExternal = linkUrl.startsWith("http");
  const IconCmp = icon && Icons[icon] ? Icons[icon] : null;

  let bgStyle = { backgroundColor: bgColor, color: textColor, padding: padding };
  if (useGradient) {
    // Un degradado que usa el color de fondo como base
    bgStyle = {
      ...bgStyle,
      background: `linear-gradient(90deg, ${bgColor} 0%, rgba(255,255,255,0.15) 50%, ${bgColor} 100%)`,
    };
  }

  return (
    <div className={`topbar topbar--effect-${effect}`} style={bgStyle}>
      <div className="topbar__inner">
        {IconCmp && <IconCmp size={Number(iconSize) || 16} className="topbar__icon" />}
        <span className="topbar__text" style={{ fontSize: textSize, fontWeight: fontWeight }}>{text}</span>

        {linkUrl && linkText && (
          isExternal ? (
            <a href={linkUrl} target="_blank" rel="noopener noreferrer" className="topbar__link" style={{ color: textColor }}>
              {linkText}
            </a>
          ) : (
            <Link to={linkUrl} className="topbar__link" style={{ color: textColor }}>
              {linkText}
            </Link>
          )
        )}
      </div>
      
      {isCloseable && (
        <button onClick={handleClose} className="topbar__close" style={{ color: textColor }} title="Cerrar anuncio">
          <Icons.X size={16} />
        </button>
      )}
    </div>
  );
}
