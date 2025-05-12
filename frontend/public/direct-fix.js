// Script de solución directa para el fondo rojo

// Ejecutar una vez que el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  // Aplicar inmediatamente
  applyDirectFix();
  
  // Aplicar continuamente
  setInterval(applyDirectFix, 50);
});

function applyDirectFix() {
  // Apuntar directamente al contenedor problemático
  // Hay un div dentro de .tabla-scroll-main que está causando el problema
  const tableMain = document.querySelector('.tabla-scroll-main');
  if (tableMain) {
    // Forzar el color de fondo
    tableMain.style.backgroundColor = 'white';
    
    // Buscar cualquier div hijo directo y cambiarlo a transparente
    const children = tableMain.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child.tagName === 'DIV') {
        // Este es probablemente el div con fondo rojo
        child.style.backgroundColor = 'transparent';
        console.log('Sobrescribiendo div con posible fondo rojo:', child);
      }
    }
  }
  
  // Atacar directamente a la tabla
  const table = document.querySelector('.pagos-table');
  if (table) {
    // Cambiar el fondo a transparente
    table.style.backgroundColor = 'transparent';
    
    // Corregir el fondo de las celdas
    const cells = table.querySelectorAll('td');
    cells.forEach(cell => {
      if (cell.classList.contains('sticky-col')) {
        cell.style.backgroundColor = 'white';
      } else if (cell.classList.contains('pago-completado')) {
        cell.style.backgroundColor = '#dcfce7';
      } else if (cell.classList.contains('pago-atrasado')) {
        cell.style.backgroundColor = '#fee2e2';
      } else if (cell.classList.contains('pago-pendiente')) {
        cell.style.backgroundColor = '#fff7ed';
      } else {
        cell.style.backgroundColor = 'white';
      }
    });
  }
} 