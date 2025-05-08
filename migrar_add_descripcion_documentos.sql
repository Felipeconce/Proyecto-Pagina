-- Agregar columna de descripción a la tabla de documentos
ALTER TABLE documentos ADD COLUMN descripcion TEXT;

-- Nota: Para ejecutar esta migración, utiliza el siguiente comando:
-- psql -U usuario -d centro_apoderados -f migrar_add_descripcion_documentos.sql 