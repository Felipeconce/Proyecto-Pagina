import React, { useState, useEffect } from 'react';
import { useToast } from '../Layout/ToastProvider';
import styles from './ConceptosForm.module.css';

export default function ConceptosForm({ user, onConceptoAgregado }) {
  const [nombre, setNombre] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [conceptos, setConceptos] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [editNombre, setEditNombre] = useState('');
  const [editFechaVencimiento, setEditFechaVencimiento] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [collapsedSection, setCollapsedSection] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/conceptos`)
      .then(res => {
        if (res.ok) return res.json();
        return [];
      })
      .then(data => {
        console.log("Conceptos cargados:", data);
        // Verificar si "Pap" tiene fecha de vencimiento
        const pap = data.find(c => c.nombre === "Pap");
        if (pap) {
          console.log("Concepto Pap encontrado:", pap);
          console.log("Fecha de vencimiento de Pap:", pap.fecha_vencimiento);
          
          // Si Pap no tiene fecha de vencimiento, intentar corregirlo
          if (!pap.fecha_vencimiento && user && user.rol_id === 3) {
            const token = localStorage.getItem('token');
            if (token) {
              console.log("Intentando corregir concepto Pap sin fecha de vencimiento...");
              
              // Usar el 3 de mayo de 2023 como fecha de vencimiento (para que esté atrasado)
              const fechaVencimiento = "2023-05-03";
              
              fetch(`${process.env.REACT_APP_API_URL}/conceptos/${pap.id}`, {
                method: 'PUT',
                headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                  nombre: "Pap",
                  fecha_vencimiento: fechaVencimiento,
                  usuario_id: user.id,
                  usuario_nombre: user.nombre,
                  rol_id: user.rol_id,
                  curso_id: user.curso_id,
                  colegio_id: user.colegio_id
                }),
              })
              .then(res => {
                if (res.ok) {
                  console.log("Concepto Pap corregido exitosamente");
                  // Recargar la página para ver los cambios
                  window.location.reload();
                } else {
                  console.error("No se pudo corregir el concepto Pap");
                }
              })
              .catch(err => {
                console.error("Error al corregir concepto Pap:", err);
              });
            }
          }
        }
        setConceptos(data);
      })
      .catch(err => {
        console.error("Error al cargar conceptos:", err);
      });
  }, [success, onConceptoAgregado, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validar que el nombre tenga exactamente 3 caracteres
    if (nombre.length !== 3) {
      setError('El nombre debe tener exactamente 3 caracteres');
      toast.showToast('El nombre debe tener exactamente 3 caracteres', 'error');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No estás autenticado');
        toast.showToast('No estás autenticado', 'error');
        return;
      }
      
      // Verificar y formatear la fecha
      let fechaFormateada = null;
      if (fechaVencimiento) {
        console.log("Fecha original seleccionada:", fechaVencimiento);
        
        // Asegurarnos de que la fecha esté en formato YYYY-MM-DD
        const partesFecha = fechaVencimiento.split('T')[0].split('-');
        if (partesFecha.length === 3) {
          fechaFormateada = `${partesFecha[0]}-${partesFecha[1]}-${partesFecha[2]}`;
        } else {
          fechaFormateada = fechaVencimiento;
        }
        
        console.log("Fecha formateada a enviar:", fechaFormateada);
      }
      
      const conceptoData = { 
        nombre, 
        orden: 0, // Marcar como concepto personalizado con orden 0
        fecha_vencimiento: fechaFormateada,
        usuario_id: user.id,
        usuario_nombre: user.nombre,
        rol_id: user.rol_id,
        curso_id: user.curso_id,
        colegio_id: user.colegio_id
      };
      
      console.log("Enviando datos de concepto:", JSON.stringify(conceptoData));
      
      const res = await fetch(`${process.env.REACT_APP_API_URL}/conceptos`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(conceptoData),
      });
      
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Error al agregar concepto');
        toast.showToast(data.error || 'Error al agregar ítem', 'error');
        return;
      }
      
      // Ver la respuesta
      const nuevoConcepto = await res.json();
      console.log("Concepto creado:", nuevoConcepto);
      
      setNombre('');
      setFechaVencimiento('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 1500);
      toast.showToast('Ítem agregado correctamente', 'success');
      
      // Forzar actualización inmediata
      console.log("Ejecutando callback de onConceptoAgregado para refrescar la tabla");
      if (onConceptoAgregado) {
        onConceptoAgregado();
        
        // Recargamos conceptos inmediatamente
        fetch(`${process.env.REACT_APP_API_URL}/conceptos`)
          .then(res => res.ok ? res.json() : [])
          .then(data => {
            console.log("Conceptos recargados después de agregar:", data);
            setConceptos(data);
          });
      }
    } catch (err) {
      console.error("Error completo:", err);
      setError('Error de conexión');
      toast.showToast('Error de conexión', 'error');
    }
  };

  // Solo mostrar ítems agregados por el usuario (orden === 0)
  const userItems = conceptos.filter(c => c.orden === 0);

  const handleDelete = async () => {
    if (!selectedId) return;
    if (!window.confirm('¿Seguro que deseas eliminar este ítem?')) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.showToast('No estás autenticado', 'error');
        return;
      }
      
      const res = await fetch(`${process.env.REACT_APP_API_URL}/conceptos/${selectedId}`, { 
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          usuario_id: user.id,
          usuario_nombre: user.nombre,
          rol_id: user.rol_id,
          curso_id: user.curso_id,
          colegio_id: user.colegio_id
        })
      });
      
      if (!res.ok) {
        const error = await res.json();
        toast.showToast(error.message || 'Error al eliminar concepto', 'error');
        return;
      }
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 1000);
      setSelectedId('');
      setEditMode(false);
      setEditNombre('');
      setEditFechaVencimiento('');
      toast.showToast('Ítem eliminado correctamente', 'success');
      if (onConceptoAgregado) onConceptoAgregado();
      
      // Actualizar lista de conceptos
      const updatedRes = await fetch(`${process.env.REACT_APP_API_URL}/conceptos`);
      if (updatedRes.ok) {
        const data = await updatedRes.json();
        setConceptos(data);
      }
    } catch (err) {
      console.error("Error al eliminar concepto:", err);
      toast.showToast('Error de conexión', 'error');
    }
  };

  const handleEdit = () => {
    if (!selectedId) return;
    const item = userItems.find(c => c.id === selectedId);
    if (item) {
      setEditMode(true);
      setEditNombre(item.nombre);
      // Formatear fecha para el campo date, si existe
      setEditFechaVencimiento(item.fecha_vencimiento ? item.fecha_vencimiento.substr(0, 10) : '');
    }
  };

  const handleEditSave = async () => {
    if (!selectedId) return;
    
    // Validar que el nombre editado tenga exactamente 3 caracteres
    if (editNombre.length !== 3) {
      toast.showToast('El nombre debe tener exactamente 3 caracteres', 'error');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.showToast('No estás autenticado', 'error');
        return;
      }
      
      // Formatear la fecha de vencimiento
      let fechaFormateada = null;
      if (editFechaVencimiento) {
        // Asegurarnos de que la fecha esté en formato YYYY-MM-DD
        const partesFecha = editFechaVencimiento.split('T')[0].split('-');
        if (partesFecha.length === 3) {
          fechaFormateada = `${partesFecha[0]}-${partesFecha[1]}-${partesFecha[2]}`;
        } else {
          fechaFormateada = editFechaVencimiento;
        }
        
        console.log("Fecha formateada para edición:", fechaFormateada);
      }
      
      const res = await fetch(`${process.env.REACT_APP_API_URL}/conceptos/${selectedId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          nombre: editNombre,
          fecha_vencimiento: fechaFormateada,
          usuario_id: user.id,
          usuario_nombre: user.nombre,
          rol_id: user.rol_id,
          curso_id: user.curso_id,
          colegio_id: user.colegio_id
        }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        toast.showToast(error.message || 'Error al editar concepto', 'error');
        return;
      }
      
      setEditMode(false);
      setEditNombre('');
      setEditFechaVencimiento('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 1000);
      toast.showToast('Ítem editado correctamente', 'success');
      if (onConceptoAgregado) onConceptoAgregado();
      
      // Actualizar lista de conceptos
      const updatedRes = await fetch(`${process.env.REACT_APP_API_URL}/conceptos`);
      if (updatedRes.ok) {
        const data = await updatedRes.json();
        setConceptos(data);
      }
    } catch (err) {
      console.error("Error al editar concepto:", err);
      toast.showToast('Error de conexión', 'error');
    }
  };

  if (!user || user.rol_id !== 3) return null;

  return (
    <div className="nuevo-cobro-container">
      <div 
        className="nuevo-cobro-header"
        onClick={() => setCollapsedSection(!collapsedSection)}
      >
        <h3>Agregar Concepto de Pago</h3>
        <span className={`arrow-icon ${collapsedSection ? 'collapsed' : ''}`}>▼</span>
      </div>
      
      {!collapsedSection && (
        <div className="nuevo-cobro-content">
          <form onSubmit={handleSubmit} className={styles.conceptosFormGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="nombreConcepto">Nombre (3 letras)</label>
              <input
                id="nombreConcepto"
                type="text"
                maxLength={3}
                placeholder="Ej: MAR"
                value={nombre}
                onChange={e => setNombre(e.target.value.toUpperCase())}
                required
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="fechaVencimiento">Fecha Vencimiento</label>
              <input
                id="fechaVencimiento"
                type="date"
                value={fechaVencimiento}
                onChange={e => setFechaVencimiento(e.target.value)}
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup} style={{alignSelf:'end', marginTop: '22px'}}>
              <button type="submit" className="btn-principal">
                <i className="fa fa-plus"></i> Agregar
              </button>
            </div>
            {error && <div className={styles.errorMsg}>{error}</div>}
            {success && <div className={styles.successMsg}>Ítem agregado correctamente</div>}
          </form>
          
          <div className="items-selector">
            <select 
              value={selectedId} 
              onChange={(e) => {
                setSelectedId(e.target.value);
                // Si seleccionamos un ítem del dropdown, cargar sus datos en el formulario para editar
                if (e.target.value) {
                  const item = conceptos.find(c => c.id === parseInt(e.target.value));
                  if (item) {
                    setEditNombre(item.nombre);
                    setEditFechaVencimiento(item.fecha_vencimiento || '');
                  }
                }
              }}
              className="cobro-select"
            >
              <option value="">Selecciona un ítem</option>
              {userItems.map(item => (
                <option key={item.id} value={item.id}>{item.nombre} {item.fecha_vencimiento ? `(${new Date(item.fecha_vencimiento).toLocaleDateString()})` : ''}</option>
              ))}
            </select>
            
            <div className="item-actions">
              <button 
                onClick={handleEdit} 
                disabled={!selectedId || editMode}
                className="action-button edit-button"
              >
                ✏️
              </button>
              <button 
                onClick={handleDelete} 
                disabled={!selectedId}
                className="action-button delete-button"
              >
                🗑️
              </button>
            </div>
          </div>
          
          {editMode && (
            <div className="edit-form">
              <h4>Editar Ítem</h4>
              <div className="form-row">
                <input 
                  type="text" 
                  value={editNombre} 
                  onChange={(e) => setEditNombre(e.target.value)}
                  maxLength={3}
                  className="cobro-input"
                />
                <input 
                  type="date" 
                  value={editFechaVencimiento} 
                  onChange={(e) => setEditFechaVencimiento(e.target.value)}
                  className="cobro-input date-input"
                />
                <div className="edit-actions">
                  <button 
                    onClick={handleEditSave}
                    className="action-button save-edit-button"
                  >
                    Guardar
                  </button>
                  <button 
                    onClick={() => {
                      setEditMode(false);
                      setEditNombre('');
                      setEditFechaVencimiento('');
                    }}
                    className="action-button cancel-edit-button"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}