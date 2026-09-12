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
        let group = "";
    const name = p.name;
    
    if (name.includes('sale') || name.includes('loyalty')) group = "Ventas";
    else if (name.includes('order')) group = "Pedidos y Envíos";
    else if (name.includes('return')) group = "Devoluciones";
    else if (name.includes('cart')) group = "Carritos y Proformas";
    else if (name.includes('inventory')) group = "Inventario";
    else if (name.includes('product') || name.includes('categor') || name.includes('discount')) group = "Catálogo de Productos";
    else if (name.includes('finance') || name.includes('cashflow') || name.includes('expense') || name.includes('salary') || name.includes('salaries')) group = "Finanzas y Salarios";
    else if (name.includes('user') || name.includes('role') || name.includes('executive')) group = "Usuarios y Roles";
    else if (name.includes('owner')) group = "Socios / Dueños";
    else if (name.includes('purchase') || name.includes('supplier')) group = "Compras y Proveedores";
    else if (name.includes('branch')) group = "Sucursales";
    else if (name.includes('giftcard')) group = "Giftcards";
    else if (name.includes('promotion')) group = "Promociones";
    else if (name.includes('setting')) group = "Ajustes y Configuración";
    else if (name.includes('audit')) group = "Auditoría";
    else group = "Ajustes y Configuración";
    if (!acc[group]) acc[group] = [];
    acc[group].push(p);
    return acc;
  }, {});

  return (
    <div className="permissions-container">
      <div className="permissions-header-container">
        <div className="permissions-header-title-row">
          <div className="permissions-header-icon-box">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="permissions-header-title">Lista de Permisos</h1>
            <p className="permissions-header-subtitle">
              Visualiza la base de seguridad y restricciones del sistema.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="permissions-loading">Cargando permisos...</div>
      ) : (
        <div className="permissions-groups">
          {Object.keys(groupedPermissions).map((groupName) => (
            <div key={groupName} className="perm-group-card">
              <div className="perm-group-header">
                <h4 className="perm-group-title">
                  {groupName}
                </h4>
                <span className="perm-group-count">
                  {groupedPermissions[groupName].length} Permisos
                </span>
              </div>
              <div className="perm-items-grid">
                {groupedPermissions[groupName].map(p => (
                  <div 
                    key={p.id} 
                    className="perm-item"
                  >
                    <div className="perm-item-icon">
                      <Key size={12} color="var(--text-muted)" />
                    </div>
                    <span className="perm-item-label">
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