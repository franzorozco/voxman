import React, { useState, useRef, useEffect } from "react";
import { X, Plus, Trash2, GripHorizontal } from "lucide-react";
import "./LabelEditorModal.css";
import { getProductTypes } from "../../../../../api/admin/productTypes";
import CustomSelect from "../../../../../components/ui/CustomSelect";

const DraggableLabel = ({ label, index, containerRef, updatePosition }) => {
  const [isDragging, setIsDragging] = useState(false);
  const labelRef = useRef(null);

  const handleMouseDown = (e) => {
    // Only drag with left click
    if (e.button !== 0) return;
    setIsDragging(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      
      let newLeft = ((e.clientX - rect.left) / rect.width) * 100;
      let newTop = ((e.clientY - rect.top) / rect.height) * 100;
      
      // Clamp between 0 and 100
      newLeft = Math.max(0, Math.min(100, newLeft));
      newTop = Math.max(0, Math.min(100, newTop));
      
      updatePosition(index, newTop, newLeft);
    };

    const handleMouseUp = () => {
      if (isDragging) setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, containerRef, index, updatePosition]);

  return (
    <span
      ref={labelRef}
      onMouseDown={handleMouseDown}
      className={`medida-label ${label.className || ''}`}
      style={{
        position: 'absolute',
        top: `${label.top !== undefined ? label.top : 50}%`,
        left: `${label.left !== undefined ? label.left : 50}%`,
        transform: 'translate(-50%, -50%)',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        zIndex: 10,
        boxShadow: isDragging ? '0 0 0 2px var(--color-primary)' : 'none',
        transition: isDragging ? 'none' : 'box-shadow 0.2s ease',
      }}
      dangerouslySetInnerHTML={{ __html: label.text.replace(/\n/g, '<br/>') }}
    />
  );
};

