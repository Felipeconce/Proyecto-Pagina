import React, { useState, useEffect } from 'react';
import { useToast } from '../components/Layout/ToastProvider';
// Asumo que CommonStyles.css tiene los estilos necesarios como .form-grid, .form-group, .input, .btn-principal
import './CommonStyles.css';

export default function UserForm({
  user, // Usuario autenticado (para permisos)
  editingUser, // Datos del usuario a editar (si no es null)
  colegios, // Lista de colegios disponibles
  cursos, // Lista de cursos disponibles (filtrados por colegio)
  onUserSaved, // Callback al guardar usuario (crear/editar)
  onCancel, // Callback al cancelar
  selectedColegioId, // Colegio seleccionado actualmente en la página padre
  selectedCursoId // Curso seleccionado actualmente en la página padre
}) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Para nuevo usuario o cambio de clave
  const [rolId, setRolId] = useState(4); // Por defecto Apoderado
  const [selectedColegioIdForm, setSelectedColegioIdForm] = useState('');
  const [selectedCursoIdForm, setSelectedCursoIdForm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  // Roles disponibles (hardcoded por ahora, idealmente vendrían del backend)
  const roles = [
    { id: 1, nombre: 'Superusuario' },
    { id: 2, nombre: 'Presidente' },
    { id: 3, nombre: 'Tesorero' },
    { id: 4, nombre: 'Apoderado' },
    { id: 5, nombre: 'Secretario' },
  ];

  // Efecto para cargar datos del usuario si se está editando
  useEffect(() => {
    console.log('UserForm useEffect [editingUser] triggered. editingUser:', editingUser); // Log the editingUser value
    if (editingUser) {
      setNombre(editingUser.nombre || '');
      setEmail(editingUser.email || '');
      setRolId(editingUser.rol_id || 4);
      setSelectedColegioIdForm(editingUser.colegio_id || '');
      setSelectedCursoIdForm(editingUser.curso_id || '');
      setPassword(''); // No precargar la contraseña
    } else {
      // Resetear formulario para nuevo usuario
      setNombre('');
      setEmail('');
      setPassword('');
      setRolId(4);
      // Usar el colegio/curso seleccionado en la página padre por defecto
      setSelectedColegioIdForm(selectedColegioId || '');
      setSelectedCursoIdForm(selectedCursoId || '');
    }
  }, [editingUser, selectedColegioId, selectedCursoId]);

  // Función para filtrar cursos basados en el colegio seleccionado en el formulario
  const cursosFiltrados = selectedColegioIdForm ? cursos.filter(c => c.colegio_id === parseInt(selectedColegioIdForm)) : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validaciones básicas
    if (!nombre || !email || !rolId || !selectedColegioIdForm || !selectedCursoIdForm) {
      setError('Por favor, complete todos los campos obligatorios.');
      setLoading(false);
      return;
    }

    // Validar contraseña solo si es un nuevo usuario
    if (!editingUser && !password) {
       setError('Para un nuevo usuario, la contraseña es obligatoria.');
       setLoading(false);
       return;
    }
    // Validar longitud mínima de contraseña si se proporciona
    if (password && password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres.');
        setLoading(false);
        return;
    }

    const userData = {
      nombre,
      email,
      rol_id: parseInt(rolId),
      colegio_id: parseInt(selectedColegioIdForm),
      curso_id: parseInt(selectedCursoIdForm),
      password: password || undefined // Incluir contraseña solo si se proporciona (para nuevo o cambio)
    };

    const token = localStorage.getItem('token');
    if (!token) {
        setError('No autenticado.');
        setLoading(false);
        return;
    }

    const method = editingUser ? 'PUT' : 'POST';
    const url = editingUser ? `${process.env.REACT_APP_API_URL}/usuarios/${editingUser.id}` : `${process.env.REACT_APP_API_URL}/usuarios`;
    
    // Si es una actualización y no se cambia la contraseña, no enviar el campo password
    if (editingUser && !password) {
        delete userData.password;
    }

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Error al ${editingUser ? 'actualizar' : 'crear'} usuario.`);
      }

      showToast(`Usuario ${editingUser ? 'actualizado' : 'creado'} con éxito.`, 'success');
      if (onUserSaved) {
        onUserSaved(data); // Pasar los datos del usuario guardado si es necesario
      }
      // Limpiar formulario o cerrar modal/sección
      if (!editingUser) {
        // Limpiar campos para nuevo usuario
        setNombre('');
        setEmail('');
        setPassword('');
        setRolId(4);
        setSelectedColegioIdForm(selectedColegioId || '');
        setSelectedCursoIdForm(selectedCursoId || '');
      }

    } catch (err) {
      console.error('Error saving user:', err);
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Renderizar el formulario solo si el usuario autenticado es superadmin
   if (!user || user.rol_id !== 1) {
     return <p>Acceso denegado. Solo superusuarios pueden administrar usuarios.</p>;
   }

  return (
    <form onSubmit={handleSubmit} className="form-grid form-compact">
      {/* Campo Nombre */}
      <div className="form-group">
        <label htmlFor="userName">Nombre</label>
        <input
          id="userName"
          type="text"
          placeholder="Nombre completo"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          required
          className="input"
        />
      </div>

      {/* Campo Email */}
      <div className="form-group">
        <label htmlFor="userEmail">Email</label>
        <input
          id="userEmail"
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="input"
        />
      </div>

      {/* Campo Contraseña (visible solo para nuevo usuario o si se edita y se quiere cambiar) */}
      {(!editingUser || password) && (
         <div className="form-group">
           <label htmlFor="userPassword">Contraseña {editingUser ? '(dejar vacío para no cambiar)' : ''}</label>
           <input
             id="userPassword"
             type="password"
             placeholder={editingUser ? '' : 'Contraseña (mín 6 caracteres)'}
             value={password}
             onChange={e => setPassword(e.target.value)}
             required={!editingUser} // Requerido solo para nuevos usuarios
             className="input"
           />
         </div>
      )}

      {/* Selector de Rol */}
      <div className="form-group">
        <label htmlFor="userRol">Rol</label>
        <select
          id="userRol"
          value={rolId}
          onChange={e => setRolId(e.target.value)}
          required
          className="input"
        >
          {roles.map(rol => (
            <option key={rol.id} value={rol.id}>{rol.nombre}</option>
          ))}
        </select>
      </div>

      {/* Selector de Colegio */}
       <div className="form-group">
         <label htmlFor="userColegio">Colegio</label>
         <select
           id="userColegio"
           value={selectedColegioIdForm}
           onChange={e => { setSelectedColegioIdForm(e.target.value); setSelectedCursoIdForm(''); /* Resetear curso al cambiar colegio */ }}
           required
           className="input"
         >
           <option value="">Selecciona un colegio</option>
           {colegios.map(colegio => (
             <option key={colegio.id} value={colegio.id}>{colegio.nombre}</option>
           ))}
         </select>
       </div>

       {/* Selector de Curso (dependiente del colegio seleccionado) */}
       <div className="form-group">
         <label htmlFor="userCurso">Curso</label>
         <select
           id="userCurso"
           value={selectedCursoIdForm}
           onChange={e => setSelectedCursoIdForm(e.target.value)}
           required
           className="input"
           disabled={!selectedColegioIdForm} // Deshabilitar si no hay colegio seleccionado
         >
           <option value="">Selecciona un curso</option>
           {cursosFiltrados.map(curso => (
             <option key={curso.id} value={curso.id}>{curso.nombre}</option>
           ))}
         </select>
       </div>

      {error && <p style={{ color: 'red', gridColumn: '1 / -1' }}>{error}</p>}
      <div className="form-group" style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <button type="submit" className="btn-principal" disabled={loading}>
          {loading ? 'Guardando...' : (editingUser ? 'Actualizar Usuario' : 'Crear Usuario')}
        </button>
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
} 