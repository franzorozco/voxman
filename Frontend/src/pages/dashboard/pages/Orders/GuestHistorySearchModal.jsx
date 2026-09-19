import { useState, useEffect } from "react";
import { X, Search, User, MapPin } from "lucide-react";
import { searchGuests } from "../../../../api/admin/guests";
import GuestDetails from "./GuestDetails";

export default function GuestHistorySearchModal({ onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedGuestId, setSelectedGuestId] = useState(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.length > 2) {
        handleSearch(query);
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSearch = async (q) => {
    setLoading(true);
    try {
      const res = await searchGuests(q);
      setResults(res.data || []);
    } catch (error) {
      console.error("Error searching guests:", error);
    } finally {
      setLoading(false);
    }
  };

  if (selectedGuestId) {
    return <GuestDetails guestId={selectedGuestId} onClose={() => setSelectedGuestId(null)} />;
  }

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div className="modal-content" style={{ background: 'var(--bg-main)', borderRadius: '24px', width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
        
        {/* Header */}
        <div style={{ padding: '24px 30px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Search size={20} color="var(--color-primary)" /> Buscar Historial de Invitado
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Search Input */}
        <div style={{ padding: '20px 30px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Buscar por número de WhatsApp o nombre..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', fontSize: '15px', outline: 'none' }}
              autoFocus
            />
          </div>
          <p style={{ margin: '8px 0 0 10px', fontSize: '12px', color: 'var(--text-muted)' }}>
            Escribe al menos 3 caracteres para buscar.
          </p>
        </div>

        {/* Results */}
        <div style={{ padding: '0 30px 30px 30px', overflowY: 'auto', maxHeight: '400px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Buscando...</div>
          ) : results.length > 0 ? (
            results.map((guest) => (
              <div 
                key={guest.id} 
                onClick={() => setSelectedGuestId(guest.id)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.background = 'var(--bg-overlay)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-card)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ background: 'var(--bg-overlay)', padding: '10px', borderRadius: '50%', color: 'var(--color-primary)' }}>
                    <User size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '15px' }}>{guest.name || 'Sin Nombre'}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>WhatsApp: {guest.whatsapp_phone || 'No registrado'}</div>
                  </div>
                </div>
                <div style={{ color: 'var(--color-primary)', fontSize: '13px', fontWeight: 600 }}>
                  Ver Historial &rarr;
                </div>
              </div>
            ))
          ) : query.length > 2 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
              No se encontraron invitados con "{query}"
            </div>
          ) : null}
        </div>

      </div>
    </div>
  );
}
