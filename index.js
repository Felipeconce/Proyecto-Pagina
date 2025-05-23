const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
require('dotenv').config();
const fs = require('fs');

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// Middleware de manejo de errores
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

// Configuración de la conexión a PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'centro_apoderados',
  password: process.env.DB_PASSWORD || 'tu_contraseña_aqui',
  port: process.env.DB_PORT || 5432,
});

// Configuración de almacenamiento para archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('¡Backend funcionando!');
});

// Ruta para verificar conexión CORS
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Conexión exitosa al backend', 
    timestamp: new Date().toISOString() 
  });
});

// Al iniciar el backend, asegurarse de que los conceptos de marzo a diciembre existan
// Meses por defecto abreviados y en orden calendario
const mesesPorDefecto = [
  'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

async function asegurarMesesPorDefecto() {
  for (let i = 0; i < mesesPorDefecto.length; i++) {
    const mes = mesesPorDefecto[i];
    await pool.query(
      'INSERT INTO conceptos_pago (nombre, orden) VALUES ($1, $2) ON CONFLICT (nombre) DO NOTHING',
      [mes, i+1]
    );
  }
}

// Verificar y agregar columna descripcion a la tabla documentos si no existe
async function verificarColumnasDocumentos() {
  try {
    // Primero verificamos si la columna descripcion existe
    const columnExists = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'documentos' AND column_name = 'descripcion'
    `);
    
    // Si la columna no existe, la agregamos
    if (columnExists.rows.length === 0) {
      console.log('Agregando columna descripcion a la tabla documentos...');
      await pool.query('ALTER TABLE documentos ADD COLUMN descripcion TEXT');
      console.log('Columna descripcion agregada correctamente');
    } else {
      console.log('La columna descripcion ya existe en la tabla documentos');
    }
  } catch (err) {
    console.error('Error al verificar/agregar columna descripcion:', err);
  }
}

asegurarMesesPorDefecto();
verificarColumnasDocumentos();

// Crear tabla de logs (historial de acciones)
// Ejecuta este SQL en tu base de datos PostgreSQL:
//
// CREATE TABLE logs (
//     id SERIAL PRIMARY KEY,
//     usuario_id INTEGER NOT NULL,
//     usuario_nombre VARCHAR(100) NOT NULL,
//     rol_id INTEGER NOT NULL,
//     curso_id INTEGER NOT NULL,
//     colegio_id INTEGER NOT NULL,
//     accion VARCHAR(30) NOT NULL,         -- 'crear', 'editar', 'eliminar', etc.
//     entidad VARCHAR(30) NOT NULL,        -- 'pago', 'concepto', 'documento', 'gasto', 'fecha'
//     entidad_id INTEGER,
//     detalle TEXT,
//     fecha TIMESTAMP DEFAULT NOW()
// );
//
// Recuerda: solo mostrar logs del curso/colegio del usuario autenticado.

// Usuarios
app.get('/usuarios', authenticateToken, async (req, res) => {
  try {
    // Obtener curso_id y colegio_id de los parámetros de consulta (query params)
    const query_curso_id = parseInt(req.query.curso_id, 10); // Convertir a número directamente
    const query_colegio_id = parseInt(req.query.colegio_id, 10); // Convertir a número directamente

    let query = 'SELECT * FROM usuarios WHERE 1=1';
    const values = [];
    let paramIndex = 1;

    // Si el usuario es superadmin y se proporcionan query params numéricos válidos, usarlos
    if (req.user.rol_id === 1) {
      if (!isNaN(query_curso_id)) {
        query += ` AND curso_id = $${paramIndex}`;
        values.push(query_curso_id);
        paramIndex++;
      }
      if (!isNaN(query_colegio_id)) {
        query += ` AND colegio_id = $${paramIndex}`;
        values.push(query_colegio_id);
        paramIndex++;
      }
      // Si es superadmin y NO se proporcionan query params válidos, la query queda 'SELECT * FROM usuarios WHERE 1=1', devolviendo todos los usuarios.
    } else {
      // Para otros roles, solo se les permite ver su propio curso/colegio
      // Asegurarse de que req.user.curso_id y req.user.colegio_id existan (deberían venir del token)
      if (req.user.curso_id && req.user.colegio_id) {
         query += ` AND curso_id = $${paramIndex} AND colegio_id = $${paramIndex + 1}`;
         values.push(req.user.curso_id, req.user.colegio_id);
         // paramIndex se incrementaría en 2, pero como es el final de este bloque, no es estrictamente necesario
      } else {
        // Esto no debería pasar si el token es válido, pero como fallback de seguridad
        console.error('Usuario autenticado sin curso_id/colegio_id en el token.', req.user);
        query += ' AND 1=0'; // Devuelve 0 resultados
      }
    }

    // Ordenar alfabéticamente por nombre
    query += ' ORDER BY nombre ASC';

    console.log('Executing SQL query:', query);
    console.log('With values:', values);

    const result = await pool.query(query, values);
    
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login actualizado con bcrypt y JWT
app.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;
  try {
    const result = await pool.query(
      'SELECT id, nombre, email, password, rol_id, curso_id, colegio_id FROM usuarios WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, rol_id: user.rol_id, curso_id: user.curso_id, colegio_id: user.colegio_id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol_id: user.rol_id,
      curso_id: user.curso_id,
      colegio_id: user.colegio_id,
      token
    });
  } catch (err) {
    next(err);
  }
});

// Registrar nuevo usuario con contraseña encriptada
app.post('/usuarios', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('nombre').notEmpty(),
  body('rol_id').isInt()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, nombre, rol_id } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO usuarios (email, password, nombre, rol_id) VALUES ($1, $2, $3, $4) RETURNING id, email, nombre, rol_id',
      [email, hashedPassword, nombre, rol_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// Endpoint para importar usuarios masivamente desde Excel
app.post('/usuarios/import', authenticateToken, async (req, res, next) => {
  // Verificar si el usuario es superadmin (rol_id = 1)
  if (req.user.rol_id !== 1) {
    return res.status(403).json({ error: 'Acceso denegado. Solo superadmins pueden importar usuarios.' });
  }

  const usuariosAImportar = req.body; // Esperamos un arreglo de usuarios

  if (!Array.isArray(usuariosAImportar) || usuariosAImportar.length === 0) {
    return res.status(400).json({ error: 'Se esperaba un arreglo de usuarios no vacío.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const importedUsers = [];
    const failedUsers = [];

    for (const usuario of usuariosAImportar) {
      const { nombre, email, password, rol_id, colegio, curso } = usuario; // Ahora recibimos nombres de colegio y curso

      // Validación básica de campos (puedes añadir más según necesidad)
      // Asegurarse de que los nombres de colegio y curso no estén vacíos
      if (!nombre || !email || !password || rol_id === undefined || !colegio || !curso) {
        failedUsers.push({ usuario, error: 'Faltan campos obligatorios (nombre, email, password, rol_id, colegio, curso)' });
        continue;
      }

      try {
        // 1. Encontrar o crear el colegio por nombre
        let colegioResult = await client.query(
          'SELECT id FROM colegios WHERE nombre = $1',
          [colegio]
        );
        let colegio_id;

        if (colegioResult.rows.length === 0) {
          // Si el colegio no existe, crearlo
          const newColegio = await client.query(
            'INSERT INTO colegios (nombre) VALUES ($1) RETURNING id',
            [colegio]
          );
          colegio_id = newColegio.rows[0].id;
          console.log(`Colegio creado: ${colegio} con ID ${colegio_id}`);
        } else {
          colegio_id = colegioResult.rows[0].id;
          console.log(`Colegio encontrado: ${colegio} con ID ${colegio_id}`);
        }

        // 2. Encontrar o crear el curso por nombre dentro del colegio
        let cursoResult = await client.query(
          'SELECT id FROM cursos WHERE nombre = $1 AND colegio_id = $2',
          [curso, colegio_id]
        );
        let curso_id;

        if (cursoResult.rows.length === 0) {
          // Si el curso no existe, crearlo (por defecto activo)
          const newCurso = await client.query(
            'INSERT INTO cursos (nombre, colegio_id, activo) VALUES ($1, $2, TRUE) RETURNING id',
            [curso, colegio_id]
          );
          curso_id = newCurso.rows[0].id;
           console.log(`Curso creado: ${curso} en Colegio ID ${colegio_id} con ID ${curso_id}`);
        } else {
          curso_id = cursoResult.rows[0].id;
          console.log(`Curso encontrado: ${curso} en Colegio ID ${colegio_id} con ID ${curso_id}`);
        }

        // 3. Hashear la contraseña y insertar/actualizar el usuario
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await client.query(
          'INSERT INTO usuarios (nombre, email, password, rol_id, curso_id, colegio_id) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (email) DO UPDATE SET nombre = EXCLUDED.nombre, password = EXCLUDED.password, rol_id = EXCLUDED.rol_id, curso_id = EXCLUDED.curso_id, colegio_id = EXCLUDED.colegio_id RETURNING id, email',
          [nombre, email, hashedPassword, rol_id, curso_id, colegio_id]
        );

        // Si se insertó o actualizó, el resultado tendrá filas
         if (result.rows.length > 0) {
           importedUsers.push({ email: result.rows[0].email, status: result.command === 'INSERT' ? 'inserted' : 'updated' });
         } else {
            // Esto no debería pasar con ON CONFLICT DO UPDATE, pero como fallback
            failedUsers.push({ usuario, error: 'No se pudo insertar o actualizar (conflicto no manejado?).' });
         }

      } catch (processErr) {
        console.error('Error al procesar usuario', usuario.email, processErr);
        failedUsers.push({ usuario, error: processErr.message });
      }
    }

    await client.query('COMMIT');

    res.status(200).json({
      message: 'Proceso de importación completado',
      importedCount: importedUsers.filter(u => u.status === 'inserted').length,
      updatedCount: importedUsers.filter(u => u.status === 'updated').length,
      failedCount: failedUsers.length,
      failedUsers: failedUsers
    });

  } catch (err) {
    await client.query('ROLLBACK');
    next(err); // Pasar el error al middleware de manejo de errores
  } finally {
    client.release();
  }
});

// Apoderados
app.get('/apoderados', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, nombre FROM usuarios WHERE rol_id = 4"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Pagos
app.get('/pagos', async (req, res) => {
  try {
    // Si hay token, verificar, pero si no lo hay, también permitir acceso
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    let curso_id, colegio_id;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        curso_id = decoded.curso_id;
        colegio_id = decoded.colegio_id;
      } catch (err) {
        // Si el token es inválido, aún permitir acceso de solo lectura
        console.log('Token inválido pero permitiendo acceso de solo lectura');
      }
    }
    
    // Si tenemos curso_id y colegio_id, filtramos
    let query;
    let params = [];
    
    if (curso_id && colegio_id) {
      query = `
        SELECT pagos.id, pagos.usuario_id, pagos.concepto_id, 
               usuarios.nombre AS apoderado, conceptos_pago.nombre AS concepto, 
               pagos.monto, pagos.fecha, pagos.estado
        FROM pagos
        JOIN usuarios ON pagos.usuario_id = usuarios.id
        JOIN conceptos_pago ON pagos.concepto_id = conceptos_pago.id
        WHERE usuarios.curso_id = $1 AND usuarios.colegio_id = $2
      `;
      params = [curso_id, colegio_id];
    } else {
      // Sin autenticación, mostrar datos limitados (para demo pública)
      query = `
        SELECT pagos.id, pagos.concepto_id, 
               'Usuario' AS apoderado, conceptos_pago.nombre AS concepto, 
               pagos.monto, pagos.fecha, pagos.estado
        FROM pagos
        JOIN conceptos_pago ON pagos.concepto_id = conceptos_pago.id
        LIMIT 10
      `;
    }
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Registrar log al agregar un pago
app.post('/pagos', authenticateToken, async (req, res) => {
  const { usuario_id, monto, fecha, estado, usuario_nombre, rol_id, curso_id, colegio_id, concepto_id } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO pagos (usuario_id, concepto_id, monto, fecha, estado) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [usuario_id, concepto_id, monto, fecha, estado]
    );
    // Registrar log
    await pool.query(
      'INSERT INTO logs (usuario_id, usuario_nombre, rol_id, curso_id, colegio_id, accion, entidad, entidad_id, detalle) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [usuario_id, usuario_nombre, rol_id, curso_id, colegio_id, 'crear', 'pago', result.rows[0].id, `Agregó pago de $${monto} para concepto_id ${concepto_id}`]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Registrar log al editar un pago
app.put('/pagos/:id', authenticateToken, async (req, res, next) => {
  // **** NUEVO CONSOLE.LOG PARA DEPURACIÓN ****
  console.log('>>> INSPECCIONANDO req.user en PUT /pagos/:id:', JSON.stringify(req.user, null, 2));
  // **** FIN DEL CONSOLE.LOG ****

  const { id } = req.params; // ID del pago a editar
  const { monto, fecha, estado } = req.body; // Datos del pago a actualizar

  // Datos del usuario QUE REALIZA LA ACCIÓN (del token)
  const editorUsuarioId = req.user ? req.user.id : null;
  const editorNombre = req.user ? (req.user.nombre || req.body.usuario_nombre) : req.body.usuario_nombre;
  const editorRolId = req.user ? (req.user.rol_id || req.body.rol_id) : req.body.rol_id;
  const editorCursoId = req.user ? (req.user.curso_id || req.body.curso_id) : req.body.curso_id;
  const editorColegioId = req.user ? (req.user.colegio_id || req.body.colegio_id) : req.body.colegio_id;

  // **** NUEVO CONSOLE.LOG PARA VER editorUsuarioId ****
  console.log('>>> editorUsuarioId para LOGS:', editorUsuarioId);
  // **** FIN DEL CONSOLE.LOG ****

  if (!editorUsuarioId) { // Si después de todo, editorUsuarioId es null/undefined
    console.error('¡ALERTA! editorUsuarioId es nulo ANTES de la query de logs. req.user:', JSON.stringify(req.user));
    // Considerar devolver un error aquí para no proceder si falta el ID del editor
    // return res.status(500).json({ error: 'No se pudo determinar el ID del usuario editor para el log.' });
  }

  try {
    const result = await pool.query(
      "UPDATE pagos SET monto = $1, fecha = $2, estado = $3 WHERE id = $4 RETURNING *",
      [monto, fecha, estado, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pago no encontrado para actualizar' });
    }

    // Registrar log con los datos del USUARIO EDITOR (del token)
    await pool.query(
      'INSERT INTO logs (usuario_id, usuario_nombre, rol_id, curso_id, colegio_id, accion, entidad, entidad_id, detalle) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [
        editorUsuarioId,    // ID del usuario que edita (del token)
        editorNombre,       // Nombre del usuario que edita
        editorRolId,        // Rol del usuario que edita
        editorCursoId,      // Curso del usuario que edita
        editorColegioId,    // Colegio del usuario que edita
        'editar',
        'pago',
        id,                 // ID del pago que se editó
        `Editó pago ID ${id} a $${monto}`
      ]
    );
    res.json(result.rows[0]); // Devuelve el pago actualizado
  } catch (err) {
    // Loguear el error específico antes de pasarlo al errorHandler
    console.error('Error en el bloque try/catch de PUT /pagos/:id:', err);
    next(err); // Pasa el error al errorHandler centralizado
  }
});

// Eliminar un pago y registrar log
app.delete('/pagos/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const editorUsuarioId = req.user ? req.user.id : null;
  const editorNombre = req.user ? req.user.nombre : null;
  const editorRolId = req.user ? req.user.rol_id : null;
  const editorCursoId = req.user ? req.user.curso_id : null;
  const editorColegioId = req.user ? req.user.colegio_id : null;
  try {
    // Obtener datos del pago antes de eliminar (para el log)
    const pagoRes = await pool.query('SELECT * FROM pagos WHERE id = $1', [id]);
    if (pagoRes.rowCount === 0) {
      return res.status(404).json({ error: 'Pago no encontrado para eliminar' });
    }
    const pago = pagoRes.rows[0];
    // Eliminar el pago
    await pool.query('DELETE FROM pagos WHERE id = $1', [id]);
    // Registrar log (pero no bloquear si falla)
    try {
      await pool.query(
        'INSERT INTO logs (usuario_id, usuario_nombre, rol_id, curso_id, colegio_id, accion, entidad, entidad_id, detalle) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
        [editorUsuarioId, editorNombre, editorRolId, editorCursoId, editorColegioId, 'eliminar', 'pago', id, `Eliminó pago de $${pago.monto} para concepto_id ${pago.concepto_id}`]
      );
    } catch (logErr) {
      console.error('Error al registrar log de eliminación:', logErr);
      // NO respondas con error aquí, solo loguea
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Conceptos de Pago ordenados por calendario
app.get('/conceptos', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT id, nombre, orden, fecha_vencimiento FROM conceptos_pago ORDER BY orden ASC, nombre ASC');
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// Registrar log al agregar un concepto
app.post('/conceptos', authenticateToken, async (req, res) => {
  const { nombre, orden, fecha_vencimiento, usuario_id, usuario_nombre, rol_id, curso_id, colegio_id } = req.body;
  
  // Log para depuración
  console.log("Recibiendo solicitud para crear concepto:");
  console.log("Nombre:", nombre);
  console.log("Fecha de vencimiento recibida:", fecha_vencimiento);
  
  try {
    // Manejar fecha de vencimiento
    let fechaVencimientoFormateada = null;
    if (fecha_vencimiento) {
      // Intentar asegurar un formato consistente (YYYY-MM-DD)
      try {
        fechaVencimientoFormateada = fecha_vencimiento;
        console.log("Fecha formateada para inserción:", fechaVencimientoFormateada);
      } catch (e) {
        console.error("Error al formatear fecha:", e);
        fechaVencimientoFormateada = fecha_vencimiento; // Mantener el valor original
      }
    }
    
    const result = await pool.query(
      'INSERT INTO conceptos_pago (nombre, orden, fecha_vencimiento) VALUES ($1, $2, $3) RETURNING *',
      [nombre, orden ?? 99, fechaVencimientoFormateada]
    );
    
    // Verificar lo que se guardó
    console.log("Concepto guardado:", result.rows[0]);
    
    // Registrar log
    await pool.query(
      'INSERT INTO logs (usuario_id, usuario_nombre, rol_id, curso_id, colegio_id, accion, entidad, entidad_id, detalle) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [usuario_id, usuario_nombre, rol_id, curso_id, colegio_id, 'crear', 'concepto', result.rows[0].id, `Agregó concepto: ${nombre}`]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error al guardar concepto:", err);
    res.status(500).json({ error: err.message });
  }
});

// Registrar log al eliminar un concepto
app.delete('/conceptos/:id', authenticateToken, async (req, res) => {
  const { usuario_id, usuario_nombre, rol_id, curso_id, colegio_id } = req.body;
  const { id } = req.params;
  try {
    // Obtener nombre antes de borrar
    const conceptoRes = await pool.query('SELECT nombre FROM conceptos_pago WHERE id = $1', [id]);
    const nombre = conceptoRes.rows[0]?.nombre || '';
    // Elimina primero los pagos asociados a este concepto
    await pool.query('DELETE FROM pagos WHERE concepto_id = $1', [id]);
    // Luego elimina el concepto
    await pool.query('DELETE FROM conceptos_pago WHERE id = $1', [id]);
    // Registrar log
    await pool.query(
      'INSERT INTO logs (usuario_id, usuario_nombre, rol_id, curso_id, colegio_id, accion, entidad, entidad_id, detalle) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [usuario_id, usuario_nombre, rol_id, curso_id, colegio_id, 'eliminar', 'concepto', id, `Eliminó concepto: ${nombre}`]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Editar concepto
app.put('/conceptos/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { nombre, fecha_vencimiento, usuario_id, usuario_nombre, rol_id, curso_id, colegio_id } = req.body;
  try {
    const result = await pool.query(
      'UPDATE conceptos_pago SET nombre = $1, fecha_vencimiento = $2 WHERE id = $3 RETURNING *',
      [nombre, fecha_vencimiento || null, id]
    );
    
    // Registrar log
    await pool.query(
      'INSERT INTO logs (usuario_id, usuario_nombre, rol_id, curso_id, colegio_id, accion, entidad, entidad_id, detalle) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [usuario_id, usuario_nombre, rol_id, curso_id, colegio_id, 'editar', 'concepto', id, `Editó concepto: ${nombre}`]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Gastos
app.get('/gastos', async (req, res) => {
  try {
    // Si hay token, verificar la autenticación
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    let curso_id, colegio_id;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        curso_id = decoded.curso_id;
        colegio_id = decoded.colegio_id;
      } catch (err) {
        console.log('Token inválido pero permitiendo acceso de solo lectura');
      }
    }
    
    // Si tenemos curso_id y colegio_id, filtramos
    let query;
    let params = [];
    
    if (curso_id && colegio_id) {
      query = `
        SELECT gastos.id, cursos.nombre AS curso, gastos.descripcion, 
               gastos.monto, gastos.fecha, gastos.comprobante_url
        FROM gastos
        JOIN cursos ON gastos.curso_id = cursos.id
        WHERE gastos.curso_id = $1 AND gastos.colegio_id = $2
      `;
      params = [curso_id, colegio_id];
    } else {
      // Sin autenticación, mostrar datos limitados
      query = `
        SELECT gastos.id, cursos.nombre AS curso, 
               gastos.descripcion, gastos.monto, gastos.fecha, gastos.comprobante_url
        FROM gastos
        JOIN cursos ON gastos.curso_id = cursos.id
        LIMIT 10
      `;
    }
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Registrar log al agregar un gasto
app.post('/gastos', authenticateToken, (req, res) => {
  console.log('>>> Antes de Multer - req.body:', req.body); // Log antes de Multer
  // Usar Multer con manejo de errores explícito
  upload.single('comprobante')(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      // Ocurrió un error de Multer al subir el archivo.
      console.error('Multer error when uploading comprobante:', err);
      console.error('Multer error stack:', err.stack); // Log del stack del error de Multer
      return res.status(500).json({ error: err.message || 'Error de Multer al subir el archivo.' });
    } else if (err) {
      // Ocurrió un error desconocido al subir el archivo.
      console.error('Unknown error when uploading comprobante:', err);
      console.error('Unknown error stack:', err.stack); // Log del stack del error desconocido
      return res.status(500).json({ error: 'Error desconocido al subir el archivo.' });
    }

    // Si no hay error, Multer ha procesado la solicitud.
    // req.body y req.file ahora deberían estar poblados (si los datos fueron enviados).
    console.log('>>> Despues de Multer callback - req.body:', req.body);
    console.log('>>> Despues de Multer callback - req.file:', req.file);

    // Verificación explícita de req.body antes de desestructurar
    if (!req.body) {
        console.error("Error: req.body is undefined after multer.");
        return res.status(400).json({ error: "Error al procesar los datos del formulario." });
    }

    const { curso_id, descripcion, monto, fecha, usuario_id, usuario_nombre, rol_id, colegio_id } = req.body;
    const comprobante_url = req.file ? `/uploads/${req.file.filename}` : null;

    // Convertir monto a número
    const montoNumerico = parseFloat(monto);

    console.log('POST /gastos received data:', req.body);
    console.log('POST /gastos received file:', req.file);

    // Validación básica
    if (!curso_id || !descripcion || !monto || !fecha || !usuario_id || !usuario_nombre || !rol_id || !colegio_id) {
      // Log para depuración si faltan campos
      console.log('Faltan campos obligatorios en req.body:', req.body);
      return res.status(400).json({ error: 'Faltan campos obligatorios (excepto comprobante).', received: req.body, file: req.file });
    }
    if (isNaN(montoNumerico) || montoNumerico <= 0) {
      console.log('Validación de monto fallida:', monto);
      return res.status(400).json({ error: 'El monto debe ser un número mayor a 0.' });
    }
    if (typeof descripcion !== 'string' || descripcion.trim().length < 3) {
      console.log('Validación de descripción fallida:', descripcion);
      return res.status(400).json({ error: 'La descripción debe tener al menos 3 caracteres.' });
    }
    const fechaGasto = new Date(fecha);
    const hoy = new Date();
    if (isNaN(fechaGasto.getTime()) || fechaGasto > hoy) {
      console.log('Validación de fecha fallida:', fecha);
      return res.status(400).json({ error: 'La fecha es inválida o futura.' });
    }

    try {
      console.log('Attempting to insert gasto into DB with values:', [curso_id, colegio_id, descripcion, montoNumerico, fecha, comprobante_url]);
      const result = await pool.query(
        "INSERT INTO gastos (curso_id, colegio_id, descripcion, monto, fecha, comprobante_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        [curso_id, colegio_id, descripcion, montoNumerico, fecha, comprobante_url]
      );

      // Registrar actividad
      try {
        await pool.query(
          `INSERT INTO logs (fecha, usuario_id, usuario_nombre, rol_id, accion, entidad, entidad_id, detalle, curso_id, colegio_id)
           VALUES (NOW(), $1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            usuario_id,
            usuario_nombre,
            rol_id,
            'crear',
            'gasto',
            result.rows[0].id,
            `Gasto: ${descripcion} - $${monto}`,
            curso_id,
            colegio_id
          ]
        );
      } catch (logError) {
        console.error('Error al registrar actividad:', logError);
      }

      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al guardar el gasto en la base de datos.' });
    }
  }); // Cierre del callback de Multer
});

