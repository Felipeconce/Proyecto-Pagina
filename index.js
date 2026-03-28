const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// CORS restringido al frontend
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());

// Rate limiting para login (10 intentos cada 15 min)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos de login. Intenta en 15 minutos.' }
});

// ============================================================
// MIDDLEWARES
// ============================================================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token no proporcionado' });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
};

// Verifica que el usuario tenga al menos uno de los roles indicados
const requireRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.rol_id)) {
    return res.status(403).json({ error: 'No tienes permiso para esta acción' });
  }
  next();
};

const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

// ============================================================
// BASE DE DATOS
// ============================================================

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'centro_apoderados',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

// ============================================================
// SUBIDA DE ARCHIVOS (con validación de tipo y tamaño)
// ============================================================

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/gif'
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const safeName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, Date.now() + '-' + safeName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo PDF, Word, Excel e imágenes.'));
    }
  }
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => res.send('Backend funcionando'));

// ============================================================
// MIGRACIONES Y DATOS INICIALES
// ============================================================

const mesesPorDefecto = [
  'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

async function asegurarMesesPorDefecto() {
  for (let i = 0; i < mesesPorDefecto.length; i++) {
    await pool.query(
      'INSERT INTO conceptos_pago (nombre, orden) VALUES ($1, $2) ON CONFLICT (nombre) DO NOTHING',
      [mesesPorDefecto[i], i + 1]
    );
  }
}

async function ejecutarMigraciones() {
  // Helper para agregar columna si no existe
  const addColumnIfMissing = async (table, column, type) => {
    const res = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name=$1 AND column_name=$2`,
      [table, column]
    );
    if (res.rows.length === 0) {
      await pool.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
      console.log(`Columna ${column} agregada a ${table}`);
    }
  };

  await addColumnIfMissing('documentos', 'descripcion', 'TEXT');
  await addColumnIfMissing('documentos', 'curso_id', 'INTEGER');
  await addColumnIfMissing('documentos', 'colegio_id', 'INTEGER');
  await addColumnIfMissing('fechas', 'curso_id', 'INTEGER');
  await addColumnIfMissing('fechas', 'colegio_id', 'INTEGER');
  await addColumnIfMissing('gastos', 'colegio_id', 'INTEGER');

  // Índices para mejorar rendimiento
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email)',
    'CREATE INDEX IF NOT EXISTS idx_pagos_usuario_concepto ON pagos(usuario_id, concepto_id)',
    'CREATE INDEX IF NOT EXISTS idx_usuarios_scope ON usuarios(curso_id, colegio_id)',
    'CREATE INDEX IF NOT EXISTS idx_documentos_scope ON documentos(curso_id, colegio_id)',
    'CREATE INDEX IF NOT EXISTS idx_fechas_scope ON fechas(curso_id, colegio_id)',
    'CREATE INDEX IF NOT EXISTS idx_gastos_scope ON gastos(curso_id, colegio_id)',
    'CREATE INDEX IF NOT EXISTS idx_logs_scope ON logs(curso_id, colegio_id)',
  ];
  for (const sql of indexes) {
    await pool.query(sql).catch(() => {});
  }

  console.log('Migraciones ejecutadas correctamente');
}

asegurarMesesPorDefecto().catch(console.error);
ejecutarMigraciones().catch(console.error);

// ============================================================
// USUARIOS (solo superadmin gestiona usuarios)
// ============================================================

app.get('/usuarios', authenticateToken, requireRoles(1), async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, email, nombre, rol_id, curso_id, colegio_id FROM usuarios'
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

app.post('/login', loginLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  try {
    const result = await pool.query(
      'SELECT id, nombre, email, password, rol_id, curso_id, colegio_id FROM usuarios WHERE email = $1',
      [email]
    );
    if (result.rows.length === 0) return res.status(401).json({ error: 'Credenciales inválidas' });

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign(
      { id: user.id, email: user.email, rol_id: user.rol_id, curso_id: user.curso_id, colegio_id: user.colegio_id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      id: user.id, nombre: user.nombre, email: user.email,
      rol_id: user.rol_id, curso_id: user.curso_id, colegio_id: user.colegio_id, token
    });
  } catch (err) { next(err); }
});

// Crear usuario — solo superadmin
app.post('/usuarios', authenticateToken, requireRoles(1), [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
  body('nombre').notEmpty().trim(),
  body('rol_id').isInt({ min: 1, max: 5 })
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password, nombre, rol_id, curso_id, colegio_id } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO usuarios (email, password, nombre, rol_id, curso_id, colegio_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, email, nombre, rol_id, curso_id, colegio_id',
      [email, hashedPassword, nombre, rol_id, curso_id, colegio_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// ============================================================
// APODERADOS (filtrados por curso/colegio del usuario)
// ============================================================

app.get('/apoderados', authenticateToken, async (req, res, next) => {
  try {
    let result;
    if (req.user.rol_id === 1) {
      result = await pool.query("SELECT id, nombre FROM usuarios WHERE rol_id = 4");
    } else {
      result = await pool.query(
        "SELECT id, nombre FROM usuarios WHERE rol_id = 4 AND curso_id = $1 AND colegio_id = $2",
        [req.user.curso_id, req.user.colegio_id]
      );
    }
    res.json(result.rows);
  } catch (err) { next(err); }
});

// ============================================================
// PAGOS
// Lectura: todos los roles autenticados (filtrado por curso/colegio)
// Escritura: solo tesorero (3) y superadmin (1)
// ============================================================

app.get('/pagos', authenticateToken, async (req, res, next) => {
  try {
    let query, params;
    if (req.user.rol_id === 1) {
      query = `SELECT pagos.id, pagos.usuario_id, pagos.concepto_id,
                      usuarios.nombre AS apoderado, conceptos_pago.nombre AS concepto,
                      pagos.monto, pagos.fecha, pagos.estado
               FROM pagos
               JOIN usuarios ON pagos.usuario_id = usuarios.id
               JOIN conceptos_pago ON pagos.concepto_id = conceptos_pago.id`;
      params = [];
    } else {
      query = `SELECT pagos.id, pagos.usuario_id, pagos.concepto_id,
                      usuarios.nombre AS apoderado, conceptos_pago.nombre AS concepto,
                      pagos.monto, pagos.fecha, pagos.estado
               FROM pagos
               JOIN usuarios ON pagos.usuario_id = usuarios.id
               JOIN conceptos_pago ON pagos.concepto_id = conceptos_pago.id
               WHERE usuarios.curso_id = $1 AND usuarios.colegio_id = $2`;
      params = [req.user.curso_id, req.user.colegio_id];
    }
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { next(err); }
});

app.post('/pagos', authenticateToken, requireRoles(1, 3), async (req, res, next) => {
  const { usuario_id, concepto_id, monto, fecha, estado } = req.body;
  if (!monto || Number(monto) <= 0) {
    return res.status(400).json({ error: 'El monto debe ser mayor a 0' });
  }
  try {
    const result = await pool.query(
      "INSERT INTO pagos (usuario_id, concepto_id, monto, fecha, estado) VALUES ($1,$2,$3,$4,$5) RETURNING *",
      [usuario_id, concepto_id, monto, fecha, estado]
    );
    await pool.query(
      'INSERT INTO logs (usuario_id, usuario_nombre, rol_id, curso_id, colegio_id, accion, entidad, entidad_id, detalle) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [req.user.id, req.user.email, req.user.rol_id, req.user.curso_id, req.user.colegio_id, 'crear', 'pago', result.rows[0].id, `Agregó pago de $${monto} para concepto_id ${concepto_id}`]
    );
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

app.put('/pagos/:id', authenticateToken, requireRoles(1, 3), async (req, res, next) => {
  const { id } = req.params;
  const { monto, fecha, estado } = req.body;
  if (!monto || Number(monto) <= 0) {
    return res.status(400).json({ error: 'El monto debe ser mayor a 0' });
  }
  try {
    const result = await pool.query(
      "UPDATE pagos SET monto=$1, fecha=$2, estado=$3 WHERE id=$4 RETURNING *",
      [monto, fecha, estado, id]
    );
    await pool.query(
      'INSERT INTO logs (usuario_id, usuario_nombre, rol_id, curso_id, colegio_id, accion, entidad, entidad_id, detalle) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [req.user.id, req.user.email, req.user.rol_id, req.user.curso_id, req.user.colegio_id, 'editar', 'pago', id, `Editó pago a $${monto}`]
    );
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// ============================================================
// CONCEPTOS DE PAGO
// Lectura: todos los roles autenticados
// Escritura: solo tesorero (3) y superadmin (1)
// ============================================================

app.get('/conceptos', authenticateToken, async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, nombre, orden, fecha_vencimiento FROM conceptos_pago ORDER BY orden ASC, nombre ASC'
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

app.post('/conceptos', authenticateToken, requireRoles(1, 3), async (req, res, next) => {
  const { nombre, orden, fecha_vencimiento } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO conceptos_pago (nombre, orden, fecha_vencimiento) VALUES ($1,$2,$3) RETURNING *',
      [nombre, orden ?? 99, fecha_vencimiento || null]
    );
    await pool.query(
      'INSERT INTO logs (usuario_id, usuario_nombre, rol_id, curso_id, colegio_id, accion, entidad, entidad_id, detalle) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [req.user.id, req.user.email, req.user.rol_id, req.user.curso_id, req.user.colegio_id, 'crear', 'concepto', result.rows[0].id, `Agregó concepto: ${nombre}`]
    );
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

app.put('/conceptos/:id', authenticateToken, requireRoles(1, 3), async (req, res, next) => {
  const { id } = req.params;
  const { nombre, fecha_vencimiento } = req.body;
  try {
    const result = await pool.query(
      'UPDATE conceptos_pago SET nombre=$1, fecha_vencimiento=$2 WHERE id=$3 RETURNING *',
      [nombre, fecha_vencimiento || null, id]
    );
    await pool.query(
      'INSERT INTO logs (usuario_id, usuario_nombre, rol_id, curso_id, colegio_id, accion, entidad, entidad_id, detalle) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [req.user.id, req.user.email, req.user.rol_id, req.user.curso_id, req.user.colegio_id, 'editar', 'concepto', id, `Editó concepto: ${nombre}`]
    );
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

app.delete('/conceptos/:id', authenticateToken, requireRoles(1, 3), async (req, res, next) => {
  const { id } = req.params;
  try {
    const conceptoRes = await pool.query('SELECT nombre FROM conceptos_pago WHERE id=$1', [id]);
    const nombre = conceptoRes.rows[0]?.nombre || '';
    await pool.query('DELETE FROM pagos WHERE concepto_id=$1', [id]);
    await pool.query('DELETE FROM conceptos_pago WHERE id=$1', [id]);
    await pool.query(
      'INSERT INTO logs (usuario_id, usuario_nombre, rol_id, curso_id, colegio_id, accion, entidad, entidad_id, detalle) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [req.user.id, req.user.email, req.user.rol_id, req.user.curso_id, req.user.colegio_id, 'eliminar', 'concepto', id, `Eliminó concepto: ${nombre}`]
    );
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ============================================================
// GASTOS
// Lectura: todos los roles autenticados (filtrado por curso/colegio)
// Escritura: solo tesorero (3) y superadmin (1)
// ============================================================

app.get('/gastos', authenticateToken, async (req, res, next) => {
  try {
    let query, params;
    if (req.user.rol_id === 1) {
      query = `SELECT gastos.id, cursos.nombre AS curso, gastos.descripcion, gastos.monto, gastos.fecha
               FROM gastos JOIN cursos ON gastos.curso_id = cursos.id`;
      params = [];
    } else {
      query = `SELECT gastos.id, cursos.nombre AS curso, gastos.descripcion, gastos.monto, gastos.fecha
               FROM gastos JOIN cursos ON gastos.curso_id = cursos.id
               WHERE gastos.curso_id = $1 AND gastos.colegio_id = $2`;
      params = [req.user.curso_id, req.user.colegio_id];
    }
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { next(err); }
});

app.get('/cursos', authenticateToken, async (req, res, next) => {
  try {
    const result = await pool.query("SELECT id, nombre FROM cursos");
    res.json(result.rows);
  } catch (err) { next(err); }
});

app.post('/gastos', authenticateToken, requireRoles(1, 3), async (req, res, next) => {
  const { descripcion, monto, fecha } = req.body;
  // Para superadmin puede venir curso_id en el body; para el resto se usa el del JWT
  const curso_id = req.user.rol_id === 1 ? (req.body.curso_id || req.user.curso_id) : req.user.curso_id;
  const colegio_id = req.user.colegio_id;

  if (!curso_id || !descripcion || !monto || !fecha) {
    return res.status(400).json({ error: 'Faltan campos obligatorios.' });
  }
  if (typeof monto !== 'number' || monto <= 0) {
    return res.status(400).json({ error: 'El monto debe ser un número mayor a 0.' });
  }
  if (typeof descripcion !== 'string' || descripcion.trim().length < 3) {
    return res.status(400).json({ error: 'La descripción debe tener al menos 3 caracteres.' });
  }
  const fechaGasto = new Date(fecha);
  if (isNaN(fechaGasto.getTime()) || fechaGasto > new Date()) {
    return res.status(400).json({ error: 'La fecha es inválida o futura.' });
  }
  try {
    const result = await pool.query(
      "INSERT INTO gastos (curso_id, colegio_id, descripcion, monto, fecha) VALUES ($1,$2,$3,$4,$5) RETURNING *",
      [curso_id, colegio_id, descripcion.trim(), monto, fecha]
    );
    await pool.query(
      'INSERT INTO logs (usuario_id, usuario_nombre, rol_id, curso_id, colegio_id, accion, entidad, entidad_id, detalle) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [req.user.id, req.user.email, req.user.rol_id, req.user.curso_id, req.user.colegio_id, 'crear', 'gasto', result.rows[0].id, `Agregó gasto: ${descripcion.trim()} $${monto}`]
    );
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

app.put('/gastos/:id', authenticateToken, requireRoles(1, 3), async (req, res, next) => {
  const { id } = req.params;
  const { descripcion, monto, fecha } = req.body;
  if (!monto || Number(monto) <= 0) {
    return res.status(400).json({ error: 'El monto debe ser mayor a 0.' });
  }
  try {
    const result = await pool.query(
      "UPDATE gastos SET descripcion=$1, monto=$2, fecha=$3 WHERE id=$4 RETURNING *",
      [descripcion, monto, fecha, id]
    );
    await pool.query(
      'INSERT INTO logs (usuario_id, usuario_nombre, rol_id, curso_id, colegio_id, accion, entidad, entidad_id, detalle) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [req.user.id, req.user.email, req.user.rol_id, req.user.curso_id, req.user.colegio_id, 'editar', 'gasto', id, `Editó gasto: ${descripcion} $${monto}`]
    );
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// ============================================================
// DOCUMENTOS
// Lectura: todos los roles autenticados (filtrado por curso/colegio)
// Escritura: superadmin (1), presidente (2), tesorero (3), secretaria (5)
// ============================================================

app.get('/documentos', authenticateToken, async (req, res, next) => {
  try {
    let query, params;
    if (req.user.rol_id === 1) {
      query = "SELECT id, nombre, descripcion, fecha_subida, url FROM documentos";
      params = [];
    } else {
      query = "SELECT id, nombre, descripcion, fecha_subida, url FROM documentos WHERE curso_id=$1 AND colegio_id=$2";
      params = [req.user.curso_id, req.user.colegio_id];
    }
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { next(err); }
});

app.post('/documentos', authenticateToken, requireRoles(1, 2, 3, 5), upload.single('documento'), async (req, res, next) => {
  const { nombre, descripcion } = req.body;
  if (!nombre || !descripcion) {
    return res.status(400).json({ error: 'Faltan campos obligatorios.' });
  }
  const url = req.file ? `/uploads/${req.file.filename}` : null;
  if (!url) return res.status(400).json({ error: 'No se ha proporcionado un archivo.' });

  const fechaActual = new Date().toISOString().split('T')[0];
  try {
    const result = await pool.query(
      "INSERT INTO documentos (nombre, descripcion, fecha_subida, url, curso_id, colegio_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
      [nombre, descripcion, fechaActual, url, req.user.curso_id, req.user.colegio_id]
    );
    await pool.query(
      'INSERT INTO logs (usuario_id, usuario_nombre, rol_id, curso_id, colegio_id, accion, entidad, entidad_id, detalle) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [req.user.id, req.user.email, req.user.rol_id, req.user.curso_id, req.user.colegio_id, 'crear', 'documento', result.rows[0].id, `Agregó documento: ${nombre}`]
    );
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// ============================================================
// FECHAS IMPORTANTES
// Lectura: todos los roles autenticados (filtrado por curso/colegio)
// Escritura: superadmin (1), presidente (2), tesorero (3), secretaria (5)
// ============================================================

app.get('/fechas', authenticateToken, async (req, res, next) => {
  try {
    let query, params;
    if (req.user.rol_id === 1) {
      query = "SELECT id, fecha, descripcion FROM fechas ORDER BY fecha ASC";
      params = [];
    } else {
      query = "SELECT id, fecha, descripcion FROM fechas WHERE curso_id=$1 AND colegio_id=$2 ORDER BY fecha ASC";
      params = [req.user.curso_id, req.user.colegio_id];
    }
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { next(err); }
});

app.post('/fechas', authenticateToken, requireRoles(1, 2, 3, 5), async (req, res, next) => {
  const { fecha, descripcion } = req.body;
  if (!fecha || !descripcion) {
    return res.status(400).json({ error: 'Faltan campos obligatorios.' });
  }
  try {
    const result = await pool.query(
      "INSERT INTO fechas (fecha, descripcion, curso_id, colegio_id) VALUES ($1,$2,$3,$4) RETURNING *",
      [fecha, descripcion, req.user.curso_id, req.user.colegio_id]
    );
    await pool.query(
      'INSERT INTO logs (usuario_id, usuario_nombre, rol_id, curso_id, colegio_id, accion, entidad, entidad_id, detalle) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [req.user.id, req.user.email, req.user.rol_id, req.user.curso_id, req.user.colegio_id, 'crear', 'fecha', result.rows[0].id, `Agregó fecha: ${descripcion}`]
    );
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// ============================================================
// LOGS / HISTORIAL
// Lectura: superadmin (1), presidente (2), tesorero (3)
// Filtrado por curso/colegio del token JWT (no de query params)
// ============================================================

app.post('/logs', authenticateToken, async (req, res, next) => {
  const { accion, entidad, entidad_id, detalle } = req.body;
  try {
    await pool.query(
      'INSERT INTO logs (usuario_id, usuario_nombre, rol_id, curso_id, colegio_id, accion, entidad, entidad_id, detalle) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [req.user.id, req.user.email, req.user.rol_id, req.user.curso_id, req.user.colegio_id, accion, entidad, entidad_id, detalle]
    );
    res.json({ success: true });
  } catch (err) { next(err); }
});

app.get('/logs', authenticateToken, requireRoles(1, 2, 3), async (req, res, next) => {
  try {
    let query, params;
    if (req.user.rol_id === 1) {
      query = 'SELECT * FROM logs ORDER BY fecha DESC LIMIT 200';
      params = [];
    } else {
      query = 'SELECT * FROM logs WHERE curso_id=$1 AND colegio_id=$2 ORDER BY fecha DESC LIMIT 200';
      params = [req.user.curso_id, req.user.colegio_id];
    }
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// ============================================================
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
