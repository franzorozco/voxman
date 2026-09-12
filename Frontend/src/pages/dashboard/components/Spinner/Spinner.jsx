import React from 'react';
import './Spinner.css';

export default function Spinner({ size = 38, color = "#2563eb", trackColor = "#e5e7eb", borderWidth = 4, className = "", style = {} }) {
  return (
    <div
      className={`vox-spinner ${className}`}
      style={{
        width: size,
        height: size,
        border: `${borderWidth}px solid ${trackColor}`,
        borderTop: `${borderWidth}px solid ${color}`,
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
        ...style
      }}
    />
  );
}
