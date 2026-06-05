import React, { useRef, useState, useEffect } from "react";
import { UploadCloud, Star, Trash2 } from "lucide-react";
import "./Products.css";

export default function ImageGalleryModal({ isOpen, onClose, title, images, onImagesChange }) {
  const fileInputRef = useRef(null);
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    const newPreviews = images.map(file => {
      if (typeof file === "string") return file;
      return URL.createObjectURL(file);
    });
    setPreviews(newPreviews);

    // Skip aggressive revokeObjectURL to avoid React StrictMode ERR_FILE_NOT_FOUND
    return () => {};
  }, [images]);

  if (!isOpen) return null;

  const handleFileDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith("image/"));
    if (files.length > 0) {
      onImagesChange([...images, ...files]);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files).filter(file => file.type.startsWith("image/"));
    if (files.length > 0) {
      onImagesChange([...images, ...files]);
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    onImagesChange(images.filter((_, index) => index !== indexToRemove));
  };

  const handleMakeMain = (indexToMain) => {
    if (indexToMain === 0) return;
    const newImages = [...images];
    const item = newImages.splice(indexToMain, 1)[0];
    newImages.unshift(item);
    onImagesChange(newImages);
  };

  return (
    <div className="modal-overlay gallery-overlay">
      <div className="modal gallery-modal">
        <h2>{title || "Galería de Imágenes"}</h2>
        
        <div 
          className="image-dropzone" 
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="image-dropzone-icon">
            <UploadCloud size={48} color="rgba(255,255,255,0.8)" />
          </div>
          <p className="image-dropzone-text">
            Arrastra tus imágenes aquí o haz clic para seleccionar
          </p>
          <p className="image-dropzone-subtext">
            Soporta JPG, PNG, WEBP.
          </p>
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: "none" }} 
            multiple 
            accept="image/*"
            onChange={handleFileSelect}
          />
        </div>

        {previews.length > 0 ? (
          <div className="gallery-grid">
            {previews.map((preview, idx) => (
              <div 
                key={idx} 
                className={`gallery-item ${idx === 0 ? "main-item" : ""}`}
              >
                <img src={preview} alt="Gallery item" />
                
                {idx === 0 && (
                  <div className="gallery-item-badge">
                    Principal
                  </div>
                )}

                <div className="gallery-item-overlay">
                  <button 
                    type="button" 
                    className="gallery-item-btn"
                    onClick={(e) => { e.stopPropagation(); handleMakeMain(idx); }}
                    title="Establecer como principal"
                  >
                    <Star size={18} color="white" fill={idx === 0 ? "white" : "transparent"} />
                  </button>
                  <button 
                    type="button" 
                    className="gallery-item-btn"
                    onClick={(e) => { e.stopPropagation(); handleRemoveImage(idx); }}
                    title="Eliminar imagen"
                  >
                    <Trash2 size={18} color="#ef4444" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="gallery-empty">
            No hay imágenes en esta galería.
          </div>
        )}

        <div className="form-actions" style={{ marginTop: "20px" }}>
          <button type="button" className="btn-primary" onClick={onClose} style={{ width: "100%" }}>
            Hecho
          </button>
        </div>
      </div>
    </div>
  );
}
