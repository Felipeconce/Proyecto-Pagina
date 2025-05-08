/**
 * ScrollSync - Módulo para sincronizar barras de desplazamiento horizontal
 * Permite que dos contenedores se desplacen de manera sincronizada
 */

// Configurar las barras de desplazamiento sincronizadas
export const setupScrollSync = (topScrollRef, mainScrollRef) => {
  if (!topScrollRef?.current || !mainScrollRef?.current) return null;
  
  const topScroll = topScrollRef.current;
  const mainScroll = mainScrollRef.current;
  
  // Manejador para cuando se desplaza la barra superior
  const handleTopScroll = () => {
    if (mainScroll) {
      mainScroll.scrollLeft = topScroll.scrollLeft;
    }
  };
  
  // Manejador para cuando se desplaza la barra principal
  const handleMainScroll = () => {
    if (topScroll) {
      topScroll.scrollLeft = mainScroll.scrollLeft;
    }
  };
  
  // Añadir oyentes de eventos
  topScroll.addEventListener('scroll', handleTopScroll);
  mainScroll.addEventListener('scroll', handleMainScroll);
  
  // Devolver una función de limpieza para eliminar los oyentes
  return () => {
    topScroll.removeEventListener('scroll', handleTopScroll);
    mainScroll.removeEventListener('scroll', handleMainScroll);
  };
};

// Aplicar estilos para que las celdas reflejen su estado correcto
export const fixStickyColumn = () => {
  try {
    // Primero, obtener todas las celdas con la clase sticky-col
    const stickyCells = document.querySelectorAll('.sticky-col');
    
    // Recorrer cada celda y aplicar estilos directamente
    stickyCells.forEach(cell => {
      // NO eliminar las clases de estado, solo asegurar que la celda tiene los estilos sticky correctos
      
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
    
    // Asegurar que las celdas normales (no sticky) mantengan sus estilos originales
    const normalCells = document.querySelectorAll('.pagos-table td:not(.sticky-col), .pagos-table th:not(.sticky-col)');
    normalCells.forEach(cell => {
      // Eliminar cualquier estilo sticky
      cell.style.position = 'static';
      cell.style.left = 'auto';
      cell.style.zIndex = '1';
      
      // Restablecer box-shadow y border-right
      cell.style.boxShadow = 'none';
      
      // Asegurarse de que mantiene sus clases de estado
      if (cell.classList.contains('pago-completado')) {
        cell.style.backgroundColor = '#dcfce7';
      } else if (cell.classList.contains('pago-atrasado')) {
        cell.style.backgroundColor = '#fee2e2';
      } else if (cell.classList.contains('pago-pendiente')) {
        cell.style.backgroundColor = '#fff7ed';
      }
    });
    
    console.log('Estilos de columna fija aplicados correctamente');
  } catch (error) {
    console.error('Error al aplicar estilos a la columna fija:', error);
  }
};

// Exportar funciones útiles
export default {
  setupScrollSync,
  fixStickyColumn
};
