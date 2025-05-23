import React, { useState } from 'react';
import { useToast } from '../Layout/ToastProvider';
import { FaPlus, FaUpload, FaFileAlt, FaFileWord, FaFilePdf, FaFileExcel, FaImage } from 'react-icons/fa';
import styles from './DocumentosForm.module.css';
import '../CommonStyles.css';

export default function DocumentosForm({ user }) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const { showToast } = useToast();

  if (!user || ![1, 2, 3, 5].includes(user.rol_id)) return null;

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
    <form onSubmit={handleSubmit} className={styles.documentosFormGrid}>
      <div className={styles.formGroupNombre}>
        <label htmlFor="docNombre">Nombre</label>
        <input
          id="docNombre"
          type="text"
          placeholder="Nombre del documento"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          required
          className={styles.input}
        />
      </div>
      
      <div className={styles.formGroupDescripcion}>
        <label htmlFor="docDescripcion">Descripción</label>
        <input
          id="docDescripcion"
          type="text"
          placeholder="Breve descripción"
          value={descripcion}
          onChange={e => setDescripcion(e.target.value)}
          required
          className={styles.input}
        />
      </div>
      
      <div className={styles.formGroupArchivo}>
        <div className={styles.fileInputContainer}>
          <input
            id="docFile"
            type="file"
            onChange={handleFileChange}
            required
            className={styles.hiddenFileInput}
          />
          <label htmlFor="docFile" className="btn btn-secondary">
            <FaUpload size={14} /> Seleccionar
          </label>
          <div className={styles.fileName}>
            {/* Solo mostrar icono y nombre si hay un archivo seleccionado */}
            {fileName && (
              <>
                {getFileIcon()}
                <span>
                  {fileName}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className={styles.formGroupBoton}>
        <button type="submit" className="btn btn-primary">
          <FaPlus /> Agregar
        </button>
      </div>
    </form>
  );
}