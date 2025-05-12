/**
 * Script de solución de emergencia para la interfaz de usuario
 * Este script se ejecuta en cada carga de la página para corregir 
 * problemas de UI que puedan surgir en tiempo de ejecución.
 */

(function() {
  console.log('🛠 Script de corrección de emergencia iniciado');
  
  // Variables para detección
  const isMobile = window.innerWidth <= 900;
  
  // Función que se ejecuta después de que el DOM esté cargado
  function fixUI() {
    // 1. Corregir problemas de scroll duplicado
    fixScrollIssues();
    
    // 2. Asegurar que los menús funcionan correctamente según el dispositivo
    setupMenus();
    
    // 3. Agregar detector para cambios de tamaño de ventana
    addResizeHandler();
    
    console.log('✅ Correcciones de UI aplicadas');
  }
  
  // 1. Corregir problemas de scroll
  function fixScrollIssues() {
    // Asegurar que solo hay un scrollbar
    document.documentElement.style.overflowX = 'hidden';
    document.documentElement.style.overflowY = 'auto';
    document.body.style.overflowX = 'hidden';
    document.body.style.overflowY = 'auto';
    
    // Asegurar que la altura es correcta
    document.documentElement.style.height = '100%';
    document.body.style.height = '100%';
    
    // Eliminar clases que podrían estar causando problemas
    document.body.classList.remove('sidebar-open');
    document.documentElement.classList.remove('sidebar-open');
  }
  
  // 2. Configurar menús según el dispositivo
  function setupMenus() {
    if (isMobile) {
      // En móvil: 
      // 1. Ocultar botón hamburguesa de desktop
      const desktopHamburger = document.querySelector('.desktop-hamburger');
      if (desktopHamburger) {
        desktopHamburger.style.display = 'none';
      }
      
      // 2. Asegurar que el SimpleMenu es visible
      setTimeout(() => {
        const mobileMenuContainer = document.querySelector('[style*="position: fixed"][style*="top: 15px"][style*="left: 15px"]');
        if (mobileMenuContainer) {
          mobileMenuContainer.style.display = 'flex';
          mobileMenuContainer.style.zIndex = '10000';
        }
      }, 500);
    } else {
      // En desktop:
      // 1. Asegurar que el botón hamburguesa de desktop es visible
      const desktopHamburger = document.querySelector('.desktop-hamburger');
      if (desktopHamburger) {
        desktopHamburger.style.display = 'flex';
      }
      
      // 2. Ocultar SimpleMenu
      const mobileMenuContainer = document.querySelector('[style*="position: fixed"][style*="top: 15px"][style*="left: 15px"]');
      if (mobileMenuContainer) {
        mobileMenuContainer.style.display = 'none';
      }
      
      // 3. Asegurar que el sidebar de desktop está correctamente posicionado
      const sidebar = document.querySelector('[class*="sidebar"]');
      if (sidebar) {
        sidebar.style.transform = 'translateX(0)';
      }
    }
  }
  
  // 3. Agregar detector para cambios de tamaño de ventana
  function addResizeHandler() {
    window.addEventListener('resize', function() {
      const newIsMobile = window.innerWidth <= 900;
      
      // Solo aplicar cambios si hubo cambio de tamaño significativo
      if (newIsMobile !== isMobile) {
        console.log('🔄 Cambio de tamaño detectado, ajustando UI');
        setupMenus();
      }
    });
  }
  
  // Ejecutar correcciones después de que el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixUI);
  } else {
    fixUI();
  }
  
  // También ejecutar después de que todos los recursos estén cargados
  window.addEventListener('load', function() {
    // Esperar un momento para asegurar que todos los componentes React estén montados
    setTimeout(fixUI, 1000);
  });
})(); 