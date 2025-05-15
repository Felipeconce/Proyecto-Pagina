import React, { useState, useRef } from 'react';
import GastosList from '../components/Gastos/GastosList';
import GastosForm from '../components/Gastos/GastosForm';
import { FileStack, ChevronDown, ChevronUp } from 'lucide-react';

export default function GastosPage({ user }) {
  // Estado para forzar actualizaciones
  const [refreshKey, setRefreshKey] = useState(0);
  // Referencia al componente GastosList
  const gastosListRef = useRef(null);
  const [isFormVisible, setIsFormVisible] = useState(false); // Estado para visibilidad del formulario, empieza cerrado

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
            <GastosForm 
              user={user} 
              onGastoAdded={handleGastosUpdated} 
            />
          </div>
        )}
      </div>
      
      {/* Sección de la lista de gastos */}
      <div className="card" style={{ marginTop: '1.5rem' }}> {/* Añadir un margen superior si es necesario */}
        <h3 className="section-subtitle" style={{padding: '0.8rem 1rem'}}>Gastos registrados</h3>
        <div style={{padding: '0 1rem 1rem 1rem'}}>
          <GastosList 
            ref={gastosListRef}
            user={user} 
            key={`gastos-list-${refreshKey}`}
          />
        </div>
      </div>
    </section>
  );
}