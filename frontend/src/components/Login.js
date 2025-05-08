import React, { useState } from 'react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // VOLVEMOS A USAR LA VARIABLE DE ENTORNO
    // const API_URL = 'http://localhost:4000'; 
    
    try {
      // Usamos la variable de entorno como debe ser
      const res = await fetch(`${process.env.REACT_APP_API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Guardar token en localStorage
        localStorage.setItem('token', data.token);
        
        // Asegurarse de que el usuario tiene todos los campos necesarios
        if (!data.rol_id || !data.curso_id || !data.colegio_id) {
          setError('Falta información de usuario. Contacte al administrador.');
          setLoading(false);
          return;
        }
        
        onLogin(data);
      } else {
        setError(data.error || 'Error de autenticación');
        setLoading(false);
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Centro de Apoderados</h2>
        <h3>Iniciar Sesión</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="login-input"
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="login-input"
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" disabled={loading} className="login-button">
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}