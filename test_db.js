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

async function testDatabase() {
  console.log('Iniciando prueba de base de datos...');
  
  try {
    // 1. Probar conexión
    console.log('Probando conexión a la base de datos...');
    const client = await pool.connect();
    console.log('Conexión exitosa a la base de datos');
    
    // 2. Verificar tablas existentes
    console.log('\nVerificando tablas existentes:');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('Tablas en la base de datos:');
    tablesResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    // 3. Verificar específicamente documentos y fechas
    console.log('\nVerificando tabla documentos:');
    const docExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'documentos'
      )
    `);
    
    if (docExists.rows[0].exists) {
      console.log('La tabla documentos existe. Verificando columnas:');
      const docColumns = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'documentos'
      `);
      
      docColumns.rows.forEach(col => {
        console.log(`- ${col.column_name} (${col.data_type})`);
      });
      
      // Verificar datos en la tabla
      const docData = await client.query('SELECT COUNT(*) FROM documentos');
      console.log(`Número de registros en documentos: ${docData.rows[0].count}`);
    } else {
      console.log('La tabla documentos NO existe');
    }
    
    console.log('\nVerificando tabla fechas:');
    const fechasExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'fechas'
      )
    `);
    
    if (fechasExists.rows[0].exists) {
      console.log('La tabla fechas existe. Verificando columnas:');
      const fechasColumns = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'fechas'
      `);
      
      fechasColumns.rows.forEach(col => {
        console.log(`- ${col.column_name} (${col.data_type})`);
      });
      
      // Verificar datos en la tabla
      const fechasData = await client.query('SELECT COUNT(*) FROM fechas');
      console.log(`Número de registros en fechas: ${fechasData.rows[0].count}`);
    } else {
      console.log('La tabla fechas NO existe');
    }
    
    client.release();
    console.log('\nPrueba completada exitosamente');
  } catch (err) {
    console.error('Error durante la prueba:', err);
  } finally {
    // Cerrar pool
    await pool.end();
  }
}

testDatabase(); 