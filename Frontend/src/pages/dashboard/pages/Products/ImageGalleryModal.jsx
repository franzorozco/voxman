import React, { useRef, useState, useEffect, useMemo } from "react";
import { UploadCloud, Star, Trash2 } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import "./Products.css";

// Componente individual para cada imagen arrastrable
function SortableGalleryItem({ id, item, idx, onMakeMain, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`gallery-item ${idx === 0 ? "main-item" : ""}`}
    >
      <img src={item.preview} alt="Gallery item" />

      {idx === 0 && (
        <div className="gallery-item-badge">
          Principal
        </div>
      )}

      <div className="gallery-item-overlay">
        <button
          type="button"
          className="gallery-item-btn"
          onPointerDown={(e) => { e.stopPropagation(); onMakeMain(idx); }}
          title="Establecer como principal"
        >
          <Star size={18} color="white" fill={idx === 0 ? "white" : "transparent"} />
        </button>
        <button
          type="button"
          className="gallery-item-btn"
          onPointerDown={(e) => { e.stopPropagation(); onRemove(idx); }}
          title="Eliminar imagen"
        >
          <Trash2 size={18} color="#ef4444" />
        </button>
      </div>
    </div>
  );
}

export default function ImageGalleryModal({ isOpen, onClose, title, images, onImagesChange }) {
  const fileInputRef = useRef(null);

  // Mapeamos las imágenes de entrada a objetos internos con ID único para dnd-kit
  const internalItems = useMemo(() => {
    return images.map((file, idx) => {
      // Create a unique ID that survives re-renders
      const id = typeof file === "string" ? file : file.name + '-' + file.size + '-' + idx;
      const preview = typeof file === "string" ? file : URL.createObjectURL(file);
      return { id, file, preview };
    });
  }, [images]);

  // Sensores: Pointer (mouse) y Touch (android/ios)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Requires moving 5px before starting to drag to allow clicks
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // Requires holding for 200ms before dragging on touch devices
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  // Evento al finalizar el arrastre (Drag End)
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = internalItems.findIndex(i => i.id === active.id);
      const newIndex = internalItems.findIndex(i => i.id === over.id);
      
      const newInternalItems = arrayMove(internalItems, oldIndex, newIndex);
      onImagesChange(newInternalItems.map(item => item.file));
    }
  };

  return (
    <div className="modal-overlay gallery-overlay">
      <div className="modal gallery-modal" style={{ touchAction: 'none' }}>
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
            Soporta JPG, PNG, WEBP. Mantén presionado y arrastra para reordenar (soportado en móviles).
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

        {internalItems.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={internalItems.map(i => i.id)}
              strategy={rectSortingStrategy}
            >
              <div className="gallery-grid">
                {internalItems.map((item, idx) => (
                  <SortableGalleryItem
                    key={item.id}
                    id={item.id}
                    item={item}
                    idx={idx}
                    onMakeMain={handleMakeMain}
                    onRemove={handleRemoveImage}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
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
