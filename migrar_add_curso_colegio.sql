-- Agregar columnas de curso_id y colegio_id a la tabla de documentos
ALTER TABLE IF EXISTS documentos 
    ADD COLUMN IF NOT EXISTS curso_id INTEGER NOT NULL DEFAULT 1;
ALTER TABLE IF EXISTS documentos 
    ADD COLUMN IF NOT EXISTS colegio_id INTEGER NOT NULL DEFAULT 1;

-- Agregar columnas de curso_id y colegio_id a la tabla de fechas
ALTER TABLE IF EXISTS fechas 
    ADD COLUMN IF NOT EXISTS curso_id INTEGER NOT NULL DEFAULT 1;
ALTER TABLE IF EXISTS fechas 
    ADD COLUMN IF NOT EXISTS colegio_id INTEGER NOT NULL DEFAULT 1;

-- Agregar índices para mejorar el rendimiento de las consultas
-- Primero eliminar los índices si ya existen
DROP INDEX IF EXISTS idx_documentos_curso_colegio;
DROP INDEX IF EXISTS idx_fechas_curso_colegio;

-- Luego crear los índices
CREATE INDEX IF NOT EXISTS idx_documentos_curso_colegio ON documentos(curso_id, colegio_id);
CREATE INDEX IF NOT EXISTS idx_fechas_curso_colegio ON fechas(curso_id, colegio_id);

-- Nota: Para ejecutar esta migración, utiliza el siguiente comando:
-- psql -U usuario -d centro_apoderados -f migrar_add_curso_colegio.sql 