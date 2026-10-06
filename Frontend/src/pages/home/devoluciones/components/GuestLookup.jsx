import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { lookupGuestSale } from '../../../../api/shop/returns';
import { toast } from 'react-hot-toast';

export default function GuestLookup({ onSaleFound }) {
  const [formData, setFormData] = useState({
    whatsapp_phone: '',
    invoice_number: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.whatsapp_phone || !formData.invoice_number) {
      toast.error('Por favor completa ambos campos.');
      return;
    }

    try {
      setLoading(true);
      const { data } = await lookupGuestSale(formData);
      toast.success(data.message || 'Compra encontrada.');
      // Enviamos el formData (telefono) para usarlo al momento de solicitar la devolución
      onSaleFound(data.sale, formData.whatsapp_phone);
    } catch (error) {
      toast.error(error.response?.data?.message || 'No pudimos encontrar tu compra. Verifica los datos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="guest-lookup-container">
      <h2>Verificar mi compra</h2>
      <p>Ingresa tu número de WhatsApp y tu código de venta (ej. VXM-12345) o entrega para buscar tu pedido.</p>
      
      <form onSubmit={handleSubmit} className="guest-lookup-form">
        <div className="form-group">
          <label>Número de WhatsApp</label>
          <input 
            type="text" 
            name="whatsapp_phone" 
            placeholder="Ej. 77712345" 
            value={formData.whatsapp_phone}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Código de Venta / Entrega</label>
          <input 
            type="text" 
            name="invoice_number" 
            placeholder="Ej. VXM-00042" 
            value={formData.invoice_number}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" className="btn-lookup" disabled={loading}>
          {loading ? <><Loader2 size={18} className="spin" /> Buscando...</> : <><Search size={18} /> Buscar Pedido</>}
        </button>
      </form>
    </div>
  );
}
