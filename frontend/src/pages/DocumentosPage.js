import React from 'react';
import DocumentosList from '../components/Documentos/DocumentosList';
import DocumentosForm from '../components/Documentos/DocumentosForm';
import { FaFileAlt } from 'react-icons/fa';
import '../components/Documentos/DocumentosAlignments.css';

export default function DocumentosPage({ user }) {
  return (
    <section className="documentos-page">
      <h2 className="page-title">
        <FaFileAlt color="#d97706" /> Documentos
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