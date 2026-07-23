import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { createGiftcard, reloadGiftcard } from "../../../../api/admin/giftcards";
import api from "../../../../api/client";
import toast from "react-hot-toast";
import AsyncSelect from "react-select/async";
import Spinner from "../../components/Spinner/Spinner";

const customStyles = {
  menuPortal: base => ({ ...base, zIndex: 99999 }),
  control: (base) => ({
    ...base,
    backgroundColor: 'var(--bg-input)',
    borderColor: 'var(--border-color)',
    color: 'var(--text-main)',
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    zIndex: 99999,
  }),
  option: (base, state) => ({
    ...base,
    background: state.isFocused ? 'var(--bg-overlay)' : 'var(--bg-card)',
    color: 'var(--text-main)',
  }),
  singleValue: (base) => ({
    ...base,
    color: 'var(--text-main)',
  }),
  input: (base) => ({
      ...base,
      color: 'var(--text-main)',
  })
};

export default function GiftcardModal({ isOpen, onClose, onSuccess, mode, giftcard }) {
  const generateRandomCode = () => {
    return 'VOX-' + Math.floor(100000 + Math.random() * 900000);
  };
  const addMonths = (months) => {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [code, setCode] = useState(generateRandomCode());
  const [amount, setAmount] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [presetDuration, setPresetDuration] = useState("1m");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && mode !== "reload") {
      setCode(generateRandomCode());
      setExpiresAt(addMonths(1));
      setPresetDuration("1m");
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const isReload = mode === "reload";

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (parseFloat(amount) < (isReload ? 1 : 50)) {
      toast.error(`El monto mínimo es ${isReload ? '1Bs' : '50Bs'}`);
      return;
    }

    setLoading(true);
    try {
      if (isReload) {
        await reloadGiftcard(giftcard.id, { amount: parseFloat(amount) });
        toast.success("Giftcard recargada exitosamente");
      } else {
        await createGiftcard({ 
          code: code,
          amount: parseFloat(amount),
          expires_at: expiresAt ? expiresAt : null,
          purchaser_id: selectedCustomer ? selectedCustomer.value : null
        });
        toast.success("Giftcard emitida exitosamente");
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Ocurrió un error al procesar la operación");
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = (inputValue, callback) => {
    if (!inputValue) return callback([]);
    api.get(`/v1/admin/customers?search=${inputValue}`).then(res => {
      const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
      callback(data.map(c => {
        const profile = c.user?.profile || {};
        return { value: c.id, label: `${profile.first_name || ''} ${profile.last_name_paternal || ''} (${c.customer_code || 'S/C'})`.trim() };
      }));
    }).catch(() => callback([]));
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '500px' }}>
        <h2 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0, padding: '24px 30px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '20px', fontWeight: '600' }}>
          {isReload ? `Recargar Giftcard: ${giftcard?.code}` : "Emitir Nueva Giftcard"}
          <button type="button" className="btn-secondary" style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={onClose}>
            <X size={20} />
          </button>
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '24px', flex: 1 }}>
            
            <div className="form-group">
              <label>Monto a {isReload ? 'recargar' : 'cargar'} (Bs) *</label>
              <input
                type="number"
                step="0.01"
                min={isReload ? "1" : "50"}
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Ej. ${isReload ? '20' : '100'}`}
              />
            </div>

            {!isReload && (
              <>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label>Código de Giftcard *</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      required
                      value={code}
                      maxLength={10}
                      onChange={(e) => {
                        let val = e.target.value.toUpperCase();
                        if (!val.startsWith('VOX-')) val = 'VOX-';
                        const rest = val.substring(4).replace(/[^0-9]/g, '');
                        setCode('VOX-' + rest.substring(0, 6));
                      }}
                      placeholder="VOX-123456"
                      style={{ flex: 1, letterSpacing: '1px', fontWeight: 'bold' }}
                    />
                    <button type="button" className="btn-secondary" onClick={() => setCode(generateRandomCode())} style={{ padding: '0 16px', borderRadius: '8px', cursor: 'pointer', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}>
                      Generar
                    </button>
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '16px' }}>
                  <label>Asignar Comprador (Búsqueda Asyncrona)</label>
                  <AsyncSelect
                    isClearable
                    cacheOptions
                    loadOptions={loadCustomers}
                    value={selectedCustomer}
                    onChange={setSelectedCustomer}
                    placeholder="Escribe para buscar un cliente..."
                    noOptionsMessage={() => "Escribe para buscar..."}
                    styles={customStyles}
                    menuPosition="fixed"
                  />
                  <small style={{ color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Opcional. Deja vacío si se vende de forma anónima.
                  </small>
                </div>

                <div className="form-group" style={{ marginTop: '16px' }}>
                  <label>Fecha de expiración (Opcional)</label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <button 
                      type="button" 
                      className="btn-secondary" 
                      style={{ flex: 1, padding: '6px', fontSize: '0.85rem', borderRadius: '6px', border: presetDuration === '1m' ? '1px solid var(--color-primary)' : '1px solid var(--border-color)', background: presetDuration === '1m' ? 'var(--bg-overlay)' : 'transparent', color: presetDuration === '1m' ? 'var(--color-primary)' : 'var(--text-muted)' }}
                      onClick={() => { setPresetDuration('1m'); setExpiresAt(addMonths(1)); }}
                    >
                      1 Mes
                    </button>
                    <button 
                      type="button" 
                      className="btn-secondary" 
                      style={{ flex: 1, padding: '6px', fontSize: '0.85rem', borderRadius: '6px', border: presetDuration === '1y' ? '1px solid var(--color-primary)' : '1px solid var(--border-color)', background: presetDuration === '1y' ? 'var(--bg-overlay)' : 'transparent', color: presetDuration === '1y' ? 'var(--color-primary)' : 'var(--text-muted)' }}
                      onClick={() => { setPresetDuration('1y'); setExpiresAt(addMonths(12)); }}
                    >
                      1 Año
                    </button>
                    <button 
                      type="button" 
                      className="btn-secondary" 
                      style={{ flex: 1, padding: '6px', fontSize: '0.85rem', borderRadius: '6px', border: presetDuration === '5y' ? '1px solid var(--color-primary)' : '1px solid var(--border-color)', background: presetDuration === '5y' ? 'var(--bg-overlay)' : 'transparent', color: presetDuration === '5y' ? 'var(--color-primary)' : 'var(--text-muted)' }}
                      onClick={() => { setPresetDuration('5y'); setExpiresAt(addMonths(60)); }}
                    >
                      5 Años
                    </button>
                    <button 
                      type="button" 
                      className="btn-secondary" 
                      style={{ flex: 1, padding: '6px', fontSize: '0.85rem', borderRadius: '6px', border: presetDuration === 'custom' ? '1px solid var(--color-primary)' : '1px solid var(--border-color)', background: presetDuration === 'custom' ? 'var(--bg-overlay)' : 'transparent', color: presetDuration === 'custom' ? 'var(--color-primary)' : 'var(--text-muted)' }}
                      onClick={() => { setPresetDuration('custom'); }}
                    >
                      Otra
                    </button>
                  </div>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => {
                      setExpiresAt(e.target.value);
                      setPresetDuration('custom');
                    }}
                  />
                </div>
              </>
            )}
          </div>

          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'var(--bg-card)', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
            <button type="button" className="btn-secondary" style={{ padding: '10px 20px', borderRadius: '6px', fontWeight: 500, cursor: 'pointer', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)' }} onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" style={{ padding: '10px 20px', borderRadius: '6px', fontWeight: 500, cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '160px' }} disabled={loading}>
              {loading ? <Spinner size={20} color="#ffffff" trackColor="rgba(255,255,255,0.3)" borderWidth={2} /> : (isReload ? "Recargar Saldo" : "Emitir Giftcard")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
