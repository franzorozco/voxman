import "./HomeConfig.css";
import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { X, Search } from 'lucide-react';
const POPULAR_ICONS = ['Truck', 'MessageCircle', 'PackageCheck', 'UserPlus', 'Star', 'ShieldCheck', 'Smartphone', 'MapPin', 'CreditCard', 'Clock', 'Gift', 'ShoppingBag', 'Tag', 'Heart', 'Zap', 'Award', 'ThumbsUp', 'Smile', 'Headset', 'CheckCircle', 'Calendar', 'Camera', 'Box', 'Activity', 'Anchor', 'Bell', 'Briefcase', 'Coffee', 'Compass', 'DollarSign', 'Eye', 'Feather', 'Flag', 'Globe', 'Key', 'LifeBuoy', 'Lock', 'Mail', 'Monitor', 'Navigation', 'Paperclip', 'Percent', 'Phone', 'Send', 'Settings', 'Shield', 'ShoppingBasket', 'ShoppingCart', 'Store', 'Sun', 'Target', 'Tool', 'TrendingUp', 'Unlock', 'Upload', 'User', 'UserCheck', 'Users', 'Video', 'Watch', 'Wifi', 'Map', 'Home', 'Info', 'HelpCircle', 'AlertCircle', 'AlertTriangle'];
export default function IconPickerModal({
  isOpen,
  onClose,
  onSelect
}) {
  const [search, setSearch] = useState('');
  if (!isOpen) return null;
  const filteredIcons = POPULAR_ICONS.filter(name => name.toLowerCase().includes(search.toLowerCase()));
  return <div className="hc-style-156">
      <div className="hc-style-157">
        {/* Header */}
        <div className="hc-style-158">
          <h3 className="hc-style-159">Seleccionar Ícono</h3>
          <button onClick={onClose} className="hc-style-160">
            <X size={20} />
          </button>
        </div>
        
        {/* Search */}
        <div className="hc-style-161">
          <div className="hc-style-162">
            <Search size={16} className="hc-style-163" />
            <input type="text" placeholder="Buscar icono por nombre..." value={search} onChange={e => setSearch(e.target.value)} autoFocus className="hc-style-164" />
          </div>
        </div>

        {/* Grid */}
        <div className="hc-style-165">
          {filteredIcons.length === 0 ? <div className="hc-style-166">No se encontraron iconos.</div> : <div className="hc-style-167">
              {filteredIcons.map(name => {
            const IconComp = Icons[name];
            if (!IconComp) return null;
            return <button key={name} onClick={() => {
              onSelect(name);
              onClose();
            }} title={name} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary, #000)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'} className="hc-style-168">
                    <IconComp size={26} strokeWidth={1.5} />
                  </button>;
          })}
            </div>}
        </div>
      </div>
    </div>;
}