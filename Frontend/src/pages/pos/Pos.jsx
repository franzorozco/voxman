import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { usePosStore } from '../../store/pos/usePosStore';
import { useThemeStore } from '../../store/themeStore';
import { UserCircle2, ChevronDown, LogOut, LayoutDashboard, Store, X, Sun, Moon } from 'lucide-react';
import api from '../../api/client';
import './Pos.css';

const Pos = () => {
    const { user, logout } = useAuthStore();
    const { branchId, branchName, setBranchId } = usePosStore();
    const { isDark, toggleTheme } = useThemeStore();
    const navigate = useNavigate();
    
    const [showDropdown, setShowDropdown] = useState(false);
    const [showBranchModal, setShowBranchModal] = useState(false);
    const [branches, setBranches] = useState([]);
    const [loadingBranches, setLoadingBranches] = useState(false);

    const hasSellAll = user?.permissions?.includes('sell_all_branches');
    const hasSellOwn = user?.permissions?.includes('sell_own_branch');

    useEffect(() => {
        if (!user) return;
        
        // Guardia de seguridad
        if (!hasSellAll && !hasSellOwn) {
            navigate('/dashboard');
            return;
        }

        // Auto-asignar sucursal si es empleado y no tiene permiso global
        if (hasSellOwn && !hasSellAll && user.employee) {
            setBranchId(user.employee.branch_id, user.employee.branch?.name || 'Sucursal Asignada');
        }

        // Si es admin y no ha seleccionado sucursal, podríamos forzar a abrir el modal
        if (hasSellAll && !branchId) {
            fetchBranches();
            setShowBranchModal(true);
        }
    }, [user, hasSellAll, hasSellOwn, navigate, branchId, setBranchId]);

    const fetchBranches = async () => {
        try {
            setLoadingBranches(true);
            const { data } = await api.get('/v1/admin/branches');
            // Assuming response is directly the array or paginated data.
            // In typical Laravel API it might be data.data
            const branchList = Array.isArray(data) ? data : (data.data || []);
            setBranches(branchList);
        } catch (error) {
            console.error("Error al obtener sucursales:", error);
        } finally {
            setLoadingBranches(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const openBranchModal = () => {
        setShowDropdown(false);
        fetchBranches();
        setShowBranchModal(true);
    };

    const selectBranch = (branch) => {
        setBranchId(branch.id, branch.name);
        setShowBranchModal(false);
    };

    // Prevent rendering if unauthorized (prevents flashing)
    if (!user || (!hasSellAll && !hasSellOwn)) {
        return null; 
    }

    return (
        <div className="pos-layout">
            <header className="flex items-center justify-between px-8 py-4 bg-[var(--bg-main)] text-[var(--text-main)] shrink-0">
                <div className="flex items-center gap-3">
                    <div className="text-2xl font-bold tracking-wider">VOXman POS</div>
                    <span className="px-3 py-1 text-xs font-medium border border-[var(--color-primary)] rounded-full">
                        {branchName || 'Seleccione Sucursal'}
                    </span>
                </div>

                <div className="relative flex items-center gap-6">
                    {/* Botón de Tema */}
                    <button 
                        onClick={toggleTheme}
                        className="p-2 rounded-full hover:bg-[var(--color-primary)] hover:text-[var(--color-primary-text)] transition-colors focus:outline-none"
                        title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                    >
                        {isDark ? <Sun size={24} /> : <Moon size={24} />}
                    </button>

                    <button 
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity focus:outline-none"
                    >
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold">{user?.username || "Cajero Invitado"}</p>
                            <p className="text-xs opacity-70">{hasSellAll ? "Administrador" : "Vendedor"}</p>
                        </div>
                        <UserCircle2 size={36} strokeWidth={1.5} />
                        <ChevronDown size={16} className={`transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showDropdown && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                            <div className="absolute top-full right-0 mt-3 w-56 bg-[var(--bg-main)] border border-[var(--color-primary)] rounded-xl shadow-2xl z-50 overflow-hidden">
                                <div className="p-4 border-b border-[var(--color-primary)]/20">
                                    <p className="text-sm font-bold truncate">{user?.email}</p>
                                    <p className="text-xs opacity-70 mt-1">Turno Activo</p>
                                </div>
                                <div className="py-2">
                                    <button 
                                        onClick={() => { setShowDropdown(false); navigate('/dashboard'); }}
                                        className="w-full px-4 py-2 text-sm flex items-center gap-3 hover:bg-[var(--color-primary)] hover:text-[var(--color-primary-text)] transition-colors text-left"
                                    >
                                        <LayoutDashboard size={16} />
                                        <span>Volver al Dashboard</span>
                                    </button>
                                    
                                    {hasSellAll && (
                                        <button 
                                            className="w-full px-4 py-2 text-sm flex items-center gap-3 hover:bg-[var(--color-primary)] hover:text-[var(--color-primary-text)] transition-colors text-left"
                                            onClick={openBranchModal}
                                        >
                                            <Store size={16} />
                                            <span>Cambiar Sucursal</span>
                                        </button>
                                    )}

                                    <button 
                                        onClick={handleLogout}
                                        className="w-full px-4 py-2 text-sm flex items-center gap-3 text-red-500 hover:bg-red-500 hover:text-white transition-colors text-left"
                                    >
                                        <LogOut size={16} />
                                        <span>Cerrar Sesión</span>
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </header>

            <main className="flex-1 flex flex-col relative overflow-hidden">
                {!branchId && hasSellAll ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <Store size={64} className="opacity-20 mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Bienvenido al POS</h2>
                        <p className="opacity-70 mb-6">Debes seleccionar una sucursal para comenzar a operar.</p>
                        <button 
                            onClick={openBranchModal}
                            className="px-6 py-3 bg-[var(--color-primary)] text-[var(--color-primary-text)] rounded-xl font-semibold hover:opacity-90 transition-opacity"
                        >
                            Seleccionar Sucursal
                        </button>
                    </div>
                ) : (
                    <Outlet />
                )}
            </main>

            {/* Modal de Selección de Sucursal */}
            {showBranchModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                    <div className="bg-[var(--bg-main)] text-[var(--text-main)] w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between p-8 pb-4">
                            <h3 className="text-xl font-bold flex items-center gap-3">
                                <Store size={24} className="opacity-80" />
                                Seleccionar Sucursal
                            </h3>
                            {branchId && (
                                <button onClick={() => setShowBranchModal(false)} className="hover:opacity-70 transition-opacity p-2 rounded-full hover:bg-[var(--bg-card)]">
                                    <X size={24} />
                                </button>
                            )}
                        </div>
                        <div className="p-6 pt-2 max-h-[60vh] overflow-y-auto">
                            {loadingBranches ? (
                                <div className="text-center py-8 opacity-70">Cargando sucursales...</div>
                            ) : branches.length === 0 ? (
                                <div className="text-center py-8 opacity-70">No hay sucursales disponibles.</div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {branches.map(branch => (
                                        <button
                                            key={branch.id}
                                            onClick={() => selectBranch(branch)}
                                            className={`p-5 rounded-2xl text-left transition-all duration-200 ${
                                                branch.id === branchId 
                                                    ? 'bg-[var(--color-primary)] text-[var(--color-primary-text)] shadow-lg scale-[1.02]' 
                                                    : 'bg-[var(--bg-card)] hover:bg-[var(--color-primary)] hover:text-[var(--color-primary-text)] hover:scale-[1.02]'
                                            }`}
                                        >
                                            <p className="font-bold text-lg">{branch.name}</p>
                                            {branch.address && (
                                                <p className={`text-sm mt-1 ${branch.id === branchId ? 'opacity-90' : 'opacity-60 group-hover:opacity-90'}`}>
                                                    {typeof branch.address === 'string' ? branch.address : `${branch.address.street || ''}, ${branch.address.city || ''}`}
                                                </p>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Pos;