// Registrar log al editar un gasto
app.put('/gastos/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { descripcion, monto, fecha, usuario_id, usuario_nombre, rol_id, curso_id, colegio_id } = req.body;
  try {
    const result = await pool.query(
      "UPDATE gastos SET descripcion = $1, monto = $2, fecha = $3 WHERE id = $4 RETURNING *",
      [descripcion, monto, fecha, id]
    );
    // Registrar log
    await pool.query(
      'INSERT INTO logs (usuario_id, usuario_nombre, rol_id, curso_id, colegio_id, accion, entidad, entidad_id, detalle) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [usuario_id, usuario_nombre, rol_id, curso_id, colegio_id, 'editar', 'gasto', id, `Editó gasto: ${descripcion} $${monto}`]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint para descargar el comprobante de un gasto
app.get('/gastos/:id/comprobante', authenticateToken, async (req, res) => {
  const { id } = req.params; // ID del gasto
  const gastoId = parseInt(id, 10);

  console.log(`GET /gastos/${id}/comprobante requested. Gasto ID:`, gastoId);

  if (isNaN(gastoId)) {
    return res.status(400).json({ error: 'ID de gasto inválido.' });
  }

  try {
    // Obtener la URL del comprobante y verificar curso/colegio (para no superadmins)
    let query = 'SELECT comprobante_url, curso_id, colegio_id FROM gastos WHERE id = $1';
    const values = [gastoId];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Gasto no encontrado.' });
    }

    const gasto = result.rows[0];
    const comprobante_url = gasto.comprobante_url;

    console.log('Comprobante URL from DB:', comprobante_url);

    if (!comprobante_url) {
      return res.status(404).json({ error: 'Comprobante no encontrado para este gasto.' });
    }

    // Verificar que el usuario tiene permiso para ver este comprobante (superadmin o mismo curso/colegio)
    if (req.user.rol_id !== 1 && (req.user.curso_id !== gasto.curso_id || req.user.colegio_id !== gasto.colegio_id)) {
         return res.status(403).json({ error: 'Acceso denegado. No tiene permiso para ver este comprobante.' });
    }

    // Construir la ruta absoluta al archivo
    const filePath = path.join(__dirname, comprobante_url);
    console.log('Attempting to send file from:', filePath);

    // Enviar el archivo
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error details from res.sendFile callback:', err);
        console.error('Error sending file:', err);
        // Si el error indica que el archivo no se encontró, responder 404
        if (err.code === 'ENOENT') {
             return res.status(404).json({ error: 'Archivo de comprobante no encontrado en el servidor.' });
        }
        // Para otros errores, responder 500
        res.status(500).json({ error: 'Error al enviar el archivo.' });
      }
    });

  } catch (err) {
    console.error('Error en endpoint /gastos/:id/comprobante:', err);
    res.status(500).json({ error: err.message });
  }
});

