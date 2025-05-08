import React, { useEffect, useState } from 'react';
import { FaDownload, FaFileAlt, FaFileWord, FaFilePdf, FaFileExcel, FaImage, FaList } from 'react-icons/fa';

export default function DocumentosList() {
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setLoading(true);
    
    fetch(`${process.env.REACT_APP_API_URL}/documentos`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setDocumentos(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error al cargar documentos:', err);
        setLoading(false);
      });
  }, []);

  const getFileIcon = (url) => {
    if (!url) return <FaFileAlt color="#6b7280" />;
    
    const extension = url.split('.').pop().toLowerCase();
    if (['doc', 'docx'].includes(extension)) return <FaFileWord color="#2b579a" />;
    if (['pdf'].includes(extension)) return <FaFilePdf color="#f40f02" />;
    if (['xls', 'xlsx'].includes(extension)) return <FaFileExcel color="#217346" />;
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) return <FaImage color="#60a5fa" />;
    return <FaFileAlt color="#6b7280" />;
  };

  return (
    <div className="content-section" style={{
      backgroundColor: '#fff',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)'
    }}>
      <h3 style={{
        fontSize: '20px',
        fontWeight: '700',
        color: '#374151',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <FaList color="#4f46e5" /> Listado de Documentos
      </h3>

      {loading ? (
        <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
          Cargando documentos...
        </div>
      ) : documentos.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
          No hay documentos disponibles.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            fontSize: '15px',
            color: '#374151'
          }}>
            <thead>
              <tr style={{ 
                backgroundColor: '#e0e7ff',
                borderBottom: '2px solid #d1d5db',
                textAlign: 'left'
              }}>
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Nombre</th>
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Descripción</th>
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Fecha</th>
                <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'center' }}>Documento</th>
              </tr>
            </thead>
            <tbody>
              {documentos.map(doc => (
                <tr key={doc.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getFileIcon(doc.url)}
                    {doc.nombre}
                  </td>
                  <td style={{ padding: '12px 16px' }}>{doc.descripcion}</td>
                  <td style={{ padding: '12px 16px' }}>
                    {new Date(doc.fecha_subida).toLocaleDateString('es-CL', { 
                      day: '2-digit', 
                      month: '2-digit', 
                      year: 'numeric' 
                    })}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <a
                      href={`${process.env.REACT_APP_API_URL}${doc.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        backgroundColor: '#e0e7ff',
                        color: '#4f46e5',
                        borderRadius: '8px',
                        fontWeight: '600',
                        textDecoration: 'none',
                        fontSize: '14px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <FaDownload /> Descargar
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}