-- Script para crear las tablas documentos y fechas si no existen

-- Tabla de documentos
CREATE TABLE IF NOT EXISTS documentos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    fecha_subida DATE NOT NULL,
    url TEXT NOT NULL,
    curso_id INTEGER NOT NULL DEFAULT 1,
    colegio_id INTEGER NOT NULL DEFAULT 1
);

-- Tabla de fechas importantes
CREATE TABLE IF NOT EXISTS fechas (
    id SERIAL PRIMARY KEY,
    fecha DATE NOT NULL,
    descripcion TEXT NOT NULL,
    curso_id INTEGER NOT NULL DEFAULT 1,
    colegio_id INTEGER NOT NULL DEFAULT 1
);

-- Nota: Este script crea las tablas sin las restricciones de clave foránea
-- para permitir que se ejecute primero. Las claves foráneas pueden añadirse después
-- si es necesario. 