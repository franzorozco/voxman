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
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState({
      status: "all",      // all | active | inactive
      type: "all",        // all | owner | customer
      role: "all",
      sort: "created_at_desc",
      minPoints: "",
      maxPoints: "",
      groupBy: "none",    // none | type | role
    });

    
  const loadUsers = async () => {
    try {
      const res = await getUsers();
      setUsers(res.data);
    } catch (error) {
      console.error("ERROR BACKEND:", error.response?.data || error.message);
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
      console.error("ERROR BACKEND:");
      console.log(error.response?.data);
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
      console.error("ERROR BACKEND:");
      console.log(error.response?.data);
    }
  };

const generatePdf = async () => {
  const params = new URLSearchParams({
    search,
    status: filters.status,
    type: filters.type,
    role: filters.role,
    sort: filters.sort,
    minPoints: filters.minPoints,
    maxPoints: filters.maxPoints,
  });

  const token = localStorage.getItem("token");

  window.open(`http://localhost:8000/api/users/report/pdf?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

  return (
    <div className="users-container">

      <div className="users-header">
        <h1 className="users-title">Usuarios</h1>
        <button className="btn-primary" onClick={handleCreate}>
          + Crear usuario
        </button>
        <button className="btn-primary" onClick={generatePdf}>
          Exportar PDF
        </button>
      </div>

    <UsersTable
      users={users}
      onEdit={handleEdit}
      onDelete={handleDelete}
      search={search}
      setSearch={setSearch}
      filters={filters}
      setFilters={setFilters}
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