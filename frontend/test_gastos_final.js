// Script para verificar que los gastos ahora se guardan correctamente
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

async function verificarCampoColegioId() {
  console.log('Verificando si los gastos ahora incluyen el campo colegio_id correctamente...');
  
  try {
    // Conectar a la base de datos
    const client = await pool.connect();
    console.log('Conexión a la base de datos establecida.');
    
    // Verificar si hay gastos en la tabla
    const gastosQuery = await client.query('SELECT COUNT(*) FROM gastos');
    const totalGastos = parseInt(gastosQuery.rows[0].count);
    
    console.log(`Total de gastos encontrados: ${totalGastos}`);
    
    if (totalGastos === 0) {
      console.log('No hay gastos registrados. Debes crear al menos un gasto para verificar.');
    } else {
      // Verificar si el campo colegio_id tiene valores
      const gastosConColegioId = await client.query('SELECT COUNT(*) FROM gastos WHERE colegio_id IS NOT NULL');
      const totalConColegioId = parseInt(gastosConColegioId.rows[0].count);
      
      console.log(`Gastos con colegio_id asignado: ${totalConColegioId} (${(totalConColegioId / totalGastos * 100).toFixed(2)}%)`);
      
      if (totalConColegioId === 0) {
        console.log('ADVERTENCIA: Ningún gasto tiene el campo colegio_id asignado.');
        console.log('Esto puede indicar que la solución aún no está funcionando o no se han agregado nuevos gastos.');
      } else {
        // Obtener los últimos 5 gastos para verificar
        const ultimosGastos = await client.query(`
          SELECT g.id, g.descripcion, g.monto, g.fecha, g.curso_id, g.colegio_id, c.nombre AS curso, co.nombre AS colegio
          FROM gastos g
          LEFT JOIN cursos c ON g.curso_id = c.id
          LEFT JOIN colegios co ON g.colegio_id = co.id
          ORDER BY g.id DESC
          LIMIT 5
        `);
        
        console.log('\nÚltimos 5 gastos registrados:');
        console.table(ultimosGastos.rows.map(g => ({
          ID: g.id,
          Descripción: g.descripcion,
          Monto: g.monto,
          Fecha: new Date(g.fecha).toLocaleDateString('es-CL'),
          'Curso ID': g.curso_id,
          Curso: g.curso,
          'Colegio ID': g.colegio_id,
          Colegio: g.colegio
        })));
        
        const ultimoGasto = ultimosGastos.rows[0];
        if (ultimoGasto && ultimoGasto.colegio_id) {
          console.log('\n✅ El último gasto registrado tiene el campo colegio_id correctamente asignado.');
          console.log('La solución parece estar funcionando correctamente.');
        } else if (ultimoGasto) {
          console.log('\n❌ El último gasto registrado NO tiene el campo colegio_id asignado.');
          console.log('La solución puede no estar aplicada correctamente o no se han registrado nuevos gastos.');
        }
      }
    }
    
    client.release();
  } catch (error) {
    console.error('Error al verificar los gastos:', error);
  } finally {
    await pool.end();
  }
}

verificarCampoColegioId(); 