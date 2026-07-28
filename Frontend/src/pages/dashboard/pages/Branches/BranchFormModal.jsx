import { useState, useEffect, useRef } from "react";
import { createBranch, updateBranch } from "../../../../api/admin/branches";
import { getEmployees } from "../../../../api/admin/employees";
import { API_BASE_URL } from "../../../../config/api";
import toast from "react-hot-toast";

import CustomSelect from '../../../../components/ui/CustomSelect';
export default function BranchFormModal({ branch, onClose, onSave }) {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    is_active: true,
    manager_id: "",
    address: {
      country: "Bolivia",
      state: "",
      city: "",
      zone: "",
      street: "",
      reference: "",
    }
  });

  const [images, setImages] = useState([]); // new files
  const [existingImages, setExistingImages] = useState([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0); // index for new images
  const [primaryImageId, setPrimaryImageId] = useState(null); // id for existing images
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadEmployees();
    if (branch) {
      setFormData({
        name: branch.name || "",
        phone: branch.phone || "",
        is_active: branch.is_active ?? true,
        manager_id: branch.manager?.id || "",
        address: branch.address || {
          country: "Bolivia",
          state: "",
          city: "",
          zone: "",
          street: "",
          reference: "",
        }
      });
      
      if (branch.images && branch.images.length > 0) {
        setExistingImages(branch.images);
        const primary = branch.images.find(img => img.is_primary);
        if (primary) {
          setPrimaryImageId(primary.id);
        }
      }
    }
  }, [branch]);

  const loadEmployees = async () => {
    try {
      const res = await getEmployees();
      // Assume API returns array or {data: array}
      const list = res.data?.data || res.data || res || [];
      setEmployees(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Error cargando empleados:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith("addr_")) {
      const field = name.replace("addr_", "");
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, [field]: value }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setImages(prev => [...prev, ...newFiles]);
      // If no primary image set, set first new one as primary if existing is empty
      if (existingImages.length === 0 && primaryImageId === null && images.length === 0) {
        setPrimaryImageIndex(0);
      }
    }
  };

  const handleRemoveExistingImage = (id) => {
    setExistingImages(prev => prev.filter(img => img.id !== id));
    if (primaryImageId === id) {
      setPrimaryImageId(null);
      if (existingImages.length > 1) {
        setPrimaryImageId(existingImages.find(img => img.id !== id)?.id || null);
      } else if (images.length > 0) {
        setPrimaryImageIndex(0);
      }
    }
  };

  const handleRemoveNewImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    if (primaryImageIndex === index) {
      setPrimaryImageIndex(0);
    } else if (primaryImageIndex > index) {
      setPrimaryImageIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    data.append("name", formData.name);
    data.append("phone", formData.phone);
    data.append("is_active", formData.is_active ? 1 : 0);
    if (formData.manager_id) data.append("manager_id", formData.manager_id);
    
    // Address
    data.append("address[country]", formData.address.country);
    data.append("address[state]", formData.address.state);
    data.append("address[city]", formData.address.city);
    data.append("address[zone]", formData.address.zone);
    data.append("address[street]", formData.address.street);
    data.append("address[reference]", formData.address.reference);

    // Images
    images.forEach((file, index) => {
      data.append("images[]", file);
    });

    if (branch) {
      // Retained images
      const retainedIds = existingImages.map(img => img.id);
      data.append("retained_image_ids", JSON.stringify(retainedIds));
      if (primaryImageId) {
        data.append("primary_image_id", primaryImageId);
      } else if (images.length > 0) {
        data.append("primary_image_index", primaryImageIndex);
      }
    } else {
      data.append("primary_image_index", primaryImageIndex);
    }

    try {
      if (branch) {
        await updateBranch(branch.id, data);
      } else {
        await createBranch(data);
      }
      toast.success(branch ? "Sucursal actualizada correctamente" : "Sucursal creada correctamente");
      onSave();
    } catch (error) {
      console.error('Error guardando sucursal:', error.response?.data || error);
      toast.error(error.response?.data?.message || "Error guardando la sucursal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="branch-modal-overlay">
      <div className="branch-modal">
        <div className="branch-modal-header">
          <h2>{branch ? "Editar Sucursal" : "Nueva Sucursal"}</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="branch-modal-content">
          <form id="branchForm" onSubmit={handleSubmit} className="form-grid">
            
            <div className="form-group full-width" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
              <input 
                type="checkbox" 
                id="is_active" 
                name="is_active" 
                checked={formData.is_active} 
                onChange={handleInputChange} 
                style={{ width: '20px' }}
              />
              <label htmlFor="is_active" style={{ cursor: 'pointer', margin: 0 }}>Sucursal Activa</label>
            </div>

            <div className="form-group">
              <label>Nombre de la Sucursal *</label>
              <input 
                required 
                name="name" 
                value={formData.name} 
                onChange={handleInputChange} 
                placeholder="Ej. Sucursal Centro" 
              />
            </div>

            <div className="form-group">
              <label>Teléfono</label>
              <input 
                name="phone" 
                value={formData.phone} 
                onChange={handleInputChange} 
                placeholder="Ej. +591 71234567" 
              />
            </div>

            <div className="form-group full-width">
              <label>Encargado / Gerente</label>
              <CustomSelect name="manager_id" value={formData.manager_id} onChange={handleInputChange}>
                <option value="">-- Sin asignar --</option>
                {employees.map(emp => {
                  const firstName = emp.user?.profile?.first_name || '';
                  const lastNameP = emp.user?.profile?.last_name_paternal || '';
                  const fullName = `${firstName} ${lastNameP}`.trim();
                  
                  const name = fullName ? fullName : (emp.user?.email || `Empleado ${emp.id}`);
                  return (
                    <option key={emp.id} value={emp.id}>{name} ({typeof emp.role === 'object' ? emp.role?.name || '' : emp.role})</option>
                  );
                })}
              </CustomSelect>
            </div>

            <div className="form-group full-width">
              <h3 style={{ marginTop: '16px', marginBottom: '8px' }}>Ubicación</h3>
              <hr style={{ borderColor: 'var(--border-color)', marginBottom: '16px' }} />
            </div>

            <div className="form-group">
              <label>Ciudad</label>
              <input name="addr_city" value={formData.address.city} onChange={handleInputChange} placeholder="Ej. Santa Cruz" />
            </div>

            <div className="form-group">
              <label>Zona / Barrio</label>
              <input name="addr_zone" value={formData.address.zone} onChange={handleInputChange} placeholder="Ej. Equipetrol" />
            </div>

            <div className="form-group full-width">
              <label>Dirección exacta (Calle, Nro)</label>
              <input name="addr_street" value={formData.address.street} onChange={handleInputChange} placeholder="Ej. Av. San Martín #123" />
            </div>

            <div className="form-group full-width">
              <label>Referencia</label>
              <input name="addr_reference" value={formData.address.reference} onChange={handleInputChange} placeholder="Ej. Frente a la plaza" />
            </div>

            <div className="form-group full-width image-upload-section">
              <h3 style={{ marginBottom: '8px' }}>Imágenes de la Sucursal</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>Haz clic en una imagen para hacerla principal (portada).</p>
              
              <div className="image-preview-grid">
                {/* Existing Images */}
                {existingImages.map((img) => (
                  <div 
                    key={img.id} 
                    className={`image-preview-item ${primaryImageId === img.id ? 'primary' : ''}`}
                    onClick={() => { setPrimaryImageId(img.id); setPrimaryImageIndex(null); }}
                  >
                    <img src={img?.image_url?.startsWith('http') ? img.image_url : `${API_BASE_URL}${img?.image_url || ''}`} alt="Branch" />
                    <button type="button" className="image-remove-btn" onClick={(e) => { e.stopPropagation(); handleRemoveExistingImage(img.id); }}>✕</button>
                    {primaryImageId === img.id && <span className="primary-badge">Portada</span>}
                  </div>
                ))}

                {/* New Images */}
                {images.map((file, index) => (
                  <div 
                    key={index} 
                    className={`image-preview-item ${primaryImageId === null && primaryImageIndex === index ? 'primary' : ''}`}
                    onClick={() => { setPrimaryImageIndex(index); setPrimaryImageId(null); }}
                  >
                    <img src={URL.createObjectURL(file)} alt="New" />
                    <button type="button" className="image-remove-btn" onClick={(e) => { e.stopPropagation(); handleRemoveNewImage(index); }}>✕</button>
                    {primaryImageId === null && primaryImageIndex === index && <span className="primary-badge">Portada</span>}
                  </div>
                ))}

                {/* Upload Button */}
                <button 
                  type="button" 
                  className="image-upload-btn"
                  onClick={() => fileInputRef.current.click()}
                >
                  <span style={{ fontSize: '24px' }}>+</span>
                  <span style={{ fontSize: '12px' }}>Añadir Foto</span>
                </button>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  onChange={handleFileChange}
                />
              </div>
            </div>

          </form>
        </div>

        <div className="branch-modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button type="submit" form="branchForm" className="btn-primary" disabled={loading}>
            {loading ? "Guardando..." : "Guardar Sucursal"}
          </button>
        </div>
      </div>
    </div>
  );
}
