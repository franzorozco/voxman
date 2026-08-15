import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Package, ArrowLeft, CheckCircle, AlertTriangle, XCircle, Info, Save } from "lucide-react";
import { toast } from "react-hot-toast";
import { getPurchase, receivePurchase } from "../../../../api/admin/purchases";
import { getEmployees } from "../../../../api/admin/employees";
import Spinner from "../../components/Spinner/Spinner";
import ConfirmModal from "../../../../components/ui/ConfirmModal";
import { useAuthStore } from "../../../../store/authStore";
import "./Purchases.css";

import CustomSelect from '../../../../components/ui/CustomSelect';
import { API_BASE_URL as CONFIG_API_BASE_URL } from '../../../../config/api';
const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || CONFIG_API_BASE_URL;

export default function ReceivePurchase() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [purchase, setPurchase] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: "", // Who is receiving
    notes: ""
  });

  // State array to hold reception data for each item
  const [receptionItems, setReceptionItems] = useState([]);

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    const finalPath = cleanUrl.startsWith('storage/') ? cleanUrl : `storage/${cleanUrl}`;
    return `${API_BASE_URL}/${finalPath}`;
  };
  const extractImage = (detail) => {
    const variant = detail.product_variant;
    if (!variant) return null;

    if (variant.variant_images?.[0]) return variant.variant_images[0].url;

    const variantAttrIds = variant.variant_attribute_values?.map(v => String(v.attribute_value_id)) || [];
    const product = variant.product;
    if (product?.attribute_value_images) {
      const colorImg = product.attribute_value_images.find(img => variantAttrIds.includes(String(img.attribute_value_id)) && img.is_main) 
                    || product.attribute_value_images.find(img => variantAttrIds.includes(String(img.attribute_value_id)));
      if (colorImg) return colorImg.url;
    }

    const pImages = product?.product_images;
    if (pImages && pImages.length > 0) {
      const mainImg = pImages.find(img => img.is_main) || pImages[0];
      return mainImg.url;
    }
    return null;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [purchaseRes, empRes] = await Promise.all([
          getPurchase(id),
          getEmployees()
        ]);
        
        const data = purchaseRes.data;
        setPurchase(data);
        
        // Auto-select logged-in user if they are an employee
        const allEmployees = empRes?.data || empRes || [];
        setEmployees(allEmployees);
        
        const me = allEmployees.find(e => e.user_id === user?.id);
        if (me) {
          setFormData(prev => ({ ...prev, employee_id: me.id }));
        }
        
        // Initialize reception items state
        if (data.purchase_details) {
          setReceptionItems(data.purchase_details.map(detail => ({
            variant_id: detail.variant_id,
            expected_quantity: detail.quantity,
            received_quantity: detail.quantity, // Default to receiving everything perfectly
            damaged_quantity: 0,
            wrong_quantity: 0,
            extra_quantity: 0,
            accepted_quantity: detail.quantity, // Default to accepting everything
            product_name: detail.product_variant?.product?.name,
            sku: detail.product_variant?.sku,
            image: extractImage(detail)
          })));
        }

      } catch (error) {
        toast.error("Error al cargar los datos de la orden");
        navigate("/dashboard/purchases");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, navigate, user]);

  const handleQuantityChange = (variant_id, field, value) => {
    const val = parseInt(value) || 0;
    
    setReceptionItems(prev => prev.map(item => {
      if (item.variant_id === variant_id) {
        const updatedItem = { ...item, [field]: Math.max(0, val) };
        
        // Auto-calculate accepted quantity
        // accepted = received - damaged - wrong
        if (field === 'received_quantity' || field === 'damaged_quantity' || field === 'wrong_quantity') {
          const received = field === 'received_quantity' ? updatedItem.received_quantity : item.received_quantity;
          const damaged = field === 'damaged_quantity' ? updatedItem.damaged_quantity : item.damaged_quantity;
          const wrong = field === 'wrong_quantity' ? updatedItem.wrong_quantity : item.wrong_quantity;
          
          updatedItem.accepted_quantity = Math.max(0, received - damaged - wrong);
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  const handleSubmit = async () => {
    if (!formData.employee_id) return toast.error("Seleccione quién está recepcionando");
    
    // Validate that at least something is being processed
    const hasProcessedItems = receptionItems.some(i => i.received_quantity > 0 || i.damaged_quantity > 0 || i.wrong_quantity > 0);
    if (!hasProcessedItems) return toast.error("No hay cantidades procesadas");

      setShowConfirmModal(true);
    };

    const handleConfirmSubmit = async () => {

    

    setSubmitting(true);
    try {
      const payload = {
        purchase_id: id,
        employee_id: formData.employee_id,
        notes: formData.notes,
        items: receptionItems.map(i => ({
          variant_id: i.variant_id,
          expected_quantity: i.expected_quantity,
          received_quantity: i.received_quantity,
          damaged_quantity: i.damaged_quantity,
          wrong_quantity: i.wrong_quantity,
          extra_quantity: i.extra_quantity,
          accepted_quantity: i.accepted_quantity
        }))
      };

      const { data } = await receivePurchase(payload);
      toast.success(data.message || "Mercadería recepcionada correctamente");
      navigate("/dashboard/purchases");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al procesar recepción");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="purchases-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spinner size={40} />
      </div>
    );
  }

  if (!purchase) return null;

  return (
    <div className="purchases-container fade-in">
      <div className="purchases-header">
        <div>
          <h1 className="purchases-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Package size={28} className="text-primary" />
            Recepción de Mercadería
          </h1>
          <p>Verificación física y actualización de inventario</p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/dashboard/purchases" className="btn-secondary">
            <ArrowLeft size={16} /> Volver
          </Link>
          <button 
            className="btn-primary" 
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? <Spinner size={16} color="#fff" /> : <Save size={16} />}
            Finalizar Recepción
          </button>
        </div>
      </div>

      {/* Info Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="purchase-panel">
          <div className="purchase-panel-title">Datos de la Orden</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
            <div><span className="text-muted">Nro Factura/Doc:</span> {purchase.invoice_number || "N/A"}</div>
            <div><span className="text-muted">Proveedor:</span> {purchase.supplier?.name}</div>
            <div><span className="text-muted">Sucursal Destino:</span> <span style={{ fontWeight: 600 }}>{purchase.branch?.name}</span></div>
            <div><span className="text-muted">Fecha Emisión:</span> {new Date(purchase.created_at).toLocaleDateString()}</div>
          </div>
        </div>

        <div className="purchase-panel">
          <div className="purchase-panel-title">Responsable de Recepción</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Almacenista / Recepcionista</label>
              <CustomSelect 
                className="purchase-form-select"
                value={formData.employee_id}
                onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
              >
                <option value="">Seleccione encargado...</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.user?.profile?.first_name || emp.user?.user_profiles?.[0]?.first_name} {emp.user?.profile?.last_name || emp.user?.user_profiles?.[0]?.last_name} ({emp.employee_code || emp.role})
                  </option>
                ))}
              </CustomSelect>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Notas u Observaciones Generales</label>
              <input 
                type="text" 
                className="purchase-form-input" 
                placeholder="Ej. Cajas llegaron mojadas, transportista llegó tarde..."
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Formulario de Verificación (Tabla) */}
      <div className="purchase-panel">
        <div className="purchase-panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={18} className="text-primary" />
          Verificación Física de Productos
        </div>
        
        <div className="table-container" style={{ marginTop: '15px' }}>
          <table className="purchases-table" style={{ minWidth: '1000px' }}>
            <thead>
              <tr>
                <th>Producto</th>
                <th style={{ textAlign: 'center', width: '100px', background: 'var(--bg-secondary)' }}>Esperado (OC)</th>
                <th style={{ textAlign: 'center', width: '100px' }}>Recibido Físico</th>
                <th style={{ textAlign: 'center', width: '100px', color: '#eab308' }}>Dañado</th>
                <th style={{ textAlign: 'center', width: '100px', color: '#ef4444' }}>Equivocado</th>
                <th style={{ textAlign: 'center', width: '100px', color: '#8b5cf6' }}>Extra</th>
                <th style={{ textAlign: 'center', width: '110px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>Aceptado (A Stock)</th>
              </tr>
            </thead>
            <tbody>
              {receptionItems.map((item, index) => (
                <tr key={item.variant_id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {item.image ? (
                        <img src={getImageUrl(item.image)} alt={item.product_name} style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 40, height: 40, background: 'var(--bg-overlay)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Package size={20} color="var(--text-muted)" />
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600 }}>{item.product_name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>SKU: {item.sku || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  
                  {/* ESPERADO */}
                  <td style={{ textAlign: 'center', background: 'var(--bg-secondary)', fontWeight: 600 }}>
                    {item.expected_quantity}
                  </td>
                  
                  {/* RECIBIDO FISICO */}
                  <td style={{ textAlign: 'center' }}>
                    <input 
                      type="number" 
                      min="0"
                      className="purchase-form-input" 
                      style={{ width: '70px', textAlign: 'center', padding: '6px' }}
                      value={item.received_quantity}
                      onChange={(e) => handleQuantityChange(item.variant_id, 'received_quantity', e.target.value)}
                    />
                  </td>

                  {/* DAÑADO */}
                  <td style={{ textAlign: 'center' }}>
                    <input 
                      type="number" 
                      min="0"
                      className="purchase-form-input" 
                      style={{ width: '70px', textAlign: 'center', padding: '6px', borderColor: item.damaged_quantity > 0 ? '#eab308' : '' }}
                      value={item.damaged_quantity === 0 ? '' : item.damaged_quantity}
                      placeholder="0"
                      onChange={(e) => handleQuantityChange(item.variant_id, 'damaged_quantity', e.target.value)}
                    />
                  </td>

                  {/* EQUIVOCADO */}
                  <td style={{ textAlign: 'center' }}>
                    <input 
                      type="number" 
                      min="0"
                      className="purchase-form-input" 
                      style={{ width: '70px', textAlign: 'center', padding: '6px', borderColor: item.wrong_quantity > 0 ? '#ef4444' : '' }}
                      value={item.wrong_quantity === 0 ? '' : item.wrong_quantity}
                      placeholder="0"
                      onChange={(e) => handleQuantityChange(item.variant_id, 'wrong_quantity', e.target.value)}
                    />
                  </td>

                  {/* EXTRA */}
                  <td style={{ textAlign: 'center' }}>
                    <input 
                      type="number" 
                      min="0"
                      className="purchase-form-input" 
                      style={{ width: '70px', textAlign: 'center', padding: '6px', borderColor: item.extra_quantity > 0 ? '#8b5cf6' : '' }}
                      value={item.extra_quantity === 0 ? '' : item.extra_quantity}
                      placeholder="0"
                      onChange={(e) => handleQuantityChange(item.variant_id, 'extra_quantity', e.target.value)}
                    />
                  </td>

                  {/* ACEPTADO (STOCK) */}
                  <td style={{ textAlign: 'center', background: 'rgba(34, 197, 94, 0.05)' }}>
                    <input 
                      type="number" 
                      min="0"
                      className="purchase-form-input" 
                      style={{ width: '70px', textAlign: 'center', padding: '6px', fontWeight: 'bold', color: '#22c55e', borderColor: '#22c55e' }}
                      value={item.accepted_quantity}
                      onChange={(e) => handleQuantityChange(item.variant_id, 'accepted_quantity', e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div style={{ marginTop: '15px', padding: '15px', background: 'var(--bg-overlay)', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <Info size={20} className="text-primary" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            <strong>Instrucciones:</strong> Por defecto, se asume que se recibió todo en perfecto estado. Si hubo problemas, ajuste los valores de <em>Dañado</em> o <em>Equivocado</em>. 
            El sistema calculará automáticamente el <strong>Aceptado</strong> (Recibido Físico - Dañado - Equivocado).
            Sólo la cantidad <strong>Aceptada</strong> será añadida al stock para venta. Las mermas se guardarán en el registro histórico de la orden para posteriores reclamaciones al proveedor.
          </div>
        </div>

      </div>
    
        {showConfirmModal && (
          <ConfirmModal
            isOpen={showConfirmModal}
            onClose={() => setShowConfirmModal(false)}
            onConfirm={handleConfirmSubmit}
            title="Finalizar Recepción"
            message="¿Está seguro de finalizar la recepción? El inventario será actualizado y la orden pasará a estado 'Recepcionado'."
            confirmText="Sí, finalizar"
            type="primary"
          />
        )}
      </div>
    );
  }
