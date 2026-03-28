import React, { useEffect, useState, useCallback } from 'react';
import { FaUsersCog, FaUserPlus, FaEdit, FaTrash, FaSave, FaTimes, FaKey } from 'react-icons/fa';
import { useToast } from '../components/Layout/ToastProvider';

const API = process.env.REACT_APP_API_URL;

const ROLES = { 1: 'Superusuario', 2: 'Presidente', 3: 'Tesorero', 4: 'Apoderado', 5: 'Secretaria' };

const EMPTY_FORM = { nombre: '', email: '', password: '', rol_id: 4, curso_id: '', colegio_id: '' };

function authHeader() {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export default function AdminPage({ user }) {
  const [usuarios, setUsuarios] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [colegios, setColegios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, cursosRes, colegiosRes] = await Promise.all([
        fetch(`${API}/usuarios`, { headers: authHeader() }),
        fetch(`${API}/cursos`, { headers: authHeader() }),
        fetch(`${API}/colegios`, { headers: authHeader() }).catch(() => ({ ok: false })),
      ]);
      if (usersRes.ok) setUsuarios(await usersRes.json());
      if (cursosRes.ok) setCursos(await cursosRes.json());
      if (colegiosRes.ok) setColegios(await colegiosRes.json());
    } catch (err) {
      showToast('Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { loadData(); }, [loadData]);

  if (!user || user.rol_id !== 1) {
    return <div style={{ color: '#b91c1c', margin: 32 }}>Acceso restringido a superusuario.</div>;
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name === 'rol_id' ? Number(value) : value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.email || !form.password) {
      showToast('Nombre, email y contraseña son obligatorios', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API}/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.errors?.[0]?.msg || data.error || 'Error al crear usuario');
      showToast('Usuario creado correctamente', 'success');
      setForm(EMPTY_FORM);
      setShowForm(false);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEditStart = (u) => {
    setEditId(u.id);
    setForm({ nombre: u.nombre, email: u.email, password: '', rol_id: u.rol_id, curso_id: u.curso_id || '', colegio_id: u.colegio_id || '' });
  };

  const handleEditSave = async (id) => {
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      const res = await fetch(`${API}/usuarios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar');
      showToast('Usuario actualizado', 'success');
      setEditId(null);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar al usuario "${nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      const res = await fetch(`${API}/usuarios/${id}`, {
        method: 'DELETE',
        headers: authHeader(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar');
      showToast('Usuario eliminado', 'success');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const inputStyle = {
    padding: '7px 10px', borderRadius: 6, border: '1px solid #d1d5db',
    fontSize: 14, width: '100%', boxSizing: 'border-box'
  };
  const btnStyle = (color) => ({
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '7px 14px', borderRadius: 6, border: 'none',
    fontWeight: 600, fontSize: 13, cursor: 'pointer',
    background: color, color: '#fff', transition: 'opacity .15s'
  });

  return (
    <section>
      <h2 style={{ fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <FaUsersCog color="#6366f1" /> Administración de Usuarios
      </h2>

      {/* Botón crear */}
      <div style={{ marginBottom: 20 }}>
        <button style={btnStyle('#6366f1')} onClick={() => { setShowForm(!showForm); setEditId(null); setForm(EMPTY_FORM); }}>
          <FaUserPlus /> {showForm ? 'Cancelar' : 'Nuevo Usuario'}
        </button>
      </div>

      {/* Formulario de creación */}
      {showForm && (
        <div style={{ background: '#f8fafc', borderRadius: 12, padding: 24, marginBottom: 24, border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#374151' }}>Crear nuevo usuario</h3>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#4b5563', display: 'block', marginBottom: 4 }}>Nombre *</label>
                <input style={inputStyle} name="nombre" value={form.nombre} onChange={handleFormChange} placeholder="Nombre completo" required />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#4b5563', display: 'block', marginBottom: 4 }}>Email *</label>
                <input style={inputStyle} name="email" type="email" value={form.email} onChange={handleFormChange} placeholder="email@ejemplo.com" required />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#4b5563', display: 'block', marginBottom: 4 }}>Contraseña *</label>
                <input style={inputStyle} name="password" type="password" value={form.password} onChange={handleFormChange} placeholder="Mín. 8 caracteres" required />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#4b5563', display: 'block', marginBottom: 4 }}>Rol *</label>
                <select style={inputStyle} name="rol_id" value={form.rol_id} onChange={handleFormChange}>
                  {Object.entries(ROLES).map(([id, nombre]) => (
                    <option key={id} value={id}>{nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#4b5563', display: 'block', marginBottom: 4 }}>Curso</label>
                <select style={inputStyle} name="curso_id" value={form.curso_id} onChange={handleFormChange}>
                  <option value="">Sin curso</option>
                  {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#4b5563', display: 'block', marginBottom: 4 }}>Colegio</label>
                {colegios.length > 0 ? (
                  <select style={inputStyle} name="colegio_id" value={form.colegio_id} onChange={handleFormChange}>
                    <option value="">Sin colegio</option>
                    {colegios.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                ) : (
                  <input style={inputStyle} name="colegio_id" type="number" value={form.colegio_id} onChange={handleFormChange} placeholder="ID del colegio" />
                )}
              </div>
            </div>
            <button type="submit" style={btnStyle('#22c55e')} disabled={saving}>
              <FaSave /> {saving ? 'Guardando...' : 'Crear Usuario'}
            </button>
          </form>
        </div>
      )}

      {/* Tabla de usuarios */}
      {loading ? (
        <div style={{ padding: 32, textAlign: 'center', color: '#6b7280' }}>Cargando usuarios...</div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#e0e7ff', borderBottom: '2px solid #c7d2fe' }}>
                  {['Nombre', 'Email', 'Rol', 'Curso ID', 'Colegio ID', 'Acciones'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#374151', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    {editId === u.id ? (
                      <>
                        <td style={{ padding: '8px 12px' }}>
                          <input style={{ ...inputStyle, width: 150 }} name="nombre" value={form.nombre} onChange={handleFormChange} />
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <input style={{ ...inputStyle, width: 180 }} name="email" type="email" value={form.email} onChange={handleFormChange} />
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <select style={{ ...inputStyle, width: 120 }} name="rol_id" value={form.rol_id} onChange={handleFormChange}>
                            {Object.entries(ROLES).map(([id, nombre]) => (
                              <option key={id} value={id}>{nombre}</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <select style={{ ...inputStyle, width: 110 }} name="curso_id" value={form.curso_id} onChange={handleFormChange}>
                            <option value="">—</option>
                            {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          {colegios.length > 0 ? (
                            <select style={{ ...inputStyle, width: 110 }} name="colegio_id" value={form.colegio_id} onChange={handleFormChange}>
                              <option value="">—</option>
                              {colegios.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                            </select>
                          ) : (
                            <input style={{ ...inputStyle, width: 80 }} name="colegio_id" type="number" value={form.colegio_id} onChange={handleFormChange} />
                          )}
                        </td>
                        <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <input
                              style={{ ...inputStyle, width: 130 }}
                              name="password"
                              type="password"
                              value={form.password}
                              onChange={handleFormChange}
                              placeholder="Nueva clave (opcional)"
                              title="Dejar en blanco para no cambiar"
                            />
                            <button style={btnStyle('#22c55e')} onClick={() => handleEditSave(u.id)} disabled={saving} title="Guardar">
                              <FaSave />
                            </button>
                            <button style={btnStyle('#6b7280')} onClick={() => setEditId(null)} title="Cancelar">
                              <FaTimes />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ padding: '12px 16px', fontWeight: 500 }}>{u.nombre}</td>
                        <td style={{ padding: '12px 16px', color: '#6b7280' }}>{u.email}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '3px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 600,
                            background: u.rol_id === 1 ? '#ede9fe' : u.rol_id === 3 ? '#dcfce7' : '#e0e7ff',
                            color: u.rol_id === 1 ? '#7c3aed' : u.rol_id === 3 ? '#16a34a' : '#3730a3'
                          }}>
                            {ROLES[u.rol_id] || u.rol_id}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#6b7280' }}>{u.curso_id || '—'}</td>
                        <td style={{ padding: '12px 16px', color: '#6b7280' }}>{u.colegio_id || '—'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button style={btnStyle('#3b82f6')} onClick={() => handleEditStart(u)} title="Editar">
                              <FaEdit /> Editar
                            </button>
                            {u.id !== user.id && (
                              <button style={btnStyle('#ef4444')} onClick={() => handleDelete(u.id, u.nombre)} title="Eliminar">
                                <FaTrash />
                              </button>
                            )}
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '10px 16px', background: '#f9fafb', borderTop: '1px solid #e5e7eb', fontSize: 13, color: '#6b7280' }}>
            {usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} en total
          </div>
        </div>
      )}
    </section>
  );
}