// Eliminar un gasto (solo Tesorero) y su comprobante si existe
app.delete('/gastos/:id', authenticateToken, async (req, res, next) => {
  const { id } = req.params; // ID del gasto a eliminar
  const client = await pool.connect();

  // Datos del usuario QUE REALIZA LA ACCIÓN (del token)
  // Asegurarse de que req.user existe y sus propiedades no son nulas
  const eliminadorUsuarioId = req.user ? req.user.id : null;
  const eliminadorNombre = (req.user && req.user.nombre) ? req.user.nombre : 'Usuario Desconocido'; // Usar placeholder si nombre es nulo/indefinido
  const eliminadorRolId = req.user ? req.user.rol_id : null;
  const eliminadorCursoId = req.user ? req.user.curso_id : null;
  const eliminadorColegioId = req.user ? req.user.colegio_id : null;

  // Verificar si el usuario tiene permiso para eliminar (Superadmin o Tesorero)
  const rolesPermitidosEliminar = [1, 3];
  if (!eliminadorRolId || !rolesPermitidosEliminar.includes(eliminadorRolId)) {
     // Si no tiene rol o el rol no está permitido, loguear intento fallido si hay info de usuario
     if (eliminadorUsuarioId) {
         console.warn(`Intento de eliminación de gasto ${id} denegado para usuario ${eliminadorUsuarioId} (Rol ${eliminadorRolId}).`);
     }
     return res.status(403).json({ error: 'Acceso denegado. Solo roles autorizados pueden eliminar gastos.' });
  }

  // Verificar que tenemos la información mínima del usuario para loguear
  if (!eliminadorUsuarioId || !eliminadorRolId || !eliminadorCursoId || !eliminadorColegioId) {
      console.error('¡ALERTA! Información de usuario incompleta para la eliminación de gasto y el log.', {
          eliminadorUsuarioId,
          eliminadorNombre,
          eliminadorRolId,
          eliminadorCursoId,
          eliminadorColegioId
      });
      // Podríamos devolver un error aquí o intentar continuar sin log, dependiendo de la criticidad
      // Por ahora, permitiremos la eliminación pero el log podría no ser perfecto
      // return res.status(500).json({ error: 'Información de usuario incompleta para procesar la eliminación.' });
  }


  try {
    await client.query('BEGIN'); // Iniciar transacción

    // 1. Obtener info del gasto para el log y la URL del comprobante
    const gastoResult = await client.query('SELECT descripcion, monto, comprobante_url FROM gastos WHERE id = $1', [id]);

    if (gastoResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Gasto no encontrado' });
    }

    const { descripcion, monto: rawMonto, comprobante_url } = gastoResult.rows[0]; // Usar un nombre temporal para el monto crudo
    const monto = Number(rawMonto); // Convertir explícitamente a número

    // 2. Eliminar el gasto de la base de datos
    const deleteResult = await client.query('DELETE FROM gastos WHERE id = $1 RETURNING *', [id]);

    if (deleteResult.rows.length === 0) {
       await client.query('ROLLBACK');
       return res.status(404).json({ error: 'Gasto no encontrado para eliminar' });
    }

    // 3. Eliminar el archivo del comprobante si existe
    if (comprobante_url) {
      const filePath = path.join(__dirname, comprobante_url); // comprobante_url incluye '/uploads/'
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Error al eliminar archivo de comprobante:', filePath, err);
          // No hacemos rollback si falla la eliminación del archivo, solo si falla la BD
        } else {
          console.log('Archivo de comprobante eliminado:', filePath);
        }
      });
    }

    // 4. Registrar log de la eliminación
    // Solo registrar si tenemos la información esencial del usuario
    if (eliminadorUsuarioId && eliminadorRolId && eliminadorCursoId && eliminadorColegioId) {
       await client.query(
        'INSERT INTO logs (usuario_id, usuario_nombre, rol_id, curso_id, colegio_id, accion, entidad, entidad_id, detalle) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [
          eliminadorUsuarioId,
          eliminadorNombre, // <-- Usará el nombre o 'Usuario Desconocido'
          eliminadorRolId,
          eliminadorCursoId,
          eliminadorColegioId,
          'eliminar',
          'gasto',
          id, // ID del gasto eliminado
          `Eliminó gasto: ${descripcion} - $${monto.toFixed(2)}`
        ]
      );
       console.log(`Log de eliminación de gasto ${id} registrado por usuario ${eliminadorNombre} (ID: ${eliminadorUsuarioId})`);
    } else {
       console.error('¡ALERTA! Log de eliminación de gasto NO REGISTRADO por falta de información del usuario.', {
           eliminadorUsuarioId,
           eliminadorNombre,
           eliminadorRolId,
           eliminadorCursoId,
           eliminadorColegioId
       });
    }


    await client.query('COMMIT'); // Confirmar transacción

    // Enviar respuesta exitosa al frontend
    res.status(200).json({ message: 'Gasto eliminado con éxito.' });

  } catch (err) {
    await client.query('ROLLBACK'); // Revertir si algo falla en la BD
    console.error('Error al eliminar gasto:', err); // Simplificado ya que el log se maneja aparte
    // Enviar un error más específico si es posible
    res.status(500).json({ error: 'Error interno del servidor al eliminar gasto.', db_error: err.message });
    // No llamamos a next(err) para evitar que el error Handler global lo capture si ya enviamos respuesta
  } finally {
    client.release(); // Liberar cliente de la pool
  }
});

