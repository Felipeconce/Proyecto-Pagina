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

async function verifyGastosTable() {
  console.log('Verificando tabla de gastos...');
  
  try {
    // 1. Probar conexión
    console.log('Conectando a la base de datos...');
    const client = await pool.connect();
    console.log('Conexión exitosa');
    
    // 2. Verificar si existe la tabla gastos
    console.log('\nVerificando si existe la tabla gastos:');
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'gastos'
      )
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('La tabla gastos NO existe. Creándola...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS gastos (
          id SERIAL PRIMARY KEY,
          curso_id INTEGER,
          colegio_id INTEGER,
          descripcion TEXT NOT NULL,
          monto DECIMAL(10,2) NOT NULL,
          fecha DATE NOT NULL
        )
      `);
      console.log('Tabla gastos creada correctamente');
    } else {
      console.log('La tabla gastos existe. Verificando estructura...');
      
      // 3. Verificar columnas
      const columnsResult = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'gastos'
      `);
      
      console.log('Columnas en la tabla gastos:');
      columnsResult.rows.forEach(col => {
        console.log(`- ${col.column_name} (${col.data_type})`);
      });
      
      // 4. Verificar si faltan columnas
      const requiredColumns = ['id', 'curso_id', 'colegio_id', 'descripcion', 'monto', 'fecha'];
      const existingColumns = columnsResult.rows.map(col => col.column_name);
      
      console.log('\nVerificando columnas requeridas...');
      let missingColumns = [];
      
      requiredColumns.forEach(colName => {
        if (!existingColumns.includes(colName)) {
          missingColumns.push(colName);
          console.log(`- Falta la columna: ${colName}`);
        }
      });
      
      // 5. Agregar columnas faltantes
      if (missingColumns.length > 0) {
        console.log('\nAgregando columnas faltantes...');
        
        for (const colName of missingColumns) {
          let dataType = '';
          switch (colName) {
            case 'id':
              console.log('Recreando la tabla con id como PRIMARY KEY...');
              continue;
            case 'curso_id':
            case 'colegio_id':
              dataType = 'INTEGER';
              break;
            case 'descripcion':
              dataType = 'TEXT';
              break;
            case 'monto':
              dataType = 'DECIMAL(10,2)';
              break;
            case 'fecha':
              dataType = 'DATE';
              break;
          }
          
          if (dataType) {
            console.log(`Agregando columna ${colName} (${dataType})`);
            await client.query(`ALTER TABLE gastos ADD COLUMN IF NOT EXISTS ${colName} ${dataType}`);
          }
        }
        
        console.log('Columnas faltantes agregadas correctamente');
      } else {
        console.log('Todas las columnas requeridas están presentes');
      }
      
      // 6. Verificar datos en la tabla
      const countQuery = await client.query('SELECT COUNT(*) FROM gastos');
      console.log(`\nNúmero de registros en la tabla gastos: ${countQuery.rows[0].count}`);
      
      // 7. Si hay cero registros, verificar si hay algún problema con las consultas
      if (parseInt(countQuery.rows[0].count) === 0) {
        console.log('No hay registros en la tabla gastos. Verificando inserts/updates...');
        
        try {
          // Intentar una inserción de prueba
          console.log('Intentando inserción de prueba...');
          
          // Primero, necesitamos un curso_id válido
          const cursosQuery = await client.query('SELECT id FROM cursos LIMIT 1');
          if (cursosQuery.rows.length === 0) {
            console.log('No hay cursos en la base de datos. Creando un curso de prueba...');
            
            // Verificar si tenemos un colegio
            const colegiosQuery = await client.query('SELECT id FROM colegios LIMIT 1');
            let colegioId = null;
            
            if (colegiosQuery.rows.length === 0) {
              console.log('No hay colegios. Creando un colegio de prueba...');
              const newColegioResult = await client.query(
                'INSERT INTO colegios (nombre, direccion) VALUES ($1, $2) RETURNING id',
                ['Colegio de Prueba', 'Dirección de Prueba']
              );
              colegioId = newColegioResult.rows[0].id;
              console.log(`Colegio creado con ID: ${colegioId}`);
            } else {
              colegioId = colegiosQuery.rows[0].id;
            }
            
            // Crear un curso de prueba
            const newCursoResult = await client.query(
              'INSERT INTO cursos (nombre, colegio_id, año) VALUES ($1, $2, $3) RETURNING id',
              ['Curso de Prueba', colegioId, new Date().getFullYear()]
            );
            const cursoId = newCursoResult.rows[0].id;
            console.log(`Curso creado con ID: ${cursoId}`);
            
            // Probar la inserción en gastos
            const testInsertResult = await client.query(
              'INSERT INTO gastos (curso_id, colegio_id, descripcion, monto, fecha) VALUES ($1, $2, $3, $4, $5) RETURNING id',
              [cursoId, colegioId, 'Gasto de prueba', 1000, new Date().toISOString().split('T')[0]]
            );
            
            console.log(`Inserción de prueba exitosa! ID del gasto: ${testInsertResult.rows[0].id}`);
            
            // Eliminar el gasto de prueba
            await client.query('DELETE FROM gastos WHERE id = $1', [testInsertResult.rows[0].id]);
            console.log('Gasto de prueba eliminado');
          } else {
            const cursoId = cursosQuery.rows[0].id;
            
            // Obtener colegio_id
            const colegioQuery = await client.query('SELECT colegio_id FROM cursos WHERE id = $1', [cursoId]);
            const colegioId = colegioQuery.rows[0]?.colegio_id;
            
            if (colegioId) {
              // Probar la inserción
              const testInsertResult = await client.query(
                'INSERT INTO gastos (curso_id, colegio_id, descripcion, monto, fecha) VALUES ($1, $2, $3, $4, $5) RETURNING id',
                [cursoId, colegioId, 'Gasto de prueba', 1000, new Date().toISOString().split('T')[0]]
              );
              
              console.log(`Inserción de prueba exitosa! ID del gasto: ${testInsertResult.rows[0].id}`);
              
              // Eliminar el gasto de prueba
              await client.query('DELETE FROM gastos WHERE id = $1', [testInsertResult.rows[0].id]);
              console.log('Gasto de prueba eliminado');
            } else {
              console.log('No se pudo obtener un colegio_id válido para la prueba');
            }
          }
        } catch (insertErr) {
          console.error('Error durante la inserción de prueba:', insertErr);
          console.log('Posible problema con permisos o restricciones de clave foránea');
        }
      }
      
      console.log('\nVerificación de la tabla gastos completada');
    }
    
    client.release();
    console.log('\nProceso de verificación completado exitosamente');
  } catch (err) {
    console.error('Error durante la verificación:', err);
  } finally {
    await pool.end();
  }
}

verifyGastosTable(); 