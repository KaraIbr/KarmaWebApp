// Use environment variables for API URL, with fallback for development
const API_URL = process.env.REACT_APP_API_URL || 'https://karma-webapp.onrender.com'; // Removido el slash final
const API_PREFIX = '/api/';  // Agregado slash inicial para asegurar la correcta formación de la URL

// Funciones de autenticación
export const loginUsuario = async (correo, contraseña) => {
  const response = await fetch(`${API_URL}${API_PREFIX}auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      correo: correo, // Corregido el nombre del campo para que coincida con el backend
      password: contraseña
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error al iniciar sesión');
  }
  
  return await response.json();
};

export const registrarUsuario = async (usuario) => {
  const response = await fetch(`${API_URL}${API_PREFIX}auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(usuario)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error al registrar usuario');
  }
  
  return await response.json();
};

export const obtenerPerfil = async (userId) => {
  const response = await fetch(`${API_URL}${API_PREFIX}auth/profile?id=${userId}`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error al obtener perfil');
  }
  
  return await response.json();
};

// Funciones de Productos
export const agregarProd = async (producto) => {
  const response = await fetch(`${API_URL}${API_PREFIX}productos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(producto)
  });
  return await response.json();
};

export const modificarProd = async (id, producto) => {
  const response = await fetch(`${API_URL}${API_PREFIX}productos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(producto)
  });
  return await response.json();
};

export const eliminarProd = async (id) => {
  await fetch(`${API_URL}${API_PREFIX}productos/${id}`, {
    method: 'DELETE'
  });
};

// Función de Usuarios
export const obtenerUser = async (credentials) => {
  try {
    const response = await fetch(`${API_URL}${API_PREFIX}usuarios`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error al obtener usuarios (${response.status})`);
    }
    
    const users = await response.json();
    return users.find(u => 
      u.correo === credentials.correo && 
      u.contraseña === credentials.contraseña
    );
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    throw error;
  }
};

// Funciones de Carrito
export const agregarCarrito = async (usuarioId, productoId, cantidad) => {
  const response = await fetch(`${API_URL}${API_PREFIX}carrito/${usuarioId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ producto_id: productoId, cantidad })
  });
  return await response.json();
};

export const modificarCarrito = async (usuarioId, productoId, cantidad) => {
  const response = await fetch(`${API_URL}${API_PREFIX}carrito/${usuarioId}/${productoId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cantidad })
  });
  return await response.json();
};

export const eliminarCarrito = async (usuarioId, productoId) => {
  await fetch(`${API_URL}${API_PREFIX}carrito/${usuarioId}/${productoId}`, {
    method: 'DELETE'
  });
};

export const mostrarCarrito = async (usuarioId) => {
  const response = await fetch(`${API_URL}${API_PREFIX}carrito/${usuarioId}`);
  return await response.json();
};

// Función de Ventas
export const crearVenta = async (usuarioId, productos) => {
  const response = await fetch(`${API_URL}${API_PREFIX}ventas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      usuario_id: usuarioId,
      productos: productos
    })
  });
  return await response.json();
};