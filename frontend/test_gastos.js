// Script para probar la conexión con el endpoint de gastos
const fetch = require('node-fetch');
const fs = require('fs');
require('dotenv').config();

// URL del API
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Datos de prueba
const testGasto = {
  curso_id: 1,
  descripcion: 'Gasto de prueba',
  monto: 10000,
  fecha: '2023-05-10',
  usuario_id: 1,
  usuario_nombre: 'Usuario de prueba',
  rol_id: 3,
  colegio_id: 1
};

// Función para obtener un token válido desde localStorage
function getToken() {
  try {
    // Intenta leer las variables de entorno primero
    if (process.env.TEST_TOKEN) {
      return process.env.TEST_TOKEN;
    }
    
    console.log('Por favor, proporciona un token válido manualmente:');
    console.log('1. Abre la aplicación en el navegador');
    console.log('2. Inicia sesión si es necesario');
    console.log('3. Abre las herramientas de desarrollador (F12)');
    console.log('4. Ve a Aplicación > Almacenamiento local');
    console.log('5. Copia el valor del token');
    console.log('6. Pégalo y presiona Enter');
    
    // Lee el token desde la entrada estándar (esto es interactivo)
    // Esta es una operación síncrona, pero para fines de prueba está bien
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    return new Promise((resolve) => {
      readline.question('Token: ', (token) => {
        readline.close();
        resolve(token);
      });
    });
  } catch (error) {
    console.error('Error al obtener el token:', error);
    return 'token_de_prueba';
  }
}

async function testAddGasto() {
  try {
    const token = await getToken();
    if (!token || token === 'token_de_prueba') {
      console.error('No se pudo obtener un token válido');
      return;
    }
    
    console.log('Intentando agregar un gasto de prueba...');
    console.log('URL:', `${API_URL}/gastos`);
    console.log('Datos:', JSON.stringify(testGasto, null, 2));
    
    const response = await fetch(`${API_URL}/gastos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testGasto)
    });
    
    const responseData = await response.json();
    
    if (response.ok) {
      console.log('Éxito! Gasto creado:', responseData);
    } else {
      console.error('Error al crear gasto:', responseData);
    }
    
    console.log('Status:', response.status);
    console.log('Respuesta completa:', responseData);
  } catch (error) {
    console.error('Error de red:', error);
  }
}

// Ejecutar la prueba
testAddGasto(); 