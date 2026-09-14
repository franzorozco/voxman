import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { X, Search } from 'lucide-react';

const POPULAR_ICONS = [
  'Truck', 'MessageCircle', 'PackageCheck', 'UserPlus', 'Star', 'ShieldCheck',
  'Smartphone', 'MapPin', 'CreditCard', 'Clock', 'Gift', 'ShoppingBag', 'Tag',
  'Heart', 'Zap', 'Award', 'ThumbsUp', 'Smile', 'Headset', 'CheckCircle',
  'Calendar', 'Camera', 'Box', 'Activity', 'Anchor', 'Bell', 'Briefcase',
  'Coffee', 'Compass', 'DollarSign', 'Eye', 'Feather', 'Flag', 'Globe',
  'Key', 'LifeBuoy', 'Lock', 'Mail', 'Monitor', 'Navigation', 'Paperclip',
  'Percent', 'Phone', 'Send', 'Settings', 'Shield', 'ShoppingBasket',
  'ShoppingCart', 'Store', 'Sun', 'Target', 'Tool', 'TrendingUp', 'Unlock',
  'Upload', 'User', 'UserCheck', 'Users', 'Video', 'Watch', 'Wifi',
  'Map', 'Home', 'Info', 'HelpCircle', 'AlertCircle', 'AlertTriangle'
];

export default function IconPickerModal({ isOpen, onClose, onSelect }) {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredIcons = POPULAR_ICONS.filter(name => 
    name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(0,0,0,0.6)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 20,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: 'var(--bg-card, #fff)',
        border: '1px solid var(--border-color, #ccc)',
        borderRadius: 16, width: '100%', maxWidth: 500,
        maxHeight: '80vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-main, #000)' }}>Seleccionar Ícono</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4 }}>
            <X size={20} />
          </button>
        </div>
        
        {/* Search */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-muted, #888)' }} />
            <input 
              type="text" 
              placeholder="Buscar icono por nombre..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
              style={{ 
                width: '100%', padding: '8px 12px 8px 36px', 
                borderRadius: 8, border: '1px solid var(--border-color)',
                background: 'var(--bg-input, #f9f9f9)', color: 'var(--text-main)',
                outline: 'none', boxSizing: 'border-box', fontSize: 14
              }}
            />
          </div>
        </div>

        {/* Grid */}
        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
          {filteredIcons.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>No se encontraron iconos.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))', gap: 12 }}>
              {filteredIcons.map(name => {
                const IconComp = Icons[name];
                if (!IconComp) return null;
                return (
                  <button 
                    key={name}
                    onClick={() => { onSelect(name); onClose(); }}
                    title={name}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: 8, padding: 12, borderRadius: 10, background: 'var(--bg-overlay, #f5f5f5)',
                      border: '1px solid var(--border-color)', cursor: 'pointer',
                      color: 'var(--text-main)', transition: 'all 0.2s',
                      aspectRatio: '1/1'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary, #000)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                  >
                    <IconComp size={26} strokeWidth={1.5} />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
