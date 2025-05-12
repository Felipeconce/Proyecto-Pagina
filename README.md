# Centro de Apoderados - Sistema de Gestión

Sistema para gestionar centros de apoderados de colegios, permitiendo administrar pagos, gastos, documentos y fechas importantes.

## Características

- **Gestión de Pagos**: Registro y seguimiento de pagos de apoderados
- **Control de Gastos**: Registro de gastos del centro de apoderados
- **Documentos**: Repositorio de documentos compartidos
- **Fechas Importantes**: Calendario de eventos y fechas clave
- **Historial de Actividades**: Registro de auditoría de todas las acciones
- **Roles de Usuario**: Diferentes niveles de acceso (Superusuario, Presidente, Tesorero, Apoderado)
- **Separación por Curso/Colegio**: Cada colegio y curso mantiene sus datos separados

## Requisitos

- Node.js v14 o superior
- PostgreSQL 12 o superior
- Navegador web moderno

## Instalación

1. Clonar el repositorio:
```
git clone <url_repositorio>
cd centro-apoderados
```

2. Instalar dependencias:
```
npm install
```

3. Configurar la base de datos:
```
createdb centro_apoderados
psql -U usuario -d centro_apoderados -f estructura_bd.sql
```

4. Configurar variables de entorno:
```
cp .env.example .env
# Editar .env con tus credenciales
```

5. Iniciar el servidor:
```
npm run dev
```

## Estructura del Proyecto

- `index.js`: API principal y lógica del backend
- `frontend/`: Aplicación React para el frontend
- `uploads/`: Carpeta para almacenamiento de documentos
- `*.sql`: Scripts de migración de la base de datos

## Guía de Seguridad

- Las contraseñas se almacenan encriptadas con bcrypt
- Autenticación mediante JWT
- Separación estricta de datos entre colegios y cursos
- Registro de auditoría completo de todas las acciones

## Contribución

1. Crear una rama para tu característica (`git checkout -b feature/amazing-feature`)
2. Commit de tus cambios (`git commit -m 'Add some amazing feature'`)
3. Push a la rama (`git push origin feature/amazing-feature`)
4. Crear un Pull Request

## Licencia

Este proyecto está bajo licencia propietaria, todos los derechos reservados.

## Contacto

Centro de Apoderados - [email@example.com](mailto:email@example.com)

## Lógica Principal de Módulos

### Usuarios y Roles
- Describir aquí cómo se gestionan los usuarios, autenticación, roles y permisos.

### Pagos
- Explicar el flujo de registro, validación y seguimiento de pagos.

### Gastos
- Detallar cómo se registran y controlan los gastos.

### Documentos
- Describir el proceso de subida, almacenamiento y acceso a documentos.

### Fechas Importantes
- Explicar cómo se gestionan los eventos y fechas clave.

---

## Endpoints/API (si aplica)

| Método | Endpoint                | Descripción                       |
|--------|-------------------------|-----------------------------------|
| GET    | /api/usuarios           | Listar usuarios                   |
| POST   | /api/login              | Autenticación                     |
| ...    | ...                     | ...                               |

*Completar con los endpoints relevantes del backend.*

---

## Historial de Cambios y Mejoras

- **[YYYY-MM-DD]** Breve descripción del cambio realizado.
- **[2024-06-10]** Ejemplo: Se implementó la subida de documentos PDF.
- **[2024-06-12]** Ejemplo: Se agregó validación de fechas en pagos.

*Agregar aquí cada cambio importante realizado en el sistema.*

---

## Notas Técnicas y Decisiones de Implementación

- Anotar aquí cualquier decisión técnica relevante, problemas encontrados y cómo se resolvieron, o consideraciones para el futuro.

--- 