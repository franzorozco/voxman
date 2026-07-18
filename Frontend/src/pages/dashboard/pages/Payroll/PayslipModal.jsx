import { X, Printer } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function PayslipModal({ payment, onClose }) {
  if (!payment) return null;

  const profile = payment.employee?.user?.profile || {};
  const fullName = `${profile.first_name || ''} ${profile.last_name_paternal || ''}`.trim() || 'Sin Nombre';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay fade-in no-print-bg">
      <div className="modal-content slide-up" style={{ maxWidth: '600px', width: '100%' }}>
        <div className="modal-header hide-on-print">
          <h3>Recibo de Pago</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-secondary" onClick={handlePrint} style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Printer size={16} /> Imprimir
            </button>
            <button className="btn-icon" onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        <div className="modal-body print-area" style={{ padding: '30px' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ margin: '0 0 5px 0' }}>VOXMAN S.R.L.</h2>
            <p style={{ margin: '0', color: 'var(--text-muted)', fontSize: '14px' }}>Boleta de Pago de Salario</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', fontSize: '14px' }}>
            <div>
              <p style={{ margin: '0 0 5px 0' }}><strong>Empleado:</strong> {fullName}</p>
              <p style={{ margin: '0 0 5px 0' }}><strong>Código:</strong> {payment.employee?.employee_code}</p>
              <p style={{ margin: '0' }}><strong>Cargo:</strong> {payment.employee?.role}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: '0 0 5px 0' }}><strong>Fecha de Pago:</strong> {format(new Date(payment.payment_date), 'dd/MM/yyyy')}</p>
              <p style={{ margin: '0' }}><strong>Mes Correspondiente:</strong> {format(new Date(payment.payment_date), 'MMMM yyyy', { locale: es }).toUpperCase()}</p>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #000' }}>
                <th style={{ textAlign: 'left', padding: '10px 0' }}>CONCEPTO</th>
                <th style={{ textAlign: 'right', padding: '10px 0' }}>INGRESOS (Bs.)</th>
                <th style={{ textAlign: 'right', padding: '10px 0' }}>DESCUENTOS (Bs.)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}>Sueldo Base</td>
                <td style={{ textAlign: 'right', padding: '10px 0', borderBottom: '1px solid #eee' }}>{Number(payment.base_salary).toFixed(2)}</td>
                <td style={{ textAlign: 'right', padding: '10px 0', borderBottom: '1px solid #eee' }}></td>
              </tr>
              <tr>
                <td style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}>Comisiones</td>
                <td style={{ textAlign: 'right', padding: '10px 0', borderBottom: '1px solid #eee' }}>{Number(payment.commissions).toFixed(2)}</td>
                <td style={{ textAlign: 'right', padding: '10px 0', borderBottom: '1px solid #eee' }}></td>
              </tr>
              {Number(payment.bonuses) > 0 && (
                <tr>
                  <td style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}>Bonos Extra</td>
                  <td style={{ textAlign: 'right', padding: '10px 0', borderBottom: '1px solid #eee' }}>{Number(payment.bonuses).toFixed(2)}</td>
                  <td style={{ textAlign: 'right', padding: '10px 0', borderBottom: '1px solid #eee' }}></td>
                </tr>
              )}
              {Number(payment.deductions) > 0 && (
                <tr>
                  <td style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}>Deducciones / Faltas</td>
                  <td style={{ textAlign: 'right', padding: '10px 0', borderBottom: '1px solid #eee' }}></td>
                  <td style={{ textAlign: 'right', padding: '10px 0', borderBottom: '1px solid #eee' }}>{Number(payment.deductions).toFixed(2)}</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid #000', fontWeight: 'bold' }}>
                <td style={{ padding: '15px 0' }}>TOTALES</td>
                <td style={{ textAlign: 'right', padding: '15px 0' }}>{(Number(payment.base_salary) + Number(payment.commissions) + Number(payment.bonuses)).toFixed(2)}</td>
                <td style={{ textAlign: 'right', padding: '15px 0' }}>{Number(payment.deductions).toFixed(2)}</td>
              </tr>
              <tr>
                <td colSpan="3" style={{ padding: '15px 0', textAlign: 'right', fontSize: '18px' }}>
                  <strong>LÍQUIDO PAGABLE: Bs. {Number(payment.total_paid).toFixed(2)}</strong>
                </td>
              </tr>
            </tfoot>
          </table>

          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '60px' }}>
            <div style={{ textAlign: 'center', width: '200px' }}>
              <div style={{ borderBottom: '1px solid #000', height: '40px' }}></div>
              <p style={{ margin: '5px 0 0 0', fontSize: '12px' }}>Firma del Empleador</p>
            </div>
            <div style={{ textAlign: 'center', width: '200px' }}>
              <div style={{ borderBottom: '1px solid #000', height: '40px' }}></div>
              <p style={{ margin: '5px 0 0 0', fontSize: '12px' }}>Firma del Empleado</p>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print-bg {
            background: none !important;
          }
          .hide-on-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
