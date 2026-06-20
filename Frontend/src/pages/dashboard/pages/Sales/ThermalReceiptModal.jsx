import React from 'react';
import { Printer, X } from 'lucide-react';
import './ThermalReceiptModal.css';
import logo from '../../../../assets/global/logo_white.png';

export default function ThermalReceiptModal({ sale, onClose }) {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="thermal-receipt-overlay">
      <div className="thermal-receipt-container">
        
        {/* Actions (Hidden during print) */}
        <div className="thermal-receipt-actions">
          <button className="receipt-btn receipt-btn-close" onClick={onClose}>
            <X size={16} /> Cerrar
          </button>
          <button className="receipt-btn receipt-btn-print" onClick={handlePrint}>
            <Printer size={16} /> Imprimir
          </button>
        </div>

        {/* Receipt Content */}
        <div className="thermal-receipt-content" id="thermal-receipt-printable">
          <div className="receipt-header">
            <img src={logo} alt="VOXman Logo" className="receipt-logo" />
            <h2>VOXman Store</h2>
            <p>Sucursal: {sale.branch?.name || 'Principal'}</p>
            <p>{sale.branch?.address || 'Av. Ejemplo 123'}</p>
          </div>

          <div className="receipt-divider"></div>

          <div className="receipt-info">
            <p><span>Fecha:</span> <span>{formatDate(sale.created_at)}</span></p>
            <p><span>N° Factura:</span> <span>{sale.invoice_number || sale.id.split('-')[0].toUpperCase()}</span></p>
            <p><span>Vendedor:</span> <span>{sale.user?.profile?.first_name || 'Admin'}</span></p>
            <p><span>Cliente:</span> <span>{sale.customer?.user?.profile?.first_name ? `${sale.customer.user.profile.first_name} ${sale.customer.user.profile.last_name || ''}` : 'Consumidor Final'}</span></p>
          </div>

          <div className="receipt-divider"></div>

          <table className="receipt-items-table">
            <thead>
              <tr>
                <th className="receipt-item-qty">Cant</th>
                <th className="receipt-item-desc">Descripción</th>
                <th className="receipt-item-price">Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.sale_details?.map((detail) => {
                let name = "Producto Desconocido";
                if (detail.product_variant) {
                  name = `${detail.product_variant.product?.name} (${detail.product_variant.size?.name || ''})`;
                } else if (detail.giftcard) {
                  name = `Giftcard: ${detail.giftcard.code}`;
                }

                return (
                  <tr key={detail.id}>
                    <td className="receipt-item-qty">{detail.quantity}</td>
                    <td className="receipt-item-desc">
                      {name}
                      {parseFloat(detail.discount) > 0 && (
                        <div style={{ fontSize: '10px', color: '#666' }}>
                          - Desc: {parseFloat(detail.discount)} 
                          {sale.sale_applied_discounts?.find(d => d.sale_detail_id === detail.id)?.discount?.code 
                            ? ` (${sale.sale_applied_discounts.find(d => d.sale_detail_id === detail.id).discount.code})`
                            : ' (Manual)'}
                        </div>
                      )}
                    </td>
                    <td className="receipt-item-price">
                      {parseFloat(detail.subtotal).toLocaleString('en-US', {minimumFractionDigits: 2})}
                    </td>
                  </tr>
                );
              })}
              
              {/* If no details but it has giftcard_transactions (direct issue) */}
              {!sale.sale_details?.length && sale.giftcard_transactions?.map((tx) => (
                <tr key={tx.id}>
                  <td className="receipt-item-qty">1</td>
                  <td className="receipt-item-desc">Giftcard: {tx.giftcard?.code || 'Nueva'}</td>
                  <td className="receipt-item-price">{parseFloat(tx.amount).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="receipt-divider"></div>

          <div className="receipt-totals">
            <div className="receipt-totals-row">
              <span>Subtotal:</span>
              <span>Bs. {parseFloat(sale.subtotal).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
            </div>
            {parseFloat(sale.discount_total) > 0 && (
              <div className="receipt-totals-row">
                <span style={{ display: 'flex', flexDirection: 'column' }}>
                  <span>Descuento Global:</span>
                  <span style={{ fontSize: '10px', color: '#666' }}>
                    {sale.sale_applied_discounts?.filter(d => !d.sale_detail_id).map(d => d.discount?.code).filter(Boolean).join(', ') 
                       ? `Cupón: ${sale.sale_applied_discounts.filter(d => !d.sale_detail_id).map(d => d.discount?.code).filter(Boolean).join(', ')}`
                       : 'Manual / Giftcard'}
                  </span>
                </span>
                <span>- Bs. {parseFloat(sale.discount_total).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
              </div>
            )}
            <div className="receipt-totals-row grand-total">
              <span>TOTAL:</span>
              <span>Bs. {parseFloat(sale.total).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
            </div>
          </div>

          {sale.payments?.length > 0 && (
            <div className="receipt-payments">
              <div className="receipt-divider"></div>
              <strong style={{ display: 'block', marginBottom: '6px' }}>MÉTODOS DE PAGO:</strong>
              {sale.payments.map((payment) => (
                <div key={payment.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span>{payment.payment_method?.name || 'Pago'} {payment.transaction_reference ? `(${payment.transaction_reference})` : ''}</span>
                  <span>Bs. {parseFloat(payment.amount).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                </div>
              ))}
            </div>
          )}

          <div className="receipt-divider"></div>
          
          <div className="receipt-footer">
            <p style={{ fontWeight: 'bold', margin: '0 0 4px 0' }}>¡Gracias por tu compra!</p>
            <p style={{ margin: 0 }}>voxman.com</p>
          </div>

        </div>
      </div>
    </div>
  );
}
