import React, { useState } from 'react';
import { useToast } from '../Layout/ToastProvider';
import { FaCalendarPlus, FaCalendarAlt, FaPencilAlt } from 'react-icons/fa';

export default function FechasForm({ user }) {
  const [fecha, setFecha] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showToast('No estás autenticado', 'error');
        return;
      }
      
      if (!user) {
        showToast('Datos de usuario no disponibles', 'error');
        return;
      }
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/fechas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          fecha, 
          descripcion,
          usuario_id: user.id,
          usuario_nombre: user.nombre,
          rol_id: user.rol_id,
          curso_id: user.curso_id || 1,
          colegio_id: user.colegio_id || 1
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Error al agregar fecha');
      }
      
      setFecha('');
      setDescripcion('');
      showToast('Fecha agregada correctamente', 'success');
      // Opcional: podrías recargar la lista de fechas aquí si lo deseas
    } catch (err) {
      console.error('Error completo:', err);
      showToast(err.message || 'Error de red al agregar fecha', 'error');
    }
  };

  // Si quieres restringir quién puede agregar fechas, usa algo como:
  // if (user.rol_id !== 1 && user.rol_id !== 2) return null;

  return (
    <div className="content-section" style={{ 
      backgroundColor: '#fff', 
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
      marginBottom: '32px'
    }}>
      <h3 style={{ 
        fontSize: '20px', 
        fontWeight: '700', 
        color: '#374151',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <FaCalendarPlus color="#3b82f6" /> Agregar Fecha Importante
      </h3>
      
      <form onSubmit={handleSubmit} style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        maxWidth: '700px'
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 2fr',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="fechaImp" style={{ fontWeight: '600', fontSize: '14px', color: '#4b5563' }}>Fecha</label>
            <div style={{ position: 'relative' }}>
              <input
                id="fechaImp"
                type="date"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                required
                style={{
                  padding: '8px 12px',
                  paddingLeft: '36px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '15px',
                  width: '100%'
                }}
              />
              <FaCalendarAlt 
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#60a5fa'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="descImp" style={{ fontWeight: '600', fontSize: '14px', color: '#4b5563' }}>Descripción</label>
            <div style={{ position: 'relative' }}>
              <input
                id="descImp"
                type="text"
                placeholder="Descripción del evento"
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                required
                style={{
                  padding: '8px 12px',
                  paddingLeft: '36px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '15px',
                  width: '100%'
                }}
              />
              <FaPencilAlt 
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#60a5fa'
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button type="submit" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            borderRadius: '6px',
            border: 'none',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            width: 'auto',
            minWidth: '100px'
          }}>
            <FaCalendarPlus size={14} /> Agregar
          </button>
        </div>
      </form>
    </div>
  );
}