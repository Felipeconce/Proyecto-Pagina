import React, { useState } from 'react';
import { useToast } from '../Layout/ToastProvider';
import styles from './GastosPage.module.css';
import '../CommonStyles.css';
import { FaPlus } from 'react-icons/fa';

export default function GastosForm({ user, onGastoAdded }) {
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState('');
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validaciones
    if (!descripcion.trim()) {
      showToast('Ingresa una descripción', 'error');
      return;
    }
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
          curso_id: user.curso_id,
          descripcion,
          monto: montoNum,
          fecha,
          usuario_id: user.id,
          usuario_nombre: user.nombre,
          rol_id: user.rol_id,
          colegio_id: user.colegio_id
        })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al agregar gasto');
      }
      setDescripcion('');
      setMonto('');
      setFecha('');
      showToast('Gasto agregado correctamente', 'success');
      if (typeof onGastoAdded === 'function') {
        onGastoAdded();
      }
    } catch (err) {
      showToast(err.message || 'Error de red al agregar gasto', 'error');
    }
  };

  if (user.rol_id !== 3) return null;

  return (
    <form onSubmit={handleSubmit} className={styles.formGrid + ' ' + styles.formCompact}>
      <div className={styles.formGroup}>
        <label htmlFor="descripcionGasto">Descripción</label>
        <input
          id="descripcionGasto"
          type="text"
          placeholder="Descripción del gasto"
          value={descripcion}
          onChange={e => setDescripcion(e.target.value)}
          required
          className={styles.input}
        />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="montoGasto">Monto</label>
        <input
          id="montoGasto"
          type="number"
          placeholder="Monto"
          value={monto}
          onChange={e => setMonto(e.target.value)}
          required
          className={styles.input}
        />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="fechaGasto">Fecha</label>
        <input
          id="fechaGasto"
          type="date"
          value={fecha}
          onChange={e => setFecha(e.target.value)}
          required
          className={styles.input}
        />
      </div>
      <div className={styles.formGroup} style={{alignSelf:'end', marginTop: '22px'}}>
        <button type="submit" className="btn-principal">
          <FaPlus /> Agregar
        </button>
      </div>
    </form>
  );
}