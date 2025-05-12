// Script para corregir el problema del fondo rojo en la tabla de pagos

// Función que se ejecutará cuando la página esté completamente cargada
document.addEventListener('DOMContentLoaded', function() {
  // La primera ejecución inmediata
  fixRedBackground();
  
  // Luego ejecutar periódicamente para asegurar que se mantiene corregido
  setInterval(fixRedBackground, 100);
  
  // Agregar un observador de mutaciones para detectar cambios en el DOM
  const observer = new MutationObserver(function(mutations) {
    fixRedBackground();
  });
  
  // Comenzar a observar todo el documento para cambios
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class']
  });
});

// Función principal para detectar y corregir elementos con fondo rojo
function fixRedBackground() {
  try {
    // SOLUCIÓN DIRECTA PARA LA TABLA DE PAGOS
    const tableContainer = document.querySelector('.tabla-contenedor');
    if (tableContainer) {
      // Forzar estilos directamente en el contenedor principal
      applyInlineAndImportantStyles(tableContainer, {
        'background-color': 'white',
        'overflow': 'hidden',
        'border-radius': '12px',
        'box-shadow': '0 4px 20px rgba(0, 0, 0, 0.08)',
        'border': '1px solid #e5e7eb'
      });
      
      // Corregir el contenedor de la tabla
      const scrollMainContainer = tableContainer.querySelector('.tabla-scroll-main');
      if (scrollMainContainer) {
        applyInlineAndImportantStyles(scrollMainContainer, {
          'background-color': 'white',
          'overflow-x': 'auto',
          'overflow-y': 'auto'
        });
        
        // Debe haber un contenedor directo que esté causando el problema (el div rojo)
        // Encontrar todos los hijos directos
        const children = scrollMainContainer.children;
        for (let i = 0; i < children.length; i++) {
          const child = children[i];
          
          // Corregir directamente todos los hijos del contenedor principal
          if (child.tagName === 'DIV' || !child.classList.contains('pagos-table')) {
            console.log('Corrigiendo contenedor rojo:', child);
            applyInlineAndImportantStyles(child, {
              'background-color': 'transparent',
              'display': 'block',
              'width': '100%'
            });
          }
          
          // Si encontramos la tabla, aplicamos estilos específicos
          if (child.classList.contains('pagos-table') || child.tagName === 'TABLE') {
            applyInlineAndImportantStyles(child, {
              'width': 'max-content',
              'min-width': '100%',
              'border-collapse': 'separate',
              'border-spacing': '0',
              'background-color': 'transparent'
            });
            
            // Corregir todas las filas
            const rows = child.querySelectorAll('tr');
            rows.forEach(row => {
              applyInlineAndImportantStyles(row, {
                'background-color': 'transparent'
              });
            });
            
            // Corregir celdas según su estado
            applyTableCellStyles(child);
          }
        }
      }
    }
    
    // Encuentre cualquier elemento con fondo rojo en toda la página
    const redElements = findRedBackgroundElements();
    redElements.forEach(el => {
      console.log('Elemento con fondo rojo encontrado:', el);
      el.style.cssText += 'background-color: transparent !important;';
    });
    
  } catch (error) {
    console.error('Error al corregir fondo rojo:', error);
  }
}

// Función para encontrar elementos con fondo rojo
function findRedBackgroundElements() {
  const elements = [];
  const allElements = document.querySelectorAll('*');
  
  allElements.forEach(el => {
    const style = window.getComputedStyle(el);
    const bgColor = style.backgroundColor;
    
    if (isRedColor(bgColor)) {
      elements.push(el);
    }
  });
  
  return elements;
}

// Función para aplicar estilos a las celdas de la tabla según su estado
function applyTableCellStyles(table) {
  // Celdas no sticky
  const regularCells = table.querySelectorAll('td:not(.sticky-col)');
  regularCells.forEach(cell => {
    // Primero aplicar un fondo blanco a todas las celdas
    applyInlineAndImportantStyles(cell, {
      'background-color': 'white',
      'position': 'static'
    });
    
    // Luego aplicar estilos según el estado
    if (cell.classList.contains('pago-completado')) {
      cell.style.cssText += 'background-color: #dcfce7 !important;';
    } else if (cell.classList.contains('pago-atrasado')) {
      cell.style.cssText += 'background-color: #fee2e2 !important;';
    } else if (cell.classList.contains('pago-pendiente')) {
      cell.style.cssText += 'background-color: #fff7ed !important;';
    }
  });
  
  // Celdas sticky
  const stickyCells = table.querySelectorAll('.sticky-col');
  stickyCells.forEach(cell => {
    applyInlineAndImportantStyles(cell, {
      'position': 'sticky',
      'left': '0',
      'background-color': 'white',
      'z-index': '1000'
    });
  });
}

// Función para aplicar estilos inline con !important
function applyInlineAndImportantStyles(element, styles) {
  let styleText = '';
  for (const [property, value] of Object.entries(styles)) {
    styleText += `${property}: ${value} !important; `;
  }
  element.style.cssText += styleText;
}

// Función para determinar si un color es rojo
function isRedColor(color) {
  // Normalizar el color a rgb si viene en formato hex o rgba
  const rgbColor = color.toLowerCase();
  
  // Valores RGB del rojo (255,0,0)
  if (rgbColor.includes('rgb(')) {
    try {
      // Extraer los valores RGB
      const matches = rgbColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (matches) {
        const r = parseInt(matches[1]);
        const g = parseInt(matches[2]);
        const b = parseInt(matches[3]);
        
        // Criterio simple para "rojez": R alto, G y B bajos
        if (r > 200 && g < 100 && b < 100) {
          return true;
        }
      }
    } catch (e) {
      // Si hay un error al parsear, verificar con includes
      return rgbColor.includes('rgb(255, 0, 0)') || 
             rgbColor.includes('rgb(255, 99, 71)') ||
             rgbColor.includes('rgb(239, 68, 68)');
    }
  }
  
  // Verificación de formatos comunes de rojo
  return rgbColor.includes('rgba(255, 0, 0,') ||
         rgbColor === '#ff0000' ||
         rgbColor === 'red';
} 