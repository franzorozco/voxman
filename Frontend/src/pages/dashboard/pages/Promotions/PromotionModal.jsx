import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { toast } from "react-hot-toast";
import Select from "react-select";
import AsyncSelect from "react-select/async";
import { createPromotion, updatePromotion } from "../../../../api/admin/discounts";
import { getBrands } from "../../../../api/admin/brands";
import api from "../../../../api/client";
import Spinner from "../../components/Spinner/Spinner";

const customStyles = {
  menuPortal: base => ({ ...base, zIndex: 99999 }),
  control: (base) => ({
    ...base,
    backgroundColor: 'var(--bg-input)',
    borderColor: 'var(--border-color)',
    color: 'var(--text-main)',
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    zIndex: 99999,
  }),
  option: (base, state) => ({
    ...base,
    background: state.isFocused ? 'var(--bg-overlay)' : 'var(--bg-card)',
    color: 'var(--text-main)',
  }),
  singleValue: (base) => ({
    ...base,
    color: 'var(--text-main)',
  }),
  multiValue: (base) => ({
    ...base,
    background: 'var(--bg-overlay)',
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: 'var(--text-main)',
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: 'var(--text-muted)',
    ':hover': {
      backgroundColor: 'var(--btn-delete-bg)',
      color: 'white',
    },
  }),
  input: (base) => ({
      ...base,
      color: 'var(--text-main)',
  })
};

