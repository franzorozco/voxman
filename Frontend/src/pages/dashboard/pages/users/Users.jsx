import { useEffect, useState } from "react";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../../../../api/users";
import "./Users.css";


import UsersTable from "./UsersTable";
import UserForm from "./UserForm";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [open, setOpen] = useState(false);

  const loadUsers = async () => {
    try {
      const res = await getUsers();
      setUsers(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreate = () => {
    setSelectedUser(null);
    setOpen(true);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      if (!window.confirm("¿Eliminar usuario?")) return;
      await deleteUser(id);
      await loadUsers();
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (data) => {
    try {
      if (selectedUser) {
        await updateUser(selectedUser.id, data);
      } else {
        await createUser(data);
      }

      setOpen(false);
      await loadUsers();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="users-container">

      <div className="users-header">
        <h1 className="users-title">Usuarios</h1>
        <button className="btn-primary" onClick={handleCreate}>
          + Crear usuario
        </button>
      </div>

      <UsersTable
        users={users}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {open && (
        <UserForm
          user={selectedUser}
          onClose={() => setOpen(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}