app.get('/cursos', async (req, res) => {
  try {
    // Obtener colegio_id de los parámetros de consulta (query params)
    const colegio_id = parseInt(req.query.colegio_id, 10);

    let query = `
      SELECT 
        c.id,
        c.nombre,
        c.activo,
        c.colegio_id,
        co.nombre AS colegio_nombre
      FROM cursos c
      JOIN colegios co ON c.colegio_id = co.id
    `;
    const values = [];
    let paramIndex = 1;

    // Si se proporciona un colegio_id válido, agregarlo a la cláusula WHERE
    if (!isNaN(colegio_id)) {
      query += ` WHERE c.colegio_id = $${paramIndex}`;
      values.push(colegio_id);
      paramIndex++;
    }

    query += ` ORDER BY co.nombre, c.nombre`; // Mantener el orden

    console.log('Executing cursos query:', query);
    console.log('With values:', values);

    const result = await pool.query(query, values);

    // Obtener cursos junto con el nombre del colegio asociado
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Documentos
app.get('/documentos', async (req, res) => {
  try {
    // Si hay token, verificar la autenticación
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    let curso_id, colegio_id;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        curso_id = decoded.curso_id;
        colegio_id = decoded.colegio_id;
        console.log(`Token válido. Curso: ${curso_id}, Colegio: ${colegio_id}`);
      } catch (err) {
        console.log('Token inválido pero permitiendo acceso de solo lectura:', err.message);
      }
    }
    
    // Comprobar si la tabla existe
    try {
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'documentos'
        )
      `);
      
      const tableExists = tableCheck.rows[0].exists;
      console.log('¿Existe la tabla documentos?', tableExists);
      
      if (!tableExists) {
        console.log('La tabla documentos no existe. Creando...');
        await pool.query(`
          CREATE TABLE IF NOT EXISTS documentos (
            id SERIAL PRIMARY KEY,
            nombre VARCHAR(100) NOT NULL,
            descripcion TEXT,
            fecha_subida DATE NOT NULL,
            url TEXT NOT NULL,
            curso_id INTEGER NOT NULL DEFAULT 1,
            colegio_id INTEGER NOT NULL DEFAULT 1
          )
        `);
        console.log('Tabla documentos creada exitosamente');
        return res.json([]);
      }
    } catch (checkErr) {
      console.error('Error verificando tabla documentos:', checkErr);
    }
    
    // Comprobar columnas de la tabla documentos
    try {
      const columnsCheck = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'documentos'
      `);
      
      console.log('Columnas de la tabla documentos:', columnsCheck.rows);
    } catch (columnsErr) {
      console.error('Error verificando columnas:', columnsErr);
    }
    
    // Si tenemos curso_id y colegio_id, filtramos
    let query;
    let params = [];
    
    if (curso_id && colegio_id) {
      // Comprobar si existen las columnas curso_id y colegio_id
      try {
        const columnsExist = await pool.query(`
          SELECT 
            COUNT(*) filter (WHERE column_name = 'curso_id') AS has_curso,
            COUNT(*) filter (WHERE column_name = 'colegio_id') AS has_colegio
          FROM information_schema.columns 
          WHERE table_name = 'documentos'
        `);
        
        const hasCurso = parseInt(columnsExist.rows[0].has_curso) > 0;
        const hasColegio = parseInt(columnsExist.rows[0].has_colegio) > 0;
        
        console.log('¿Tiene columna curso_id?', hasCurso);
        console.log('¿Tiene columna colegio_id?', hasColegio);
        
        if (hasCurso && hasColegio) {
          query = `
            SELECT id, nombre, descripcion, fecha_subida, url 
            FROM documentos
            WHERE curso_id = $1 AND colegio_id = $2
          `;
          params = [curso_id, colegio_id];
        } else {
          console.log('Faltan columnas en la tabla documentos, usando consulta sin filtro');
          query = `
            SELECT id, nombre, descripcion, fecha_subida, url 
            FROM documentos
          `;
        }
      } catch (colErr) {
        console.error('Error verificando columnas curso_id/colegio_id:', colErr);
        query = `
          SELECT id, nombre, descripcion, fecha_subida, url 
          FROM documentos
        `;
      }
    } else {
      // Sin autenticación, mostrar datos limitados
      query = `
        SELECT id, nombre, descripcion, fecha_subida, url 
        FROM documentos
        LIMIT 10
      `;
    }
    
    console.log('Ejecutando query documentos:', query);
    console.log('Params:', params);
    
    const result = await pool.query(query, params);
    console.log(`Se encontraron ${result.rows.length} documentos`);
    res.json(result.rows || []);
  } catch (err) {
    console.error('Error en endpoint /documentos:', err);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
    });
  }
});

