import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { ChevronUp, ChevronDown } from 'lucide-react';
import UserForm from '../components/UserForm';

export default function AdminUsuariosPage({ user }) {
  const [cursos, setCursos] = useState([]);
  const [colegios, setColegios] = useState([]);
  const [selectedCursoId, setSelectedCursoId] = useState('');
  const [selectedColegioId, setSelectedColegioId] = useState('');
  const [loadingCursosColegios, setLoadingCursosColegios] = useState(true);
  const [errorCursosColegios, setErrorCursosColegios] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actualizando, setActualizando] = useState(false);
  const [alumnos, setAlumnos] = useState([]);
  const [rolesSeleccionados, setRolesSeleccionados] = useState({ presidente: null, tesorero: null, secretario: null });
  const [loadingAlumnos, setLoadingAlumnos] = useState(false);
  const [alumnosImportados, setAlumnosImportados] = useState([]);
  const [rolesImportados, setRolesImportados] = useState({});

  // Estado para controlar la visibilidad y datos del formulario de usuario manual
  const [isManualUserFormVisible, setIsManualUserFormVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // null si es nuevo, objeto usuario si se está editando

  // Estados para controlar si las secciones están colapsadas
  const [isAlumnosExistentesCollapsed, setIsAlumnosExistentesCollapsed] = useState(false);
  const [isAlumnosImportadosCollapsed, setIsAlumnosImportadosCollapsed] = useState(false);

  // Estados para el modal de cambio de contraseña de usuario existente
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [selectedUserForPasswordChange, setSelectedUserForPasswordChange] = useState(null);
  const [newPasswordAdmin, setNewPasswordAdmin] = useState('');
  const [confirmNewPasswordAdmin, setConfirmNewPasswordAdmin] = useState('');
  const [passwordChangeMessage, setPasswordChangeMessage] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Nuevo estado para almacenar el nombre del archivo seleccionado
  const [selectedFileName, setSelectedFileName] = useState('');

  // Roles disponibles (duplicado aquí, idealmente centralizar)
   const roles = [
     { id: 1, nombre: 'Superusuario' },
     { id: 2, nombre: 'Presidente' },
     { id: 3, nombre: 'Tesorero' },
     { id: 4, nombre: 'Apoderado' },
     { id: 5, nombre: 'Secretario' },
   ];

  useEffect(() => {
    if (!user || user.rol_id !== 1) return;
    console.log('useEffect [user] - Cargando colegios...');
    setLoadingCursosColegios(true);
    const token = localStorage.getItem('token');

    const fetchColegios = fetch(`${process.env.REACT_APP_API_URL}/colegios`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => res.json());

    fetchColegios
      .then(colegiosData => {
        setColegios(Array.isArray(colegiosData) ? colegiosData : []);
        setLoadingCursosColegios(false);
        console.log('Carga inicial de colegios completada.', { colegiosCargados: colegiosData.length });
      })
      .catch(err => {
        console.error('Error cargando colegios:', err);
        setErrorCursosColegios('Error al cargar colegios');
        setLoadingCursosColegios(false);
      });
  }, [user]);

  useEffect(() => {
    console.log('useEffect [selectedColegioId] - Valor actual:', selectedColegioId);
    if (!selectedColegioId) {
      console.log('selectedColegioId está vacío. Limpiando cursos, cursos seleccionados y alumnos.');
      setCursos([]);
      setSelectedCursoId('');
      setAlumnos([]);
      setRolesSeleccionados({});
      return;
    }

    console.log(`selectedColegioId tiene valor (${selectedColegioId}). Cargando cursos para este colegio.`);
    setCursos([]);
    setSelectedCursoId('');
    setAlumnos([]);
    setRolesSeleccionados({});

    const token = localStorage.getItem('token');
    if (!token) {
        console.log('No hay token, no se cargan cursos.');
        setLoadingCursosColegios(false);
        return;
    }

    setLoadingCursosColegios(true);
    const cursosFetchUrl = `${process.env.REACT_APP_API_URL}/cursos?colegio_id=${selectedColegioId}`;
    console.log('Fetching cursos URL:', cursosFetchUrl);

    fetch(cursosFetchUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
        if (!res.ok) {
          return res.json().then(err => { throw new Error(err.error || 'Error desconocido al cargar cursos'); });
        }
        return res.json();
      })
      .then(cursosData => {
        console.log('Cursos recibidos por fetch [selectedColegioId]:', cursosData);
        setCursos(Array.isArray(cursosData) ? cursosData : []);
        setLoadingCursosColegios(false);
        setErrorCursosColegios('');
        console.log(`Cursos cargados para colegio ${selectedColegioId}:`, cursosData);
      })
      .catch(err => {
        console.error('Error cargando cursos por colegio:', err);
        setErrorCursosColegios(`Error al cargar cursos: ${err.message || ''}`);
        setCursos([]);
        setLoadingCursosColegios(false);
      });

  }, [selectedColegioId, user]);

  useEffect(() => {
    console.log('useEffect [selectedCursoId, selectedColegioId, isManualUserFormVisible] - Curso:', selectedCursoId, 'Colegio:', selectedColegioId, 'Formulario visible:', isManualUserFormVisible);
    // Modificado: Solo cargar alumnos si el formulario manual NO está visible
    if (selectedCursoId && selectedColegioId && !isManualUserFormVisible) {
      console.log(`Cargando alumnos para curso ${selectedCursoId} y colegio ${selectedColegioId}`);
      setLoadingAlumnos(true);
      const token = localStorage.getItem('token');
      const fetchUrl = `${process.env.REACT_APP_API_URL}/usuarios?curso_id=${selectedCursoId}&colegio_id=${selectedColegioId}`;
      console.log('Fetching users for curso_id:', selectedCursoId, 'URL:', fetchUrl);
      fetch(fetchUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => {
             if (!res.ok) {
                // Intentar leer el error del cuerpo de la respuesta si no es ok
                return res.json().then(err => {
                     console.error('Error response from fetch users:', err);
                     throw new Error(err.error || `Error fetching users: ${res.status} ${res.statusText}`);
                }).catch(() => {
                     // Si no se puede leer JSON, lanzar un error genérico
                     throw new Error(`Error fetching users: ${res.status} ${res.statusText}`);
                });
             }
             return res.json();
          })
        .then(data => {
          console.log('Datos de usuarios recibidos:', data);
          setAlumnos(Array.isArray(data) ? data : []);
          setRolesSeleccionados({ presidente: null, tesorero: null, secretario: null });
          setLoadingAlumnos(false);
        })
        .catch(err => {
           console.error('Fetch users catch block error:', err);
           setError(err.message || 'Error al cargar alumnos.'); // Mostrar error en la UI si es necesario
           setAlumnos([]);
           setLoadingAlumnos(false);
        });
    } else if (!selectedCursoId || !selectedColegioId) {
        // Limpiar alumnos si no hay curso o colegio seleccionado y el formulario manual no está visible
         if (!isManualUserFormVisible) {
            setAlumnos([]);
            setRolesSeleccionados({});
         }
    }
  }, [selectedCursoId, selectedColegioId, user, isManualUserFormVisible]); // Agregar isManualUserFormVisible como dependencia

  const handleSeleccionarCurso = (e) => {
    const id = parseInt(e.target.value);
    console.log('Seleccionado curso con ID:', id);
    setSelectedCursoId(id);
  };

  const handleSeleccionarColegio = (e) => {
    const id = parseInt(e.target.value);
    console.log('Seleccionado colegio con ID:', id);
    setSelectedColegioId(id);
  };

  const toggleEstadoCurso = async () => {
    if (!selectedCursoId) return;
    setActualizando(true);
    const token = localStorage.getItem('token');
    if (!token) {
        alert('No autenticado.');
        setActualizando(false);
        return;
    }
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/cursos/${selectedCursoId}/estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ activo: !cursos.find(c => c.id === selectedCursoId).activo })
      });
      if (res.ok) {
        const actualizado = { ...cursos.find(c => c.id === selectedCursoId), activo: !cursos.find(c => c.id === selectedCursoId).activo };
        setSelectedCursoId(actualizado.id);
        setCursos(cursos.map(c => c.id === actualizado.id ? actualizado : c));
      }
    } catch (err) {
      setError('Error al actualizar estado del curso');
    }
    setActualizando(false);
  };

  const handleAsignarRolExistente = (rol, alumnoId) => {
    setRolesSeleccionados(prev => ({ ...prev, [rol]: prev[rol] === alumnoId ? null : alumnoId }));
  };

  const handleAsignarRolImportado = (rol, index) => {
    setRolesImportados(prev => ({ ...prev, [rol]: prev[rol] === index ? null : index }));
  };

  const handleGuardarRolesExistente = async () => {
    const token = localStorage.getItem('token');
    const updates = [];
    alumnos.forEach(alumno => {
      let nuevoRol = 4;
      if (rolesSeleccionados.presidente === alumno.id) nuevoRol = 2;
      if (rolesSeleccionados.tesorero === alumno.id) nuevoRol = 3;
      if (rolesSeleccionados.secretario === alumno.id) nuevoRol = 5;
      // Solo enviar actualización si el rol ha cambiado
      if (alumno.rol_id !== nuevoRol) {
        updates.push(
          fetch(`${process.env.REACT_APP_API_URL}/usuarios/${alumno.id}/rol`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ rol_id: nuevoRol })
          })
           .then(res => {
               if (!res.ok) {
                   return res.json().then(err => { throw new Error(err.error || 'Error desconocido al actualizar rol'); });
               }
               return res.json();
            })
           .catch(err => {
               console.error(`Error actualizando rol para usuario ${alumno.id}:`, err);
               // Manejar el error para esta actualización específica si es necesario
               throw err; // Relanzar el error para que Promise.all lo capture
           })
        );
      }
    });

    if (updates.length > 0) {
        try {
            await Promise.all(updates);
            alert('Roles de alumnos existentes actualizados correctamente');
            // Recargar la lista de alumnos para reflejar los cambios
            if (selectedCursoId && selectedColegioId) {
                setLoadingAlumnos(true); // Mostrar indicador de carga
                setError(''); // Limpiar errores
                const token = localStorage.getItem('token');
                const fetchUrl = `${process.env.REACT_APP_API_URL}/usuarios?curso_id=${selectedCursoId}&colegio_id=${selectedColegioId}`;
                 fetch(fetchUrl, {
                   headers: { 'Authorization': `Bearer ${token}` }
                 })
                .then(res => {
                   if (!res.ok) {
                       return res.json().then(err => { throw new Error(err.error || 'Error desconocido al recargar usuarios'); });
                   }
                   return res.json();
                })
                .then(data => {
                   setAlumnos(Array.isArray(data) ? data : []);
                   setLoadingAlumnos(false);
                })
                .catch(err => {
                   console.error('Error reloading users after role save:', err);
                   setError(err.message || 'Error al recargar alumnos.');
                   setAlumnos([]);
                   setLoadingAlumnos(false);
                });
            }
        } catch (allErr) {
            console.error('Error durante la actualización masiva de roles:', allErr);
            alert(`Error al actualizar roles: ${allErr.message}`);
        }
    } else {
        alert('No se realizaron cambios en los roles.');
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFileName(file.name); // Guardar el nombre del archivo
      const reader = new FileReader();
      // Detectar tipo de archivo para opciones de lectura ANTES de reader.onload
      const isCSV = file.name.toLowerCase().endsWith('.csv');

      reader.onload = (e) => {
        const fileContent = e.target.result; // Contenido leído como texto (para CSV) o ArrayBuffer (para XLSX)

        console.log('FileReader onload triggered.');
        if (isCSV) {
          console.log('CSV file content (first 500 chars):', fileContent.substring(0, 500));
        }

        const workbook = XLSX.read(fileContent, {
          type: isCSV ? 'string' : 'array', // Leer como string para CSV, array para otros
          codepage: isCSV ? 65001 : undefined, // Intentar UTF-8 para CSV
          // Posiblemente añadir 'delimiter' aquí si confirmamos que no es coma
        });

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        // Añadir header: 1 para que lea la primera fila como encabezado
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // Leer como array de arrays

        console.log('Parsed raw data from file (header: 1):', json);

        // Suponiendo que la primera fila son los encabezados
        if (json.length < 2) {
             console.warn('Archivo vacío o sin datos después del encabezado.', json);
             setAlumnosImportados([]);
             alert('El archivo no contiene datos de alumnos.');
             return;
        }

        const headers = json[0]; // Primera fila como encabezados
        const dataRows = json.slice(1); // Resto son datos

        console.log('Detected headers:', headers);
        console.log('Data rows (first 5):', dataRows.slice(0, 5));

        // Mapear columnas por nombre (asumiendo nombres esperados)
        const colegioCol = headers.indexOf('colegio');
        const cursoCol = headers.indexOf('curso');
        const apellidoCol = headers.indexOf('apellido');
        const nombreCol = headers.indexOf('nombre');
        const mailCol = headers.indexOf('mail');

        // Verificar que las columnas esperadas existen
        if (colegioCol === -1 || cursoCol === -1 || apellidoCol === -1 || nombreCol === -1 || mailCol === -1) {
            console.error('Faltan columnas esperadas en el encabezado del archivo.', headers);
            setAlumnosImportados([]);
            alert('El encabezado del archivo debe contener las columnas: colegio, curso, apellido, nombre, mail.');
            return;
        }

        const alumnosParseados = dataRows.map(row => ({
          colegio: row[colegioCol], // Usar índice de columna
          curso: row[cursoCol],     // Usar índice de columna
          apellido: row[apellidoCol],
          nombre: row[nombreCol],
          mail: row[mailCol]
        }));

        console.log('Alumnos parseados del archivo:', alumnosParseados);

        // Mapear nombres de colegio y curso a IDs, y generar clave temporal
        const alumnosConDatosCompletos = alumnosParseados.map((alumno, index) => {
          const nombreCompleto = `${alumno.apellido} ${alumno.nombre}`.trim();
          
          // Buscar IDs de colegio y curso por nombre
          const colegioObj = colegios.find(col => col.nombre === alumno.colegio);
          const cursoObj = cursos.find(cur => cur.nombre === alumno.curso && cur.colegio_id === colegioObj?.id); // Filtrar cursos por colegio

          const claveTemporal = `${alumno.nombre.charAt(0)}${alumno.apellido}${alumno.curso}`.replace(/\s/g, '').toLowerCase();

          return {
            ...alumno,
            nombreCompleto: nombreCompleto,
            colegio_id: colegioObj ? colegioObj.id : null, // Guardar ID o null si no se encontró
            curso_id: cursoObj ? cursoObj.id : null,     // Guardar ID o null si no se encontró
            rol_id: 4, // Apoderado por defecto
            claveTemporal: claveTemporal,
          };
        });
        
        console.log('Alumnos con IDs de colegio/curso y clave temporal:', alumnosConDatosCompletos);

        // Filtrar alumnos que tienen IDs de colegio y curso válidos
        const alumnosValidos = alumnosConDatosCompletos.filter(alumno => alumno.colegio_id !== null && alumno.curso_id !== null);
        const alumnosInvalidos = alumnosConDatosCompletos.filter(alumno => alumno.colegio_id === null || alumno.curso_id === null);
        
        if (alumnosInvalidos.length > 0) {
             console.warn('Alumnos con colegio/curso no encontrado:', alumnosInvalidos);
             alert(`Se encontraron ${alumnosInvalidos.length} alumnos con colegio o curso no encontrado en el sistema. Por favor, revise los nombres en el archivo y asegúrese de que existan en la base de datos.`);
        }

        setAlumnosImportados(alumnosValidos); // Solo importar alumnos con IDs válidos
        setRolesImportados({}); // Resetear roles seleccionados para importación
      };

      // Iniciar la lectura del archivo
      if (isCSV) {
        reader.readAsText(file, 'UTF-8'); // Leer CSV como texto UTF-8
      } else {
        reader.readAsArrayBuffer(file); // Leer otros tipos (XLSX) como ArrayBuffer
      }
    }
  };

  const handleImportarAlumnos = async () => {
    if (alumnosImportados.length === 0) {
      alert('No hay alumnos válidos para importar.');
      return;
    }

    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    if (!token) {
        setError('No autenticado.');
        setLoading(false);
        return;
    }

    // Mapear alumnos importados a la estructura esperada por el backend /usuarios/import
    const usuariosParaBackend = alumnosImportados.map(alumno => ({
        nombre: alumno.nombreCompleto, // Usar nombre completo (Apellido Nombre)
        email: alumno.mail,
        password: alumno.claveTemporal, // Usar la clave temporal como contraseña inicial
        rol_id: rolesImportados[alumnosImportados.indexOf(alumno)] || 4, // Usar rol seleccionado o Apoderado (4) por defecto
        // Enviar nombres de colegio y curso al backend para que él maneje la búsqueda/creación
        colegio: alumno.colegio, 
        curso: alumno.curso,
        // Aunque el backend ahora usa nombres, los IDs en alumnosImportados son útiles para depuración en frontend
        colegio_id_frontend: alumno.colegio_id, // Mantener para depuración en frontend si es necesario
        curso_id_frontend: alumno.curso_id     // Mantener para depuración en frontend si es necesario
    }));

    console.log('Usuarios a enviar al backend para importación:', usuariosParaBackend);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/usuarios/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(usuariosParaBackend)
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Importación completada. Creados: ${data.importedCount}, Actualizados: ${data.updatedCount}, Fallidos: ${data.failedCount}`);
        console.log('Import result:', data);
        setAlumnosImportados([]); // Limpiar la lista de importados después de una importación exitosa
        setRolesImportados({}); // Limpiar roles seleccionados para importación
        setSelectedFileName(''); // Limpiar nombre de archivo
        // Opcional: Recargar la lista de alumnos existentes si se importaron al curso/colegio actual
         if (selectedCursoId && selectedColegioId && data.importedCount + data.updatedCount > 0) {
            setLoadingAlumnos(true);
            setError('');
            const fetchUrl = `${process.env.REACT_APP_API_URL}/usuarios?curso_id=${selectedCursoId}&colegio_id=${selectedColegioId}`;
             fetch(fetchUrl, {
               headers: { 'Authorization': `Bearer ${token}` }
             })
            .then(res => {
               if (!res.ok) {
                   return res.json().then(err => { throw new Error(err.error || 'Error desconocido al recargar usuarios'); });
               }
               return res.json();
            })
            .then(data => {
               setAlumnos(Array.isArray(data) ? data : []);
               setLoadingAlumnos(false);
            })
            .catch(err => {
               console.error('Error reloading users after import:', err);
               setError(err.message || 'Error al recargar alumnos.');
               setAlumnos([]);
               setLoadingAlumnos(false);
            });
         }

      } else {
        // Manejar errores del backend
        setError(data.error || 'Error al importar usuarios.');
        console.error('Backend import error:', data);
        alert(`Error al importar usuarios: ${data.error || 'Error desconocido'}. ${data.failedCount > 0 ? `(${data.failedCount} fallidos)` : ''}`);
        // Opcional: mostrar detalles de failedUsers si data.failedUsers existe
        if (data.failedUsers && data.failedUsers.length > 0) {
             console.log('Detalles de usuarios fallidos:', data.failedUsers);
        }
      }
    } catch (err) {
      console.error('Error calling import endpoint:', err);
      setError('Error en la comunicación con el servidor al importar usuarios.');
      alert(`Error en la comunicación con el servidor: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

   const handleOpenChangePasswordModal = (alumno) => {
     setSelectedUserForPasswordChange(alumno);
     setNewPasswordAdmin('');
     setConfirmNewPasswordAdmin('');
     setPasswordChangeMessage('');
     setPasswordChangeError('');
     setIsChangePasswordModalOpen(true);
   };

   const handleCloseChangePasswordModal = () => {
     setIsChangePasswordModalOpen(false);
     setSelectedUserForPasswordChange(null);
   };

   const handleChangePasswordAdmin = async () => {
     if (newPasswordAdmin !== confirmNewPasswordAdmin) {
       setPasswordChangeError('Las contraseñas no coinciden.');
       return;
     }
     if (newPasswordAdmin.length < 6) {
        setPasswordChangeError('La contraseña debe tener al menos 6 caracteres.');
        return;
     }

     setIsChangingPassword(true);
     setPasswordChangeMessage('');
     setPasswordChangeError('');
     const token = localStorage.getItem('token');

     if (!selectedUserForPasswordChange || !token) {
         setPasswordChangeError('Error interno: usuario no seleccionado o no autenticado.');
         setIsChangingPassword(false);
         return;
     }

     try {
       const response = await fetch(`${process.env.REACT_APP_API_URL}/usuarios/${selectedUserForPasswordChange.id}/password`, {
         method: 'PUT',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${token}`
         },
         body: JSON.stringify({ newPassword: newPasswordAdmin })
       });

       const data = await response.json();

       if (!response.ok) {
         throw new Error(data.error || 'Error desconocido al cambiar la contraseña.');
       }

       setPasswordChangeMessage('Contraseña actualizada con éxito.');
       // No cerramos el modal automáticamente, permitimos al usuario ver el mensaje de éxito.
       // Se cerrará manualmente.

     } catch (err) {
       console.error('Error changing password:', err);
       setPasswordChangeError(err.message);
     } finally {
       setIsChangingPassword(false);
     }
   };

  // Funciones para manejar la visibilidad del formulario manual y la edición
  const handleOpenManualUserForm = (userToEdit = null) => {
    setEditingUser(userToEdit);
    setIsManualUserFormVisible(true);
  };

  const handleUserSaved = (savedUser) => {
    // Cerrar formulario y limpiar estado de edición
    setIsManualUserFormVisible(false);
    setEditingUser(null);
    if (savedUser.curso_id === parseInt(selectedCursoId) && savedUser.colegio_id === parseInt(selectedColegioId)) {
        console.log('Recargar lista de alumnos necesaria.');
    }
  };

  // Renderizar el formulario manual si está visible
  if (isManualUserFormVisible) {
      return (
         <div className="page-content"> {/* Usar un contenedor similar a la página */}
             <h2 className="page-title">
                {editingUser ? 'Editar Usuario' : 'Agregar Nuevo Usuario'}
             </h2>
             <div className="card">
                 <div style={{ padding: '1rem' }}>
                     {/* Botón para cancelar y volver a la vista principal */}
                     <button 
                       onClick={() => { handleOpenManualUserForm(null); }} 
                       className="btn btn-secondary" 
                       style={{ marginBottom: '20px' }}
                     >
                         Cancelar
                     </button>
                     <UserForm
                         user={user} // Pasar usuario autenticado
                         editingUser={editingUser} // Pasar usuario a editar (o null)
                         colegios={colegios} // Pasar lista de colegios
                         cursos={cursos} // Pasar lista de cursos
                         onUserSaved={handleUserSaved}
                         onCancel={() => { handleOpenManualUserForm(null); }}
                         // Pasar colegio y curso seleccionados en la página padre para valores por defecto
                         selectedColegioId={selectedColegioId}
                         selectedCursoId={selectedCursoId}
                     />
                 </div>
             </div>
         </div>
      );
  }


  // Renderizar el resto de la página de administración si el formulario manual NO está visible
  if (!user || user.rol_id !== 1) {
    return <p>Acceso denegado. Solo superusuarios pueden acceder a esta página.</p>;
  }

  return (
    <section className="admin-usuarios-page">
      <h2 className="page-title">Administración de Usuarios</h2>
      
      {/* Selectores de Colegio y Curso */}
      <div className="card mb-3">
        <div style={{padding: '1rem'}}>
          <div className="form-grid form-compact">
             {/* Selector de Colegio */}
             <div className="form-group">
                <label htmlFor="selectColegio">Seleccionar Colegio</label>
                <select
                   id="selectColegio"
                   value={selectedColegioId}
                   onChange={handleSeleccionarColegio}
                   className="input"
                   disabled={loadingCursosColegios}
                >
                  <option value="">Selecciona un colegio</option>
                  {colegios.map(colegio => (
                    <option key={colegio.id} value={colegio.id}>{colegio.nombre}</option>
                  ))}
                </select>
             </div>

             {/* Selector de Curso */}
             <div className="form-group">
               <label htmlFor="selectCurso">Seleccionar Curso</label>
               <select
                 id="selectCurso"
                 value={selectedCursoId}
                 onChange={handleSeleccionarCurso}
                 className="input"
                 disabled={!selectedColegioId || loadingCursosColegios}
               >
                 <option value="">Selecciona un curso</option>
                 {cursos.map(curso => (
                   <option key={curso.id} value={curso.id}>{curso.nombre} {curso.activo ? '' : '(Inactivo)'}</option>
                 ))}
               </select>
             </div>
             {selectedCursoId && cursos.find(c => c.id === parseInt(selectedCursoId)) && (
                <div className="form-group" style={{alignSelf:'end', marginTop: '22px'}}>
                   <button onClick={toggleEstadoCurso} className="btn btn-secondary" disabled={actualizando}>
                      {actualizando ? 'Actualizando...' : (
                         cursos.find(c => c.id === parseInt(selectedCursoId)).activo ? 'Desactivar Curso' : 'Activar Curso'
                      )}
                   </button>
                </div>
             )}
          </div>
           {errorCursosColegios && <p style={{ color: 'red', marginTop: '1rem' }}>{errorCursosColegios}</p>}
        </div>
      </div>
      
      {/* Sección de la lista de alumnos existentes */}
      {selectedColegioId && selectedCursoId && ( // Solo mostrar si hay colegio y curso seleccionados
      <div className="card" style={{marginTop: '2rem'}}>
        <div
          onClick={() => setIsAlumnosExistentesCollapsed(!isAlumnosExistentesCollapsed)}
          className="accordion-header"
          style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1rem' }}
        >
          <h3 className="section-subtitle" style={{ margin: 0, fontSize: '1.1rem' }}>Alumnos existentes en este curso</h3>
          {isAlumnosExistentesCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </div>

        {!isAlumnosExistentesCollapsed && selectedCursoId && !loadingAlumnos && (
          <div style={{ padding: '1rem' }}> {/* Contenedor para el padding interno */}
             {/* Botón para agregar nuevo usuario */}
             <button 
               onClick={() => { handleOpenManualUserForm(null); }} // Abre el formulario para nuevo usuario
               className="btn btn-primary" 
               style={{ marginBottom: '15px' }}
             >
                Agregar Usuario
             </button>

            {alumnos.length === 0 ? (
              <p>No hay alumnos registrados en este curso aún.</p>
            ) : (
              <div className="table-container">
                <table className="table-modern alumnos-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Email</th> {/* Agregar columna de Email */}
                      <th>Rol actual</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alumnos.map(alumno => (
                      <tr key={alumno.id}>
                        <td>{alumno.nombre}</td>
                        <td>{alumno.email}</td> {/* Mostrar Email */}
                        <td>{alumno.rol_id === 1 ? 'Superusuario' : roles.find(rol => rol.id === alumno.rol_id)?.nombre || 'Desconocido'}</td>
                        <td className="text-center">
                           <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                             {/* Botón para Editar Usuario */}
                             {/* Solo Superadmins pueden editar usuarios */}
                             {user && user.rol_id === 1 && (
                                <button 
                                  onClick={() => { handleOpenManualUserForm(alumno); }} // Abre el formulario para editar este usuario
                                  className="btn btn-outline-secondary btn-small"
                                >
                                   Editar
                                </button>
                             )}
                             {/* Botón para Abrir Modal de Cambio de Clave */}
                             {user && user.rol_id === 1 && ( // Solo Superadmin puede cambiar clave de otros
                               <button
                                 onClick={() => handleOpenChangePasswordModal(alumno)}
                                 className="btn btn-outline-secondary btn-small"
                               >
                                 Cambiar Clave
                               </button>
                             )}
                           </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
              </div>
            )}
          </div>
          )}
           {loadingAlumnos && selectedCursoId && selectedColegioId && <p>Cargando alumnos...</p>}
           {!selectedCursoId && !selectedColegioId && <p>Selecciona un colegio y un curso para ver los alumnos.</p>}
           {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
       </div>
      )}

      {/* Sección para subir archivo Excel de alumnos */}
      {selectedColegioId && selectedCursoId && ( // Solo mostrar si hay colegio y curso seleccionados
        <div className="card" style={{marginTop: '2rem'}}>
          <div
            onClick={() => setIsAlumnosImportadosCollapsed(!isAlumnosImportadosCollapsed)}
            className="accordion-header"
            style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1rem' }}
          >
            <h3 className="section-subtitle" style={{ margin: 0, fontSize: '1.1rem' }}>Subir archivo Excel de alumnos</h3>
            {isAlumnosImportadosCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </div>
          
          {!isAlumnosImportadosCollapsed && (
            <div style={{ padding: '1rem' }}> {/* Contenedor para el padding interno */}
              {/* Formulario de carga de archivo */}
              <div className="form-group">
                  <label htmlFor="uploadFile" className="file-upload-button">
                      {selectedFileName ? `Archivo seleccionado: ${selectedFileName}` : 'Seleccionar archivo Excel o CSV'}
                  </label>
                  <input 
                      id="uploadFile" 
                      type="file" 
                      accept=".xlsx, .xls, .csv"
                      onChange={handleFileUpload} 
                      style={{ display: 'none' }} // Ocultar el input de archivo real
                  />
              </div>

              {/* Tabla de alumnos importados para previsualizar y asignar roles */}
              {alumnosImportados.length > 0 && (
                <div className="table-container" style={{ marginTop: '20px' }}>
                   {/* Tabla de alumnos importados */}
                    <table className="table-modern alumnos-importados-table">
                       <thead>
                          <tr>
                             <th>Colegio</th>
                             <th>Curso</th>
                             <th>Apellido y Nombre</th>
                             <th>Mail</th>
                             <th>Rol por defecto (Apoderado)</th>
                             <th>Presidente</th>
                             <th>Tesorero</th>
                             <th>Secretario</th>
                             <th>Clave Temporal</th>
                          </tr>
                       </thead>
                       <tbody>
                          {alumnosImportados.map((alumno, index) => (
                             <tr key={index}> {/* Usar index como key si no hay ID aún */}
                                <td>{alumno.colegio}</td>
                                <td>{alumno.curso}</td>
                                <td>{alumno.nombreCompleto}</td>
                                <td>{alumno.mail}</td>
                                <td>Apoderado</td>
                                <td>
                                  <input type="radio" name={`rol-import-${index}`} checked={rolesImportados[`presidente-${index}`] === index} onChange={() => handleAsignarRolImportado(`presidente-${index}`, index)} />
                                </td>
                                <td>
                                  <input type="radio" name={`rol-import-${index}`} checked={rolesImportados[`tesorero-${index}`] === index} onChange={() => handleAsignarRolImportado(`tesorero-${index}`, index)} />
                                </td>
                                <td>
                                  <input type="radio" name={`rol-import-${index}`} checked={rolesImportados[`secretario-${index}`] === index} onChange={() => handleAsignarRolImportado(`secretario-${index}`, index)} />
                                </td>
                                <td>{alumno.claveTemporal}</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>

                  {/* Botón para importar */}
                  <button onClick={handleImportarAlumnos} className="btn-principal" style={{marginTop:'1rem'}} disabled={loading}>                  
                      {loading ? 'Importando...' : 'Importar Alumnos'}
                   </button>

                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal para cambio de clave de usuario existente */}
      {isChangePasswordModalOpen && selectedUserForPasswordChange && (
           <div className="modal">
             <div className="modal-content">
               <span className="close-button" onClick={handleCloseChangePasswordModal}>&times;</span>
               <h3>Cambiar Contraseña para {selectedUserForPasswordChange.nombre}</h3>
               <div className="form-group">
                 <label htmlFor="adminNewPassword">Nueva Contraseña</label>
                 <input 
                   type="password" 
                   id="adminNewPassword" 
                   value={newPasswordAdmin} 
                   onChange={(e) => setNewPasswordAdmin(e.target.value)} 
                   className="input form-input-narrow"
                   required 
                 />
               </div>
                <div className="form-group">
                 <label htmlFor="adminConfirmNewPassword">Confirmar Nueva Contraseña</label>
                 <input 
                   type="password" 
                   id="adminConfirmNewPassword" 
                   value={confirmNewPasswordAdmin} 
                   onChange={(e) => setConfirmNewPasswordAdmin(e.target.value)} 
                   className="input form-input-narrow"
                   required 
                 />
               </div>
               {passwordChangeError && <p style={{ color: 'red' }}>{passwordChangeError}</p>}
               {passwordChangeMessage && <p style={{ color: 'green' }}>{passwordChangeMessage}</p>}
               <button onClick={handleChangePasswordAdmin} disabled={isChangingPassword} className="btn-principal" style={{marginTop:'1rem'}}>
                 {isChangingPassword ? 'Cambiando...' : 'Cambiar Contraseña'}
               </button>
             </div>
           </div>
        )}

    </section>
  );
} 