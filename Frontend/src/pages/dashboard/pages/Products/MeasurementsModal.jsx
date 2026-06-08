import { useState, useEffect } from "react";
import { X, Ruler, Save, Edit2, Copy } from "lucide-react";
import api from "../../../../api/client";
import { updateProductMeasurements } from "../../../../api/products";
import toast from "react-hot-toast";

export default function MeasurementsModal({ product, onClose, onSaved }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Array of required measurement types for this product's product_type
  const [requiredMeasurements, setRequiredMeasurements] = useState([]);
  
  // State to hold the input values
  // Format: { variantId: { measurementTypeId: "value" } }
  const [values, setValues] = useState({});
  const [initialValues, setInitialValues] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  
  // State for global "fill all" feature
  const [globalValues, setGlobalValues] = useState({});

  useEffect(() => {
    if (product) {
      loadRequirements();
    }
  }, [product]);

  const loadRequirements = async () => {
    try {
      setLoading(true);
      // 1. Fetch relationships between product types and measurement types
      const relRes = await api.get('/v1/admin/product-type-measurements');
      const relations = relRes.data?.data ?? relRes.data ?? [];
      
      // Filter for current product type
      const myRelations = relations.filter(r => r.product_type_id === product.product_type_id);
      
      // 2. Fetch all measurement types to get their names
      const measRes = await api.get('/v1/admin/measurement-types');
      const allMeas = measRes.data?.data ?? measRes.data ?? [];
      
      // Map required measurements and deduplicate by ID
      const required = [];
      const seen = new Set();

      myRelations.forEach(rel => {
        if (!seen.has(rel.measurement_type_id)) {
          seen.add(rel.measurement_type_id);
          const type = allMeas.find(m => m.id === rel.measurement_type_id);
          if (type) {
            required.push({ id: type.id, name: type.name });
          }
        }
      });
      
      setRequiredMeasurements(required);

      // 3. Initialize state with existing values from product
      const initVals = {};
      
      product.product_variants?.forEach(variant => {
        initVals[variant.id] = {};
        
        variant.variant_measurements?.forEach(vm => {
          initVals[variant.id][vm.measurement_type_id] = vm.value;
        });
      });
      
      setValues(initVals);
      setInitialValues(initVals);

    } catch (error) {
      console.error("Error loading measurements:", error);
      toast.error("Error cargando los tipos de medidas.");
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (variantId, measurementId, value) => {
    setValues(prev => ({
      ...prev,
      [variantId]: {
        ...prev[variantId],
        [measurementId]: value
      }
    }));
  };

  const handleGlobalValueChange = (measurementId, value) => {
    setGlobalValues(prev => ({ ...prev, [measurementId]: value }));
  };

  const applyGlobalValues = () => {
    if (Object.keys(globalValues).length === 0) return;
    
    setValues(prev => {
      const newValues = { ...prev };
      product.product_variants.forEach(variant => {
        newValues[variant.id] = { ...newValues[variant.id] };
        Object.keys(globalValues).forEach(mId => {
          if (globalValues[mId] !== "" && globalValues[mId] !== undefined) {
             newValues[variant.id][mId] = globalValues[mId];
          }
        });
      });
      return newValues;
    });
    
    toast.success("Medidas aplicadas a todas las variantes.");
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Format payload for backend
      // { measurements: { variant_id: [ { measurement_type_id, value } ] } }
      const payload = {};
      
      Object.keys(values).forEach(variantId => {
        payload[variantId] = [];
        
        Object.keys(values[variantId]).forEach(measurementId => {
          payload[variantId].push({
            measurement_type_id: measurementId,
            value: values[variantId][measurementId]
          });
        });
      });

      await updateProductMeasurements(product.id, payload);
      toast.success("Medidas actualizadas correctamente.");
      onSaved();
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar medidas.");
    } finally {
      setSaving(false);
    }
  };

  if (!product) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div className="modal-content" style={{ width: "95%", maxWidth: "800px", background: "var(--bg-main)", borderRadius: "12px", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
        
        {/* HEADER */}
        <div style={{ padding: "20px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: "10px", fontSize: "1.2rem", fontWeight: "600" }}>
              <Ruler size={20} className="text-primary" />
              Medidas Físicas: {product.name}
            </h2>
            <p style={{ margin: "5px 0 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              {isEditing 
                ? "Ingresa los centímetros exactos de las prendas para el almacén y control de tallas."
                : "Catálogo de medidas físicas actuales para todas las variantes."}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
            <X size={24} />
          </button>
        </div>

        {/* BODY */}
        <div style={{ padding: "20px", overflowY: "auto", flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>Cargando esquema de medidas...</div>
          ) : requiredMeasurements.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <div style={{ fontSize: "3rem", marginBottom: "15px" }}>🤷‍♂️</div>
              <h3 style={{ margin: 0, fontWeight: 500, color: "var(--text-main)" }}>Sin Medidas Requeridas</h3>
              <p style={{ color: "var(--text-muted)", marginTop: "10px" }}>
                El Tipo de Producto ("{product.product_type?.name}") no tiene medidas asociadas. Ve a Configuración de Catálogo para agregarle medidas si es necesario.
              </p>
            </div>
          ) : product.product_variants?.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--color-danger)" }}>
              Este producto aún no tiene variantes generadas.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border-color)" }}>
                    <th style={{ padding: "12px", fontWeight: "600", color: "var(--text-muted)" }}>Variante (SKU)</th>
                    <th style={{ padding: "12px", fontWeight: "600", color: "var(--text-muted)" }}>Detalle</th>
                    {requiredMeasurements.map(m => (
                      <th key={m.id} style={{ padding: "12px", fontWeight: "600", color: "var(--text-muted)", textAlign: "center" }}>
                        {m.name} <small>(cm)</small>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isEditing && product.product_variants?.length > 1 && (
                    <tr style={{ background: "var(--bg-hover, rgba(0,0,0,0.02))", borderBottom: "2px solid var(--border-color)" }}>
                      <td colSpan={2} style={{ padding: "15px 12px", fontSize: "0.9rem", color: "var(--text-main)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontWeight: "600", color: "var(--primary-color)" }}>Rellenado Rápido</span>
                          <button 
                            className="btn-secondary" 
                            style={{ padding: "4px 8px", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "5px" }}
                            onClick={applyGlobalValues}
                            title="Aplica estos valores a todas las filas de abajo"
                          >
                            <Copy size={12} /> Aplicar a Todas
                          </button>
                        </div>
                      </td>
                      {requiredMeasurements.map(m => (
                        <td key={m.id} style={{ padding: "10px", textAlign: "center" }}>
                          <input 
                            type="number" 
                            step="0.1"
                            placeholder="0.0"
                            value={globalValues[m.id] || ""}
                            onChange={(e) => handleGlobalValueChange(m.id, e.target.value)}
                            style={{ 
                              width: "80px", 
                              padding: "8px", 
                              borderRadius: "6px", 
                              border: "1px dashed var(--primary-color)", 
                              background: "transparent", 
                              color: "var(--primary-color)",
                              fontWeight: "600",
                              textAlign: "center",
                              outline: "none"
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  )}
                  {product.product_variants.map(variant => {
                    
                    const attrText = variant.variant_attribute_values
                      ?.map(vav => vav.attribute_value?.value)
                      .filter(Boolean)
                      .join(", ");
                      
                    const detailParts = [];
                    if (variant.size?.name) detailParts.push(`Talla ${variant.size.name}`);
                    if (variant.fit?.name) detailParts.push(variant.fit.name);
                    if (attrText) detailParts.push(attrText);

                    return (
                      <tr key={variant.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                        <td style={{ padding: "15px 12px", fontFamily: "monospace", fontSize: "0.9rem", color: "var(--text-main)" }}>{variant.sku}</td>
                        <td style={{ padding: "15px 12px", fontSize: "0.9rem" }}>
                          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: "1.4", display: "block" }}>
                            {detailParts.join(" • ") || "Estándar"}
                          </span>
                        </td>
                        
                        {requiredMeasurements.map(m => {
                          const val = values[variant.id]?.[m.id];
                          return (
                            <td key={m.id} style={{ padding: "10px", textAlign: "center" }}>
                              {isEditing ? (
                                <input 
                                  type="number" 
                                  step="0.1"
                                  placeholder="0.0"
                                  value={val || ""}
                                  onChange={(e) => handleValueChange(variant.id, m.id, e.target.value)}
                                  style={{ 
                                    width: "80px", 
                                    padding: "8px", 
                                    borderRadius: "6px", 
                                    border: "1px solid var(--border-color)", 
                                    background: "var(--bg-input)", 
                                    color: "var(--text-main)",
                                    textAlign: "center",
                                    outline: "none",
                                    transition: "0.2s border"
                                  }}
                                  onFocus={(e) => e.target.style.borderColor = "var(--primary-color)"}
                                  onBlur={(e) => e.target.style.borderColor = "var(--border-color)"}
                                />
                              ) : (
                                <span style={{ 
                                  fontWeight: 600, 
                                  color: val ? "var(--text-main)" : "var(--text-muted)", 
                                  display: "inline-block",
                                  minWidth: "40px",
                                  fontSize: "0.95rem"
                                }}>
                                  {val ? `${val} cm` : "---"}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div style={{ padding: "15px 20px", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "flex-end", gap: "10px", background: "var(--bg-main)", borderBottomLeftRadius: "12px", borderBottomRightRadius: "12px" }}>
          {isEditing ? (
            <>
              <button 
                className="btn-secondary"
                onClick={() => { setIsEditing(false); setValues(initVals); }} 
                disabled={saving}
                style={{ whiteSpace: "nowrap" }}
              >
                Cancelar
              </button>
              <button 
                className="btn-save"
                onClick={handleSave} 
                disabled={saving}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: saving ? 0.7 : 1, whiteSpace: "nowrap" }}
              >
                <Save size={18} />
                {saving ? "Guardando..." : "Guardar Medidas"}
              </button>
            </>
          ) : (
            <>
              <button 
                className="btn-secondary"
                onClick={onClose} 
                style={{ whiteSpace: "nowrap" }}
              >
                Cerrar
              </button>
              {requiredMeasurements.length > 0 && product.product_variants?.length > 0 && (
                <button 
                  className="btn-edit"
                  onClick={() => setIsEditing(true)} 
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", whiteSpace: "nowrap" }}
                >
                  <Edit2 size={18} />
                  Editar Medidas
                </button>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}
