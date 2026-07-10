import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { toast } from "react-hot-toast";
import Select from "react-select";
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
  const [productsList, setProducts] = useState([]);
  const [variantsList, setVariants] = useState([]);
  const [branchesList, setBranches] = useState([]);
  const [customersList, setCustomers] = useState([]);
  const [employeesList, setEmployees] = useState([]);

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
        products: promotion.products ? promotion.products.map(p => p.id) : [],
        variants: promotion.variants ? promotion.variants.map(v => v.id) : [],
        branches: promotion.branches ? promotion.branches.map(b => b.id) : [],
        customers: promotion.customers ? promotion.customers.map(c => c.id) : [],
        employees: promotion.employees ? promotion.employees.map(e => e.id) : []
      });
    }
    fetchData();
  }, [promotion]);

  const fetchData = async () => {
    setDataLoading(true);
    try {
      const [resBrands, resCat, resProd, resVar, resBranch, resCust, resEmp] = await Promise.all([
        getBrands(),
        api.get("/v1/admin/categories"),
        api.get("/v1/admin/products"),
        api.get("/v1/admin/variants"),
        api.get("/v1/admin/branches"),
        api.get("/v1/admin/customers"),
        api.get("/v1/admin/employees")
      ]);
      setBrands(Array.isArray(resBrands.data) ? resBrands.data.filter(b => b.is_active !== false) : (resBrands.data.data || []).filter(b => b.is_active !== false));
      setCategories(Array.isArray(resCat.data) ? resCat.data.filter(c => c.is_active !== false) : (resCat.data.data || []).filter(c => c.is_active !== false));
      setProducts(Array.isArray(resProd.data) ? resProd.data : resProd.data.data || []);
      setVariants(Array.isArray(resVar.data) ? resVar.data : resVar.data.data || []);
      setBranches(Array.isArray(resBranch.data) ? resBranch.data.filter(b => b.is_active !== false) : (resBranch.data.data || []).filter(b => b.is_active !== false));
      setCustomers(Array.isArray(resCust.data) ? resCust.data : resCust.data.data || []);
      setEmployees(Array.isArray(resEmp.data) ? resEmp.data : resEmp.data.data || []);
    } catch (error) {
      toast.error("Error al cargar datos");
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
              <div className="form-group" style={{justifyContent: 'center'}}>
                <label className="checkbox-group">
                  <input 
                    type="checkbox" 
                    name="active" 
                    checked={formData.active} 
                    onChange={handleChange} 
                  />
                  Promoción Activa
                </label>
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

            <p style={{ margin: '24px 0 16px 0', fontSize: '16px', fontWeight: 600, color: 'var(--primary-color)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Código y Automatización</p>
            <div className="form-grid">
              <div className="form-group">
                <label className="checkbox-group" style={{marginTop: '0'}}>
                  <input 
                    type="checkbox" 
                    name="is_automatic" 
                    checked={formData.is_automatic} 
                    onChange={handleChange} 
                  />
                  Aplicar Automáticamente (No requiere código)
                </label>
              </div>
              {!formData.is_automatic && (
                <div className="form-group">
                  <label>Código del Cupón *</label>
                  <input 
                    type="text" 
                    name="code" 
                    required={!formData.is_automatic}
                    value={formData.code} 
                    onChange={handleChange} 
                    placeholder="Ej: VERANO20"
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
                <label>Productos</label>
                <Select
                  isMulti
                  options={productsList.map(p => ({ value: p.id, label: `${p.name} (${p.slug})` }))}
                  value={productsList.filter(p => formData.products.includes(p.id)).map(p => ({ value: p.id, label: `${p.name} (${p.slug})` }))}
                  onChange={(selected) => setFormData({...formData, products: selected ? selected.map(s => s.value) : []})}
                  placeholder="Selecciona productos..."
                  styles={customStyles}
                  menuPosition="fixed"
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Variantes (SKUs específicos)</label>
                <Select
                  isMulti
                  options={variantsList.map(v => ({ value: v.id, label: `${v.product?.name} - ${v.sku}` }))}
                  value={variantsList.filter(v => formData.variants.includes(v.id)).map(v => ({ value: v.id, label: `${v.product?.name} - ${v.sku}` }))}
                  onChange={(selected) => setFormData({...formData, variants: selected ? selected.map(s => s.value) : []})}
                  placeholder="Selecciona variantes..."
                  styles={customStyles}
                  menuPosition="fixed"
                />
              </div>

              <div className="form-group">
                <label>Clientes</label>
                <Select
                  isMulti
                  options={customersList.map(c => {
                    const profile = c.user?.profile || {};
                    return { value: c.id, label: `${profile.first_name || ''} ${profile.last_name_paternal || ''} (${c.customer_code || 'S/C'})`.trim() };
                  })}
                  value={customersList.filter(c => formData.customers.includes(c.id)).map(c => {
                    const profile = c.user?.profile || {};
                    return { value: c.id, label: `${profile.first_name || ''} ${profile.last_name_paternal || ''} (${c.customer_code || 'S/C'})`.trim() };
                  })}
                  onChange={(selected) => setFormData({...formData, customers: selected ? selected.map(s => s.value) : []})}
                  placeholder="Selecciona clientes..."
                  styles={customStyles}
                  menuPosition="fixed"
                />
              </div>

              <div className="form-group">
                <label>Empleados</label>
                <Select
                  isMulti
                  options={employeesList.map(e => {
                    const profile = e.user?.profile || {};
                    return { value: e.id, label: `${profile.first_name || ''} ${profile.last_name_paternal || ''} (${e.employee_code || 'S/C'})`.trim() };
                  })}
                  value={employeesList.filter(e => formData.employees.includes(e.id)).map(e => {
                    const profile = e.user?.profile || {};
                    return { value: e.id, label: `${profile.first_name || ''} ${profile.last_name_paternal || ''} (${e.employee_code || 'S/C'})`.trim() };
                  })}
                  onChange={(selected) => setFormData({...formData, employees: selected ? selected.map(s => s.value) : []})}
                  placeholder="Selecciona empleados..."
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
