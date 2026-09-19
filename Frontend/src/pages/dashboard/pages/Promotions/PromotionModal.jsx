import { useState, useEffect } from "react";
import { X, Tag, Settings2, CalendarClock, Target, Zap } from "lucide-react";
import { toast } from "react-hot-toast";
import Select from "react-select";
import AsyncSelect from "react-select/async";
import { createPromotion, updatePromotion } from "../../../../api/admin/discounts";
import { getBrands } from "../../../../api/admin/brands";
import api from "../../../../api/client";
import Spinner from "../../components/Spinner/Spinner";

import CustomSelect from '../../../../components/ui/CustomSelect';
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
    usage_limit_per_customer: "",
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
        usage_limit_per_customer: promotion.usage_limit_per_customer || "",
        start_date: promotion.start_date ? promotion.start_date.split("T")[0] : "",
        end_date: promotion.end_date ? promotion.end_date.split("T")[0] : "",
        active: promotion.active !== undefined ? promotion.active : true,
        
        brands: promotion.brands ? promotion.brands.map(b => ({ value: b.id, label: b.name })) : [],
        categories: promotion.categories ? promotion.categories.map(c => ({ value: c.id, label: c.name })) : (promotion.discount_categories ? promotion.discount_categories.map(dc => ({ value: dc.category_id, label: dc.category?.name || 'Categoría' })) : []),
        branches: promotion.branches ? promotion.branches.map(b => ({ value: b.id, label: b.name })) : [],
        
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
    setDataLoading(false);
  }, [promotion]);

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
        usage_limit: formData.usage_limit !== '' && formData.usage_limit !== null ? parseInt(formData.usage_limit) : null,
        usage_limit_per_customer: formData.usage_limit_per_customer !== '' && formData.usage_limit_per_customer !== null ? parseInt(formData.usage_limit_per_customer) : null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        code: formData.is_automatic ? null : (formData.code || null),
        // Map AsyncSelect arrays of {value, label} back to array of IDs
        brands: formData.brands.map(b => b.value),
        categories: formData.categories.map(c => c.value),
        branches: formData.branches.map(b => b.value),
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
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  const fetchBrandsApi = (inputValue, callback) => {
    api.get(`/v1/admin/brands?search=${inputValue}&per_page=10`).then(res => {
      const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
      callback(data.map(b => ({ value: b.id, label: b.name })));
    }).catch(() => callback([]));
  };
  const fetchBrandsDebounced = useState(() => debounce(fetchBrandsApi, 300))[0];

  const loadBrands = (inputValue, callback) => {
    if (!inputValue) return callback([]);
    fetchBrandsDebounced(inputValue, callback);
  };

  const fetchCategoriesApi = (inputValue, callback) => {
    api.get(`/v1/admin/categories?search=${inputValue}&per_page=10`).then(res => {
      const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
      callback(data.map(c => ({ value: c.id, label: c.name })));
    }).catch(() => callback([]));
  };
  const fetchCategoriesDebounced = useState(() => debounce(fetchCategoriesApi, 300))[0];

  const loadCategories = (inputValue, callback) => {
    if (!inputValue) return callback([]);
    fetchCategoriesDebounced(inputValue, callback);
  };

  const fetchBranchesApi = (inputValue, callback) => {
    api.get(`/v1/admin/branches?search=${inputValue}&per_page=10`).then(res => {
      const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
      callback(data.map(b => ({ value: b.id, label: b.name })));
    }).catch(() => callback([]));
  };
  const fetchBranchesDebounced = useState(() => debounce(fetchBranchesApi, 300))[0];

  const loadBranches = (inputValue, callback) => {
    if (!inputValue) return callback([]);
    fetchBranchesDebounced(inputValue, callback);
  };

  const fetchProductsApi = (inputValue, callback) => {
    api.get(`/v1/admin/products?search=${inputValue}&per_page=10`).then(res => {
      const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
      callback(data.map(p => ({ value: p.id, label: `${p.name} (${p.slug})` })));
    }).catch(() => callback([]));
  };
  const fetchProductsDebounced = useState(() => debounce(fetchProductsApi, 300))[0];

  const loadProducts = (inputValue, callback) => {
    if (!inputValue) return callback([]);
    fetchProductsDebounced(inputValue, callback);
  };

  const fetchVariantsApi = (inputValue, callback) => {
    api.get(`/v1/admin/variants?search=${inputValue}&per_page=10`).then(res => {
      const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
      callback(data.map(v => ({ value: v.id, label: `${v.product?.name} - ${v.sku}` })));
    }).catch(() => callback([]));
  };
  const fetchVariantsDebounced = useState(() => debounce(fetchVariantsApi, 300))[0];

  const loadVariants = (inputValue, callback) => {
    if (!inputValue) return callback([]);
    fetchVariantsDebounced(inputValue, callback);
  };

  const fetchCustomersApi = (inputValue, callback) => {
    api.get(`/v1/admin/customers?search=${inputValue}&per_page=10`).then(res => {
      const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
      callback(data.map(c => {
        const profile = c.user?.profile || {};
        return { value: c.id, label: `${profile.first_name || ''} ${profile.last_name_paternal || ''} (${c.customer_code || 'S/C'})`.trim() };
      }));
    }).catch(() => callback([]));
  };
  const fetchCustomersDebounced = useState(() => debounce(fetchCustomersApi, 300))[0];

  const loadCustomers = (inputValue, callback) => {
    if (!inputValue) return callback([]);
    fetchCustomersDebounced(inputValue, callback);
  };

  const fetchEmployeesApi = (inputValue, callback) => {
    api.get(`/v1/admin/employees?search=${inputValue}&per_page=10`).then(res => {
      const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
      callback(data.map(e => {
        const profile = e.user?.profile || {};
        return { value: e.id, label: `${profile.first_name || ''} ${profile.last_name_paternal || ''} (${e.employee_code || 'S/C'})`.trim() };
      }));
    }).catch(() => callback([]));
  };
  const fetchEmployeesDebounced = useState(() => debounce(fetchEmployeesApi, 300))[0];

  const loadEmployees = (inputValue, callback) => {
    if (!inputValue) return callback([]);
    fetchEmployeesDebounced(inputValue, callback);
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '1000px', width: '95%' }}>
        <h2 className="promo-modal-header" style={{ padding: '20px 30px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Tag className="text-primary" size={24} />
          {promotion ? "Editar Promoción" : "Nueva Promoción"}
          <button type="button" className="promo-modal-close-btn" style={{ marginLeft: 'auto' }} onClick={onClose}>
            <X size={20} />
          </button>
        </h2>

        <form onSubmit={handleSubmit} className="promo-modal-form" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {dataLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, minHeight: '300px' }}>
              <Spinner size={48} color="var(--primary-color)" />
            </div>
          ) : (
            <>
              <div className="promo-modal-body" style={{ 
                padding: '30px', 
                background: 'var(--bg-main)', 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
                gap: '24px',
                overflowY: 'auto'
              }}>
                
                {/* Left Column: Basic Info & Limits */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* Card 1: Configuración Básica */}
                  <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: 'var(--text-main)', fontWeight: 600, fontSize: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                      <Settings2 size={20} className="text-primary" /> Configuración Principal
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label>Nombre de la Promoción *</label>
                        <input 
                          type="text" 
                          name="name" 
                          required 
                          value={formData.name} 
                          onChange={handleChange} 
                          placeholder="Ej: Oferta Especial de Verano"
                          style={{ width: '100%', boxSizing: 'border-box' }}
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Tipo de Descuento *</label>
                        <CustomSelect name="type" value={formData.type} onChange={handleChange}>
                          <option value="percentage">Porcentaje (%)</option>
                          <option value="fixed">Monto Fijo (Bs)</option>
                        </CustomSelect>
                      </div>

                      <div className="form-group">
                        <label>Valor *</label>
                        <div style={{ position: 'relative' }}>
                          <input 
                            type="number" 
                            step="0.01"
                            name="value" 
                            required 
                            value={formData.value} 
                            onChange={handleChange} 
                            placeholder="Ej: 10"
                            style={{ paddingLeft: '32px', width: '100%', boxSizing: 'border-box' }}
                          />
                          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                            {formData.type === 'percentage' ? '%' : 'Bs'}
                          </span>
                        </div>
                      </div>

                      {formData.type === 'percentage' && (
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                          <label>Límite de Descuento (Monto Máximo en Bs.)</label>
                          <input 
                            type="number" 
                            step="0.01"
                            name="max_discount_amount" 
                            value={formData.max_discount_amount} 
                            onChange={handleChange} 
                            placeholder="Ej: 100 (Dejar vacío para no tener límite)"
                            style={{ width: '100%', boxSizing: 'border-box' }}
                          />
                          <small className="promo-helper-text" style={{ fontSize: '11px', marginTop: '4px' }}>
                            Establece un tope monetario máximo. Si el 50% de un producto de 1000 Bs es 500 Bs, pero el límite es 100 Bs, el descuento será 100 Bs.
                          </small>
                        </div>
                      )}

                      <div className="form-group" style={{ gridColumn: '1 / -1', marginTop: '8px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        <div className="promo-toggle-wrapper">
                          <label className="promo-toggle-label">
                            <input type="checkbox" name="active" checked={formData.active} onChange={handleChange} className="promo-toggle-input" />
                            <span className="promo-toggle-slider"></span>
                          </label>
                          <span className="promo-toggle-text">Promoción Activa</span>
                        </div>
                        
                        <div className="promo-toggle-wrapper">
                          <label className="promo-toggle-label">
                            <input type="checkbox" name="is_automatic" checked={formData.is_automatic} onChange={handleChange} className="promo-toggle-input" />
                            <span className="promo-toggle-slider"></span>
                          </label>
                          <span className="promo-toggle-text">Aplicar Automáticamente</span>
                        </div>
                      </div>

                      {!formData.is_automatic && (
                        <div className="form-group" style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Zap size={14} className="text-primary"/> Código del Cupón *</label>
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
                            placeholder="Ej: VRN20X (Max 6 caracteres)"
                            style={{ fontSize: '16px', letterSpacing: '2px', fontWeight: 'bold', textTransform: 'uppercase', border: '2px dashed var(--color-primary)', textAlign: 'center', color: 'var(--text-main)', width: '100%', boxSizing: 'border-box' }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card 2: Condiciones y Límites */}
                  <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: 'var(--text-main)', fontWeight: 600, fontSize: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                      <CalendarClock size={20} className="text-primary" /> Condiciones y Límites
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group">
                        <label>Compra Mínima (Bs)</label>
                        <input type="number" step="0.01" name="min_purchase_amount" value={formData.min_purchase_amount} onChange={handleChange} placeholder="Sin mínimo" style={{ width: '100%', boxSizing: 'border-box' }} />
                      </div>

                      <div className="form-group">
                        <label>Cant. Mínima (Items)</label>
                        <input type="number" name="min_quantity" value={formData.min_quantity} onChange={handleChange} placeholder="Sin mínimo" style={{ width: '100%', boxSizing: 'border-box' }} />
                      </div>

                      <div className="form-group">
                        <label>Usos Totales</label>
                        <input type="number" name="usage_limit" value={formData.usage_limit} onChange={handleChange} placeholder="Ilimitado" style={{ width: '100%', boxSizing: 'border-box' }} />
                      </div>

                      <div className="form-group">
                        <label>Usos por Cliente</label>
                        <input type="number" name="usage_limit_per_customer" value={formData.usage_limit_per_customer} onChange={handleChange} placeholder="Ilimitado" style={{ width: '100%', boxSizing: 'border-box' }} />
                      </div>

                      <div className="form-group">
                        <label>Válido Desde</label>
                        <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} style={{ width: '100%', boxSizing: 'border-box', colorScheme: 'dark' }} />
                      </div>

                      <div className="form-group">
                        <label>Válido Hasta</label>
                        <input type="date" name="end_date" value={formData.end_date} onChange={handleChange} style={{ width: '100%', boxSizing: 'border-box', colorScheme: 'dark' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Targets */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {/* Card 3: Filtros */}
                  <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', height: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-main)', fontWeight: 600, fontSize: '16px' }}>
                      <Target size={20} className="text-primary" /> Objetivos Específicos (Filtros)
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                      Si dejas estos campos vacíos, el descuento se aplicará de forma global. Selecciona opciones específicas para restringir la promoción.
                    </p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      
                      <div className="form-group">
                        <label>Marcas</label>
                        <AsyncSelect isMulti cacheOptions defaultOptions={formData.brands} loadOptions={loadBrands} value={formData.brands} onChange={(selected) => setFormData({...formData, brands: selected || []})} placeholder="Buscar marcas..." noOptionsMessage={() => "Escribe para buscar..."} styles={customStyles} menuPosition="fixed" />
                      </div>

                      <div className="form-group">
                        <label>Categorías</label>
                        <AsyncSelect isMulti cacheOptions defaultOptions={formData.categories} loadOptions={loadCategories} value={formData.categories} onChange={(selected) => setFormData({...formData, categories: selected || []})} placeholder="Buscar categorías..." noOptionsMessage={() => "Escribe para buscar..."} styles={customStyles} menuPosition="fixed" />
                      </div>

                      <div className="form-group">
                        <label>Sucursales</label>
                        <AsyncSelect isMulti cacheOptions defaultOptions={formData.branches} loadOptions={loadBranches} value={formData.branches} onChange={(selected) => setFormData({...formData, branches: selected || []})} placeholder="Buscar sucursales..." noOptionsMessage={() => "Escribe para buscar..."} styles={customStyles} menuPosition="fixed" />
                      </div>

                      <div className="form-group">
                        <label>Productos Específicos</label>
                        <AsyncSelect isMulti cacheOptions defaultOptions={formData.products} loadOptions={loadProducts} value={formData.products} onChange={(selected) => setFormData({...formData, products: selected || []})} placeholder="Buscar productos..." noOptionsMessage={() => "Escribe para buscar..."} styles={customStyles} menuPosition="fixed" />
                      </div>

                      <div className="form-group">
                        <label>Variantes (SKUs)</label>
                        <AsyncSelect isMulti cacheOptions defaultOptions={formData.variants} loadOptions={loadVariants} value={formData.variants} onChange={(selected) => setFormData({...formData, variants: selected || []})} placeholder="Buscar variantes..." noOptionsMessage={() => "Escribe para buscar..."} styles={customStyles} menuPosition="fixed" />
                      </div>

                      <div className="form-group">
                        <label>Exclusivo para Clientes</label>
                        <AsyncSelect isMulti cacheOptions defaultOptions={formData.customers} loadOptions={loadCustomers} value={formData.customers} onChange={(selected) => setFormData({...formData, customers: selected || []})} placeholder="Buscar clientes..." noOptionsMessage={() => "Escribe para buscar..."} styles={customStyles} menuPosition="fixed" />
                      </div>

                      <div className="form-group">
                        <label>Exclusivo para Empleados</label>
                        <AsyncSelect isMulti cacheOptions defaultOptions={formData.employees} loadOptions={loadEmployees} value={formData.employees} onChange={(selected) => setFormData({...formData, employees: selected || []})} placeholder="Buscar empleados..." noOptionsMessage={() => "Escribe para buscar..."} styles={customStyles} menuPosition="fixed" />
                      </div>
                      
                    </div>
                  </div>
                </div>

              </div>
              
              <div className="promo-modal-footer" style={{ padding: '20px 30px', background: 'var(--bg-card)' }}>
                <button type="button" className="promo-btn-cancel" onClick={onClose} disabled={loading} style={{ fontSize: '14px', height: '42px' }}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary promo-btn-submit" disabled={loading} style={{ fontSize: '14px', height: '42px', fontWeight: 600 }}>
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
