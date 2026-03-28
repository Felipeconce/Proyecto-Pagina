import React, { useState } from 'react';
import DocumentosList from '../components/Documentos/DocumentosList';
import DocumentosForm from '../components/Documentos/DocumentosForm';
import { FaFileAlt } from 'react-icons/fa';

export default function DocumentosPage({ user }) {
  const [refresh, setRefresh] = useState(false);

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
      <DocumentosForm user={user} onSuccess={() => setRefresh(r => !r)} />
      <DocumentosList user={user} refresh={refresh} onRefresh={() => setRefresh(r => !r)} />
    </section>
  );
}
