import React, { useState, useEffect } from "react";
import { 
  FolderTree, 
  Tags, 
  Palette, 
  Ruler, 
  Scissors, 
  Scale, 
  Plus, 
  Edit2, 
  Trash2,
  Check,
  X
} from "lucide-react";
import * as api from "../../../../api/catalog-settings";
import Spinner from "../../components/Spinner/Spinner";
import "./Settings.css";

function LoadingRow({ colSpan = 3, message = "Cargando..." }) {
  return (
    <tr>
      <td colSpan={colSpan} style={{ padding: "60px 0" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
          }}
        >
          <Spinner size={38} />

          <span
            style={{
              fontSize: 14,
              color: "#6b7280",
              fontWeight: 500,
            }}
          >
            {message}
          </span>
        </div>
      </td>
    </tr>
  );
}

function LoadingBlock({ message = "Cargando..." }) {
  return (
    <div
      style={{
        padding: "60px 20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
      }}
    >
      <Spinner size={38} />

      <span
        style={{
          fontSize: 14,
          color: "#6b7280",
          fontWeight: 500,
        }}
      >
        {message}
      </span>
    </div>
  );
}


export default function Settings() {
  const [activeTab, setActiveTab] = useState("categories");

  const tabs = [
    { id: "categories", label: "Categorías", icon: <FolderTree /> },
    { id: "productTypes", label: "Tipos de Producto", icon: <Tags /> },
    { id: "attributes", label: "Atributos y Valores", icon: <Palette /> },
    { id: "sizes", label: "Tallas", icon: <Ruler /> },
    { id: "fits", label: "Fits (Cortes)", icon: <Scissors /> },
    { id: "measurements", label: "Tipos de Medida", icon: <Scale /> },
  ];

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Configuración de Catálogo</h1>
        <p>Gestiona los metadatos globales para la creación de productos.</p>
      </div>

      <div className="settings-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`settings-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="settings-content-card">
        {activeTab === "categories" && <TabCategories />}
        {activeTab === "productTypes" && <TabProductTypes />}
        {activeTab === "attributes" && <TabAttributes />}
        {activeTab === "sizes" && <TabSizes />}
        {activeTab === "fits" && <TabFits />}
        {activeTab === "measurements" && <TabMeasurements />}
      </div>
    </div>
  );
}

// ==========================================
// TABS COMPONENTS
// ==========================================

