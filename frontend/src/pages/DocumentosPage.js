import React from 'react';
import DocumentosList from '../components/Documentos/DocumentosList';
import DocumentosForm from '../components/Documentos/DocumentosForm';
import { FileText } from 'lucide-react';
// import './DocumentosAlignments.css'; // Comentado para evitar !important conflictivos
import GastosList from '../components/Gastos/GastosList'; // Asumiendo que existe para ejemplo

export default function DocumentosPage({ user }) {
  return (
    <section className="documentos-page">
      <h2 className="page-title">
        <FileText color="var(--color-primary)" size={28} /> Documentos
      </h2>
      <div className="card">
        <h3 className="section-subtitle">Agregar documento nuevo</h3>
        <DocumentosForm user={user} />
      </div>
      <div className="card">
        <h3 className="section-subtitle">Listado de documentos</h3>
        <DocumentosList user={user} />
      </div>
    </section>
  );
}