import React from 'react';
import DocumentosList from '../components/Documentos/DocumentosList';
import DocumentosForm from '../components/Documentos/DocumentosForm';
import { FaFileAlt } from 'react-icons/fa';

export default function DocumentosPage({ user }) {
  return (
    <section>
      <h2 style={{
        fontSize: '28px',
        fontWeight: '700',
        color: '#111827',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <FaFileAlt color="#d97706" /> Documentos
      </h2>
      <DocumentosForm user={user} />
      <DocumentosList user={user} />
    </section>
  );
}