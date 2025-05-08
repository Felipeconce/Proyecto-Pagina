import React, { useEffect, useState } from 'react';

function Documentos({ user }) {
  const [documentos, setDocumentos] = useState([]);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState('');
  const [file, setFile] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3001/documentos')
      .then(res => res.json())
      .then(data => setDocumentos(data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('descripcion', descripcion);
    formData.append('fecha_subida', fecha);
    formData.append('documento', file);

    await fetch('http://localhost:3001/documentos', {
      method: 'POST',
      body: formData,
    });

    // Refresca la lista
    fetch('http://localhost:3001/documentos')
      .then(res => res.json())
      .then(data => setDocumentos(data));

    setNombre('');
    setDescripcion('');
    setFecha('');
    setFile(null);
  };

  return (
    <section>
      <h2>Documentos</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nombre"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Descripción"
          value={descripcion}
          onChange={e => setDescripcion(e.target.value)}
          required
        />
        <input
          type="date"
          value={fecha}
          onChange={e => setFecha(e.target.value)}
          required
        />
        <input
          type="file"
          onChange={e => setFile(e.target.files[0])}
          required
        />
        <button type="submit">Subir Documento</button>
      </form>
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Fecha</th>
            <th>Documento</th>
          </tr>
        </thead>
        <tbody>
          {documentos.map(doc => (
            <tr key={doc.id}>
              <td>{doc.nombre}</td>
              <td>{doc.descripcion}</td>
              <td>{doc.fecha_subida}</td>
              <td>
                <a href={`http://localhost:3001${doc.url}`} target="_blank" rel="noopener noreferrer">
                  Descargar
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default Documentos;