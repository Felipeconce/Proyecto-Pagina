import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth'; // Asegúrate de que la ruta a useAuth sea correcta

export default function ChangePasswordPage() {
  const { user, token } = useAuth(); // Obtener el usuario y token autenticado
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    if (newPassword !== confirmNewPassword) {
      setError('La nueva contraseña y la confirmación no coinciden.');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
       setError('La nueva contraseña debe tener al menos 6 caracteres.');
       setLoading(false);
       return;
    }

    if (!user || !token) {
        setError('Usuario no autenticado.');
        setLoading(false);
        return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/usuarios/${user.id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Contraseña actualizada exitosamente.');
        // Limpiar campos después de éxito
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        setError(data.error || 'Error al actualizar la contraseña.');
      }
    } catch (err) {
      console.error('Error en la solicitud de cambio de contraseña:', err);
      setError('Error al comunicarse con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div>Cargando usuario...</div>; // O manejar de otra forma si no hay usuario

  return (
    <section className="change-password-page">
      <h2 style={{ marginBottom: '30px' }}>Cambiar Contraseña</h2>
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group-horizontal">
            <label htmlFor="currentPassword">Actual:</label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="form-input-narrow"
              required
            />
          </div>
          <div className="form-group-horizontal">
            <label htmlFor="newPassword">Nueva:</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="form-input-narrow"
              required
            />
          </div>
          <div className="form-group-horizontal">
            <label htmlFor="confirmNewPassword">Confirmar Nueva:</label>
            <input
              type="password"
              id="confirmNewPassword"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="form-input-narrow"
              required
            />
          </div>
          <div style={{ marginTop: '20px' }}>
            <button type="submit" disabled={loading} className="button">Cambiar Contraseña</button>
          </div>
        </form>
        {message && <p style={{ color: 'green' }}>{message}</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    </section>
  );
} 