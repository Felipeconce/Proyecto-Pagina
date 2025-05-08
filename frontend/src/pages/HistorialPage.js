import React, { useEffect, useState } from 'react';
import { useToast } from '../components/Layout/ToastProvider';

export default function HistorialPage({ user }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    if (![1, 2, 3].includes(user.rol_id)) return;
    setLoading(true);
    console.log('HistorialPage user:', user);

    // Validar que los IDs son números válidos
    const rolIdValido = Number.isInteger(user.rol_id);
    const cursoIdValido = Number.isInteger(user.curso_id);
    const colegioIdValido = Number.isInteger(user.colegio_id);

    if (!rolIdValido || !cursoIdValido || !colegioIdValido) {
      toast.showToast('Faltan datos del usuario para cargar el historial', 'error');
      setLoading(false);
      return;
    }

    fetch(`${process.env.REACT_APP_API_URL}/logs?rol_id=${user.rol_id}&curso_id=${user.curso_id}&colegio_id=${user.colegio_id}`)
      .then(res => {
        if (!res.ok) {
          res.json().then(err => {
            toast.showToast(err.error || 'Error desconocido al cargar historial', 'error');
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
        if (!loading) toast.showToast('No se pudo cargar el historial', 'error');
        setLoading(false);
      });
  }, [user, toast, loading]);

  if (![1, 2, 3].includes(user.rol_id)) {
    return <div style={{ color: '#b91c1c', margin: 32 }}>No tienes permiso para ver el historial.</div>;
  }

  return (
    <section>
      <h2>Historial de Cambios</h2>
      {loading ? (
        <div style={{ margin: 32 }}>Cargando historial...</div>
      ) : logs.length === 0 ? (
        <div style={{ margin: 32, color: '#64748b' }}>No hay registros de historial para tu curso/colegio.</div>
      ) : (
        <div style={{ overflowX: 'auto', marginTop: 24 }}>
          <table style={{ minWidth: 800, borderCollapse: 'collapse', background: '#fff', borderRadius: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <thead style={{ background: '#e0e7ff' }}>
              <tr>
                <th style={{ padding: 8, fontWeight: 700 }}>Fecha</th>
                <th style={{ padding: 8, fontWeight: 700 }}>Usuario</th>
                <th style={{ padding: 8, fontWeight: 700 }}>Rol</th>
                <th style={{ padding: 8, fontWeight: 700 }}>Acción</th>
                <th style={{ padding: 8, fontWeight: 700 }}>Entidad</th>
                <th style={{ padding: 8, fontWeight: 700 }}>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: 8 }}>{new Date(log.fecha).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td style={{ padding: 8 }}>{log.usuario_nombre}</td>
                  <td style={{ padding: 8 }}>{rolNombre(log.rol_id)}</td>
                  <td style={{ padding: 8 }}>{log.accion}</td>
                  <td style={{ padding: 8 }}>{log.entidad}</td>
                  <td style={{ padding: 8 }}>{log.detalle}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
