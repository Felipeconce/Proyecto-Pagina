const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Configuración de la conexión a PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'centro_apoderados',
  password: process.env.DB_PASSWORD || 'tu_contraseña_aqui',
  port: process.env.DB_PORT || 5432,
});

async function findOrCreateAdmin() {
  console.log('Buscando usuarios superadministradores (rol_id = 1)...');
  
  try {
    // Conectar a la base de datos
    const client = await pool.connect();
    console.log('Conexión exitosa a la base de datos');
    
    // Buscar superadministradores
    const result = await client.query(`
      SELECT id, nombre, email, rol_id, curso_id, colegio_id 
      FROM usuarios 
      WHERE rol_id = 1
    `);
    
    if (result.rows.length > 0) {
      console.log('\nUsuarios superadministradores encontrados:');
      result.rows.forEach(user => {
        console.log(`ID: ${user.id}`);
        console.log(`Nombre: ${user.nombre}`);
        console.log(`Email: ${user.email}`);
        console.log(`Curso ID: ${user.curso_id || 'No asignado'}`);
        console.log(`Colegio ID: ${user.colegio_id || 'No asignado'}`);
        console.log('-------------------------');
      });
      
      // Verificar si se desea resetear la contraseña
      const resetPassword = process.argv.includes('--reset');
      if (resetPassword) {
        const adminId = result.rows[0].id;
        const newPassword = 'Admin123!';
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        await client.query(`
          UPDATE usuarios 
          SET password = $1 
          WHERE id = $2
        `, [hashedPassword, adminId]);
        
        console.log(`\nContraseña del administrador ID ${adminId} ha sido reseteada a: ${newPassword}`);
      }
    } else {
      console.log('\nNo se encontraron usuarios superadministradores');
      
      // Verificar si se debe crear un usuario admin
      const createAdmin = true; // Siempre crear en este caso
      
      if (createAdmin) {
        // Verificar si existen colegios y cursos
        const colegiosResult = await client.query('SELECT id FROM colegios LIMIT 1');
        const cursosResult = await client.query('SELECT id FROM cursos LIMIT 1');
        
        let colegio_id = null;
        let curso_id = null;
        
        if (colegiosResult.rows.length > 0) {
          colegio_id = colegiosResult.rows[0].id;
        } else {
          // Crear un colegio predeterminado
          const newColegioResult = await client.query(`
            INSERT INTO colegios (nombre, direccion) 
            VALUES ('Colegio Predeterminado', 'Dirección Predeterminada') 
            RETURNING id
          `);
          colegio_id = newColegioResult.rows[0].id;
          console.log(`Colegio predeterminado creado con ID: ${colegio_id}`);
        }
        
        if (cursosResult.rows.length > 0) {
          curso_id = cursosResult.rows[0].id;
        } else if (colegio_id) {
          // Crear un curso predeterminado
          const currentYear = new Date().getFullYear();
          const newCursoResult = await client.query(`
            INSERT INTO cursos (nombre, colegio_id, año) 
            VALUES ('Curso Predeterminado', $1, $2) 
            RETURNING id
          `, [colegio_id, currentYear]);
          curso_id = newCursoResult.rows[0].id;
          console.log(`Curso predeterminado creado con ID: ${curso_id}`);
        }
        
        // Crear usuario superadministrador
        const adminEmail = 'admin@sistema.com';
        const adminPassword = 'Admin123!';
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        
        const newAdminResult = await client.query(`
          INSERT INTO usuarios (nombre, email, password, rol_id, curso_id, colegio_id) 
          VALUES ('Administrador', $1, $2, 1, $3, $4) 
          RETURNING id, nombre, email
        `, [adminEmail, hashedPassword, curso_id, colegio_id]);
        
        const newAdmin = newAdminResult.rows[0];
        console.log('\nNuevo superadministrador creado:');
        console.log(`ID: ${newAdmin.id}`);
        console.log(`Nombre: ${newAdmin.nombre}`);
        console.log(`Email: ${newAdmin.email}`);
        console.log(`Contraseña: ${adminPassword}`);
        console.log(`Curso ID: ${curso_id}`);
        console.log(`Colegio ID: ${colegio_id}`);
      }
    }
    
    client.release();
  } catch (err) {
    console.error('Error al gestionar superadministradores:', err);
  } finally {
    // Cerrar pool
    await pool.end();
  }
}

findOrCreateAdmin(); 