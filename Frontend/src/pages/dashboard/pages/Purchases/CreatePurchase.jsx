import { useState, useEffect, useRef } from "react";
import { Plus, Search, Trash2, ArrowLeft, Save, ShoppingCart, Box, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { useNavigate, Link } from "react-router-dom";
import { createPurchase } from "../../../../api/admin/purchases";
import { getSuppliers } from "../../../../api/admin/suppliers";
import { getBranches } from "../../../../api/admin/branches";
import { getEmployees } from "../../../../api/admin/employees";
import { getProducts } from "../../../../api/admin/products";
import { useAuthStore } from "../../../../store/authStore";
import { API_BASE_URL } from "../../../../config/api";
import Spinner from "../../components/Spinner/Spinner";
import "./Purchases.css";

import CustomSelect from '../../../../components/ui/CustomSelect';
export default function CreatePurchase() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [suppliers, setSuppliers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [employees, setEmployees] = useState([]);
  
  // Cart state
  const [cart, setCart] = useState([]);
  
  // Form state
  const [formData, setFormData] = useState({
    supplier_id: "",
    branch_id: "",
    employee_id: "",
    invoice_number: "",
    notes: "",
    tax: 0
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    const finalPath = cleanUrl.startsWith('storage/') ? cleanUrl : `storage/${cleanUrl}`;
    
    return `${API_BASE_URL}/${finalPath}`;
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setInitialLoading(true);
        const [suppRes, branchRes, empRes] = await Promise.all([
          getSuppliers(),
          getBranches(),
          getEmployees()
        ]);
        
        // getSuppliers returns axios response
        setSuppliers(suppRes.data?.data || suppRes.data || []);
        
        // getBranches and getEmployees return data directly
        setBranches(branchRes?.data || branchRes || []);
        setEmployees(empRes?.data || empRes || []);
      } catch (error) {
        toast.error("Error al cargar datos iniciales");
      } finally {
        setInitialLoading(false);
      }
    };
    loadInitialData();
  }, []);

  // Click outside to close search
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchResults([]);
        setSearchQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search products
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        try {
          const { data } = await getProducts({ search: searchQuery });
          const products = data.data || data;
          
          const variants = [];
          products.forEach(p => {
            if (p.product_variants) {
              p.product_variants.forEach(v => {
                // Determine best image: 1) variant specific, 2) attribute specific (color), 3) general product
                const attrImage = p.attribute_value_images?.find(avi => 
                  v.variant_attribute_values?.some(vav => vav.attribute_value_id === avi.attribute_value_id)
                )?.url;
                
                variants.push({
                  id: v.id,
                  product_name: p.name,
                  sku: v.sku,
                  cost: v.cost || 0,
                  image: v.variant_images?.[0]?.url || attrImage || p.product_images?.[0]?.url || null,
                  attributes: v.attributes || []
                });
              });
            }
          });
          setSearchResults(variants);
        } catch (error) {
          console.error(error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const addToCart = (variant) => {
    const existing = cart.find(item => item.variant_id === variant.id);
    if (existing) {
      setCart(cart.map(item => 
        item.variant_id === variant.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        variant_id: variant.id,
        name: variant.product_name,
        sku: variant.sku,
        quantity: 1,
        unit_cost: variant.cost,
        image: variant.image
      }]);
    }
    toast.success("Agregado a la orden", { duration: 1500, position: 'bottom-right' });
  };

  const updateQuantity = (variant_id, qty) => {
    const quantity = parseInt(qty);
    if (isNaN(quantity) || quantity < 1) return;
    
    setCart(cart.map(item => 
      item.variant_id === variant_id 
        ? { ...item, quantity }
        : item
    ));
  };

  const updateCost = (variant_id, cost) => {
    const unit_cost = parseFloat(cost);
    if (isNaN(unit_cost) || unit_cost < 0) return;

    setCart(cart.map(item => 
      item.variant_id === variant_id 
        ? { ...item, unit_cost }
        : item
    ));
  };

  const removeFromCart = (variant_id) => {
    setCart(cart.filter(item => item.variant_id !== variant_id));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.quantity * item.unit_cost), 0);
  const total = subtotal + parseFloat(formData.tax || 0);

  const handleSubmit = async () => {
    if (!formData.supplier_id) return toast.error("Seleccione un proveedor");
    if (!formData.branch_id) return toast.error("Seleccione una sucursal destino");
    if (!formData.employee_id) return toast.error("Seleccione un empleado (comprador)");
    if (cart.length === 0) return toast.error("Agregue al menos un producto");

    setLoading(true);
    try {
      const payload = {
        ...formData,
        items: cart.map(i => ({
          variant_id: i.variant_id,
          quantity: i.quantity,
          unit_cost: i.unit_cost
        }))
      };

      const { data } = await createPurchase(payload);
      toast.success(data.message);
      navigate("/dashboard/purchases");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al emitir orden de compra");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="purchases-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spinner size={40} />
      </div>
    );
  }

  return (
    <div className="purchases-container">
      <div className="purchases-header">
        <h1 className="purchases-title">
          <ShoppingCart size={28} className="text-primary" />
          Nueva Orden de Compra
        </h1>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/dashboard/purchases" className="btn-secondary">
            <ArrowLeft size={16} />
            Volver
          </Link>
          <button 
            className="btn-primary" 
            onClick={handleSubmit}
            disabled={loading || cart.length === 0}
          >
            {loading ? <Spinner size={16} color="#fff" /> : <Save size={16} />}
            Emitir Orden
          </button>
        </div>
      </div>

      <div className="purchase-create-grid">
        {/* LADO IZQUIERDO: Buscador y Carrito */}
        <div className="purchase-panel">
          <div className="purchase-panel-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Productos a Abastecer</span>
            <span className="text-muted" style={{ fontSize: '13px' }}>{cart.length} items</span>
          </div>

          <div className="purchases-search-box" ref={searchRef}>
            <Search size={18} />
            <input
              type="text"
              className="purchases-search-input"
              placeholder="Buscar por código de barra, SKU o nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {isSearching && (
              <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                <Spinner size={16} />
              </span>
            )}
            
            {searchResults.length > 0 && (
              <div className="search-results-dropdown">
                {searchResults.map(res => (
                  <div key={res.id} className="search-result-item" onClick={() => addToCart(res)}>
                    {res.image ? (
                      <img src={getImageUrl(res.image)} alt={res.product_name} />
                    ) : (
                      <div style={{ width: '40px', height: '40px', background: 'var(--bg-overlay)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Box size={20} color="var(--text-muted)" />
                      </div>
                    )}
                    <div className="search-result-details">
                      <div className="search-result-title">{res.product_name}</div>
                      <div className="search-result-sku">SKU: {res.sku || "N/A"}</div>
                    </div>
                    <div className="text-primary font-semibold">${Number(res.cost).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', background: 'var(--bg-overlay)', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
                <ShoppingCart size={40} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                <p>Usa el buscador para agregar productos a la orden de compra</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.variant_id} className="purchase-cart-item">
                  {item.image ? (
                    <img src={getImageUrl(item.image)} alt={item.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} />
                  ) : (
                    <div style={{ width: 40, height: 40, background: 'var(--bg-overlay)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Box size={20} color="var(--text-muted)" />
                    </div>
                  )}
                  <div className="purchase-cart-info">
                    <div className="purchase-cart-name">{item.name}</div>
                    <div className="purchase-cart-sku">SKU: {item.sku || "N/A"}</div>
                  </div>
                  
                  <div className="purchase-cart-controls">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Costo Unit. ($)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="purchase-form-input"
                        value={item.unit_cost}
                        onChange={(e) => updateCost(item.variant_id, e.target.value)}
                        style={{ width: '90px' }}
                      />
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Cantidad</label>
                      <input
                        type="number"
                        min="1"
                        className="purchase-form-input"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.variant_id, e.target.value)}
                        style={{ width: '80px' }}
                      />
                    </div>

                    <div className="purchase-cart-subtotal">
                      ${(item.quantity * item.unit_cost).toFixed(2)}
                    </div>

                    <button 
                      className="btn-remove-item"
                      onClick={() => removeFromCart(item.variant_id)}
                      title="Quitar"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* LADO DERECHO: Detalles y Total */}
        <div className="purchase-panel">
          <div className="purchase-panel-title">Detalles de la Orden</div>

          <div className="purchase-form-group">
            <label>Proveedor *</label>
            <CustomSelect 
              className="purchase-form-select"
              value={formData.supplier_id}
              onChange={e => setFormData({...formData, supplier_id: e.target.value})}
            >
              <option value="">Seleccione un proveedor</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name} {s.tax_id ? `(${s.tax_id})` : ''}</option>
              ))}
            </CustomSelect>
          </div>

          <div className="purchase-form-group">
            <label>Sucursal Destino *</label>
            <CustomSelect 
              className="purchase-form-select"
              value={formData.branch_id}
              onChange={e => setFormData({...formData, branch_id: e.target.value})}
            >
              <option value="">Seleccione sucursal explícitamente</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </CustomSelect>
          </div>

          <div className="purchase-form-group">
            <label>Comprador / Empleado *</label>
            <CustomSelect 
              className="purchase-form-select"
              value={formData.employee_id}
              onChange={e => setFormData({...formData, employee_id: e.target.value})}
            >
              <option value="">Seleccione un empleado explicitamente</option>
              {employees.map(e => {
                const profile = e.user?.user_profiles?.[0] || {};
                const name = `${profile.first_name || 'Empleado'} ${profile.last_name_paternal || ''}`.trim();
                return <option key={e.id} value={e.id}>{name}</option>;
              })}
            </CustomSelect>
          </div>

          <div className="purchase-form-group">
            <label>Número de Factura (Opcional)</label>
            <input 
              type="text" 
              className="purchase-form-input"
              placeholder="Ej. F-102934"
              value={formData.invoice_number}
              onChange={e => setFormData({...formData, invoice_number: e.target.value})}
            />
          </div>

          <div className="purchase-form-group">
            <label>Impuestos / Tax ($)</label>
            <input 
              type="number" 
              className="purchase-form-input"
              min="0"
              step="0.01"
              value={formData.tax}
              onChange={e => setFormData({...formData, tax: e.target.value})}
            />
          </div>

          <div className="purchase-form-group">
            <label>Notas de Compra</label>
            <textarea 
              className="purchase-form-input"
              rows="3"
              placeholder="Observaciones de la orden..."
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
            ></textarea>
          </div>

          <div className="purchase-totals">
            <div className="purchase-totals-row">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="purchase-totals-row">
              <span>Impuestos:</span>
              <span>${parseFloat(formData.tax || 0).toFixed(2)}</span>
            </div>
            <div className="purchase-totals-row grand-total">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
