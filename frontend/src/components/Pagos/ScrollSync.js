/**
 * ScrollSync - Módulo para sincronizar barras de desplazamiento horizontal
 * Permite que dos contenedores se desplacen de manera sincronizada
 */

// Función para sincronizar las barras de desplazamiento entre dos elementos
export const setupScrollSync = (topScrollRef, mainScrollRef) => {
  if (!topScrollRef?.current || !mainScrollRef?.current) {
    return () => {}; // No-op si las referencias no existen
  }

  const topScrollEl = topScrollRef.current;
  const mainScrollEl = mainScrollRef.current;

  // Función para sincronizar el desplazamiento horizontal
  const handleScroll = (e) => {
    const scrollingEl = e.target;
    
    if (scrollingEl === topScrollEl) {
      mainScrollEl.scrollLeft = scrollingEl.scrollLeft;
    } else if (scrollingEl === mainScrollEl) {
      topScrollEl.scrollLeft = scrollingEl.scrollLeft;
    }
  };

  // Añadir event listeners
  topScrollEl.addEventListener('scroll', handleScroll);
  mainScrollEl.addEventListener('scroll', handleScroll);

  // Devolver función de limpieza
  return () => {
    topScrollEl.removeEventListener('scroll', handleScroll);
    mainScrollEl.removeEventListener('scroll', handleScroll);
  };
};

// Aplicar estilos para que las celdas reflejen su estado correcto
export const fixStickyColumn = () => {
  try {
    // Asegurarse de que la tabla misma no tenga fondo rojo
    const table = document.querySelector('.pagos-table');
    if (table) {
      table.style.backgroundColor = 'transparent';
      
      // Limpiar todos los fondos de filas
      const allRows = table.querySelectorAll('tr');
      allRows.forEach(row => {
        row.style.backgroundColor = 'transparent';
      });
    }
    
    // Primero, obtener todas las celdas con la clase sticky-col
    const stickyCells = document.querySelectorAll('.pagos-table .sticky-col');
    
    // Recorrer cada celda y aplicar estilos directamente
    stickyCells.forEach(cell => {
      // Aplicar estilos inline para garantizar que se apliquen
      cell.style.position = 'sticky';
      cell.style.left = '0';
      
      // Solo aplicar fondo blanco a las celdas TD (no a los encabezados TH)
      if (cell.tagName === 'TD') {
        cell.style.backgroundColor = 'white';
      } else {
        cell.style.backgroundColor = '#f1f5f9'; // Color de fondo para encabezados
      }
      
      cell.style.zIndex = cell.tagName === 'TH' ? '1001' : '1000';
      cell.style.boxShadow = '4px 0 8px -4px rgba(0, 0, 0, 0.15)';
      cell.style.borderRight = '2px solid #e5e7eb';
    });
    
    // Configurar estilos para todas las celdas TD que no son sticky
    const allCells = document.querySelectorAll('.pagos-table td:not(.sticky-col)');
    allCells.forEach(cell => {
      // Eliminar completamente todos los estilos inline antes de aplicar nuevos
      cell.removeAttribute('style');
      
      // Aplicar estilos básicos
      cell.style.position = 'static';
      cell.style.left = 'auto';
      cell.style.zIndex = '1';
      cell.style.boxShadow = 'none';
      
      // Fondo por defecto debe ser blanco
      cell.style.backgroundColor = 'white';
      
      // Asegurarse de que mantiene sus clases de estado
      if (cell.classList.contains('pago-completado')) {
        cell.style.backgroundColor = '#dcfce7';
      } else if (cell.classList.contains('pago-atrasado')) {
        cell.style.backgroundColor = '#fee2e2';
      } else if (cell.classList.contains('pago-pendiente')) {
        cell.style.backgroundColor = '#fff7ed';
      }
    });
    
    // Configurar ancho adecuado para la tabla
    if (table) {
      const columns = table.querySelector('thead tr').childElementCount;
      // Calcular ancho total necesario: columna alumno (200px) + resto de columnas (120px cada una)
      const totalWidth = 200 + ((columns - 1) * 120);
      table.style.width = `${Math.max(totalWidth, 1800)}px`;
    }
  } catch (error) {
    console.error("Error al aplicar estilos fijos:", error);
  }
};

// Exportar funciones útiles
export default {
  setupScrollSync,
  fixStickyColumn
};
