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
      <div className="modal gift-modal-digitalize">
        <h2 className="gift-modal-header">
          <div className="gift-modal-title-wrapper">
            <Smartphone size={24} className="text-primary" />
            Digitalizar Giftcard
          </div>
          <button type="button" className="gift-modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </h2>

        <form onSubmit={handleSubmit} className="gift-modal-form">
          <div className="gift-modal-body">
            
            <div className="gift-alert-box">
                <p className="gift-alert-text">
                    Al digitalizar la giftcard <strong>{giftcard.code}</strong>, quedará vinculada permanentemente al cliente seleccionado (propietario digital). El comprador original seguirá registrado para auditoría.
                </p>
                <div className="gift-alert-meta">
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

          <div className="gift-modal-footer">
            <button type="button" className="gift-btn-cancel" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary gift-btn-submit" disabled={loading}>
              {loading ? <Spinner size={20} color="#ffffff" trackColor="rgba(255,255,255,0.3)" borderWidth={2} /> : "Digitalizar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
