import React, { useEffect, useState } from 'react';
import { useToast } from '../components/Layout/ToastProvider';
import { FaHistory } from 'react-icons/fa';

export default function HistorialPage({ user }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    if (![1, 2, 3].includes(user.rol_id)) return;
    setLoading(true);

    // Validar que los IDs son números válidos
    const rolIdValido = Number.isInteger(user.rol_id);
    const cursoIdValido = Number.isInteger(user.curso_id);
    const colegioIdValido = Number.isInteger(user.colegio_id);

    if (!rolIdValido || !cursoIdValido || !colegioIdValido) {
      showToast('Faltan datos del usuario para cargar el historial', 'error');
      setLoading(false);
      return;
    }

    fetch(`${process.env.REACT_APP_API_URL}/logs?rol_id=${user.rol_id}&curso_id=${user.curso_id}&colegio_id=${user.colegio_id}`)
      .then(res => {
        if (!res.ok) {
          res.json().then(err => {
            showToast(err.error || 'Error desconocido al cargar historial', 'error');
          });
          throw new Error('No autorizado o error de red');
        }
        return res.json();
      })
      .then(data => {
        setLogs(data);
        setLoading(false);
      })
      .catch(err => {
        showToast('No se pudo cargar el historial', 'error');
        setLoading(false);
      });
  }, [user, showToast]);

  if (![1, 2, 3].includes(user.rol_id)) {
    return (
      <section className="historial-page">
        <h2 className="page-title">
          <FaHistory color="#2563eb" /> Historial
        </h2>
        <div className="card">
          <div className="permission-error">No tienes permiso para ver el historial.</div>
        </div>
      </section>
    );
  }

  return (
    <section className="historial-page">
      <h2 className="page-title">
        <FaHistory color="#2563eb" /> Historial de Cambios
      </h2>
      
      <div className="card">
        {loading ? (
          <div className="loading-text">Cargando historial...</div>
        ) : logs.length === 0 ? (
          <div className="loading-text">No hay registros de historial para tu curso/colegio.</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Acción</th>
                  <th>Entidad</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td>{new Date(log.fecha).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td>{log.usuario_nombre}</td>
                    <td>{rolNombre(log.rol_id)}</td>
                    <td>{log.accion}</td>
                    <td>{log.entidad}</td>
                    <td>{log.detalle}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function rolNombre(rol_id) {
  if (rol_id === 1) return 'Admin';
  if (rol_id === 2) return 'Presidente';
  if (rol_id === 3) return 'Tesorero';
  if (rol_id === 4) return 'Apoderado';
  return 'Otro';
}
