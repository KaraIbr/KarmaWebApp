// Script para probar la API local de Karma
const fetch = require('node-fetch');

// URL de la API local
const API_URL = 'http://localhost:5000';
const API_PREFIX = 'api/';

// ID de usuario para pruebas
const USUARIO_ID = 1; // Cambiar por un ID válido si es necesario

// Función auxiliar para realizar peticiones
async function makeRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    console.log(`Realizando petición ${method} a ${API_URL}${endpoint}`);
    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json();
    console.log('Respuesta:');
    console.log(JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error(`Error en petición a ${endpoint}:`, error);
    throw error;
  }
}

// Pruebas
async function runTests() {
  console.log('========== INICIANDO PRUEBAS DE LA API ==========');
  
  try {
    // 1. Obtener carrito general
    console.log('\n1. Obtener carrito general:');
    await makeRequest(`${API_PREFIX}carrito`);
    
    // 2. Obtener carrito de un usuario específico
    console.log('\n2. Obtener carrito de un usuario específico:');
    await makeRequest(`${API_PREFIX}carrito/usuario/${USUARIO_ID}`);
    
    // 3. Agregar un producto al carrito
    console.log('\n3. Agregar un producto al carrito:');
    await makeRequest(`${API_PREFIX}carrito`, 'POST', {
      producto_id: 1, // Cambiar por un ID válido
      cantidad: 1,
      cliente_id: USUARIO_ID
    });
    
    // 4. Obtener carrito de usuario después de agregar
    console.log('\n4. Obtener carrito de usuario después de agregar:');
    await makeRequest(`${API_PREFIX}carrito/usuario/${USUARIO_ID}`);
    
    // 5. Vaciar el carrito del usuario
    console.log('\n5. Vaciar el carrito del usuario:');
    await makeRequest(`${API_PREFIX}carrito/vaciar`, 'DELETE', {
      cliente_id: USUARIO_ID
    });
    
    // 6. Verificar que el carrito está vacío
    console.log('\n6. Verificar que el carrito está vacío:');
    await makeRequest(`${API_PREFIX}carrito/usuario/${USUARIO_ID}`);
    
    console.log('\n========== PRUEBAS COMPLETADAS ==========');
  } catch (error) {
    console.error('Error en las pruebas:', error);
  }
}

// Ejecutar las pruebas
runTests();