// Registrar log al agregar un documento
app.post('/documentos', authenticateToken, upload.single('documento'), async (req, res) => {
  const { nombre, descripcion, usuario_id, usuario_nombre, rol_id, curso_id, colegio_id } = req.body;
  
  // Validación básica
  if (!nombre || !descripcion || !usuario_id || !usuario_nombre || !rol_id || !curso_id || !colegio_id) {
    return res.status(400).json({ error: 'Faltan campos obligatorios.' });
  }
  
  const url = req.file ? `/uploads/${req.file.filename}` : null;
  
  if (!url) {
    return res.status(400).json({ error: 'No se ha proporcionado un archivo.' });
  }
  
  // Usar fecha actual formateada como YYYY-MM-DD
  const fechaActual = new Date().toISOString().split('T')[0];
  
  try {
    const result = await pool.query(
      "INSERT INTO documentos (nombre, descripcion, fecha_subida, url, curso_id, colegio_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [nombre, descripcion, fechaActual, url, curso_id, colegio_id]
    );
    // Registrar log
    await pool.query(
      'INSERT INTO logs (usuario_id, usuario_nombre, rol_id, curso_id, colegio_id, accion, entidad, entidad_id, detalle) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [usuario_id, usuario_nombre, rol_id, curso_id, colegio_id, 'crear', 'documento', result.rows[0].id, `Agregó documento: ${nombre}`]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al agregar documento:', err);
    res.status(500).json({ error: err.message });
  }
});

