const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

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
    // Obtener curso_id y colegio_id del usuario autenticado
    const { curso_id, colegio_id } = req.user;
    
    // Filtrar usuarios por curso y colegio
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE curso_id = $1 AND colegio_id = $2', 
      [curso_id, colegio_id]
    );
    
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
  const editorUsuarioId = req.user ? req.user.id : null; // Asegurarse de que req.user exista
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
               gastos.monto, gastos.fecha
        FROM gastos
        JOIN cursos ON gastos.curso_id = cursos.id
        WHERE gastos.curso_id = $1 AND gastos.colegio_id = $2
      `;
      params = [curso_id, colegio_id];
    } else {
      // Sin autenticación, mostrar datos limitados
      query = `
        SELECT gastos.id, cursos.nombre AS curso, 
               gastos.descripcion, gastos.monto, gastos.fecha
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

app.get('/cursos', async (req, res) => {
  try {
    const result = await pool.query("SELECT id, nombre FROM cursos");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Registrar log al agregar un gasto
app.post('/gastos', authenticateToken, async (req, res) => {
  const { curso_id, descripcion, monto, fecha, usuario_id, usuario_nombre, rol_id, colegio_id } = req.body;
  // Validación básica
  if (!curso_id || !descripcion || !monto || !fecha || !usuario_id || !usuario_nombre || !rol_id || !colegio_id) {
    return res.status(400).json({ error: 'Faltan campos obligatorios.' });
  }
  if (typeof monto !== 'number' || monto <= 0) {
    return res.status(400).json({ error: 'El monto debe ser un número mayor a 0.' });
  }
  if (typeof descripcion !== 'string' || descripcion.trim().length < 3) {
    return res.status(400).json({ error: 'La descripción debe tener al menos 3 caracteres.' });
  }
  const fechaGasto = new Date(fecha);
  const hoy = new Date();
  if (isNaN(fechaGasto.getTime()) || fechaGasto > hoy) {
    return res.status(400).json({ error: 'La fecha es inválida o futura.' });
  }
  try {
    const result = await pool.query(
      "INSERT INTO gastos (curso_id, colegio_id, descripcion, monto, fecha) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [curso_id, colegio_id, descripcion, monto, fecha]
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