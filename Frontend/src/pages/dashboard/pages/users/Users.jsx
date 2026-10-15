import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Trash2,
  Plus,
  Download,
  RefreshCw,
  Users as UsersIcon,
  UserCheck,
  UserX,
  Shield,
  ShieldCheck,
  Globe,
  Store,
  Laptop,
  Award,
} from "lucide-react";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  restoreUser,
} from "../../../../api/admin/users";
import api from "../../../../api/client";
import "./Users.css";
import UserForm from "./UserForm";
import SoftDeleteModal from "./SoftDeleteModal";
import CanAccess from "../../../../components/ui/CanAccess";
import UsersTable from "./UsersTable";
import { GoogleIcon } from "./userHelpers";

const authUser = JSON.parse(localStorage.getItem("user"));

export default function Users() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    status: "all",      
    type: "all",       
    role: "all",
    sort: "created_at_desc",
    minPoints: "",
    maxPoints: "",
    groupBy: "none",
    verification: "all",
    origin: "all",
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

        if (err.response?.status === 409 && err.response.data.type === "restore") {

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
    throw error;
  }
};

const handleRestore = async (data) => {
  try {
    await restoreUser(softDeleteModal.data.id); // 👈 SOLO RESTORE REAL

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
  try {
    await createUser({
      ...data,
      action: "overwrite"
    });

    setSoftDeleteModal({ open: false, data: null, formData: null });
    setOpen(false);
    await loadUsers();

  } catch (error) {
    console.error("ERROR OVERWRITE:", error.response?.data);
  }
};


  const generatePdf = async () => {
    try {
      const res = await api.get("/v1/admin/users/report/pdf", {
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

    const res = await api.get(`/v1/admin/users/${userId}/pdf`, {
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


  const userStats = useMemo(() => {
    const list = Array.isArray(users) ? users : [];
    const total = list.length;
    const active = list.filter((u) => u.is_active).length;
    const inactive = list.filter((u) => !u.is_active).length;
    const verified = list.filter((u) => Boolean(u.email_verified_at || u.google_id)).length;
    const pendingVerification = list.filter(
      (u) => !u.email_verified_at && !u.google_id && !u.email?.includes("@guest")
    ).length;
    const googleUsers = list.filter((u) => Boolean(u.google_id)).length;
    const posUsers = list.filter(
      (u) =>
        (u.email && u.email.includes("@guest")) ||
        u.customer?.customer_code?.startsWith("CLI-POS") ||
        u.registration_source === "pos" ||
        u.source === "store" ||
        u.source === "pos"
    ).length;
    const webUsers = Math.max(0, total - posUsers);
    const customers = list.filter((u) => u.customer?.is_active).length;
    const employees = list.filter((u) => u.employee?.is_active).length;

    return {
      total,
      active,
      inactive,
      verified,
      pendingVerification,
      googleUsers,
      posUsers,
      webUsers,
      customers,
      employees,
    };
  }, [users]);

  return (
    <div className="users-container">

        <div className="users-header">
  <h1 className="users-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <UsersIcon size={26} style={{ color: 'var(--color-primary)' }} />
    Usuarios
  </h1>
  
  <div style={{ display: 'flex', gap: '8px', width: isMobile ? '100%' : 'auto' }}>
    <CanAccess permission="view_users">
      <Link 
        to="/dashboard/users/deleted"
        className="btn-secondary" 
        style={{ flex: isMobile ? 1 : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none', padding: '10px' }}
        title="Papelera"
      >
        <Trash2 size={18} />
        {!isMobile && "Papelera"}
      </Link>
    </CanAccess>
    <CanAccess permission="view_users">
      <button 
        className="btn-secondary" 
        onClick={generatePdf}
        style={{ flex: isMobile ? 1 : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px' }}
        title="Exportar PDF"
      >
        <Download size={18} />
        {!isMobile && "Exportar PDF"}
      </button>
    </CanAccess>
    <CanAccess permission="create_users">
      <button 
        className="btn-primary" 
        onClick={handleCreate}
        style={{ flex: isMobile ? 1 : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px' }}
        title="Crear usuario"
      >
        <Plus size={18} />
        {!isMobile && "Crear usuario"}
      </button>
    </CanAccess>
    <button 
      className="btn-secondary" 
      onClick={loadUsers}
      style={{ flex: isMobile ? 1 : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px' }}
      title="Actualizar"
    >
      <RefreshCw size={18} />
      {!isMobile && "Actualizar"}
    </button>
  </div>
</div>

      {/* KPI Cards Normalizados */}
      <div className="users-kpi-grid">
        <div className="users-kpi-card kpi-total">
          <div className="users-kpi-top">
            <span className="users-kpi-value">{userStats.total}</span>
          </div>
          <div className="users-kpi-bottom">
            <div className="users-kpi-icon-mini">
              <UsersIcon size={14} />
            </div>
            <span className="users-kpi-label">Total Usuarios</span>
          </div>
        </div>

        <div className="users-kpi-card kpi-active">
          <div className="users-kpi-top">
            <span className="users-kpi-value">{userStats.active}</span>
          </div>
          <div className="users-kpi-bottom">
            <div className="users-kpi-icon-mini">
              <UserCheck size={14} />
            </div>
            <span className="users-kpi-label">Usuarios Activos</span>
          </div>
        </div>

        <div className="users-kpi-card kpi-verified">
          <div className="users-kpi-top">
            <span className="users-kpi-value">{userStats.verified}</span>
          </div>
          <div className="users-kpi-bottom">
            <div className="users-kpi-icon-mini">
              <ShieldCheck size={14} />
            </div>
            <span className="users-kpi-label">Emails Verificados</span>
          </div>
        </div>

        <div className="users-kpi-card kpi-customers">
          <div className="users-kpi-top">
            <span className="users-kpi-value">{userStats.customers}</span>
          </div>
          <div className="users-kpi-bottom">
            <div className="users-kpi-icon-mini">
              <Award size={14} />
            </div>
            <span className="users-kpi-label">Clientes Registrados</span>
          </div>
        </div>
      </div>

      {/* Barra de Indicadores y Visualización Rápida (Elegante & Minimalista) */}
      <div className="users-quick-indicators">
        <div className="users-indicator-chip" title="Estado de verificación general">
          <ShieldCheck size={13} className="indicator-icon-verified" />
          <span className="indicator-label">Verificación:</span>
          <span className="indicator-highlight">{userStats.verified} verificadas</span>
          <span className="indicator-divider">•</span>
          <span className="indicator-sub">{userStats.pendingVerification} pendientes (24h)</span>
        </div>

        <div className="users-indicator-chip" title="Distribución de usuarios por canal de acceso">
          <Globe size={13} className="indicator-icon-web" />
          <span className="indicator-label">Canales:</span>
          <span className="indicator-highlight">{userStats.webUsers} Web</span>
          {userStats.googleUsers > 0 && (
            <>
              <span className="indicator-divider">•</span>
              <span className="indicator-sub indicator-google-chip">
                <GoogleIcon size={12} /> {userStats.googleUsers} Google
              </span>
            </>
          )}
          <span className="indicator-divider">•</span>
          <span className="indicator-sub">{userStats.posUsers} POS</span>
        </div>

        <div className="users-indicator-chip" title="Equipo y colaboradores internos">
          <Laptop size={13} className="indicator-icon-staff" />
          <span className="indicator-label">Equipo interno:</span>
          <span className="indicator-highlight">{userStats.employees} colaboradores</span>
          <span className="indicator-divider">•</span>
          <span className="indicator-sub">{userStats.inactive} inactivos</span>
        </div>
      </div>

      <UsersTable
        users={users}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onReload={loadUsers}
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

