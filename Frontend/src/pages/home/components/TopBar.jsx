import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import * as Icons from "lucide-react";
import "./TopBar.css";

// â”€â”€â”€ Security helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Permite solo URLs absolutas (http/https) o rutas relativas internas (/ruta).
 * Bloquea: javascript:, data:, vbscript:, //evil.com (protocol-relative).
 */
const SAFE_URL_RE = /^(https?:\/\/|\/(?!\/))/i;
const sanitizeUrl = (url) => {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  return SAFE_URL_RE.test(trimmed) ? trimmed : "";
};

/** Acepta solo hex, rgb(), rgba(), hsl(), hsla(). Rechaza cualquier otra cosa. */
const CSS_COLOR_RE =
  /^(#[0-9a-fA-F]{3,8}|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)|rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(0|1|0?\.\d+)\s*\)|hsl\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*\)|hsla\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*,\s*(0|1|0?\.\d+)\s*\))$/i;
const sanitizeCssColor = (val, fallback) =>
  typeof val === "string" && CSS_COLOR_RE.test(val.trim()) ? val.trim() : fallback;

/** Acepta valores de tamaÃ±o: nÃºmero + unidad vÃ¡lida. */
const CSS_SIZE_RE = /^\d+(\.\d+)?(px|em|rem|%|vh|vw)$/i;
const sanitizeCssSize = (val, fallback) =>
  typeof val === "string" && CSS_SIZE_RE.test(val.trim()) ? val.trim() : fallback;

/** Acepta font-weight numÃ©rico (100â€“900) o palabras clave CSS. */
const CSS_FONT_WEIGHT_RE = /^(normal|bold|lighter|bolder|[1-9]00)$/i;
const sanitizeFontWeight = (val, fallback) =>
  typeof val === "string" && CSS_FONT_WEIGHT_RE.test(val.trim()) ? val.trim() : fallback;

/**
 * Acepta padding de 1 a 4 valores numÃ©ricos con unidad.
 * Ej: "12px 20px", "8px", "4px 8px 4px 8px".
 */
const CSS_PADDING_RE = /^(\d+(\.\d+)?(px|em|rem|%) ?)( ?\d+(\.\d+)?(px|em|rem|%) ?){0,3}$/i;
const sanitizePadding = (val, fallback) =>
  typeof val === "string" && CSS_PADDING_RE.test(val.trim()) ? val.trim() : fallback;

/** Clampea iconSize a un rango razonable [8, 64]. */
const sanitizeIconSize = (val) => {
  const n = Number(val);
  return Number.isFinite(n) ? Math.min(64, Math.max(8, n)) : 16;
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * TopBar â€” Cintillo de anuncio reutilizable.
 */
export default function TopBar({ 
  id,
  text, 
  bgColor = "#000000", 
  textColor = "#ffffff", 
  linkUrl = "", 
  linkText = "",
  icon = "",
  iconRight = "",
  useGradient = false,
  effect = "none",
  textSize = "13px",
  iconSize = 16,
  fontWeight = "500",
  padding = "12px 20px",
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

  // â”€â”€ Sanitize all props that come from the backend â”€â”€
  const safeUrl        = sanitizeUrl(linkUrl);
  const safeBgColor    = sanitizeCssColor(bgColor, "#000000");
  const safeTextColor  = sanitizeCssColor(textColor, "#ffffff");
  const safeTextSize   = sanitizeCssSize(textSize, "13px");
  const safeFontWeight = sanitizeFontWeight(fontWeight, "500");
  const safePadding    = sanitizePadding(padding, "12px 20px");
  const safeIconSize   = sanitizeIconSize(iconSize);

  const isExternal = safeUrl.startsWith("http");
  const IconCmp      = icon      && Icons[icon]      ? Icons[icon]      : null;
  const IconRightCmp = iconRight && Icons[iconRight] ? Icons[iconRight] : null;

  let bgStyle = { backgroundColor: safeBgColor, color: safeTextColor, padding: safePadding };
  if (useGradient) {
    bgStyle = {
      ...bgStyle,
      background: `linear-gradient(90deg, ${safeBgColor} 0%, rgba(255,255,255,0.15) 50%, ${safeBgColor} 100%)`,
    };
  }

  return (
    <div className={`topbar topbar--effect-${effect}`} style={bgStyle}>
      <div className="topbar__inner">
        {IconCmp && <IconCmp size={safeIconSize} className="topbar__icon" />}
        <span className="topbar__text" style={{ fontSize: safeTextSize, fontWeight: safeFontWeight }}>{text}</span>

        {safeUrl && linkText && (
          isExternal ? (
            <a href={safeUrl} target="_blank" rel="noopener noreferrer" className="topbar__link" style={{ color: safeTextColor }}>
              {linkText}
            </a>
          ) : (
            <Link to={safeUrl} className="topbar__link" style={{ color: safeTextColor }}>
              {linkText}
            </Link>
          )
        )}

        {IconRightCmp && <IconRightCmp size={safeIconSize} className="topbar__icon" style={{ marginLeft: 4, marginRight: 0 }} />}
      </div>

      {isCloseable && (
        <button onClick={handleClose} className="topbar__close" style={{ color: safeTextColor }} title="Cerrar anuncio">
          <Icons.X size={16} />
        </button>
      )}
    </div>
  );
}
