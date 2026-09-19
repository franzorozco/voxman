import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    MonitorSmartphone, 
    WalletCards, 
    Boxes, 
    BarChart3, 
    Users, 
    RotateCcw 
} from 'lucide-react';

const PosHome = () => {
    const navigate = useNavigate();

    const menuOptions = [
        {
            title: "Punto de Venta",
            icon: MonitorSmartphone,
            path: "/pos/terminal"
        },
        {
            title: "Gestión de Caja",
            icon: WalletCards,
            path: "/pos/caja"
        },
        {
            title: "Catálogo / Inventario",
            icon: Boxes,
            path: "/pos/inventario"
        },
        {
            title: "Resumen de Ventas",
            icon: BarChart3,
            path: "/pos/ventas"
        },
        {
            title: "Clientes",
            icon: Users,
            path: "/pos/clientes"
        },
        {
            title: "Devoluciones",
            icon: RotateCcw,
            path: "/pos/devoluciones"
        }
    ];

    return (
        <div className="flex-1 flex flex-col items-center justify-center bg-[var(--bg-main)] w-full h-full">
            
            {/* The grid is explicitly set to 3 columns, and we constrain the max width to replicate the exact image proportions */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-4xl px-8">
                {menuOptions.map((option, index) => {
                    const Icon = option.icon;
                    return (
                        <button
                            key={index}
                            onClick={() => navigate(option.path)}
                            className="
                                group flex flex-col items-center justify-center 
                                aspect-[2/1] rounded-3xl
                                transition-all duration-200 ease-in-out
                                pos-menu-btn
                            "
                        >
                            <div className="mb-2">
                                <Icon size={32} strokeWidth={1.5} />
                            </div>
                            <span className="text-base font-medium tracking-wide text-current">
                                {option.title}
                            </span>
                        </button>
                    )
                })}
            </div>

        </div>
    );
};

export default PosHome;
