import React, { useState } from 'react';
import DocumentosList from '../components/Documentos/DocumentosList';
import DocumentosForm from '../components/Documentos/DocumentosForm';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';
// import './DocumentosAlignments.css'; // Comentado para evitar !important conflictivos
import GastosList from '../components/Gastos/GastosList'; // Asumiendo que existe para ejemplo

export default function DocumentosPage({ user }) {
  const [isFormVisible, setIsFormVisible] = useState(false);

  const toggleFormVisibility = () => {
    setIsFormVisible(!isFormVisible);
  };

  return (
    <section className="documentos-page">
      <h2 className="page-title">
        <FileText color="var(--color-primary)" size={28} /> Documentos
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
          <h3 className="section-subtitle" style={{ margin: 0, fontSize: '1.1rem' }}>Agregar documento nuevo</h3>
          {isFormVisible ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>

        {([1,2,3,5].includes(user?.rol_id)) && isFormVisible && (
          <div style={{ padding: '1rem' }}> 
            <DocumentosForm 
              user={user} 
            />
          </div>
        )}
      </div>
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3 className="section-subtitle" style={{padding: '0.8rem 1rem'}}>Listado de documentos</h3>
        <div style={{padding: '0 1rem 1rem 1rem'}}>
          <DocumentosList 
            user={user} 
          />
        </div>
      </div>
    </section>
  );
}