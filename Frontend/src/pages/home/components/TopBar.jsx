import React from "react";
import { Link } from "react-router-dom";
import "./TopBar.css";

/**
 * TopBar — Cintillo de anuncio reutilizable.
 * @param {string} text       — Texto principal del anuncio.
 * @param {string} bgColor    — Color de fondo (hex o css var).
 * @param {string} textColor  — Color del texto.
 * @param {string} linkUrl    — URL a la que enlaza el botón/texto adicional (opcional).
 * @param {string} linkText   — Texto del enlace (opcional).
 */
export default function TopBar({ text, bgColor = "#000000", textColor = "#ffffff", linkUrl = "", linkText = "" }) {
  if (!text) return null;

  const isExternal = linkUrl.startsWith("http");

  return (
    <div
      className="topbar"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <div className="topbar__inner">
        <span className="topbar__text">{text}</span>

        {linkUrl && linkText && (
          isExternal ? (
            <a
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="topbar__link"
              style={{ color: textColor }}
            >
              {linkText}
            </a>
          ) : (
            <Link
              to={linkUrl}
              className="topbar__link"
              style={{ color: textColor }}
            >
              {linkText}
            </Link>
          )
        )}
      </div>
    </div>
  );
}
