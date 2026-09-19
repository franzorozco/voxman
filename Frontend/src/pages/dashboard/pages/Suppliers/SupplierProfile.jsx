import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, User, Phone, Mail, Building, FileText, ShoppingBag, DollarSign } from "lucide-react";
import { getSupplierProfile } from "../../../../api/admin/suppliers";
import "./Suppliers.css";
import { toast } from "react-hot-toast";

export default function SupplierProfile() {
  const { id } = useParams();
  const [supplier, setSupplier] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data } = await getSupplierProfile(id);
        setSupplier(data.supplier);
        setStats(data.stats);
      } catch (error) {
        toast.error("Error al cargar perfil del proveedor");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  if (loading) {
    return <div style={{ padding: "40px", textAlign: "center" }}>Cargando perfil...</div>;
  }

  if (!supplier) {
    return <div style={{ padding: "40px", textAlign: "center" }}>Proveedor no encontrado</div>;
  }

  return (
    <div className="suppliers-container">
      <div className="suppliers-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '15px' }}>
        <Link to="/dashboard/suppliers" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ArrowLeft size={16} /> Volver a Proveedores
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building size={30} />
          </div>
          <div>
            <h1 className="suppliers-title" style={{ margin: 0, fontSize: '28px' }}>
              {supplier.name}
            </h1>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              {supplier.company_name || 'Sin Razón Social'}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Contact Info Card */}
        <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            Información de Contacto
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <User size={16} color="var(--text-muted)" />
            <span>{supplier.contact_name || 'No especificado'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Phone size={16} color="var(--text-muted)" />
            <span>{supplier.phone || 'No especificado'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Mail size={16} color="var(--text-muted)" />
            <span>{supplier.email || 'No especificado'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={16} color="var(--text-muted)" />
            <span>NIT: {supplier.tax_id || 'No especificado'}</span>
          </div>
        </div>

        {/* Financial KPI Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--color-success)', opacity: 0.1, position: 'absolute' }}></div>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-success)' }}>
              <DollarSign size={24} />
            </div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Total Comprado (Histórico)</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main)' }}>
                Bs. {Number(stats?.total_spent || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </div>
            </div>
          </div>
          <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--color-primary)', opacity: 0.1, position: 'absolute' }}></div>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
              <ShoppingBag size={24} />
            </div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Total de Órdenes</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main)' }}>
                {stats?.total_purchases || 0} compras
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-main)' }}>Historial de Compras (Últimas 20)</h3>
        </div>
        <div className="table-wrapper">
          <table className="suppliers-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>N° Factura</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {supplier.purchases && supplier.purchases.length > 0 ? (
                supplier.purchases.map(purchase => (
                  <tr key={purchase.id}>
                    <td>{new Date(purchase.created_at).toLocaleDateString()}</td>
                    <td>{purchase.invoice_number || 'S/F'}</td>
                    <td>
                      <span className={`status-badge ${purchase.status === 'completed' ? 'status-success' : 'status-warning'}`}>
                        {purchase.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      Bs. {Number(purchase.total || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No hay compras registradas para este proveedor.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