export default function LabelEditorModal({ garment, onClose, onSave }) {
  const [labels, setLabels] = useState(garment.labels ? JSON.parse(JSON.stringify(garment.labels)) : []);
  const [productTypes, setProductTypes] = useState([]);
  const [selectedPt, setSelectedPt] = useState(garment.product_type_id || "");
  const containerRef = useRef(null);

  // Default image if empty
  const imageUrl = garment.image || "/assets/img/guia-tallas/top.jpg";

  useEffect(() => {
    getProductTypes()
      .then(res => {
        setProductTypes(res.data?.data || res.data || []);
      })
      .catch(console.error);
  }, []);

  const selectedProductType = productTypes.find(p => p.id == selectedPt);
  const availableMeasurements = selectedProductType?.measurement_types || [];

  const handleProductTypeChange = (e) => {
    const ptId = e.target.value;
    setSelectedPt(ptId);
    
    if (!ptId) return;
    
    const pt = productTypes.find(p => p.id == ptId);
    if (!pt || !pt.measurement_types) return;

    // Auto-sync labels with measurement types
    const newLabels = pt.measurement_types.map(mt => {
      const existing = labels.find(l => l.measurement_id == mt.id || l.text.toLowerCase() === mt.name.toLowerCase());
      if (existing) {
        return { ...existing, text: mt.name, measurement_id: mt.id };
      }
      return { text: mt.name, measurement_id: mt.id, top: 50, left: 50, className: "" };
    });
    
    setLabels(newLabels);
  };

  const handleUpdatePosition = (index, top, left) => {
    const next = [...labels];
    next[index].top = Number(top.toFixed(1));
    next[index].left = Number(left.toFixed(1));
    setLabels(next);
  };

  const handleTextChange = (index, newText) => {
    const next = [...labels];
    next[index].text = newText;
    setLabels(next);
  };

  const handleAddLabel = () => {
    setLabels([...labels, { text: "Nueva Medida", top: 50, left: 50, className: "" }]);
  };

  const handleRemoveLabel = (index) => {
    setLabels(labels.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave(labels, selectedPt);
  };

  return (
    <div className="lem-overlay">
      <div className="lem-modal">
        <div className="lem-header">
          <h2>Configurar Etiquetas: {garment.title}</h2>
          <button onClick={onClose} className="lem-close"><X size={20} /></button>
        </div>
        
        <div className="lem-body">
          <div className="lem-sidebar">
            <div className="lem-sidebar-header" style={{ flexDirection: "column", alignItems: "flex-start", gap: 10 }}>
              <div style={{ width: "100%" }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4, display: "block" }}>
                  Heredar de Tipo de Producto
                </label>
                <CustomSelect 
                  value={selectedPt} 
                  onChange={handleProductTypeChange}
                >
                  <option value="">-- Seleccionar Tipo --</option>
                  {productTypes.map(pt => (
                    <option key={pt.id} value={pt.id}>{pt.name}</option>
                  ))}
                </CustomSelect>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center", marginTop: 10 }}>
                <h3>Lista de Etiquetas</h3>
                <button onClick={handleAddLabel} className="lem-add-btn">
                  <Plus size={14} /> Agregar
                </button>
              </div>
            </div>
            
            <div className="lem-labels-list">
              {labels.map((label, idx) => (
                <div key={idx} className="lem-label-item">
                  <div className="lem-label-drag-handle">
                    <GripHorizontal size={14} />
                  </div>
                  <div className="lem-label-inputs">
                    {availableMeasurements.length > 0 && (
                      <div style={{ marginBottom: 4 }}>
                        <CustomSelect
                          value={label.measurement_id || ""}
                          onChange={(e) => {
                            const mId = e.target.value;
                            const mt = availableMeasurements.find(m => m.id == mId);
                            const next = [...labels];
                            if (mt) {
                              next[idx].text = mt.name;
                              next[idx].measurement_id = mt.id;
                            } else {
                              next[idx].measurement_id = "";
                            }
                            setLabels(next);
                          }}
                        >
                          <option value="">-- Personalizado --</option>
                          {availableMeasurements.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </CustomSelect>
                      </div>
                    )}
                    {(!label.measurement_id || availableMeasurements.length === 0) && (
                      <input 
                        type="text" 
                        value={label.text} 
                        onChange={(e) => handleTextChange(idx, e.target.value)}
                        placeholder="Nombre de la medida"
                        style={{ width: "100%", padding: "8px 14px", borderRadius: "8px", border: "1px solid var(--border-color)", fontSize: "0.85rem", background: "var(--bg-input)", color: "var(--text-main)" }}
                      />
                    )}
                    <div className="lem-label-coords-info">
                      <span>Top: {label.top !== undefined ? label.top : 50}%</span>
                      <span>Left: {label.left !== undefined ? label.left : 50}%</span>
                    </div>
                  </div>
                  <button onClick={() => handleRemoveLabel(idx)} className="lem-label-delete" title="Eliminar">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {labels.length === 0 && (
                <p className="lem-empty-state">No hay etiquetas. Agrega una para comenzar.</p>
              )}
            </div>
            
            <div className="lem-sidebar-footer">
              <p className="lem-help-text">
                Arrastra las etiquetas en la imagen para posicionarlas.
              </p>
              <button onClick={handleSave} className="lem-save-btn">Guardar Etiquetas</button>
            </div>
          </div>
          
          <div className="lem-canvas-container">
            <div className="lem-canvas-wrapper">
              <div 
                className="lem-canvas" 
                ref={containerRef}
                style={{ 
                  maxWidth: garment.id === 'watches' || garment.title.toLowerCase().includes('reloj') ? '500px' : '100%'
                }}
              >
                <img src={imageUrl} alt={garment.title} className="lem-image" draggable={false} />
                
                {labels.map((label, idx) => (
                  <DraggableLabel 
                    key={idx} 
                    label={label} 
                    index={idx} 
                    containerRef={containerRef} 
                    updatePosition={handleUpdatePosition} 
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