// 1. CATEGORÍAS
function TabCategories() {
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: "", parent_id: "" });
  const [loading, setLoading] = useState(true);
  useEffect(() => { loadCategories(); }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);

      const { data } = await api.getCategories();
      setCategories(data?.data ?? data ?? []);
    } catch (err) {
      console.error("Error cargando categorías", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { name: formData.name, parent_id: formData.parent_id || null };
      if (formData.id) {
        await api.updateCategory(formData.id, payload);
      } else {
        await api.createCategory(payload);
      }
      setIsModalOpen(false);
      loadCategories();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta categoría?")) return;
    try {
      await api.deleteCategory(id);
      loadCategories();
    } catch (err) { console.error(err); }
  };

  return (
    <div>
      <div className="settings-section-header">
        <h2>Categorías</h2>
        <button className="btn-add" onClick={() => { setFormData({ id: null, name: "", parent_id: "" }); setIsModalOpen(true); }}>
          <Plus size={18} /> Nueva Categoría
        </button>
      </div>
      <div className="settings-table-wrapper">
        <table className="settings-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Categoría Padre</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <LoadingRow colSpan={3} />
            ) : (
              <>
                {categories.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>

                    <td>
                      {c.parent_id
                        ? categories.find(parent => parent.id === c.parent_id)?.name || "Desconocido"
                        : <span className="badge gray">Ninguno</span>}
                    </td>

                    <td>
                      <div className="action-btns">
                        <button
                          className="btn-icon"
                          onClick={() => {
                            setFormData({
                              id: c.id,
                              name: c.name,
                              parent_id: c.parent_id || ""
                            });

                            setIsModalOpen(true);
                          }}
                        >
                          <Edit2 size={16} />
                        </button>

                        <button
                          className="btn-icon danger"
                          onClick={() => handleDelete(c.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {categories.length === 0 && (
                  <tr>
                    <td colSpan="3">No hay categorías registradas.</td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="settings-modal-overlay">
          <div className="settings-modal">
            <h3>{formData.id ? "Editar Categoría" : "Nueva Categoría"}</h3>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Nombre</label>
                <input required type="text" className="form-control" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Categoría Padre (Opcional)</label>
                <select className="form-control" value={formData.parent_id} onChange={e => setFormData({ ...formData, parent_id: e.target.value })}>
                  <option value="">Ninguno (Categoría Principal)</option>
                  {categories.filter(c => c.id !== formData.id).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-add">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// 2. PRODUCT TYPES
function TabProductTypes() {
  const [types, setTypes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadTypes(); }, []);

  const loadTypes = async () => {
    try {
      setLoading(true);

      const { data } = await api.getProductTypes();
      setTypes(data?.data ?? data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) await api.updateProductType(formData.id, { name: formData.name });
      else await api.createProductType({ name: formData.name });
      setIsModalOpen(false);
      loadTypes();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar?")) return;
    try { await api.deleteProductType(id); loadTypes(); } catch (err) { console.error(err); }
  };

  return (
    <div>
      <div className="settings-section-header">
        <h2>Tipos de Producto (Ej: Polo, Casaca, Jean)</h2>
        <button className="btn-add" onClick={() => { setFormData({ id: null, name: "" }); setIsModalOpen(true); }}><Plus size={18}/> Nuevo Tipo</button>
      </div>
      <div className="settings-table-wrapper">
        <table className="settings-table">
          <thead><tr><th>Nombre</th><th>Acciones</th></tr></thead>
          <tbody>
            {loading ? (
              <LoadingRow colSpan={2} />
            ) : ( 
            <>
              {types.map(t => (
                <tr key={t.id}>
                  <td>{t.name}</td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-icon" onClick={() => { setFormData({ id: t.id, name: t.name }); setIsModalOpen(true); }}><Edit2 size={16}/></button>
                      <button className="btn-icon danger" onClick={() => handleDelete(t.id)}><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {types.length === 0 && <tr><td colSpan="2">No hay tipos registrados.</td></tr>}
            </>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="settings-modal-overlay">
          <div className="settings-modal">
            <h3>{formData.id ? "Editar Tipo" : "Nuevo Tipo"}</h3>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Nombre</label>
                <input required type="text" className="form-control" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-add">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// 3. ATTRIBUTES & VALUES (Master-Detail)
function TabAttributes() {
  const [attributes, setAttributes] = useState([]);
  const [selectedAttr, setSelectedAttr] = useState(null);

  // Attr Modal
  const [isAttrModalOpen, setIsAttrModalOpen] = useState(false);
  const [attrForm, setAttrForm] = useState({ id: null, name: "" });

  // Value Modal
  const [values, setValues] = useState([]);
  const [isValueModalOpen, setIsValueModalOpen] = useState(false);
  const [valueForm, setValueForm] = useState({ id: null, value: "", hex_code: "", isColor: false });

  const [loadingAttributes, setLoadingAttributes] = useState(true);
  const [loadingValues, setLoadingValues] = useState(false);

  useEffect(() => { loadAttributes(); }, []);

  const loadAttributes = async () => {
    try {
      setLoadingAttributes(true);

      const { data } = await api.getAttributes();

      const items = data?.data ?? data ?? [];

      setAttributes(items);

      if (items.length > 0 && !selectedAttr) {
        loadValues(items[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAttributes(false);
    }
  };

  const loadValues = async (attr) => {
    setSelectedAttr(attr);

    try {
      setLoadingValues(true);

      const { data } = await api.getAttributeValues();

      const items = data?.data ?? data ?? [];

      setValues(items.filter(v => v.attribute_id === attr.id));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingValues(false);
    }
  };

  // Guardar Atributo
  const handleSaveAttr = async (e) => {
    e.preventDefault();
    try {
      if (attrForm.id) await api.updateAttribute(attrForm.id, { name: attrForm.name });
      else await api.createAttribute({ name: attrForm.name });
      setIsAttrModalOpen(false);
      loadAttributes();
    } catch (err) { console.error(err); }
  };

  const handleDeleteAttr = async (id) => {
    if (!window.confirm("¿Eliminar atributo y todos sus valores?")) return;
    try { 
      await api.deleteAttribute(id); 
      if (selectedAttr?.id === id) setSelectedAttr(null);
      loadAttributes(); 
    } catch (err) { console.error(err); }
  };

  // Guardar Valor
  const handleSaveValue = async (e) => {
    e.preventDefault();
    try {
      const payload = { attribute_id: selectedAttr.id, value: valueForm.value, hex_code: valueForm.isColor ? (valueForm.hex_code || "#000000") : null };
      if (valueForm.id) await api.updateAttributeValue(valueForm.id, payload);
      else await api.createAttributeValue(payload);
      setIsValueModalOpen(false);
      loadValues(selectedAttr);
    } catch (err) { console.error(err); }
  };

  const handleDeleteValue = async (id) => {
    if (!window.confirm("¿Eliminar este valor?")) return;
    try { await api.deleteAttributeValue(id); loadValues(selectedAttr); } catch (err) { console.error(err); }
  };

  return (
    <div className="attribute-split-view">
      {/* Columna Izquierda: Atributos */}
      <div className="attr-list-container">
        <div className="settings-section-header" style={{ marginBottom: "15px" }}>
          <h2>Atributos</h2>
          <button className="btn-add" onClick={() => { setAttrForm({ id: null, name: "" }); setIsAttrModalOpen(true); }}><Plus size={16}/></button>
        </div>
        <div className="attr-list">
          {loadingAttributes ? (
            <LoadingBlock />
          ) : (
            <>
              {attributes.map(a => (
                <div key={a.id} className={`attr-item ${selectedAttr?.id === a.id ? "active" : ""}`} onClick={() => loadValues(a)}>
                  <span>{a.name}</span>
                  <div className="action-btns" onClick={e => e.stopPropagation()}>
                    <button className="btn-icon" style={{width: 24, height: 24}} onClick={() => { setAttrForm({ id: a.id, name: a.name }); setIsAttrModalOpen(true); }}><Edit2 size={12}/></button>
                    <button className="btn-icon danger" style={{width: 24, height: 24}} onClick={() => handleDeleteAttr(a.id)}><Trash2 size={12}/></button>
                  </div>
                </div>
                ))}

              {attributes.length === 0 && (
                <div style={{ padding: 15, fontSize: 13, color: "#aaa" }}>
                  No hay atributos.
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Columna Derecha: Valores del Atributo Seleccionado */}
      <div className="attr-values-container">
        {selectedAttr ? (
          <>
            <div className="settings-section-header" style={{ marginBottom: "15px" }}>
              <h2>Valores para: {selectedAttr.name}</h2>
              <button className="btn-add" onClick={() => { setValueForm({ id: null, value: "", hex_code: "", isColor: false }); setIsValueModalOpen(true); }}><Plus size={16}/> Agregar Valor</button>
            </div>
            <div className="settings-table-wrapper">
              <table className="settings-table">
                <thead>
                  <tr>
                    <th>Valor</th>
                    {values.some(v => v.hex_code) && <th>Color Hex</th>}
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingValues ? (
                    <LoadingRow colSpan={values.some(v => v.hex_code) ? 3 : 2} />
                  ) : (
                    <>
                  {values.map(v => (
                    <tr key={v.id}>
                      <td>{v.value}</td>
                      {values.some(val => val.hex_code) && (
                        <td>
                          {v.hex_code ? (
                            <div style={{display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap'}}>
                              <div className="color-preview-box" style={{backgroundColor: v.hex_code, flexShrink: 0}}></div>
                              <span>{v.hex_code}</span>
                            </div>
                          ) : <span className="badge gray">N/A</span>}
                        </td>
                      )}
                      <td>
                        <div className="action-btns">
                          <button className="btn-icon" onClick={() => { setValueForm({ id: v.id, value: v.value, hex_code: v.hex_code || "", isColor: !!v.hex_code }); setIsValueModalOpen(true); }}><Edit2 size={16}/></button>
                          <button className="btn-icon danger" onClick={() => handleDeleteValue(v.id)}><Trash2 size={16}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {values.length === 0 && <tr><td colSpan="3">No hay valores registrados.</td></tr>}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div style={{display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#666'}}>
            Selecciona un atributo para ver sus valores.
          </div>
        )}
      </div>

      {/* Modal Atributo */}
      {isAttrModalOpen && (
        <div className="settings-modal-overlay">
          <div className="settings-modal">
            <h3>{attrForm.id ? "Editar Atributo" : "Nuevo Atributo"}</h3>
            <form onSubmit={handleSaveAttr}>
              <div className="form-group">
                <label>Nombre (Ej: Color, Material)</label>
                <input required type="text" className="form-control" value={attrForm.name} onChange={e => setAttrForm({ ...attrForm, name: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsAttrModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-add">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Valor */}
      {isValueModalOpen && (
        <div className="settings-modal-overlay">
          <div className="settings-modal">
            <h3>{valueForm.id ? "Editar Valor" : "Nuevo Valor"}</h3>
            <form onSubmit={handleSaveValue}>
              <div className="form-group">
                <label>Valor (Ej: Rojo, Algodón)</label>
                <input required type="text" className="form-control" value={valueForm.value} onChange={e => setValueForm({ ...valueForm, value: e.target.value })} />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => setValueForm({ ...valueForm, isColor: !valueForm.isColor, hex_code: !valueForm.isColor ? "#000000" : "" })}>
                <div style={{
                  width: 20, height: 20, borderRadius: 4, border: '2px solid rgba(255,255,255,0.3)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: valueForm.isColor ? '#3b82f6' : 'transparent',
                  borderColor: valueForm.isColor ? '#3b82f6' : 'rgba(255,255,255,0.3)'
                }}>
                  {valueForm.isColor && <span style={{color: 'white', fontSize: 14}}>✓</span>}
                </div>
                <label style={{ margin: 0, fontSize: 14, cursor: 'pointer', userSelect: 'none' }}>¿Es un color?</label>
              </div>

              {valueForm.isColor && (
                <div className="form-group">
                  <label>Código Hexadecimal</label>
                  <div style={{display: 'flex', gap: 10, alignItems: 'center'}}>
                    <input type="color" value={valueForm.hex_code || "#000000"} onChange={e => setValueForm({ ...valueForm, hex_code: e.target.value })} style={{width: 50, height: 40, background: 'transparent', border: 'none', cursor: 'pointer'}} />
                    <input type="text" placeholder="#FFFFFF" className="form-control" value={valueForm.hex_code} onChange={e => setValueForm({ ...valueForm, hex_code: e.target.value })} />
                  </div>
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsValueModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-add">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// 4. SIZES
function TabSizes() {
  const [sizes, setSizes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: "", description: "" });
  const [loading, setLoading] = useState(true);
  useEffect(() => { loadSizes(); }, []);

  const loadSizes = async () => {
    try {
      setLoading(true);

      const { data } = await api.getSizes();

      setSizes(data?.data ?? data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) await api.updateSize(formData.id, { name: formData.name, description: formData.description });
      else await api.createSize({ name: formData.name, description: formData.description });
      setIsModalOpen(false);
      loadSizes();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar?")) return;
    try { await api.deleteSize(id); loadSizes(); } catch (err) { console.error(err); }
  };

  return (
    <div>
      <div className="settings-section-header">
        <h2>Tallas Generales</h2>
        <button className="btn-add" onClick={() => { setFormData({ id: null, name: "", description: "" }); setIsModalOpen(true); }}><Plus size={18}/> Nueva Talla</button>
      </div>
      <div className="settings-table-wrapper">
        <table className="settings-table">
          <thead><tr><th>Talla</th><th>Descripción</th><th>Acciones</th></tr></thead>
          <tbody>
            {loading ? (
              <LoadingRow colSpan={3} />
            ) : (
              <>
              {sizes.map(s => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.description || "-"}</td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-icon" onClick={() => { setFormData({ id: s.id, name: s.name, description: s.description || "" }); setIsModalOpen(true); }}><Edit2 size={16}/></button>
                      <button className="btn-icon danger" onClick={() => handleDelete(s.id)}><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {sizes.length === 0 && <tr><td colSpan="3">No hay tallas.</td></tr>}
              </>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="settings-modal-overlay">
          <div className="settings-modal">
            <h3>{formData.id ? "Editar Talla" : "Nueva Talla"}</h3>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Nombre (Ej: S, M, L, XL)</label>
                <input required type="text" className="form-control" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Descripción (Opcional)</label>
                <input type="text" className="form-control" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-add">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// 5. FITS
function TabFits() {
  const [fits, setFits] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: "" });
  const [loading, setLoading] = useState(true);
  

  useEffect(() => { loadFits(); }, []);

  const loadFits = async () => {
    try { 
      const { data } = await api.getFits(); 
      setFits(data?.data ?? data ?? []); 
    } catch (err) { console.error(err); 
    }finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) await api.updateFit(formData.id, { name: formData.name });
      else await api.createFit({ name: formData.name });
      setIsModalOpen(false);
      loadFits();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar?")) return;
    try { await api.deleteFit(id); loadFits(); } catch (err) { console.error(err); }
  };

  return (
    <div>
      <div className="settings-section-header">
        <h2>Cortes (Fits)</h2>
        <button className="btn-add" onClick={() => { setFormData({ id: null, name: "" }); setIsModalOpen(true); }}><Plus size={18}/> Nuevo Fit</button>
      </div>
      <div className="settings-table-wrapper">
        <table className="settings-table">
          <thead><tr><th>Nombre</th><th>Acciones</th></tr></thead>
          <tbody>
            {loading ? (
              <LoadingRow colSpan={2} />
            ) : (
              <>
              {fits.map(f => (
                <tr key={f.id}>
                  <td>{f.name}</td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-icon" onClick={() => { setFormData({ id: f.id, name: f.name }); setIsModalOpen(true); }}><Edit2 size={16}/></button>
                      <button className="btn-icon danger" onClick={() => handleDelete(f.id)}><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {fits.length === 0 && <tr><td colSpan="2">No hay fits.</td></tr>}
              </>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="settings-modal-overlay">
          <div className="settings-modal">
            <h3>{formData.id ? "Editar Fit" : "Nuevo Fit"}</h3>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Nombre (Ej: Slim Fit, Oversize)</label>
                <input required type="text" className="form-control" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-add">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// 6. MEASUREMENT TYPES
function TabMeasurements() {
  const [measurements, setMeasurements] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadMeasurements(); }, []);

  const loadMeasurements = async () => {
    try { 
      const { data } = await api.getMeasurementTypes(); 
      setMeasurements(data?.data ?? data ?? []); 
    } catch (err) { 
      console.error(err); 
    }finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) await api.updateMeasurementType(formData.id, { name: formData.name });
      else await api.createMeasurementType({ name: formData.name });
      setIsModalOpen(false);
      loadMeasurements();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar?")) return;
    try { await api.deleteMeasurementType(id); loadMeasurements(); } catch (err) { console.error(err); }
  };

  return (
    <div>
      <div className="settings-section-header">
        <h2>Tipos de Medida para Prendas</h2>
        <button className="btn-add" onClick={() => { setFormData({ id: null, name: "" }); setIsModalOpen(true); }}><Plus size={18}/> Nueva Medida</button>
      </div>
      <div className="settings-table-wrapper">
        <table className="settings-table">
          <thead><tr><th>Nombre</th><th>Acciones</th></tr></thead>
          <tbody>
            {loading ? (
              <LoadingRow colSpan={2} />
            ) : (
              <>
              {measurements.map(m => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-icon" onClick={() => { setFormData({ id: m.id, name: m.name }); setIsModalOpen(true); }}><Edit2 size={16}/></button>
                      <button className="btn-icon danger" onClick={() => handleDelete(m.id)}><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {measurements.length === 0 && <tr><td colSpan="2">No hay medidas registradas.</td></tr>}
              </>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="settings-modal-overlay">
          <div className="settings-modal">
            <h3>{formData.id ? "Editar Medida" : "Nueva Medida"}</h3>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Nombre de la Medida (Ej: Pecho, Largo, Manga)</label>
                <input required type="text" className="form-control" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-add">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}