import React, { useState } from 'react';
import FechasList from '../components/Fechas/FechasList';
import FechasForm from '../components/Fechas/FechasForm';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';

export default function FechasPage({ user }) {
  const [isFormVisible, setIsFormVisible] = useState(false);

  const toggleFormVisibility = () => {
    setIsFormVisible(!isFormVisible);
  };

  return (
    <section className="fechas-page">
      <h2 className="page-title">
        <Calendar color="var(--color-primary)" size={28} /> Calendario
      </h2>
      <div className="card">
        <div 
          onClick={toggleFormVisibility} 
          className="accordion-header" 
          style={{ 
            cursor: 'pointer', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '0.8rem 1rem',
            borderBottom: isFormVisible ? '1px solid #e0e0e0' : 'none' 
          }}
        >
          <h3 className="section-subtitle" style={{ margin: 0, fontSize: '1.1rem' }}>Agregar fecha importante</h3>
          {isFormVisible ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>

        {isFormVisible && (
          <div style={{ padding: '1rem' }}> 
            <FechasForm 
              user={user} 
            />
          </div>
        )}
      </div>
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3 className="section-subtitle" style={{padding: '0.8rem 1rem'}}>Próximas fechas</h3>
        <div style={{padding: '0 1rem 1rem 1rem'}}>
          <FechasList 
            user={user} 
          />
        </div>
      </div>
    </section>
  );
}