import { useRef, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MoreVertical } from "lucide-react";

/**
 * RowDropdown – menú de 3 puntitos con posicionamiento dinámico real.
 * Usa createPortal inyectándolo en el nodo que contiene el tema (.admin-theme)
 * para no perder las variables CSS (--bg-card) pero escapar del overflow.
 */
export default function RowDropdown({ rowId, activeId, setActiveId, children }) {
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const isOpen = activeId === rowId;
  const [portalNode, setPortalNode] = useState(null);

  useEffect(() => {
    // Al igual que CustomSelect, inyectamos en el nodo del tema para heredar colores
    if (typeof document !== "undefined") {
      const node = document.querySelector('.admin-theme') 
                || document.querySelector('.admin-theme-dark') 
                || document.querySelector('.pos-theme') 
                || document.querySelector('.pos-theme-dark') 
                || document.body;
      setPortalNode(node);
    }
  }, []);

  const toggle = (e) => {
    e.stopPropagation();
    setActiveId(isOpen ? null : rowId);
  };

  useLayoutEffect(() => {
    if (!isOpen || !menuRef.current || !btnRef.current) return;

    const menu = menuRef.current;
    const btnRect = btnRef.current.getBoundingClientRect();
    const menuH = menu.offsetHeight;
    const menuW = menu.offsetWidth;

    const spaceBelow = window.innerHeight - btnRect.bottom - 8;
    const spaceAbove = btnRect.top - 8;
    const openUpward = spaceBelow < menuH && spaceAbove > spaceBelow;

    const top = openUpward
      ? Math.max(8, btnRect.top - menuH - 4)
      : Math.min(btnRect.bottom + 4, window.innerHeight - menuH - 8);

    const left = Math.min(
      Math.max(8, btnRect.left),
      window.innerWidth - menuW - 8
    );

    menu.style.top = top + "px";
    menu.style.left = left + "px";
    menu.style.opacity = "1";
    menu.style.pointerEvents = "auto";
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const recalc = () => {
      if (!menuRef.current || !btnRef.current) return;
      const menu = menuRef.current;
      const btnRect = btnRef.current.getBoundingClientRect();
      const menuH = menu.offsetHeight;
      const menuW = menu.offsetWidth;

      const spaceBelow = window.innerHeight - btnRect.bottom - 8;
      const spaceAbove = btnRect.top - 8;
      const openUpward = spaceBelow < menuH && spaceAbove > spaceBelow;

      const top = openUpward
        ? Math.max(8, btnRect.top - menuH - 4)
        : Math.min(btnRect.bottom + 4, window.innerHeight - menuH - 8);

      const left = Math.min(
        Math.max(8, btnRect.left),
        window.innerWidth - menuW - 8
      );

      menu.style.top = top + "px";
      menu.style.left = left + "px";
    };

    window.addEventListener("scroll", recalc, true);
    window.addEventListener("resize", recalc);
    return () => {
      window.removeEventListener("scroll", recalc, true);
      window.removeEventListener("resize", recalc);
    };
  }, [isOpen]);

  return (
    <div style={{ display: "inline-block", position: "relative" }}>
      <button
        ref={btnRef}
        onClick={toggle}
        style={{
          background: "transparent",
          border: "none",
          color: "var(--text-main)",
          padding: "4px",
          margin: 0,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "6px",
        }}
        title="Acciones"
      >
        <MoreVertical size={20} />
      </button>

      {isOpen && portalNode && createPortal(
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 99998 }}
            onClick={(e) => { e.stopPropagation(); setActiveId(null); }}
          />
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: "-9999px",
              left: "-9999px",
              opacity: 0,
              pointerEvents: "none",
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              borderRadius: "8px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
              zIndex: 99999,
              minWidth: "160px",
              display: "flex",
              flexDirection: "column",
              padding: "4px",
            }}
          >
            {children}
          </div>
        </>,
        portalNode
      )}
    </div>
  );
}
