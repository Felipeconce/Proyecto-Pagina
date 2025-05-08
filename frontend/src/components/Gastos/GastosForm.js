import React, { useState } from 'react';
import { useToast } from '../Layout/ToastProvider';
import { useFetchList } from '../../hooks/useFetchList';

export default function GastosForm({ user }) {
  const { data: cursos, loading, error } = useFetchList(`${process.env.REACT_APP_API_URL}/cursos`);
  const [cursoId, setCursoId] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState('');
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!cursoId) {
      showToast('Selecciona un curso', 'error');
      return;
    }
    
    if (!descripcion.trim()) {
      showToast('Ingresa una descripción', 'error');
      return;
    }
    
    // Validar que monto sea un número válido
    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      showToast('El monto debe ser un número mayor a 0', 'error');
      return;
    }
    
    if (!fecha) {
      showToast('Selecciona una fecha', 'error');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/gastos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          curso_id: parseInt(cursoId, 10),
          descripcion,
          monto: montoNum,
          fecha,
          usuario_id: user.id,
          usuario_nombre: user.nombre,
          rol_id: user.rol_id,
          curso_id: user.curso_id,
          colegio_id: user.colegio_id
        })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al agregar gasto');
      }
      setCursoId('');
      setDescripcion('');
      setMonto('');
      setFecha('');
      showToast('Gasto agregado correctamente', 'success');
      // Opcional: podrías recargar la lista de gastos aquí si lo deseas
    } catch (err) {
      showToast(err.message || 'Error de red al agregar gasto', 'error');
    }
  };

  if (user.rol_id !== 3) return null;

  return (
    <form onSubmit={handleSubmit} className="form-grid">
      <h3>Agregar Gasto</h3>

      <div className="form-group">
        <label htmlFor="cursoGasto">Curso</label>
        <select
          id="cursoGasto"
          value={cursoId}
          onChange={e => setCursoId(e.target.value)}
          required
          disabled={loading}
        >
          <option value="">Selecciona Curso</option>
          {cursos.map(c => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
        {loading && <div>Cargando cursos...</div>}
        {error && <div style={{color:'red'}}>Error: {error}</div>}
      </div>

      <div className="form-group">
        <label htmlFor="descripcionGasto">Descripción</label>
        <input
          id="descripcionGasto"
          type="text"
          placeholder="Descripción del gasto"
          value={descripcion}
          onChange={e => setDescripcion(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="montoGasto">Monto</label>
        <input
          id="montoGasto"
          type="number"
          placeholder="Monto"
          value={monto}
          onChange={e => setMonto(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="fechaGasto">Fecha</label>
        <input
          id="fechaGasto"
          type="date"
          value={fecha}
          onChange={e => setFecha(e.target.value)}
          required
        />
      </div>

      <div className="form-group form-group-submit">
        <button type="submit"><i className="fa fa-plus"></i> Agregar</button>
      </div>
    </form>
  );
}