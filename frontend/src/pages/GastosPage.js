import React, { useState, useRef, useEffect } from 'react';
import GastosList from '../components/Gastos/GastosList';
import GastosForm from '../components/Gastos/GastosForm';
import { FileStack, ChevronDown, ChevronUp } from 'lucide-react';
import { FaPlus } from 'react-icons/fa';

export default function GastosPage({ user }) {
  // Estado para forzar actualizaciones
  const [refreshKey, setRefreshKey] = useState(0);
  const [gastos, setGastos] = useState([]); // Estado para almacenar los gastos
  const [loading, setLoading] = useState(true); // Estado de carga
  // Referencia al componente GastosList
  const gastosListRef = useRef(null);
  const [isFormVisible, setIsFormVisible] = useState(false); // Estado para visibilidad del formulario, empieza cerrado
  const [error, setError] = useState('');
  const [actualizando, setActualizando] = useState(false);
  const [comprobante, setComprobante] = useState(null); // Estado para el archivo del comprobante

  // Estados para controlar si la sección de registro está colapsada
  const [isRegistroCollapsed, setIsRegistroCollapsed] = useState(false);

  // Estados para los campos del formulario de gasto
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState('');

  // Función para forzar recarga de gastos
  const handleGastosUpdated = () => {
    // Incrementar refreshKey para forzar renderizado
    setRefreshKey(prev => prev + 1);
    
    // Si el componente GastosList expone un método reloadGastos, llamarlo
    if (gastosListRef.current && gastosListRef.current.reloadGastos) {
      gastosListRef.current.reloadGastos();
    } else {
      // Falback: recargar la página
      window.location.reload();
    }
  };

  const toggleFormVisibility = () => {
    setIsFormVisible(!isFormVisible);
  };

  // Función para cargar los gastos desde el backend
  const fetchGastos = async () => {
    setLoading(true); // Iniciar carga
    setError(''); // Limpiar errores previos
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No autenticado.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/gastos`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al cargar los gastos');
      }

      const data = await res.json();
      setGastos(Array.isArray(data) ? data : []); // Asegurar que el estado sea un array

    } catch (err) {
      console.error('Error cargando gastos:', err);
      setError(`Error al cargar gastos: ${err.message}`);
      setGastos([]); // Limpiar lista en caso de error
    } finally {
      setLoading(false); // Finalizar carga
    }
  };

  // useEffect para cargar los gastos cuando el componente se monta
  useEffect(() => {
    if (user) { // Asegurarse de que el usuario esté cargado
        fetchGastos();
    }
  }, [user]); // Dependencia del usuario para recargar si cambia la autenticación

  const handleAddGasto = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!user || !user.curso_id || !user.colegio_id || !user.id || !user.nombre || !user.rol_id) {
        setError('Información de usuario incompleta.');
        setLoading(false);
        return;
    }

    // Validar campos obligatorios del formulario
    if (!descripcion.trim() || !monto || !fecha) {
        setError('Por favor, complete todos los campos (Descripción, Monto, Fecha).');
        setLoading(false);
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        setError('No autenticado.');
        setLoading(false);
        return;
    }

    const nuevoGastoData = {
      curso_id: user.curso_id,
      colegio_id: user.colegio_id,
      descripcion: descripcion,
      monto: parseFloat(monto), // Asegurarse de que sea número
      fecha: fecha, // Formato YYYY-MM-DD
      // Datos para el log
      usuario_id: user.id,
      usuario_nombre: user.nombre,
      rol_id: user.rol_id,
    };

    // Usar FormData para enviar datos y archivo
    const formData = new FormData();
    // Añadir campos de texto
    for (const key in nuevoGastoData) {
        formData.append(key, nuevoGastoData[key]);
    }
    // Añadir el archivo del comprobante si existe
    if (comprobante) {
        formData.append('comprobante', comprobante);
    }

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/gastos`, {
        method: 'POST',
        headers: { // No especificar Content-Type, FormData lo hace automáticamente con el boundary
          'Authorization': `Bearer ${token}`
        },
        body: formData // Enviar FormData
      });

      const data = await res.json();

      if (res.ok) {
        alert('Gasto registrado con éxito!');
        setDescripcion('');
        setMonto('');
        setFecha('');
        setComprobante(null); // Limpiar el archivo seleccionado
        fetchGastos(); // Actualizar la lista
      } else {
        setError(data.error || 'Error al registrar gasto.');
      }
    } catch (error) {
      setError('Error al registrar gasto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="gastos-page">
      <h2 className="page-title">
        <FileStack color="var(--color-primary)" size={28}/> Gastos
      </h2>
      
      {/* Sección del formulario desplegable */}
      <div className="card">
        <div 
          onClick={toggleFormVisibility} 
          className="accordion-header" // Aplicar estilos desde un CSS global o module
          style={{ 
            cursor: 'pointer', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '0.8rem 1rem', // Ajustar padding según diseño
            borderBottom: isFormVisible ? '1px solid #e0e0e0' : 'none' // Línea divisoria si está abierto
          }}
        >
          <h3 className="section-subtitle" style={{ margin: 0, fontSize: '1.1rem' }}>Registrar nuevo gasto</h3>
          {isFormVisible ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>

        {isFormVisible && (
          <div style={{ padding: '1rem' }}> {/* Contenedor para el padding interno del formulario */}
            {/* Campos de formulario movidos aquí para manejar el estado en GastosPage */}
            <form onSubmit={handleAddGasto} className="form-grid form-compact">
               {/* Campo Descripción */}
               <div className="form-group">
                 <label htmlFor="descripcionGasto">Descripción</label>
                 <input
                   id="descripcionGasto"
                   type="text"
                   placeholder="Descripción del gasto"
                   value={descripcion}
                   onChange={e => setDescripcion(e.target.value)}
                   required
                   className="input"
                 />
               </div>
               {/* Campo Monto */}
               <div className="form-group">
                 <label htmlFor="montoGasto">Monto</label>
                 <input
                   id="montoGasto"
                   type="number"
                   placeholder="Monto"
                   value={monto}
                   onChange={e => setMonto(e.target.value)}
                   required
                   className="input"
                 />
               </div>
               {/* Campo Fecha */}
               <div className="form-group">
                 <label htmlFor="fechaGasto">Fecha</label>
                 <input
                   id="fechaGasto"
                   type="date"
                   value={fecha}
                   onChange={e => setFecha(e.target.value)}
                   required
                   className="input"
                 />
               </div>
               {/* Campo Comprobante */}
               <div className="form-group">
                 <label htmlFor="comprobanteGasto">Comprobante (Opcional)</label>
                 <input
                   id="comprobanteGasto"
                   type="file"
                   onChange={e => setComprobante(e.target.files[0])}
                   className="input-file"
                 />
               </div>
               {/* Botón Agregar */}
               <div className="form-group" style={{alignSelf:'end', marginTop: '22px'}}>
                 <button type="submit" className="btn btn-primary">
                   <FaPlus /> Agregar
                 </button>
               </div>
             </form>
            </div>
          )}
        </div>
      
      {/* Sección de la lista de gastos */}
      <div className="card" style={{ marginTop: '1.5rem' }}> {/* Añadir un margen superior si es necesario */}
        <h3 className="section-subtitle" style={{padding: '0.8rem 1rem'}}>Gastos registrados</h3>
        <div style={{padding: '0 1rem 1rem 1rem'}}>
          {loading ? (
            <p>Cargando gastos...</p>
          ) : error ? (
            <p style={{ color: 'red' }}>{error}</p>
          ) : (
            <GastosList ref={gastosListRef} gastos={gastos} user={user} onGastosUpdated={fetchGastos} />
          )}
        </div>
      </div>
    </section>
  );
}