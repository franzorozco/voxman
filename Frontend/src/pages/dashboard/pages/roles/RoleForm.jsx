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
    <div className="modal-overlay role-form-overlay">
      <form onSubmit={handleSubmit} className="role-form-modal">
        {/* Header */}
        <div className="role-form-header">
          <h2 className="role-form-title">{role ? "Editar" : "Crear"} Rol</h2>
          <button type="button" onClick={onClose} className="role-form-close-btn">
            <X size={20} />
          </button>
        </div>

        {/* Body (Scrollable) */}
        <div className="role-form-body">
          <div className="role-form-inputs-grid">
            <div className="form-group role-form-group">
              <label className="role-form-label">Nombre del Rol</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Gerente de Ventas"
                required
                className="role-form-input"
                
                
              />
            </div>

            <div className="form-group role-form-group">
              <label className="role-form-label">Asignable a</label>
              <CustomSelect 
                value={roleType} 
                onChange={(e) => setRoleType(e.target.value)}
                className="role-form-input"
              >
                <option value="none">Sin asignación específica (General)</option>
                <option value="employee">Empleados (Staff del sistema)</option>
                <option value="customer">Clientes</option>
              </CustomSelect>
            </div>
          </div>

          <div className="role-form-perms-section">
            <div className="role-form-perms-header">
              <h3 className="role-form-perms-title">Permisos del Sistema</h3>
              <span className="role-form-perms-count">{selectedPermissions.length} seleccionados</span>
            </div>
            
            <div className="role-form-perms-groups">
              {Object.keys(groupedPermissions).map((groupName) => {
                const groupPerms = groupedPermissions[groupName];
                const allSelected = groupPerms.every(p => selectedPermissions.includes(p.name));

                return (
                  <div key={groupName} className="role-perm-group-card">
                    <div className="role-perm-group-header">
                      <h4 className="role-perm-group-title">{groupName}</h4>
                        <button 
                          type="button" 
                          onClick={() => toggleGroup(groupName)}
                          className={`role-perm-group-toggle ${allSelected ? "deselect" : "select"}`}
                        >
                        {allSelected ? 'Deseleccionar Módulo' : 'Seleccionar Todo'}
                      </button>
                    </div>
                    <div className="role-perm-items-grid">
                      {groupPerms.map(p => {
                        const active = selectedPermissions.includes(p.name);
                        return (
                            <div 
                              key={p.id} 
                              onClick={() => togglePermission(p.name)}
                              className={`role-perm-item ${active ? "selected" : ""}`}
                            >
                              <div className="role-perm-checkbox">
                                {active && <Check size={14} color="white" />}
                              </div>
                              <span className="role-perm-label">
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
          <div className="role-form-footer">
            <button type="button" onClick={onClose} disabled={loading} className="role-form-btn cancel">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="role-form-btn submit">
              {loading ? 'Guardando...' : 'Guardar Rol'}
            </button>
          </div>
      </form>
    </div>
  );
}