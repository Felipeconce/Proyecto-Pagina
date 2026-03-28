import React, { useEffect, useState } from 'react';
import { FaDownload, FaFileAlt, FaFileWord, FaFilePdf, FaFileExcel, FaImage, FaList, FaTrash, FaFolderOpen } from 'react-icons/fa';
import { useToast } from '../Layout/ToastProvider';

export default function DocumentosList({ user, refresh, onRefresh }) {
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const puedeEliminar = user && [1, 2, 3, 5].includes(user.rol_id);

  const handleDelete = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar el documento "${nombre}"?`)) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/documentos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      showToast('Documento eliminado', 'success');
      if (onRefresh) onRefresh();
    } catch {
      showToast('Error al eliminar documento', 'error');
    }
  };

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
  }, [refresh]);

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
        <div style={{ padding: '8px 0' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton-row">
              <span className="skeleton" style={{ height: 14, width: '28%' }} />
              <span className="skeleton" style={{ height: 14, width: '32%' }} />
              <span className="skeleton" style={{ height: 14, width: '14%' }} />
              <span className="skeleton" style={{ height: 28, width: '10%', borderRadius: 8 }} />
            </div>
          ))}
        </div>
      ) : documentos.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon"><FaFolderOpen /></span>
          <p className="empty-state-text">No hay documentos disponibles</p>
          {puedeEliminar && <p className="empty-state-hint">Sube el primer documento usando el formulario</p>}
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
                {puedeEliminar && <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'center' }}>Acciones</th>}
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
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        gap: '6px', padding: '6px 12px', backgroundColor: '#e0e7ff',
                        color: '#4f46e5', borderRadius: '8px', fontWeight: '600',
                        textDecoration: 'none', fontSize: '14px'
                      }}
                    >
                      <FaDownload /> Descargar
                    </a>
                  </td>
                  {puedeEliminar && (
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <button onClick={() => handleDelete(doc.id, doc.nombre)} className="btn-icon btn-delete" style={{ fontSize: 13, padding: '6px 12px' }}>
                        <FaTrash /> Eliminar
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}