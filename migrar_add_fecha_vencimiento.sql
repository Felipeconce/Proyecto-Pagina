-- Agregar columna de fecha de vencimiento a la tabla de conceptos de pago
ALTER TABLE conceptos_pago ADD COLUMN fecha_vencimiento DATE;

-- Nota: Para ejecutar esta migración, utiliza el siguiente comando:
-- psql -U usuario -d centro_apoderados -f migrar_add_fecha_vencimiento.sql 