import { useEffect, useState } from "react";
import { getPermissions } from "../../../../api/admin/permissions";
import { Key, Shield } from "lucide-react";
import "./Permissions.css";

export default function Permissions() {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPermissions = async () => {
    try {
      const res = await getPermissions();
      setPermissions(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, []);

  const uniquePermissions = Array.from(new Map(permissions.map(p => [p.name, p])).values());

  const groupedPermissions = uniquePermissions.reduce((acc, p) => {
    let group = "Otros";
    const name = p.name;
    
    if (name.includes('sale')) group = "Ventas";
    else if (name.includes('return')) group = "Devoluciones";
    else if (name.includes('cart')) group = "Carritos y Proformas";
    else if (name.includes('inventory')) group = "Inventario";
    else if (name.includes('product') || name.includes('categor') || name.includes('discount')) group = "Catálogo de Productos";
    else if (name.includes('salary') || name.includes('salaries') || name.includes('finance') || name.includes('cashflow') || name.includes('expense') || name.includes('owner_payment')) group = "Finanzas y Salarios";
    else if (name.includes('user') || name.includes('role') || name.includes('executive')) group = "Usuarios y Roles";
    else if (name.includes('purchase') || name.includes('supplier')) group = "Compras y Proveedores";
    else if (name.includes('branch')) group = "Sucursales";
    else if (name.includes('giftcard')) group = "Giftcards";
    else if (name.includes('promotion')) group = "Promociones";
    else if (name.includes('setting')) group = "Ajustes y Configuración";
    
    if (!acc[group]) acc[group] = [];
    acc[group].push(p);
    return acc;
  }, {});

  return (
    <div className="permissions-container" style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--bg-input)', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid var(--border-color)' }}>
            <Shield size={24} color="var(--text-main)" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>Lista de Permisos</h1>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '15px' }}>
              Visualiza la base de seguridad y restricciones del sistema.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Cargando permisos...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {Object.keys(groupedPermissions).map((groupName) => (
            <div key={groupName} style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
              <div style={{ background: 'var(--bg-input)', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {groupName}
                </h4>
                <span style={{ background: 'var(--color-primary)', color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: 600 }}>
                  {groupedPermissions[groupName].length} Permisos
                </span>
              </div>
              <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                {groupedPermissions[groupName].map(p => (
                  <div 
                    key={p.id} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px', 
                      padding: '12px 16px', 
                      borderRadius: '12px', 
                      border: '1px solid var(--border-color)', 
                      background: 'transparent',
                      transition: 'all 0.2s' 
                    }}
                  >
                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <Key size={12} color="var(--text-muted)" />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-main)' }}>
                      {p.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}