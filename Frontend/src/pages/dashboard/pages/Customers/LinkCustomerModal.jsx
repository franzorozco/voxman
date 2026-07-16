import React, { useState, useEffect } from 'react';
import { X, Search, User as UserIcon, Link2, CheckCircle } from 'lucide-react';
import { searchUnlinkedUsers, searchPosCustomers, linkUserToCustomer } from '../../../../api/admin/customers';

export default function LinkCustomerModal({ onClose, onSuccess }) {
  const [userQuery, setUserQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  const [customerQuery, setCustomerQuery] = useState('');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Debounce user search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (userQuery.trim().length >= 2) {
        setIsSearchingUsers(true);
        searchUnlinkedUsers(userQuery)
          .then(res => {
            setUsers(res.data);
          })
          .catch(err => console.error("Error buscando usuarios", err))
          .finally(() => setIsSearchingUsers(false));
      } else {
        setUsers([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [userQuery]);

  // Debounce customer search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (customerQuery.trim().length >= 2) {
        setIsSearchingCustomers(true);
        searchPosCustomers(customerQuery)
          .then(res => {
            setCustomers(res.data);
          })
          .catch(err => console.error("Error buscando clientes POS", err))
          .finally(() => setIsSearchingCustomers(false));
      } else {
        setCustomers([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [customerQuery]);

  const handleSubmit = async () => {
    if (!selectedUser || !selectedCustomer) return;
    setIsSubmitting(true);
    setError(null);

    try {
      await linkUserToCustomer({
        user_id: selectedUser.id,
        customer_id: selectedCustomer.id
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al vincular cuentas');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content link-modal-content">
        <div className="link-modal-header">
          <h2 className="link-modal-title">
            <Link2 size={24} color="var(--color-primary)" />
            Vincular Usuario a Cliente POS
          </h2>
          <button onClick={onClose} className="link-modal-close">
            <X size={20} />
          </button>
        </div>

        <div className="link-modal-body">
          {error && (
            <div className="link-modal-error">
              {error}
            </div>
          )}

          <div className="link-modal-grid">
            {/* Left: User Search */}
            <div className="link-search-column">
              <label className="link-search-label">1. Buscar Usuario Web</label>
              <div className="link-search-input-wrapper">
                <Search size={16} className="link-search-icon" />
                <input
                  type="text"
                  placeholder="Buscar por correo..."
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  className="link-search-input"
                />
                {isSearchingUsers && <div className="link-search-loading">Buscando...</div>}
              </div>

              {/* User Results */}
              {users.length > 0 && !selectedUser && (
                <div className="link-results-container">
                  {users.map(u => (
                    <div 
                      key={u.id}
                      onClick={() => { setSelectedUser(u); setUserQuery(''); setUsers([]); }}
                      className="link-result-item"
                    >
                      <span className="link-result-item-main">{u.email}</span>
                      <span className="link-result-item-sub">{u.profile?.first_name ? `${u.profile.first_name} ${u.profile.last_name_paternal || ''}`.trim() : 'Sin nombre de perfil'}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected User */}
              {selectedUser && (
                <div className="link-selected-card link-selected-user">
                  <button onClick={() => setSelectedUser(null)} className="link-selected-close"><X size={16}/></button>
                  <div className="link-selected-content">
                    <div className="link-selected-avatar link-selected-avatar-user">
                      <UserIcon size={18} />
                    </div>
                    <div className="link-selected-info">
                      <span className="link-selected-name">{selectedUser.email}</span>
                      <span className="link-selected-desc">Usuario Web</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Customer Search */}
            <div className="link-search-column">
              <label className="link-search-label">2. Buscar Cliente Caja (POS)</label>
              <div className="link-search-input-wrapper">
                <Search size={16} className="link-search-icon" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o código..."
                  value={customerQuery}
                  onChange={(e) => setCustomerQuery(e.target.value)}
                  className="link-search-input"
                />
                {isSearchingCustomers && <div className="link-search-loading">Buscando...</div>}
              </div>

              {/* Customer Results */}
              {customers.length > 0 && !selectedCustomer && (
                <div className="link-results-container">
                  {customers.map(c => {
                    const prof = c.pos_profile || c.posProfile || {};
                    const fullName = `${prof.first_name || ''} ${prof.last_name_paternal || ''} ${prof.last_name_maternal || ''}`.replace(/\s+/g, ' ').trim() || 'Sin Nombre';
                    
                    return (
                      <div 
                        key={c.id}
                        onClick={() => { setSelectedCustomer(c); setCustomerQuery(''); setCustomers([]); }}
                        className="link-result-item"
                      >
                        <span className="link-result-item-main">{fullName}</span>
                        <span className="link-result-item-sub">Cód: {c.customer_code}</span>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Selected Customer */}
              {selectedCustomer && (
                <div className="link-selected-card link-selected-pos">
                  <button onClick={() => setSelectedCustomer(null)} className="link-selected-close"><X size={16}/></button>
                  <div className="link-selected-content">
                    <div className="link-selected-avatar link-selected-avatar-pos">
                      C
                    </div>
                    <div className="link-selected-info">
                      <span className="link-selected-name">
                        {`${(selectedCustomer.pos_profile || selectedCustomer.posProfile)?.first_name || ''} ${(selectedCustomer.pos_profile || selectedCustomer.posProfile)?.last_name_paternal || ''}`.trim() || 'Sin Nombre'}
                      </span>
                      <span className="link-selected-desc">Cód: {selectedCustomer.customer_code}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="link-modal-note">
            <strong>Nota:</strong> Al vincular, la cuenta Web será la oficial. Los datos del perfil de Caja (POS) que no estén en la cuenta Web serán migrados y luego el perfil de caja se ocultará (se borrará mediante soft-delete). No se perderán puntos ni compras.
          </div>
        </div>

        <div className="link-modal-footer">
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={onClose}
          >
            Cancelar
          </button>
          <button 
            type="button" 
            className="btn-primary link-submit-btn" 
            onClick={handleSubmit}
            disabled={!selectedUser || !selectedCustomer || isSubmitting}
          >
            {isSubmitting ? 'Vinculando...' : 'Confirmar Vinculación'}
          </button>
        </div>
      </div>
    </div>
  );
}
