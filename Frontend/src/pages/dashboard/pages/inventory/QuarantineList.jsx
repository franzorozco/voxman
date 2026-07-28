import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { getQuarantineItems } from "../../../../api/admin/quarantine";
import { getBranches } from "../../../../api/admin/branches";
import ResolveQuarantineModal from "./ResolveQuarantineModal";
import { PackageX, AlertTriangle, CheckCircle, PackageOpen } from "lucide-react";
import "../Purchases/Purchases.css";
import { API_BASE_URL } from "../../../../config/api";

import CustomSelect from '../../../../components/ui/CustomSelect';
const QuarantineList = () => {
  const [items, setItems] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(true);

  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getQuarantineItems(selectedBranch, statusFilter);
      setItems(res.data);
    } catch (err) {
      toast.error("Error al cargar mermas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getBranches().then(res => setBranches(res?.data || res || [])).catch(console.error);
  }, []);

  useEffect(() => {
    loadData();
  }, [selectedBranch, statusFilter]);

  const handleResolveClick = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const getReasonBadge = (reason) => {
    if (reason === 'damaged') {
      return <span className="status-badge" style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><AlertTriangle size={14} /> Dañado</span>;
    }
    if (reason === 'wrong') {
      return <span className="status-badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><PackageX size={14} /> Equivocado</span>;
    }
    return <span className="status-badge" style={{ display: 'inline-flex', alignItems: 'center' }}>{reason}</span>;
  };

  const getStatusBadge = (status) => {
    if (status === 'pending') {
      return <span className="status-badge" style={{ background: 'rgba(168, 162, 158, 0.1)', color: '#a8a29e', display: 'inline-flex', alignItems: 'center' }}>Pendiente</span>;
    }
    if (status === 'partially_resolved') {
      return <span className="status-badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'inline-flex', alignItems: 'center' }}>Parcial</span>;
    }
    if (status === 'resolved') {
      return <span className="status-badge" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={14} /> Resuelto</span>;
    }
    return <span className="status-badge" style={{ display: 'inline-flex', alignItems: 'center' }}>{status}</span>;
  };

  return (
    <div className="purchases-container">
      <div className="purchases-header">
        <div className="purchases-title">
          <AlertTriangle size={24} />
          Mermas y Cuarentena
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Resolución de productos dañados o equivocados en recepciones.
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)' }}>
        <button 
          onClick={() => setStatusFilter('pending')}
          style={{ background: 'none', border: 'none', padding: '10px 0', borderBottom: statusFilter === 'pending' ? '2px solid var(--primary-color)' : '2px solid transparent', color: statusFilter === 'pending' ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: statusFilter === 'pending' ? 600 : 400, cursor: 'pointer', fontSize: '15px' }}
        >
          Pendientes a Resolver
        </button>
        <button 
          onClick={() => setStatusFilter('resolved')}
          style={{ background: 'none', border: 'none', padding: '10px 0', borderBottom: statusFilter === 'resolved' ? '2px solid var(--primary-color)' : '2px solid transparent', color: statusFilter === 'resolved' ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: statusFilter === 'resolved' ? 600 : 400, cursor: 'pointer', fontSize: '15px' }}
        >
          Historial (Resueltas)
        </button>
      </div>

      <div className="filters-container" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <CustomSelect 
          className="purchase-form-select"
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
          style={{ width: '250px' }}
        >
          <option value="">Todas las Sucursales</option>
          {branches.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </CustomSelect>
        <button className="btn-secondary" onClick={loadData}>
          Actualizar
        </button>
      </div>

      <div className="purchases-table-container">
        {loading ? (
          <div className="loading-state">Cargando...</div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            {statusFilter === 'pending' ? 'No hay mermas pendientes. ¡Excelente!' : 'No hay historial de mermas resueltas.'}
          </div>
        ) : (
          <table className="purchases-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Recepción</th>
                <th>Motivo</th>
                <th style={{ textAlign: 'center' }}>Pendiente</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const pendingCount = item.quantity - item.resolved_quantity;
                const attrIds = item.variant?.variant_attribute_values?.map(vav => vav.attribute_value_id) || [];
                const colorImg = item.variant?.product?.attribute_value_images?.find(img => attrIds.includes(img.attribute_value_id));

                const rawImageUrl = colorImg?.url 
                                  || item.variant?.variant_images?.[0]?.image_url 
                                  || item.variant?.product?.product_images?.[0]?.url 
                                  || item.variant?.product?.product_images?.[0]?.image_url;
                
                let finalImageUrl = `${API_BASE_URL}/storage/attributes/default.png`;
                if (rawImageUrl) {
                  finalImageUrl = rawImageUrl.startsWith('http') ? rawImageUrl : `${API_BASE_URL}${rawImageUrl.startsWith('/') ? '' : '/storage/'}${rawImageUrl}`;
                }
                
                return (
                  <tr key={item.id}>
                    <td>
                      <div className="product-cell" style={{ display: 'flex', alignItems: 'center' }}>
                        <img 
                          src={finalImageUrl} 
                          alt="Prod" 
                          className="product-image-small" 
                          style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', marginRight: 10, border: '1px solid var(--border-color)' }} 
                          onError={(e) => { 
                            e.target.onerror = null; 
                            e.target.src = `${API_BASE_URL}/storage/attributes/default.png`; 
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 500 }}>{item.variant?.product?.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>SKU: {item.variant?.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13 }}>OC: {item.purchase_reception?.purchase?.invoice_number || 'S/N'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {new Date(item.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {getReasonBadge(item.reason)}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: 16, fontWeight: 'bold' }}>{pendingCount}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>de {item.quantity}</span>
                    </td>
                    <td>{getStatusBadge(item.status)}</td>
                    <td>
                      {item.status !== 'resolved' ? (
                        <button className="btn-primary" onClick={() => handleResolveClick(item)}>
                          Resolver
                        </button>
                      ) : (
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Completado</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <ResolveQuarantineModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          item={selectedItem}
          onSuccess={() => {
            setIsModalOpen(false);
            loadData();
          }}
        />
      )}
    </div>
  );
};

export default QuarantineList;
