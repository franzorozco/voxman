import { useState, useEffect } from "react";
import { getPermissions } from "../../../../api/admin/permissions";
import { X, Check } from "lucide-react";

import CustomSelect from '../../../../components/ui/CustomSelect';
export default function RoleForm({ role, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [roleType, setRoleType] = useState("none");
  const [permissions, setPermissions] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPermissions();

    if (role) {
      setName(role.name);
      
      if (role.is_employee) setRoleType('employee');
      else if (role.is_customer) setRoleType('customer');
      else setRoleType('none');

      const ids = role.permissions?.map(p => p.name) || [];
      setSelectedPermissions(ids);
    }
  }, [role]);

  const loadPermissions = async () => {
    const res = await getPermissions();
    setPermissions(res.data);
  };

  const togglePermission = (perm) => {
    if (selectedPermissions.includes(perm)) {
      setSelectedPermissions(selectedPermissions.filter(p => p !== perm));
    } else {
      setSelectedPermissions([...selectedPermissions, perm]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    onSubmit({
      name,
      permissions: selectedPermissions,
      is_employee: roleType === 'employee',
      is_customer: roleType === 'customer'
    });
  };

  // Filtrar duplicados por si acaso el backend devuelve permisos repetidos
  const uniquePermissions = Array.from(new Map(permissions.map(p => [p.name, p])).values());

  // Agrupar permisos
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
    else if (name.includes('owner')) group = "Socios / Dueños";
    else if (name.includes('purchase') || name.includes('supplier')) group = "Compras y Proveedores";
    else if (name.includes('branch')) group = "Sucursales";
    else if (name.includes('giftcard')) group = "Giftcards";
    else if (name.includes('promotion')) group = "Promociones";
    else if (name.includes('setting')) group = "Ajustes y Configuración";
    else if (name.includes('audit')) group = "Auditoría";
    
    if (!acc[group]) acc[group] = [];
    acc[group].push(p);
    return acc;
  }, {});

  const toggleGroup = (groupName) => {
    const groupPerms = groupedPermissions[groupName].map(p => p.name);
    const allSelected = groupPerms.every(p => selectedPermissions.includes(p));
    
    if (allSelected) {
      // Deseleccionar todos
      setSelectedPermissions(selectedPermissions.filter(p => !groupPerms.includes(p)));
    } else {
      // Seleccionar todos los faltantes
      const missing = groupPerms.filter(p => !selectedPermissions.includes(p));
      setSelectedPermissions([...selectedPermissions, ...missing]);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, padding: '20px' }}>
      <form onSubmit={handleSubmit} style={{ background: 'var(--bg-card)', borderRadius: '24px', width: '100%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', border: '1px solid var(--border-color)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', animation: 'scaleIn 0.3s ease' }}>
        {/* Header */}
        <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: 'var(--text-main)' }}>{role ? "Editar" : "Crear"} Rol</h2>
          <button type="button" onClick={onClose} style={{ background: 'var(--bg-input)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)', cursor: 'pointer', transition: '0.2s' }} onMouseOver={(e) => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; }} onMouseOut={(e) => { e.currentTarget.style.background = 'var(--bg-input)'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
            <X size={20} />
          </button>
        </div>

        {/* Body (Scrollable) */}
        <div style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text-main)', fontSize: '14px' }}>Nombre del Rol</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Gerente de Ventas"
                required
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', fontSize: '15px', outline: 'none', transition: 'border-color 0.2s' }}
                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text-main)', fontSize: '14px' }}>Asignable a</label>
              <CustomSelect 
                value={roleType} 
                onChange={(e) => setRoleType(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', fontSize: '15px', outline: 'none', transition: 'border-color 0.2s', appearance: 'none', cursor: 'pointer' }}
              >
                <option value="none">Sin asignación específica (General)</option>
                <option value="employee">Empleados (Staff del sistema)</option>
                <option value="customer">Clientes</option>
              </CustomSelect>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>Permisos del Sistema</h3>
              <span style={{ background: 'var(--color-primary)', color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: 600 }}>{selectedPermissions.length} seleccionados</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {Object.keys(groupedPermissions).map((groupName) => {
                const groupPerms = groupedPermissions[groupName];
                const allSelected = groupPerms.every(p => selectedPermissions.includes(p.name));

                return (
                  <div key={groupName} style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                    <div style={{ background: 'var(--bg-input)', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{groupName}</h4>
                      <button 
                        type="button" 
                        onClick={() => toggleGroup(groupName)}
                        style={{ background: allSelected ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)', color: allSelected ? '#ef4444' : '#3b82f6', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                      >
                        {allSelected ? 'Deseleccionar Módulo' : 'Seleccionar Todo'}
                      </button>
                    </div>
                    <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                      {groupPerms.map(p => {
                        const active = selectedPermissions.includes(p.name);
                        return (
                          <div 
                            key={p.id} 
                            onClick={() => togglePermission(p.name)}
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '12px', 
                              padding: '12px 16px', 
                              borderRadius: '12px', 
                              border: `1px solid ${active ? 'var(--color-primary)' : 'var(--border-color)'}`, 
                              background: active ? 'rgba(59, 130, 246, 0.05)' : 'transparent', 
                              cursor: 'pointer', 
                              transition: 'all 0.2s' 
                            }}
                          >
                            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: active ? 'var(--color-primary)' : 'var(--bg-input)', border: `1px solid ${active ? 'var(--color-primary)' : 'var(--border-color)'}`, display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.2s' }}>
                              {active && <Check size={14} color="white" />}
                            </div>
                            <span style={{ fontSize: '14px', fontWeight: active ? 600 : 500, color: active ? 'var(--color-primary)' : 'var(--text-main)', transition: 'all 0.2s' }}>
                              {p.name}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '24px 32px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '16px', background: 'var(--bg-input)', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px' }}>
          <button type="button" onClick={onClose} disabled={loading} style={{ padding: '12px 24px', borderRadius: '12px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
            Cancelar
          </button>
          <button type="submit" disabled={loading} style={{ padding: '12px 32px', borderRadius: '12px', background: 'var(--color-primary)', border: 'none', color: 'var(--color-primary-text)', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {loading ? 'Guardando...' : 'Guardar Rol'}
          </button>
        </div>
      </form>
    </div>
  );
}