// Script optimizado para corregir el fondo rojo sin afectar el rendimiento

// Variables para controlar la frecuencia de ejecución
let isRunning = false;
let pendingExecution = false;
let lastExecutionTime = 0;
const MIN_INTERVAL = 500; // Mínimo 500ms entre ejecuciones

// Función principal para detectar y corregir elementos con fondo rojo
function fixRedBackground() {
  // Evitar ejecuciones simultáneas
  if (isRunning) {
    pendingExecution = true;
    return;
  }
  
  // Controlar frecuencia
  const now = Date.now();
  if (now - lastExecutionTime < MIN_INTERVAL) {
    setTimeout(fixRedBackground, MIN_INTERVAL - (now - lastExecutionTime));
    return;
  }
  
  isRunning = true;
  lastExecutionTime = now;
  
  try {
    // Buscar el contenedor principal de la tabla
    const tableContainer = document.querySelector('.tabla-contenedor');
    if (tableContainer) {
      // Corregir contenedor principal
      tableContainer.style.backgroundColor = 'white';
      
      // Corregir el div con scroll
      const scrollContainer = tableContainer.querySelector('.tabla-scroll-main');
      if (scrollContainer) {
        scrollContainer.style.backgroundColor = 'white';
        
        // Buscar cualquier hijo directo y corregirlo
        Array.from(scrollContainer.children).forEach(child => {
          if (child.tagName === 'DIV' || !child.classList.contains('pagos-table')) {
            child.style.backgroundColor = 'transparent';
          }
        });
      }
      
      // Corregir la tabla y celdas
      const table = tableContainer.querySelector('.pagos-table');
      if (table) {
        table.style.backgroundColor = 'transparent';
        
        // Aplicar los colores correctos a las celdas
        table.querySelectorAll('td').forEach(cell => {
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
        
        // Asegurar que los encabezados sean correctos
        table.querySelectorAll('th').forEach(header => {
          if (header.classList.contains('sticky-col')) {
            header.style.backgroundColor = '#f1f5f9';
          } else {
            header.style.backgroundColor = '#f1f5f9';
          }
        });
      }
    }
  } catch (error) {
    console.error('Error al aplicar corrección:', error);
  } finally {
    isRunning = false;
    
    // Si hay una ejecución pendiente, programar la siguiente
    if (pendingExecution) {
      pendingExecution = false;
      setTimeout(fixRedBackground, MIN_INTERVAL);
    }
  }
}

// Ejecutar la corrección cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  // Primera ejecución tras 100ms para asegurar que la página ha cargado
  setTimeout(fixRedBackground, 100);
  
  // Ejecutar en intervalos razonables
  setInterval(fixRedBackground, 2000);
  
  // También ejecutar cuando el usuario interactúe con la página
  document.addEventListener('click', function() {
    setTimeout(fixRedBackground, 100);
  });
  
  // Observar cambios en la estructura del DOM, pero limitando las llamadas
  const observer = new MutationObserver(function(mutations) {
    if (!isRunning && Date.now() - lastExecutionTime > MIN_INTERVAL) {
      setTimeout(fixRedBackground, 100);
    } else {
      pendingExecution = true;
    }
  });
  
  // Observar solo cambios relevantes para evitar bucles infinitos
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false
  });
}); 