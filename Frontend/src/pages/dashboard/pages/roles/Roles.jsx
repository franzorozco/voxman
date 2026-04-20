import { useEffect, useState } from "react";
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
} from "../../../../api/roles";

import "./Roles.css";
import "../css/stylesCruds.css";
import RolesTable from "./RolesTable";
import RoleForm from "./RoleForm";

export default function Roles() {
  const [roles, setRoles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(false);

  const loadRoles = async () => {
    const res = await getRoles();
    setRoles(res.data);
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const handleCreate = () => {
    setSelected(null);
    setOpen(true);
  };

  const handleSubmit = async (data) => {
    if (selected) {
      await updateRole(selected.id, data);
    } else {
      await createRole(data);
    }

    setOpen(false);
    loadRoles();
  };

  return (
    <div className="roles-container">
      <div className="roles-header">
        <h1 className="roles-title">Roles</h1>

        <button className="btn-primary" onClick={handleCreate}>
          + Crear Rol
        </button>
      </div>

      <RolesTable
        roles={roles}
        onEdit={(r) => {
          setSelected(r);
          setOpen(true);
        }}
        onDelete={async (id) => {
          await deleteRole(id);
          loadRoles();
        }}
      />

      {open && (
        <RoleForm
          role={selected}
          onClose={() => setOpen(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}