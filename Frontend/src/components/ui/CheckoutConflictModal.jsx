import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import useShopCartStore from '../../store/shop/useShopCartStore';

const CheckoutConflictModal = ({ isOpen, onClose, conflicts, theme = 'light' }) => {
  const [resolving, setResolving] = useState(false);
  const { removeFromCart } = useShopCartStore();

  if (!isOpen || !conflicts || conflicts.length === 0) return null;

  const currentConflict = conflicts[0]; // Handle one conflict at a time

  const handleKeepItem = async (itemToKeep, itemToRemove) => {
    setResolving(true);
    try {
      // Remove the item the user decided NOT to keep
      await removeFromCart(itemToRemove.product_id, itemToRemove.variant_id, itemToRemove.cart_item_id);
      
      // Close modal to let user click Checkout again
      onClose();
    } catch (error) {
      console.error("Error resolving conflict", error);
    } finally {
      setResolving(false);
    }
  };

  const bgClass = theme === 'dark' ? 'bg-[#1a1a1a] text-white' : 'bg-white text-gray-900';
  const borderClass = theme === 'dark' ? 'border-[#333]' : 'border-gray-200';
  const overlayClass = theme === 'dark' ? 'bg-black/80' : 'bg-black/50';

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 ${overlayClass} backdrop-blur-sm transition-opacity`}>
      <div 
        className={`${bgClass} rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all flex flex-col max-h-[90vh]`}
        style={{ animation: 'modalEnter 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <div className={`flex items-center justify-between p-5 sm:p-6 border-b ${borderClass}`}>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Conflicto de Inventario</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-[#333] text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto">
          <p className={`mb-6 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            Solo tenemos <strong>{currentConflict.available_stock} unidad(es)</strong> de <strong>{currentConflict.name}</strong> en stock, pero has solicitado <strong>{currentConflict.total_requested}</strong> en diferentes partes de tu carrito.
            <br/><br/>
            Por favor, elige qu&eacute; elemento deseas conservar para poder continuar:
          </p>

          <div className="space-y-4">
            {currentConflict.competing_items.map((item, idx) => {
              const otherItem = currentConflict.competing_items.find((_, i) => i !== idx);
              return (
                <div key={idx} className={`p-4 rounded-lg border ${borderClass} flex flex-col gap-3`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-sm">
                        {item.is_bundle ? 'Parte de un Conjunto' : 'Producto Suelto'}
                      </h4>
                      <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        Cantidad solicitada: {item.quantity}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleKeepItem(item, otherItem)}
                    disabled={resolving}
                    className="w-full py-2.5 px-4 bg-black text-white rounded-md text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    {resolving ? 'Resolviendo...' : 'Conservar este y eliminar el otro'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutConflictModal;
