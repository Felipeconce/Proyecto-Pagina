import React, { useState, useRef } from 'react';
import GastosList from '../components/Gastos/GastosList';
import GastosForm from '../components/Gastos/GastosForm';
import { FaReceipt } from 'react-icons/fa';

export default function GastosPage({ user }) {
  // Estado para forzar actualizaciones
  const [refreshKey, setRefreshKey] = useState(0);
  // Referencia al componente GastosList
  const gastosListRef = useRef(null);

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

  return (
    <section className="gastos-page">
      <h2 className="page-title">
        <FaReceipt color="#16a34a" /> Gastos
      </h2>
      
      <div className="card">
        <h3 className="section-subtitle">Registrar nuevo gasto</h3>
        <GastosForm 
          user={user} 
          onGastoAdded={handleGastosUpdated} 
        />
      </div>
      
      <div className="card">
        <h3 className="section-subtitle">Gastos registrados</h3>
        <GastosList 
          ref={gastosListRef}
          user={user} 
          key={`gastos-list-${refreshKey}`}
        />
      </div>
    </section>
  );
}