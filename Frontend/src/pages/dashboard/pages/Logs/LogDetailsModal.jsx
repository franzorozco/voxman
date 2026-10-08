import React from "react";
import { X } from "lucide-react";
import "./Logs.css";

export default function LogDetailsModal({ log, onClose }) {
  if (!log) return null;

  const renderData = (data) => {
    if (!data) return <em style={{ color: "var(--text-muted)" }}>Sin datos</em>;
    
    let parsedData = data;
    if (typeof data === "string") {
      try {
        parsedData = JSON.parse(data);
      } catch (e) {
        return <span>{data}</span>;
      }
    }

    return (
      <pre className="logs-modal-pre">
        {JSON.stringify(parsedData, null, 2)}
      </pre>
    );
  };

  return (
    <div className="logs-modal-overlay">
      <div className="logs-modal-content">
        <div className="logs-modal-header">
          <h2 className="logs-modal-title">Detalles de Auditoría</h2>
          <button onClick={onClose} className="logs-modal-close-btn">
            <X size={20} />
          </button>
        </div>

        <div className="logs-modal-body">
            <div className="logs-modal-grid">
                <div>
                    <strong className="logs-modal-label">Usuario</strong>
                    <p className="logs-modal-value">{log.user?.profile?.first_name || 'Sistema'} {log.user?.profile?.last_name || ''}</p>
                </div>
                <div>
                    <strong className="logs-modal-label">Acción</strong>
                    <p className="logs-modal-value uppercase">{log.action}</p>
                </div>
                <div>
                    <strong className="logs-modal-label">Tabla / Módulo</strong>
                    <p className="logs-modal-value">{log.table_name}</p>
                </div>
                <div>
                    <strong className="logs-modal-label">Registro ID</strong>
                    <p className="logs-modal-value">{log.record_id}</p>
                </div>
            </div>

            <div className="logs-modal-grid-large">
                <div>
                    <strong className="logs-modal-section-title">Datos Anteriores</strong>
                    {renderData(log.old_data)}
                </div>
                <div>
                    <strong className="logs-modal-section-title">Nuevos Datos</strong>
                    {renderData(log.new_data)}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