export default function PromotionModal({ promotion, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  const [brandsList, setBrands] = useState([]);
  const [categoriesList, setCategories] = useState([]);
  const [branchesList, setBranches] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    type: "percentage",
    value: "",
    is_automatic: false,
    min_purchase_amount: "",
    min_quantity: "",
    max_discount_amount: "",
    usage_limit: "",
    start_date: "",
    end_date: "",
    active: true,
    brands: [],
    categories: [],
    products: [],
    variants: [],
    branches: [],
    customers: [],
    employees: []
  });

  useEffect(() => {
    if (promotion) {
      setFormData({
        name: promotion.name || "",
        code: promotion.code || "",
        type: promotion.type || "percentage",
        value: promotion.value || "",
        is_automatic: promotion.is_automatic || false,
        min_purchase_amount: promotion.min_purchase_amount || "",
        min_quantity: promotion.min_quantity || "",
        max_discount_amount: promotion.max_discount_amount || "",
        usage_limit: promotion.usage_limit || "",
        start_date: promotion.start_date ? promotion.start_date.split("T")[0] : "",
        end_date: promotion.end_date ? promotion.end_date.split("T")[0] : "",
        active: promotion.active !== undefined ? promotion.active : true,
        brands: promotion.brands ? promotion.brands.map(b => b.id) : [],
        categories: promotion.categories ? promotion.categories.map(c => c.id) : (promotion.discount_categories ? promotion.discount_categories.map(dc => dc.category_id) : []),
        branches: promotion.branches ? promotion.branches.map(b => b.id) : [],
        
        // These are now handled by AsyncSelect, so we store the {value, label} object array directly
        products: promotion.products ? promotion.products.map(p => ({ value: p.id, label: `${p.name} (${p.slug})` })) : [],
        variants: promotion.variants ? promotion.variants.map(v => ({ value: v.id, label: `${v.product?.name} - ${v.sku}` })) : [],
        customers: promotion.customers ? promotion.customers.map(c => {
          const profile = c.user?.profile || {};
          return { value: c.id, label: `${profile.first_name || ''} ${profile.last_name_paternal || ''} (${c.customer_code || 'S/C'})`.trim() };
        }) : [],
        employees: promotion.employees ? promotion.employees.map(e => {
          const profile = e.user?.profile || {};
          return { value: e.id, label: `${profile.first_name || ''} ${profile.last_name_paternal || ''} (${e.employee_code || 'S/C'})`.trim() };
        }) : [],
      });
    }
    fetchData();
  }, [promotion]);

  const fetchData = async () => {
    setDataLoading(true);
    try {
      const [resBrands, resCat, resBranch] = await Promise.all([
        getBrands(),
        api.get("/v1/admin/categories"),
        api.get("/v1/admin/branches")
      ]);
      setBrands(Array.isArray(resBrands.data) ? resBrands.data.filter(b => b.is_active !== false) : (resBrands.data.data || []).filter(b => b.is_active !== false));
      setCategories(Array.isArray(resCat.data) ? resCat.data.filter(c => c.is_active !== false) : (resCat.data.data || []).filter(c => c.is_active !== false));
      setBranches(Array.isArray(resBranch.data) ? resBranch.data.filter(b => b.is_active !== false) : (resBranch.data.data || []).filter(b => b.is_active !== false));
    } catch (error) {
      toast.error("Error al cargar datos base");
    } finally {
      setDataLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        value: parseFloat(formData.value) || 0,
        min_purchase_amount: formData.min_purchase_amount ? parseFloat(formData.min_purchase_amount) : null,
        min_quantity: formData.min_quantity ? parseInt(formData.min_quantity) : null,
        max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        code: formData.is_automatic ? null : formData.code,
        // Map AsyncSelect arrays of {value, label} back to array of IDs
        products: formData.products.map(p => p.value),
        variants: formData.variants.map(v => v.value),
        customers: formData.customers.map(c => c.value),
        employees: formData.employees.map(emp => emp.value),
      };

      if (promotion) {
        await updatePromotion(promotion.id, payload);
        toast.success("Promoción actualizada");
      } else {
        await createPromotion(payload);
        toast.success("Promoción creada");
      }
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  // Debounced loaders for AsyncSelect
  const loadProducts = (inputValue, callback) => {
    if (!inputValue) return callback([]);
    api.get(`/v1/admin/products?search=${inputValue}`).then(res => {
      const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
      callback(data.map(p => ({ value: p.id, label: `${p.name} (${p.slug})` })));
    }).catch(() => callback([]));
  };

  const loadVariants = (inputValue, callback) => {
    if (!inputValue) return callback([]);
    api.get(`/v1/admin/variants?search=${inputValue}`).then(res => {
      const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
      callback(data.map(v => ({ value: v.id, label: `${v.product?.name} - ${v.sku}` })));
    }).catch(() => callback([]));
  };

  const loadCustomers = (inputValue, callback) => {
    if (!inputValue) return callback([]);
    api.get(`/v1/admin/customers?search=${inputValue}`).then(res => {
      const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
      callback(data.map(c => {
        const profile = c.user?.profile || {};
        return { value: c.id, label: `${profile.first_name || ''} ${profile.last_name_paternal || ''} (${c.customer_code || 'S/C'})`.trim() };
      }));
    }).catch(() => callback([]));
  };

  const loadEmployees = (inputValue, callback) => {
    if (!inputValue) return callback([]);
    api.get(`/v1/admin/employees?search=${inputValue}`).then(res => {
      const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
      callback(data.map(e => {
        const profile = e.user?.profile || {};
        return { value: e.id, label: `${profile.first_name || ''} ${profile.last_name_paternal || ''} (${e.employee_code || 'S/C'})`.trim() };
      }));
    }).catch(() => callback([]));
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0, padding: '24px 30px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '20px', fontWeight: '600' }}>
          {promotion ? "Editar Promoción" : "Nueva Promoción"}
          <button className="btn-secondary" style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={onClose}>
            <X size={20} />
          </button>
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          {dataLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, minHeight: '300px' }}>
              <Spinner size={48} color="var(--primary-color)" />
            </div>
          ) : (
            <>
              <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                
                <p style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: 'var(--primary-color)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Información General</p>
            <div className="form-grid">
              <div className="form-group">
                <label>Nombre de la Promoción *</label>
                <input 
                  type="text" 
                  name="name" 
                  required 
                  value={formData.name} 
                  onChange={handleChange} 
                  placeholder="Ej: Oferta de Verano"
                />
              </div>
              <div className="form-group" style={{justifyContent: 'center', display: 'flex', flexDirection: 'column'}}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 'auto', marginBottom: 'auto' }}>
                  <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', flexShrink: 0, margin: 0 }}>
                    <input 
                      type="checkbox" 
                      name="active" 
                      checked={formData.active} 
                      onChange={handleChange} 
                      style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                    />
                    <span style={{ 
                      position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, 
                      backgroundColor: formData.active ? 'var(--color-primary)' : 'var(--border-color)', 
                      transition: '.4s', borderRadius: '34px' 
                    }}>
                      <span style={{
                        position: 'absolute', content: '""', height: '16px', width: '16px', 
                        left: formData.active ? '24px' : '4px', bottom: '4px', 
                        backgroundColor: 'var(--bg-main)', transition: '.4s', borderRadius: '50%'
                      }}></span>
                    </span>
                  </label>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '14px' }}>Promoción Activa</span>
                </div>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Tipo de Descuento *</label>
                <select name="type" value={formData.type} onChange={handleChange}>
                  <option value="percentage">Porcentaje (%)</option>
                  <option value="fixed">Monto Fijo (Bs)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Valor *</label>
                <input 
                  type="number" 
                  step="0.01"
                  name="value" 
                  required 
                  value={formData.value} 
                  onChange={handleChange} 
                  placeholder="Ej: 10"
                />
              </div>
            </div>

            {formData.type === 'percentage' && (
              <div className="form-grid">
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Límite de Descuento (Monto Máximo en Bs.)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    name="max_discount_amount" 
                    value={formData.max_discount_amount} 
                    onChange={handleChange} 
                    placeholder="Ej: 100 (Dejar vacío para no tener límite)"
                  />
                  <small style={{ color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Establece un tope monetario máximo. Si el 50% de descuento de un producto de 1000 Bs es 500 Bs, pero el límite es 100 Bs, el descuento final será 100 Bs.
                  </small>
                </div>
              </div>
            )}

            <p style={{ margin: '24px 0 16px 0', fontSize: '16px', fontWeight: 600, color: 'var(--primary-color)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Código y Automatización</p>
            <div className="form-grid">
              <div className="form-group">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '28px' }}>
                  <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', flexShrink: 0, margin: 0 }}>
                    <input 
                      type="checkbox" 
                      name="is_automatic" 
                      checked={formData.is_automatic} 
                      onChange={handleChange} 
                      style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                    />
                    <span style={{ 
                      position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, 
                      backgroundColor: formData.is_automatic ? 'var(--color-primary)' : 'var(--border-color)', 
                      transition: '.4s', borderRadius: '34px' 
                    }}>
                      <span style={{
                        position: 'absolute', content: '""', height: '16px', width: '16px', 
                        left: formData.is_automatic ? '24px' : '4px', bottom: '4px', 
                        backgroundColor: 'var(--bg-main)', transition: '.4s', borderRadius: '50%'
                      }}></span>
                    </span>
                  </label>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '14px' }}>Aplicar Automáticamente</span>
                </div>
              </div>
              {!formData.is_automatic && (
                <div className="form-group">
                  <label>Código del Cupón *</label>
                  <input 
                    type="text" 
                    name="code" 
                    required={!formData.is_automatic}
                    value={formData.code} 
                    maxLength={6}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
                      setFormData({...formData, code: val});
                    }} 
                    placeholder="Ej: VRN20X (Max 6)"
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>
              )}
            </div>

            <p style={{ margin: '24px 0 16px 0', fontSize: '16px', fontWeight: 600, color: 'var(--primary-color)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Condiciones y Límites (Opcional)</p>
            <div className="form-grid">
              <div className="form-group">
                <label>Compra Mínima (Bs)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  name="min_purchase_amount" 
                  value={formData.min_purchase_amount} 
                  onChange={handleChange}
                  placeholder="Dejar vacío si no aplica"
                />
              </div>

              <div className="form-group">
                <label>Cantidad Mínima de Productos (Opcional)</label>
                <input 
                  type="number" 
                  name="min_quantity" 
                  value={formData.min_quantity} 
                  onChange={handleChange}
                  placeholder="Dejar vacío si no aplica"
                />
              </div>

              <div className="form-group">
                <label>Límite de Usos Totales (Opcional)</label>
                <input 
                  type="number" 
                  name="usage_limit" 
                  value={formData.usage_limit} 
                  onChange={handleChange}
                  placeholder="Ej: 100 primeros clientes"
                />
              </div>

              <div className="form-group">
                <label>Fecha de Inicio (Opcional)</label>
                <input 
                  type="date" 
                  name="start_date" 
                  value={formData.start_date} 
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Fecha de Fin (Opcional)</label>
                <input 
                  type="date" 
                  name="end_date" 
                  value={formData.end_date} 
                  onChange={handleChange}
                />
              </div>
            </div>

            <p style={{ margin: '24px 0 16px 0', fontSize: '16px', fontWeight: 600, color: 'var(--primary-color)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Objetivos Específicos (Dejar vacío para aplicar a todo)</p>
            <div className="form-grid">
              
              <div className="form-group">
                <label>Marcas</label>
                <Select
                  isMulti
                  options={brandsList.map(b => ({ value: b.id, label: b.name }))}
                  value={brandsList.filter(b => formData.brands.includes(b.id)).map(b => ({ value: b.id, label: b.name }))}
                  onChange={(selected) => setFormData({...formData, brands: selected ? selected.map(s => s.value) : []})}
                  placeholder="Selecciona marcas..."
                  styles={customStyles}
                  menuPosition="fixed"
                />
              </div>

              <div className="form-group">
                <label>Categorías</label>
                <Select
                  isMulti
                  options={categoriesList.map(c => ({ value: c.id, label: c.name }))}
                  value={categoriesList.filter(c => formData.categories.includes(c.id)).map(c => ({ value: c.id, label: c.name }))}
                  onChange={(selected) => setFormData({...formData, categories: selected ? selected.map(s => s.value) : []})}
                  placeholder="Selecciona categorías..."
                  styles={customStyles}
                  menuPosition="fixed"
                />
              </div>

              <div className="form-group">
                <label>Sucursales</label>
                <Select
                  isMulti
                  options={branchesList.map(b => ({ value: b.id, label: b.name }))}
                  value={branchesList.filter(b => formData.branches.includes(b.id)).map(b => ({ value: b.id, label: b.name }))}
                  onChange={(selected) => setFormData({...formData, branches: selected ? selected.map(s => s.value) : []})}
                  placeholder="Selecciona sucursales..."
                  styles={customStyles}
                  menuPosition="fixed"
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Productos (Búsqueda Asyncrona)</label>
                <AsyncSelect
                  isMulti
                  cacheOptions
                  defaultOptions={formData.products}
                  loadOptions={loadProducts}
                  value={formData.products}
                  onChange={(selected) => setFormData({...formData, products: selected || []})}
                  placeholder="Escribe para buscar productos..."
                  noOptionsMessage={() => "Escribe para buscar..."}
                  styles={customStyles}
                  menuPosition="fixed"
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Variantes o SKUs (Búsqueda Asyncrona)</label>
                <AsyncSelect
                  isMulti
                  cacheOptions
                  defaultOptions={formData.variants}
                  loadOptions={loadVariants}
                  value={formData.variants}
                  onChange={(selected) => setFormData({...formData, variants: selected || []})}
                  placeholder="Escribe para buscar variantes..."
                  noOptionsMessage={() => "Escribe para buscar..."}
                  styles={customStyles}
                  menuPosition="fixed"
                />
              </div>

              <div className="form-group">
                <label>Clientes (Búsqueda Asyncrona)</label>
                <AsyncSelect
                  isMulti
                  cacheOptions
                  defaultOptions={formData.customers}
                  loadOptions={loadCustomers}
                  value={formData.customers}
                  onChange={(selected) => setFormData({...formData, customers: selected || []})}
                  placeholder="Escribe para buscar clientes..."
                  noOptionsMessage={() => "Escribe para buscar..."}
                  styles={customStyles}
                  menuPosition="fixed"
                />
              </div>

              <div className="form-group">
                <label>Empleados (Búsqueda Asyncrona)</label>
                <AsyncSelect
                  isMulti
                  cacheOptions
                  defaultOptions={formData.employees}
                  loadOptions={loadEmployees}
                  value={formData.employees}
                  onChange={(selected) => setFormData({...formData, employees: selected || []})}
                  placeholder="Escribe para buscar empleados..."
                  noOptionsMessage={() => "Escribe para buscar..."}
                  styles={customStyles}
                  menuPosition="fixed"
                />
              </div>
            </div>
          </div>
          
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'var(--bg-card)' }}>
            <button type="button" className="btn-secondary" style={{ padding: '10px 20px', borderRadius: '6px', fontWeight: 500, cursor: 'pointer', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)' }} onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" style={{ padding: '10px 20px', borderRadius: '6px', fontWeight: 500, cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '160px' }} disabled={loading}>
              {loading ? <Spinner size={20} color="#ffffff" trackColor="rgba(255,255,255,0.3)" borderWidth={2} /> : "Guardar Promoción"}
            </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
