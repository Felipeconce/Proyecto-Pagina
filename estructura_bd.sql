-- Estructura completa de la base de datos del Centro de Apoderados

-- Tabla de colegios
CREATE TABLE IF NOT EXISTS colegios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    direccion TEXT,
    telefono VARCHAR(20),
    email VARCHAR(100)
);

-- Tabla de cursos
CREATE TABLE IF NOT EXISTS cursos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    colegio_id INTEGER REFERENCES colegios(id),
    año INTEGER NOT NULL
);

-- Tabla de roles
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL
);

-- Insertar roles por defecto
INSERT INTO roles (id, nombre) VALUES 
(1, 'Superusuario'),
(2, 'Presidente'),
(3, 'Tesorero'),
(4, 'Apoderado'),
(5, 'Secretario')
ON CONFLICT (id) DO NOTHING;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    rol_id INTEGER REFERENCES roles(id),
    curso_id INTEGER REFERENCES cursos(id),
    colegio_id INTEGER REFERENCES colegios(id)
);

-- Tabla de conceptos de pago
CREATE TABLE IF NOT EXISTS conceptos_pago (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    orden INTEGER,
    fecha_vencimiento DATE
);

-- Tabla de pagos
CREATE TABLE IF NOT EXISTS pagos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    concepto_id INTEGER REFERENCES conceptos_pago(id),
    monto DECIMAL(10,2) NOT NULL,
    fecha DATE NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    curso_id INTEGER REFERENCES cursos(id),
    colegio_id INTEGER REFERENCES colegios(id)
);

-- Tabla de gastos
CREATE TABLE IF NOT EXISTS gastos (
    id SERIAL PRIMARY KEY,
    curso_id INTEGER REFERENCES cursos(id),
    colegio_id INTEGER REFERENCES colegios(id),
    descripcion TEXT NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    fecha DATE NOT NULL
);

-- Tabla de documentos
CREATE TABLE IF NOT EXISTS documentos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    fecha_subida DATE NOT NULL,
    url TEXT NOT NULL,
    curso_id INTEGER NOT NULL REFERENCES cursos(id),
    colegio_id INTEGER NOT NULL REFERENCES colegios(id)
);

-- Tabla de fechas importantes
CREATE TABLE IF NOT EXISTS fechas (
    id SERIAL PRIMARY KEY,
    fecha DATE NOT NULL,
    descripcion TEXT NOT NULL,
    curso_id INTEGER NOT NULL REFERENCES cursos(id),
    colegio_id INTEGER NOT NULL REFERENCES colegios(id)
);

-- Tabla de logs (historial de acciones)
CREATE TABLE IF NOT EXISTS logs (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    usuario_nombre VARCHAR(100) NOT NULL,
    rol_id INTEGER NOT NULL,
    curso_id INTEGER NOT NULL,
    colegio_id INTEGER NOT NULL,
    accion VARCHAR(30) NOT NULL,
    entidad VARCHAR(30) NOT NULL,
    entidad_id INTEGER,
    detalle TEXT,
    fecha TIMESTAMP DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_pagos_usuario ON pagos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pagos_concepto ON pagos(concepto_id);
CREATE INDEX IF NOT EXISTS idx_pagos_curso_colegio ON pagos(curso_id, colegio_id);
CREATE INDEX IF NOT EXISTS idx_gastos_curso_colegio ON gastos(curso_id, colegio_id);
CREATE INDEX IF NOT EXISTS idx_documentos_curso_colegio ON documentos(curso_id, colegio_id);
CREATE INDEX IF NOT EXISTS idx_fechas_curso_colegio ON fechas(curso_id, colegio_id);
CREATE INDEX IF NOT EXISTS idx_logs_curso_colegio ON logs(curso_id, colegio_id);
CREATE INDEX IF NOT EXISTS idx_logs_fecha ON logs(fecha);

-- Nota: Para crear la base de datos y ejecutar este script:
-- 1. createdb centro_apoderados
-- 2. psql -U usuario -d centro_apoderados -f estructura_bd.sql 