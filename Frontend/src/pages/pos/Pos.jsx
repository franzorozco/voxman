import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { UserCircle2, ChevronDown, LogOut, LayoutDashboard, Store } from 'lucide-react';
import './Pos.css';

const Pos = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="pos-layout">
            {/* Header Global del POS */}
            <header className="flex items-center justify-between px-8 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] shrink-0">
                
                {/* Lado Izquierdo: Branding */}
                <div className="flex items-center gap-3">
                    <div className="text-2xl font-bold tracking-wider">VOXman POS</div>
                    <span className="px-3 py-1 text-xs font-medium border border-[var(--color-primary)] rounded-full">
                        Sucursal Principal
                    </span>
                </div>

                {/* Lado Derecho: Info del Empleado */}
                <div className="relative">
                    <button 
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity focus:outline-none"
                    >
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold">{user?.username || "Cajero Invitado"}</p>
                            <p className="text-xs opacity-70">Vendedor</p>
                        </div>
                        <UserCircle2 size={36} strokeWidth={1.5} />
                        <ChevronDown size={16} className={`transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Menú Desplegable */}
                    {showDropdown && (
                        <>
                            <div 
                                className="fixed inset-0 z-40"
                                onClick={() => setShowDropdown(false)}
                            />
                            <div className="absolute right-0 mt-3 w-56 bg-[var(--bg-main)] border border-[var(--color-primary)] rounded-xl shadow-2xl z-50 overflow-hidden">
                                <div className="p-4 border-b border-[var(--color-primary)]/20">
                                    <p className="text-sm font-bold truncate">{user?.email || "correo@voxman.com"}</p>
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
                                    <button 
                                        className="w-full px-4 py-2 text-sm flex items-center gap-3 hover:bg-[var(--color-primary)] hover:text-[var(--color-primary-text)] transition-colors text-left"
                                        onClick={() => setShowDropdown(false)}
                                    >
                                        <Store size={16} />
                                        <span>Cambiar Sucursal</span>
                                    </button>
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

            {/* Contenido Dinámico */}
            <main className="flex-1 flex flex-col relative overflow-hidden">
                <Outlet />
            </main>
        </div>
    );
};

export default Pos;
