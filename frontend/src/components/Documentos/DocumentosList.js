import React, { useEffect, useState } from 'react';
import { FaDownload, FaFileAlt, FaFileWord, FaFilePdf, FaFileExcel, FaImage, FaList } from 'react-icons/fa';

export default function DocumentosList() {
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debug, setDebug] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setLoading(true);
    setError(null);
    
    // Almacenar información de depuración
    try {
      const tokenData = token ? JSON.parse(atob(token.split('.')[1])) : null;
      setDebug({
        tokenPresente: !!token,
        tokenData: tokenData,
        apiUrl: process.env.REACT_APP_API_URL
      });
    } catch (e) {
      setDebug({
        tokenPresente: !!token,
        tokenError: e.message,
        apiUrl: process.env.REACT_APP_API_URL
      });
    }
    
    fetch(`${process.env.REACT_APP_API_URL}/documentos`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Error al cargar documentos: ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        // Asegurar que data sea un array
        const documentosArray = Array.isArray(data) ? data : [];
        console.log('Documentos recibidos:', documentosArray);
        setDocumentos(documentosArray);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error al cargar documentos:', err);
        setError(`No se pudieron cargar los documentos: ${err.message}`);
        setDocumentos([]);
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

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
        Cargando documentos...
      </div>
    );
  }

  if (error) {
    return (
      <>
        <div style={{ padding: '20px', textAlign: 'center', color: '#ef4444' }}>
          {error}
        </div>
        {debug && (
          <div style={{ 
            padding: '15px', 
            backgroundColor: '#f3f4f6', 
            borderRadius: '8px', 
            marginTop: '20px',
            fontSize: '12px',
            overflow: 'auto'
          }}>
            <pre>{JSON.stringify(debug, null, 2)}</pre>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {documentos.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
          No hay documentos disponibles.
        </div>
      ) : (
        <div className="table-container">
          <table className="table-modern documentos-table">
            <thead>
              <tr>
                <th className="text-center">Nombre</th>
                <th className="text-center">Descripción</th>
                <th className="text-center">Fecha</th>
                <th className="text-center">Documento</th>
              </tr>
            </thead>
            <tbody>
              {documentos.map(doc => (
                <tr key={doc.id}>
                  <td className="text-center" style={{ verticalAlign: 'middle' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: '8px' }}>
                      {getFileIcon(doc.url)}
                    </span>
                    {doc.nombre}
                  </td>
                  <td>{doc.descripcion}</td>
                  <td className="text-center">
                    {new Date(doc.fecha_subida).toLocaleDateString('es-CL', { 
                      day: '2-digit', 
                      month: '2-digit', 
                      year: 'numeric' 
                    })}
                  </td>
                  <td className="text-center" style={{ verticalAlign: 'middle' }}>
                    <a
                      href={`${process.env.REACT_APP_API_URL}${doc.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="btn btn-secondary btn-outline-secondary btn-small"
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
    </>
  );
}