// Fechas Importantes
app.get('/fechas', async (req, res) => {
  try {
    // Si hay token, verificar la autenticación
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    let curso_id, colegio_id;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        curso_id = decoded.curso_id;
        colegio_id = decoded.colegio_id;
        console.log(`Token válido. Curso: ${curso_id}, Colegio: ${colegio_id}`);
      } catch (err) {
        console.log('Token inválido pero permitiendo acceso de solo lectura:', err.message);
      }
    }
    
    // Comprobar si la tabla existe
    try {
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'fechas'
        )
      `);
      
      const tableExists = tableCheck.rows[0].exists;
      console.log('¿Existe la tabla fechas?', tableExists);
      
      if (!tableExists) {
        console.log('La tabla fechas no existe. Creando...');
        await pool.query(`
          CREATE TABLE IF NOT EXISTS fechas (
            id SERIAL PRIMARY KEY,
            fecha DATE NOT NULL,
            descripcion TEXT NOT NULL,
            curso_id INTEGER NOT NULL DEFAULT 1,
            colegio_id INTEGER NOT NULL DEFAULT 1
          )
        `);
        console.log('Tabla fechas creada exitosamente');
        return res.json([]);
      }
    } catch (checkErr) {
      console.error('Error verificando tabla fechas:', checkErr);
    }
    
    // Comprobar columnas de la tabla fechas
    try {
      const columnsCheck = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'fechas'
      `);
      
      console.log('Columnas de la tabla fechas:', columnsCheck.rows);
    } catch (columnsErr) {
      console.error('Error verificando columnas:', columnsErr);
    }
    
    // Si tenemos curso_id y colegio_id, filtramos
    let query;
    let params = [];
    
    if (curso_id && colegio_id) {
      // Comprobar si existen las columnas curso_id y colegio_id
      try {
        const columnsExist = await pool.query(`
          SELECT 
            COUNT(*) filter (WHERE column_name = 'curso_id') AS has_curso,
            COUNT(*) filter (WHERE column_name = 'colegio_id') AS has_colegio
          FROM information_schema.columns 
          WHERE table_name = 'fechas'
        `);
        
        const hasCurso = parseInt(columnsExist.rows[0].has_curso) > 0;
        const hasColegio = parseInt(columnsExist.rows[0].has_colegio) > 0;
        
        console.log('¿Tiene columna curso_id?', hasCurso);
        console.log('¿Tiene columna colegio_id?', hasColegio);
        
        if (hasCurso && hasColegio) {
          query = `
            SELECT id, fecha, descripcion 
            FROM fechas 
            WHERE curso_id = $1 AND colegio_id = $2
            ORDER BY fecha ASC
          `;
          params = [curso_id, colegio_id];
        } else {
          console.log('Faltan columnas en la tabla fechas, usando consulta sin filtro');
          query = `
            SELECT id, fecha, descripcion 
            FROM fechas 
            ORDER BY fecha ASC
          `;
        }
      } catch (colErr) {
        console.error('Error verificando columnas curso_id/colegio_id:', colErr);
        query = `
          SELECT id, fecha, descripcion 
          FROM fechas 
          ORDER BY fecha ASC
        `;
      }
    } else {
      // Sin autenticación, mostrar datos limitados
      query = `
        SELECT id, fecha, descripcion 
        FROM fechas 
        ORDER BY fecha ASC
        LIMIT 10
      `;
    }
    
    console.log('Ejecutando query fechas:', query);
    console.log('Params:', params);
    
    const result = await pool.query(query, params);
    console.log(`Se encontraron ${result.rows.length} fechas`);
    res.json(result.rows || []);
  } catch (err) {
    console.error('Error en endpoint /fechas:', err);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
    });
  }
});

