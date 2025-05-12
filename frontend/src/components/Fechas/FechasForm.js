import React, { useState } from 'react';
import { useToast } from '../Layout/ToastProvider';
import { FaCalendarAlt, FaPencilAlt, FaPlus } from 'react-icons/fa';
import '../CommonStyles.css';
import './FechasStyles.css';

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
    <form onSubmit={handleSubmit} className="fechas-form">
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="fechaImp" className="form-label">Fecha</label>
          <div className="input-with-icon">
            <FaCalendarAlt className="input-icon" />
            <input
              id="fechaImp"
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              required
              className="form-input"
            />
          </div>
        </div>

        <div className="form-group description-group">
          <label htmlFor="descImp" className="form-label">Descripción</label>
          <div className="input-with-icon">
            <FaPencilAlt className="input-icon" />
            <input
              id="descImp"
              type="text"
              placeholder="Descripción del evento"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              required
              className="form-input"
            />
          </div>
        </div>
        
        <div className="form-group button-group">
          <button type="submit" className="btn-standard">
            <FaPlus /> Agregar
          </button>
        </div>
      </div>
    </form>
  );
}