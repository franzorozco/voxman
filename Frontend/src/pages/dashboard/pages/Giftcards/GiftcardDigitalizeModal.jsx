import { useState } from "react";
import { X, Smartphone } from "lucide-react";
import { digitalizeGiftcard } from "../../../../api/admin/giftcards";
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

export default function GiftcardDigitalizeModal({ isOpen, onClose, onSuccess, giftcard }) {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !giftcard) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedCustomer) {
      toast.error(`Debes seleccionar un cliente`);
      return;
    }

    setLoading(true);
    try {
      await digitalizeGiftcard({ 
        code: giftcard.code,
        customer_id: selectedCustomer.value
      });
      toast.success("Giftcard digitalizada y asignada exitosamente");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Ocurrió un error al procesar la operación");
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Smartphone size={24} className="text-primary" />
            Digitalizar Giftcard
          </div>
          <button type="button" className="btn-secondary" style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={onClose}>
            <X size={20} />
          </button>
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '24px', flex: 1 }}>
            
            <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--bg-overlay)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--text-muted)' }}>
                    Al digitalizar la giftcard <strong>{giftcard.code}</strong>, quedará vinculada permanentemente al cliente seleccionado (propietario digital). El comprador original seguirá registrado para auditoría.
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '13px' }}>
                    <span><strong>Comprador:</strong> {giftcard.purchaser?.user?.profile?.first_name || 'Anónimo'}</span>
                    <span><strong>Saldo Actual:</strong> {giftcard.current_balance} Bs</span>
                </div>
            </div>

            <div className="form-group">
              <label>Seleccionar Propietario Digital *</label>
              <AsyncSelect
                isClearable
                cacheOptions
                defaultOptions
                loadOptions={loadCustomers}
                value={selectedCustomer}
                onChange={setSelectedCustomer}
                placeholder="Busca por nombre o código..."
                noOptionsMessage={() => "Escribe para buscar..."}
                styles={customStyles}
                menuPosition="fixed"
              />
            </div>
          </div>

          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'var(--bg-card)', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
            <button type="button" className="btn-secondary" style={{ padding: '10px 20px', borderRadius: '6px', fontWeight: 500, cursor: 'pointer', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)' }} onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" style={{ padding: '10px 20px', borderRadius: '6px', fontWeight: 500, cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '160px' }} disabled={loading}>
              {loading ? <Spinner size={20} color="#ffffff" trackColor="rgba(255,255,255,0.3)" borderWidth={2} /> : "Digitalizar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
