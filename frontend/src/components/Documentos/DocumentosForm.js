import React, { useState } from 'react';
import { useToast } from '../Layout/ToastProvider';
import { FaUpload, FaFileAlt, FaFileWord, FaFilePdf, FaFileExcel, FaImage } from 'react-icons/fa';

export default function DocumentosForm({ user }) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const { showToast } = useToast();

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      setFileName(e.target.files[0].name);
    }
  };

  const getFileIcon = () => {
    if (!fileName) return <FaFileAlt />;
    
    const extension = fileName.split('.').pop().toLowerCase();
    if (['doc', 'docx'].includes(extension)) return <FaFileWord color="#2b579a" />;
    if (['pdf'].includes(extension)) return <FaFilePdf color="#f40f02" />;
    if (['xls', 'xlsx'].includes(extension)) return <FaFileExcel color="#217346" />;
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) return <FaImage color="#60a5fa" />;
    return <FaFileAlt color="#6b7280" />;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      showToast('Datos de usuario no disponibles', 'error');
      return;
    }
    
    const formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('descripcion', descripcion);
    formData.append('documento', file);
    
    // Agregar información del usuario
    formData.append('usuario_id', user.id);
    formData.append('usuario_nombre', user.nombre);
    formData.append('rol_id', user.rol_id);
    formData.append('curso_id', user.curso_id || 1);
    formData.append('colegio_id', user.colegio_id || 1);

    const token = localStorage.getItem('token');
    if (!token) {
      showToast('No estás autenticado', 'error');
      return;
    }
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/documentos`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Error al subir documento');
      }
      
      setNombre('');
      setDescripcion('');
      setFile(null);
      setFileName('');
      showToast('Documento subido correctamente', 'success');
      // Recargar la lista de documentos aquí si tienes función para ello
      // Por ejemplo: onDocumentoAgregado()
    } catch (err) {
      console.error('Error completo:', err);
      showToast(err.message || 'Error de red al subir documento', 'error');
    }
  };

  return (
    <div className="content-section" style={{ 
      backgroundColor: '#fff', 
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
      marginBottom: '32px'
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
        <FaUpload color="#4f46e5" /> Subir Documento
      </h3>
      
      <form onSubmit={handleSubmit} style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        maxWidth: '700px'
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="docNombre" style={{ fontWeight: '600', fontSize: '14px', color: '#4b5563' }}>Nombre</label>
            <input
              id="docNombre"
              type="text"
              placeholder="Nombre del documento"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              required
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '15px',
                width: '100%'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="docDescripcion" style={{ fontWeight: '600', fontSize: '14px', color: '#4b5563' }}>Descripción</label>
            <input
              id="docDescripcion"
              type="text"
              placeholder="Breve descripción"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              required
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '15px',
                width: '100%'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label htmlFor="docFile" style={{ fontWeight: '600', fontSize: '14px', color: '#4b5563' }}>Archivo</label>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            position: 'relative'
          }}>
            <input
              id="docFile"
              type="file"
              onChange={handleFileChange}
              required
              style={{
                width: '0.1px',
                height: '0.1px',
                opacity: 0,
                overflow: 'hidden',
                position: 'absolute',
                zIndex: -1
              }}
            />
            <label htmlFor="docFile" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: '#e0e7ff',
              color: '#4f46e5',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontSize: '14px',
              whiteSpace: 'nowrap'
            }}>
              <FaUpload size={14} /> Seleccionar
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px',
              color: fileName ? '#374151' : '#9ca3af',
              flex: 1,
              minWidth: 0
            }}>
              {getFileIcon()}
              <span style={{ 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: 'nowrap',
                maxWidth: '100%'
              }}>
                {fileName || 'Ningún archivo seleccionado'}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button type="submit" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '8px 16px',
            backgroundColor: '#4f46e5',
            color: 'white',
            borderRadius: '6px',
            border: 'none',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            width: 'auto',
            minWidth: '100px'
          }}>
            <FaUpload size={14} /> Agregar
          </button>
        </div>
      </form>
    </div>
  );
}