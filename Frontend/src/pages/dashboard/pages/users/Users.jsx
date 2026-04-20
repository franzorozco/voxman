import { useEffect, useState } from "react";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../../../../api/users";
import api from "../../../../api/client";
import "./Users.css";
import SoftDeleteModal from "./SoftDeleteModal";

import UsersTable from "./UsersTable";
import UserForm from "./UserForm";

const authUser = JSON.parse(localStorage.getItem("user"));

export default function Users() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    status: "all",      
    type: "all",       
    role: "all",
    sort: "created_at_desc",
    minPoints: "",
    maxPoints: "",
    groupBy: "none",
  });
    const [softDeleteModal, setSoftDeleteModal] = useState({
  open: false,
  data: null,
  formData: null,
});
    
const loadUsers = async () => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      console.warn("No hay token");
      setUsers([]); // importante evitar UI rota
      return;
    }

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
      await deleteUser(id);
      await loadUsers();
    } catch (error) {
      throw error; // 🔥 CLAVE: dejar que UserForm lo reciba
    }
  };

const handleSubmit = async (data) => {
  try {
    if (selectedUser) {
      // 🔵 UPDATE NORMAL
      await updateUser(selectedUser.id, data);

    } else {
      // 🟢 CREATE CON CONTROL DE SOFT DELETE
      try {
        await createUser(data);

      } catch (err) {

        if (err.response?.status === 409 && err.response.data.soft_deleted) {

          setSoftDeleteModal({
            open: true,
            data: err.response.data.user, // 👈 backend debe enviar usuario
            formData: data, // 👈 lo que intentabas guardar
          });

          return; // 🚨 IMPORTANTE (detiene flujo)
        }

        throw err;
      }
    }

    setOpen(false);
    await loadUsers();

  } catch (error) {
    throw error; // 🔥 CLAVE: dejar que UserForm lo reciba
  }
};

const handleRestore = async (data) => {
  try {
    await createUser({
      ...data,
      action: "restore"
    });

    setSoftDeleteModal({ open: false, data: null, formData: null });
    setOpen(false);
    await loadUsers();

  } catch (error) {
    console.error("ERROR RESTORE:", error.response?.data);
  }


  setSoftDeleteModal({ open: false, data: null, formData: null });
  setOpen(false);
  await loadUsers();
};

const handleOverwrite = async (data) => {
  await createUser({
    ...data,
    action: "overwrite"
  });

  setSoftDeleteModal({ open: false, data: null, formData: null });
  setOpen(false);
  await loadUsers();
};


  const generatePdf = async () => {
    try {
      const res = await api.get("/users/report/pdf", {
        params: {
          search,
          status: filters.status,
          type: filters.type,
          role: filters.role,
          sort: filters.sort,
          minPoints: filters.minPoints,
          maxPoints: filters.maxPoints,
        },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(res.data);

      const link = document.createElement("a");
      link.href = url;
      link.download = "reporte-usuarios.pdf";

      document.body.appendChild(link);
      link.click();
      link.remove();

    } catch (error) {
      console.error("ERROR PDF:", error.response?.data || error.message);

      // 🔥 DEBUG REAL
      console.log("TOKEN:", localStorage.getItem("token"));
    }
  };



  const generateUserPdf = async (userId) => {
    const token = localStorage.getItem("token");

    const res = await api.get(`/users/${userId}/pdf`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");

    link.href = url;
    link.download = `usuario_${userId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };


  return (
    <div className="users-container">

        <div className="users-header">
          <h1 className="users-title">Usuarios</h1>

          <div className="users-actions">
            <button className="btn-primary" onClick={handleCreate}>
              + Crear usuario
            </button>

            <button className="btn-secondary" onClick={generatePdf}>
              Exportar PDF
            </button>
          </div>
        </div>

      <UsersTable
        users={users}
        onEdit={handleEdit}
        onDelete={handleDelete}
        search={search}
        setSearch={setSearch}
        filters={filters}
        setFilters={setFilters}
        generateUserPdf={generateUserPdf}
        authUser={authUser}
      />

      {open && (
        <UserForm
          user={selectedUser}
          onClose={() => setOpen(false)}
          onSubmit={handleSubmit}
        />
      )
      
      }
      {softDeleteModal.open && (
      <SoftDeleteModal
        data={softDeleteModal.data}
        formData={softDeleteModal.formData}
        onClose={() =>
          setSoftDeleteModal({ open: false, data: null, formData: null })
        }
        onRestore={handleRestore}
        onOverwrite={handleOverwrite}
      />
    )}


    </div>
  );
}