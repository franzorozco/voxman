import { useEffect, useState } from "react";
import {
  getPermissions,
  createPermission,
  updatePermission,
  deletePermission,
} from "../../../../api/admin/permissions";

import "./Permissions.css";
import PermissionsTable from "./PermissionsTable";
import PermissionForm from "./PermissionForm";

export default function Permissions() {
  const [permissions, setPermissions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(false);

  const loadPermissions = async () => {
    const res = await getPermissions();
    setPermissions(res.data);
  };

  useEffect(() => {
    loadPermissions();
  }, []);

  const handleCreate = () => {
    setSelected(null);
    setOpen(true);
  };

  const handleSubmit = async (data) => {
    if (selected) {
      await updatePermission(selected.id, data);
    } else {
      await createPermission(data);
    }

    setOpen(false);
    loadPermissions();
  };

  return (
    <div className="permissions-container">
      <div className="permissions-header">
        <h1 className="permissions-title">Permisos</h1>

        <button className="btn-primary" onClick={handleCreate}>
          + Crear Permiso
        </button>
      </div>

      <PermissionsTable
        permissions={permissions}
        onEdit={(p) => {
          setSelected(p);
          setOpen(true);
        }}
        onDelete={async (id) => {
          await deletePermission(id);
          loadPermissions();
        }}
      />

      {open && (
        <PermissionForm
          permission={selected}
          onClose={() => setOpen(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}