// Use environment variables for API URL, with fallback for development
const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000/';

// Funciones de autenticación
export const loginUsuario = async (correo, contraseña) => {
  const response = await fetch(`${API_URL}usuarios/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: correo,
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
  const response = await fetch(`${API_URL}usuarios/auth/register`, {
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
  const response = await fetch(`${API_URL}usuarios/auth/profile?id=${userId}`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error al obtener perfil');
  }
  
  return await response.json();
};

// Funciones de Productos
export const agregarProd = async (producto) => {
  const response = await fetch(`${API_URL}productos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(producto)
  });
  return await response.json();
};

export const modificarProd = async (id, producto) => {
  const response = await fetch(`${API_URL}productos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(producto)
  });
  return await response.json();
};

export const eliminarProd = async (id) => {
  await fetch(`${API_URL}productos/${id}`, {
    method: 'DELETE'
  });
};

// Función de Usuarios
export const obtenerUser = async (credentials) => {
  const response = await fetch(`${API_URL}usuarios`);
  const users = await response.json();
  return users.find(u => 
    u.correo === credentials.correo && 
    u.contraseña === credentials.contraseña
  );
};

// Funciones de Carrito
export const agregarCarrito = async (usuarioId, productoId, cantidad) => {
  const response = await fetch(`${API_URL}carrito/${usuarioId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ producto_id: productoId, cantidad })
  });
  return await response.json();
};

export const modificarCarrito = async (usuarioId, productoId, cantidad) => {
  const response = await fetch(`${API_URL}carrito/${usuarioId}/${productoId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cantidad })
  });
  return await response.json();
};

export const eliminarCarrito = async (usuarioId, productoId) => {
  await fetch(`${API_URL}carrito/${usuarioId}/${productoId}`, {
    method: 'DELETE'
  });
};

export const mostrarCarrito = async (usuarioId) => {
  const response = await fetch(`${API_URL}carrito/${usuarioId}`);
  return await response.json();
};

// Función de Ventas
export const crearVenta = async (usuarioId, productos) => {
  const response = await fetch(`${API_URL}ventas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      usuario_id: usuarioId,
      productos: productos
    })
  });
  return await response.json();
};