// Registrar log al agregar una fecha importante
app.post('/fechas', authenticateToken, async (req, res) => {
  const { fecha, descripcion, usuario_id, usuario_nombre, rol_id, curso_id, colegio_id } = req.body;
  
  // Validación básica
  if (!fecha || !descripcion || !usuario_id || !usuario_nombre || !rol_id || !curso_id || !colegio_id) {
    return res.status(400).json({ error: 'Faltan campos obligatorios.' });
  }
  
  try {
    const result = await pool.query(
      "INSERT INTO fechas (fecha, descripcion, curso_id, colegio_id) VALUES ($1, $2, $3, $4) RETURNING *",
      [fecha, descripcion, curso_id, colegio_id]
    );
    // Registrar log
    await pool.query(
      'INSERT INTO logs (usuario_id, usuario_nombre, rol_id, curso_id, colegio_id, accion, entidad, entidad_id, detalle) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [usuario_id, usuario_nombre, rol_id, curso_id, colegio_id, 'crear', 'fecha', result.rows[0].id, `Agregó fecha: ${descripcion}`]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al agregar fecha:', err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint para registrar un log
app.post('/logs', async (req, res) => {
  const { usuario_id, usuario_nombre, rol_id, curso_id, colegio_id, accion, entidad, entidad_id, detalle } = req.body;
  try {
    await pool.query(
      'INSERT INTO logs (usuario_id, usuario_nombre, rol_id, curso_id, colegio_id, accion, entidad, entidad_id, detalle) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [usuario_id, usuario_nombre, rol_id, curso_id, colegio_id, accion, entidad, entidad_id, detalle]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint para obtener logs filtrados por curso/colegio y solo para roles autorizados
app.get('/logs', async (req, res) => {
  // Se espera recibir: rol_id, curso_id, colegio_id como query params o headers
  const rol_id = Number(req.query.rol_id);
  const curso_id = Number(req.query.curso_id);
  const colegio_id = Number(req.query.colegio_id);
  // Solo tesorero (3), presidente (2), admin (1) pueden ver logs
  if (![1,2,3].includes(rol_id)) {
    return res.status(403).json({ error: 'No autorizado' });
  }
  try {
    const result = await pool.query(
      'SELECT * FROM logs WHERE curso_id = $1 AND colegio_id = $2 ORDER BY fecha DESC LIMIT 200',
      [curso_id, colegio_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint para obtener lista de colegios
app.get('/colegios', async (req, res) => {
  try {
    const result = await pool.query("SELECT id, nombre FROM colegios");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint para actualizar el estado activo/inactivo de un curso
app.put('/cursos/:id/estado', authenticateToken, async (req, res) => {
  const { id } = req.params; // ID del curso de la URL
  const { activo } = req.body; // Nuevo estado (booleano) del cuerpo de la solicitud

  // Validar si el usuario es superadmin (rol_id = 1) si es necesario, o si tiene permisos
  // Por ahora, asumimos que authenticateToken es suficiente y el superadmin tiene permiso.
  if (req.user.rol_id !== 1) {
    return res.status(403).json({ error: 'Acceso denegado. Solo superadmins pueden cambiar el estado del curso.' });
  }

  // Validación básica del ID y el estado
  if (!id || activo === undefined || typeof activo !== 'boolean') {
    return res.status(400).json({ error: 'Datos inválidos. Se requiere ID de curso y estado booleano (activo).' });
  }

  try {
    const result = await pool.query(
      'UPDATE cursos SET activo = $1 WHERE id = $2 RETURNING id, nombre, activo',
      [activo, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Curso no encontrado.' });
    }

    // Puedes loguear esta acción si deseas
    console.log(`Estado del curso ${result.rows[0].nombre} (ID: ${result.rows[0].id}) actualizado a ${result.rows[0].activo}`);

    res.json(result.rows[0]); // Devolver el curso actualizado
  } catch (err) {
    console.error('Error al actualizar estado del curso:', err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint para cambiar la contraseña de un usuario
app.put('/usuarios/:id/password', authenticateToken, async (req, res) => {
  const { id } = req.params; // ID del usuario a modificar
  const { currentPassword, newPassword } = req.body; // Contraseña actual (opcional) y nueva contraseña

  // Convertir id a número para comparación
  const userId = parseInt(id, 10);

  // Verificar si el usuario autenticado es el usuario objetivo O es un superadmin
  if (req.user.id !== userId && req.user.rol_id !== 1) {
    return res.status(403).json({ error: 'Acceso denegado. No tiene permiso para cambiar esta contraseña.' });
  }

  // Validación básica de la nueva contraseña
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
  }

  try {
    // Obtener el usuario de la base de datos para verificar la contraseña actual si es necesario
    const userResult = await pool.query('SELECT id, password, rol_id FROM usuarios WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    const user = userResult.rows[0];

    // Si el usuario autenticado NO es superadmin, debe proporcionar la contraseña actual correcta
    if (req.user.rol_id !== 1) {
      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Contraseña actual incorrecta.' });
      }
    }

    // Hashear la nueva contraseña
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar la contraseña en la base de datos
    await pool.query('UPDATE usuarios SET password = $1 WHERE id = $2', [hashedNewPassword, userId]);

    console.log(`Contraseña del usuario ID ${userId} cambiada exitosamente.`);

    res.json({ message: 'Contraseña actualizada exitosamente.' });
  } catch (err) {
    console.error('Error al cambiar la contraseña:', err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint para actualizar el rol de un usuario por ID
app.put('/usuarios/:id/rol', authenticateToken, async (req, res) => {
  const { id } = req.params; // ID del usuario de la URL
  const { rol_id } = req.body; // Nuevo rol_id del cuerpo de la solicitud

  // Verificar si el usuario autenticado es superadmin (rol_id = 1)
  if (req.user.rol_id !== 1) {
    return res.status(403).json({ error: 'Acceso denegado. Solo superadmins pueden asignar roles.' });
  }

  // Validación básica del ID y el rol_id
  // rol_id debe ser un número entero válido que exista en la tabla roles (1, 2, 3, 4, 5)
  const validRoles = [1, 2, 3, 4, 5];
  if (!id || rol_id === undefined || !Number.isInteger(rol_id) || !validRoles.includes(rol_id)) {
    return res.status(400).json({ error: 'Datos inválidos. Se requiere ID de usuario y un rol_id válido (1-5).' });
  }

  try {
    const result = await pool.query(
      'UPDATE usuarios SET rol_id = $1 WHERE id = $2 RETURNING id, nombre, rol_id',
      [rol_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    console.log(`Rol del usuario ${result.rows[0].nombre} (ID: ${result.rows[0].id}) actualizado a rol_id ${result.rows[0].rol_id}`);

    res.json(result.rows[0]); // Devolver el usuario actualizado (con su nuevo rol)
  } catch (err) {
    console.error('Error al actualizar rol del usuario:', err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint para actualizar un usuario existente por ID (solo Superusuario)
app.put('/usuarios/:id', authenticateToken, async (req, res) => {
  const { id } = req.params; // ID del usuario a actualizar
  const { nombre, email, rol_id, colegio_id, curso_id } = req.body; // Datos a actualizar

  // Convertir ID a número para comparación y consultas
  const userId = parseInt(id, 10);

  // Verificar si el usuario autenticado es superadmin (rol_id = 1)
  if (!req.user || req.user.rol_id !== 1) {
    return res.status(403).json({ error: 'Acceso denegado. Solo superusuarios pueden editar usuarios.' });
  }

  // Validación básica de los campos recibidos
  if (!nombre || !email || rol_id === undefined || colegio_id === undefined || curso_id === undefined) {
     return res.status(400).json({ error: 'Faltan campos obligatorios (nombre, email, rol_id, colegio_id, curso_id).' });
  }

   // Validación básica de rol_id, colegio_id, curso_id como números enteros válidos
   if (!Number.isInteger(rol_id) || !Number.isInteger(colegio_id) || !Number.isInteger(curso_id)) {
        return res.status(400).json({ error: 'Los IDs de rol, colegio y curso deben ser números enteros válidos.' });
   }


  try {
    const client = await pool.connect();
    try {
        // Verificar si el usuario existe
        const checkUser = await client.query('SELECT id FROM usuarios WHERE id = $1', [userId]);
        if (checkUser.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado para actualizar.' });
        }

        // Realizar la actualización
        const result = await client.query(
          "UPDATE usuarios SET nombre = $1, email = $2, rol_id = $3, colegio_id = $4, curso_id = $5 WHERE id = $6 RETURNING id, nombre, email, rol_id, colegio_id, curso_id",
          [nombre, email, rol_id, colegio_id, curso_id, userId]
        );

        // Registrar log de la edición
        const editorUsuarioId = req.user.id;
        const editorNombre = req.user.nombre || 'Superusuario';
        const editorRolId = req.user.rol_id;
        const editorCursoId = req.user.curso_id;
        const editorColegioId = req.user.colegio_id;

        const usuarioEditadoNombre = result.rows[0].nombre;
        const usuarioEditadoEmail = result.rows[0].email;

         if (editorUsuarioId && editorNombre && editorRolId && editorCursoId && editorColegioId) {
            await client.query(
              'INSERT INTO logs (usuario_id, usuario_nombre, rol_id, curso_id, colegio_id, accion, entidad, entidad_id, detalle) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
              [
                editorUsuarioId,
                editorNombre,
                editorRolId,
                editorCursoId,
                editorColegioId,
                'editar',
                'usuario',
                userId,
                `Editó usuario ID ${userId}: Nombre "${usuarioEditadoNombre}", Email "${usuarioEditadoEmail}", Rol ID ${rol_id}, Colegio ID ${colegio_id}, Curso ID ${curso_id}`
              ]
            );
            console.log(`Log de edición de usuario ${userId} registrado por ${editorNombre} (ID: ${editorUsuarioId})`);
         } else {
            console.warn(`No se pudo registrar log de edición para usuario ${userId}: falta información del superadmin.`, { reqUser: req.user });
         }


        // Enviar la respuesta con los datos actualizados
        res.json(result.rows[0]);

    } finally {
        client.release();
    }

  } catch (err) {
    console.error('Error en el endpoint PUT /usuarios/:id:', err);
    res.status(500).json({ error: 'Error interno del servidor al actualizar usuario.', db_error: err.message });
  }
});

// Proteger rutas que requieren autenticación
app.post('/pagos', authenticateToken);
app.put('/pagos/:id', authenticateToken);
app.post('/conceptos', authenticateToken);
app.put('/conceptos/:id', authenticateToken);
app.delete('/conceptos/:id', authenticateToken);
app.post('/gastos', authenticateToken);
app.put('/gastos/:id', authenticateToken);
app.post('/documentos', authenticateToken);
app.put('/documentos/:id', authenticateToken);
app.delete('/documentos/:id', authenticateToken);
app.post('/fechas', authenticateToken);
app.put('/fechas/:id', authenticateToken);
app.delete('/fechas/:id', authenticateToken);
app.post('/logs', authenticateToken);

// Agregar el middleware de manejo de errores al final
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});