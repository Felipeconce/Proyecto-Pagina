const { Pool } = require('pg');
require('dotenv').config();

// Configuración de la conexión a PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'centro_apoderados',
  password: process.env.DB_PASSWORD || 'tu_contraseña_aqui',
  port: process.env.DB_PORT || 5432,
});

async function fixTables() {
  console.log('Comenzando reparación de tablas...');
  const client = await pool.connect();
  
  try {
    // Comprobar y corregir tabla documentos
    console.log('\nVerificando estructura de tabla documentos:');
    await client.query('BEGIN');
    
    // Limpiar y volver a crear la tabla documentos
    console.log('Creando respaldo de la tabla documentos existente (si hay datos)');
    try {
      await client.query('CREATE TABLE documentos_backup AS SELECT * FROM documentos');
      console.log('Backup creado: documentos_backup');
    } catch (err) {
      console.log('No se pudo crear backup. Probablemente no haya datos para respaldar.');
    }
    
    console.log('Eliminando tabla documentos actual');
    await client.query('DROP TABLE IF EXISTS documentos CASCADE');
    
    console.log('Creando tabla documentos con estructura correcta');
    await client.query(`
      CREATE TABLE documentos (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        descripcion TEXT,
        fecha_subida DATE NOT NULL,
        url TEXT NOT NULL,
        curso_id INTEGER NOT NULL DEFAULT 1,
        colegio_id INTEGER NOT NULL DEFAULT 1
      )
    `);
    
    console.log('Tabla documentos creada correctamente');
    
    // Comprobar y corregir tabla fechas
    console.log('\nVerificando estructura de tabla fechas:');
    
    // Limpiar y volver a crear la tabla fechas
    console.log('Creando respaldo de la tabla fechas existente (si hay datos)');
    try {
      await client.query('CREATE TABLE fechas_backup AS SELECT * FROM fechas');
      console.log('Backup creado: fechas_backup');
    } catch (err) {
      console.log('No se pudo crear backup. Probablemente no haya datos para respaldar.');
    }
    
    console.log('Eliminando tabla fechas actual');
    await client.query('DROP TABLE IF EXISTS fechas CASCADE');
    
    console.log('Creando tabla fechas con estructura correcta');
    await client.query(`
      CREATE TABLE fechas (
        id SERIAL PRIMARY KEY,
        fecha DATE NOT NULL,
        descripcion TEXT NOT NULL,
        curso_id INTEGER NOT NULL DEFAULT 1,
        colegio_id INTEGER NOT NULL DEFAULT 1
      )
    `);
    
    console.log('Tabla fechas creada correctamente');
    
    // Crear índices para mejorar rendimiento
    console.log('\nCreando índices para optimizar consultas:');
    await client.query('CREATE INDEX IF NOT EXISTS idx_documentos_curso_colegio ON documentos(curso_id, colegio_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_fechas_curso_colegio ON fechas(curso_id, colegio_id)');
    
    console.log('Índices creados correctamente');
    
    // Insertar datos de prueba
    console.log('\nInsertando datos de prueba:');
    
    // Documento de prueba
    await client.query(`
      INSERT INTO documentos (nombre, descripcion, fecha_subida, url, curso_id, colegio_id)
      VALUES ('Documento de prueba', 'Este es un documento de prueba', CURRENT_DATE, '/uploads/test.pdf', 1, 1)
    `);
    
    // Fecha de prueba
    await client.query(`
      INSERT INTO fechas (fecha, descripcion, curso_id, colegio_id)
      VALUES (CURRENT_DATE + INTERVAL '7 days', 'Evento de prueba', 1, 1)
    `);
    
    console.log('Datos de prueba insertados correctamente');
    
    await client.query('COMMIT');
    console.log('\nReparación de tablas completada exitosamente');
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error durante la reparación de tablas:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

fixTables(); 