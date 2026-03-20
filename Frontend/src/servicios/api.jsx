// Use production API URL
export const API_URL = 'https://karmaapi-z51n.onrender.com'; // URL de producción fija
export const API_PREFIX = '/api/';

// Constantes para versión móvil
export const MOBILE_HEADERS = {
  'Content-Type': 'application/json',
  'X-Device-Type': 'mobile',
  'X-Request-Priority': 'high',
  'Accept-Encoding': 'gzip'
};

// Headers estándar para todas las peticiones
export const STANDARD_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

// Detecta si estamos en un dispositivo móvil
export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Función utilitaria para realizar solicitudes autenticadas
export const authedFetch = async (url, options = {}) => {
  try {
    // Obtener usuario del localStorage
    const storedUser = localStorage.getItem('karmaUser');
    let token = null;
    
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        token = user.token;
      } catch (error) {
        console.error("Error al recuperar token de autenticación:", error);
      }
    }
    
    // Determinar qué encabezados usar
    const baseHeaders = isMobileDevice() ? MOBILE_HEADERS : STANDARD_HEADERS;
    
    // Agregar token de autenticación si existe
    const headers = {
      ...baseHeaders,
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    };
    
    // Crear opciones finales para fetch
    const fetchOptions = {
      ...options,
      headers,
    };
    
    // Agregar timeout para evitar esperas infinitas
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || 10000);
    fetchOptions.signal = controller.signal;
    
    // Realizar solicitud
    const response = await fetch(url, fetchOptions);
    
    clearTimeout(timeoutId);
    
    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('La solicitud ha excedido el tiempo límite. Intenta más tarde.');
    }
    throw error;
  }
};

// Función de login que se comunica con el backend
export const loginUsuario = async (correo, contraseña) => {
  try {
    // Configuración de la solicitud con timeout para evitar esperas infinitas
    const response = await fetch(`${API_URL}${API_PREFIX}auth/login`, {
      method: 'POST',
      headers: isMobileDevice() ? MOBILE_HEADERS : STANDARD_HEADERS,
      body: JSON.stringify({
        correo: correo,
        password: contraseña  // Mantenemos "password" porque el backend espera este nombre en la solicitud
      }),
      timeout: 15000 // 15 segundos timeout
    });
    
    // Manejar respuestas de error
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error al iniciar sesión (${response.status})`);
    }
    
    // Parsear la respuesta exitosa
    const data = await response.json();
    
    // Verificar que la respuesta tenga la estructura esperada
    if (!data.usuario) {
      throw new Error('Formato de respuesta inválido del servidor');
    }
    
    return data;
  } catch (error) {
    console.error("Error en login:", error);
    
    // Manejo específico para diferentes tipos de errores
    if (error.name === 'AbortError') {
      throw new Error('La conexión con el servidor está tomando demasiado tiempo. Intenta más tarde.');
    }
    
    if (error.message && error.message.includes('Failed to fetch')) {
      throw new Error('No se pudo conectar con el servidor. Verifica tu conexión a internet.');
    }
    
    // Propagar el error original
    throw error;
  }
};

// Función para registrar usuario
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

// Función para obtener datos del perfil del usuario
export const obtenerPerfil = async (userId) => {
  try {
    const response = await authedFetch(`${API_URL}${API_PREFIX}auth/profile?id=${userId}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al obtener perfil');
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error al obtener perfil:", error);
    throw error;
  }
};

// Función para cerrar sesión
export const logoutUsuario = async () => {
  try {
    // No implementado en el backend actual, pero preparado para futuras mejoras
    // Simplemente limpiaremos los datos localmente por ahora
    return { success: true };
  } catch (error) {
    console.error("Error en logout:", error);
    return { success: false, error: error.message };
  }
};

// Funciones de Productos
export const agregarProd = async (producto) => {
  const response = await authedFetch(`${API_URL}${API_PREFIX}productos`, {
    method: 'POST',
    body: JSON.stringify(producto)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `Error al agregar producto (${response.status})`);
  }
  
  return await response.json();
};

export const modificarProd = async (id, producto) => {
  const response = await authedFetch(`${API_URL}${API_PREFIX}productos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(producto)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `Error al modificar producto (${response.status})`);
  }
  
  return await response.json();
};

export const eliminarProd = async (id) => {
  const response = await authedFetch(`${API_URL}${API_PREFIX}productos/${id}`, {
    method: 'DELETE'
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `Error al eliminar producto (${response.status})`);
  }
  
  return { success: true };
};

// Función para obtener usuarios
export const obtenerUser = async () => {
  try {
    const response = await authedFetch(`${API_URL}${API_PREFIX}usuarios`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error al obtener usuarios (${response.status})`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    throw error;
  }
};

// Funciones de Carrito con autenticación mejorada
export const agregarCarrito = async (usuarioId, productoId, cantidad) => {
  try {
    const response = await authedFetch(`${API_URL}${API_PREFIX}carrito/add`, {
      method: 'POST',
      body: JSON.stringify({ 
        usuario_id: usuarioId, 
        producto_id: productoId, 
        cantidad 
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error al agregar al carrito (${response.status})`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error al agregar al carrito:", error);
    throw error;
  }
};

export const modificarCarrito = async (usuarioId, productoId, cantidad) => {
  try {
    const response = await authedFetch(`${API_URL}${API_PREFIX}carrito/${usuarioId}/${productoId}`, {
      method: 'PUT',
      body: JSON.stringify({ cantidad })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error al modificar carrito (${response.status})`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error al modificar carrito:", error);
    throw error;
  }
};

export const eliminarCarrito = async (usuarioId, productoId) => {
  try {
    const response = await authedFetch(`${API_URL}${API_PREFIX}carrito/${usuarioId}/${productoId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error al eliminar del carrito (${response.status})`);
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar del carrito:", error);
    throw error;
  }
};

// Función mejorada con autenticación robusta
export const mostrarCarrito = async (usuarioId) => {
  try {
    // Usar authedFetch para incluir automáticamente el token
    const response = await authedFetch(`${API_URL}${API_PREFIX}carrito/usuario/${usuarioId}`, {
      timeout: isMobileDevice() ? 8000 : 10000 // timeout menor para móviles
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error al obtener carrito (${response.status})`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error al mostrar el carrito:", error);
    return { items: [], total: 0 }; // Valor por defecto en caso de error
  }
};

// Función de Ventas con autenticación
export const crearVenta = async (usuarioId, productos) => {
  try {
    const response = await authedFetch(`${API_URL}${API_PREFIX}ventas`, {
      method: 'POST',
      body: JSON.stringify({
        usuario_id: usuarioId,
        productos: productos
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error al crear venta (${response.status})`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error al crear venta:", error);
    throw error;
  }
};

// Función para procesar pagos
export const procesarPago = async (pagoData) => {
  try {
    const response = await authedFetch(`${API_URL}${API_PREFIX}pagos`, {
      method: 'POST',
      body: JSON.stringify(pagoData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error al procesar el pago (${response.status})`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error al procesar el pago:", error);
    throw error;
  }
};

// Función para procesar pagos divididos/mixtos
export const procesarPagoDividido = async (pagosData) => {
  try {
    const response = await authedFetch(`${API_URL}${API_PREFIX}pagos/split`, {
      method: 'POST',
      body: JSON.stringify(pagosData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error al procesar pagos divididos (${response.status})`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error al procesar pagos divididos:", error);
    throw error;
  }
};