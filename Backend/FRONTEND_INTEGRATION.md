# Instrucciones para el Frontend - Integración con Karma API

## Información General

- **URL Base de la API**: `https://karmaapi-z51n.onrender.com/api`
- **Estado**: Producción
- **Versión**: 1.0.0
- **Formato de datos**: JSON

## Configuración Inicial

1. **Configuración CORS**: La API acepta solicitudes de los siguientes orígenes:
   - `https://karma-front.vercel.app` (Producción)
   - `http://localhost:3000` (Desarrollo local)

2. **Headers requeridos**:
   - Para enviar datos: `Content-Type: application/json`
   - Para recibir datos: `Accept: application/json`

## Flujo de Compra

El proceso de compra en Karma sigue estos pasos:

### 1. Visualización de Productos

**Endpoint**: `GET /productos`

```javascript
// Ejemplo en React con Fetch API
const fetchProductos = async () => {
  try {
    const response = await fetch('https://karmaapi-z51n.onrender.com/api/productos');
    if (!response.ok) throw new Error('Error al cargar productos');
    const productos = await response.json();
    setProductos(productos); // Guardar en estado
  } catch (error) {
    console.error("Error:", error);
    setError('No se pudieron cargar los productos');
  }
};
```

### 2. Manejo del Carrito

#### Agregar productos al carrito

**Endpoint**: `POST /carrito/agregar`

```javascript
// Ejemplo de agregar al carrito
const agregarAlCarrito = async (productoId, cantidad) => {
  try {
    const response = await fetch('https://karmaapi-z51n.onrender.com/api/carrito/agregar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        producto_id: productoId,
        cantidad: cantidad,
        cliente_id: 1 // ID del cliente actual (si está disponible)
      })
    });
    
    if (!response.ok) throw new Error('Error al agregar al carrito');
    const resultado = await response.json();
    
    // Actualizar estado local o mostrar notificación
    mostrarNotificacion('Producto agregado al carrito');
    
  } catch (error) {
    console.error("Error:", error);
    setError('No se pudo agregar el producto al carrito');
  }
};
```

#### Consultar el carrito

**Endpoint**: `GET /carrito/{cliente_id}`

```javascript
// Ejemplo de consultar carrito
const consultarCarrito = async (clienteId = 1) => {
  try {
    const response = await fetch(`https://karmaapi-z51n.onrender.com/api/carrito/${clienteId}`);
    if (!response.ok) throw new Error('Error al cargar el carrito');
    const carrito = await response.json();
    
    // Guardar en estado
    setCarrito(carrito.items);
    setTotal(carrito.total);
    
  } catch (error) {
    console.error("Error:", error);
    setError('No se pudo cargar el carrito');
  }
};
```

#### Actualizar cantidad de un producto

**Endpoint**: `PUT /carrito/{id}/cantidad`

```javascript
// Ejemplo de actualizar cantidad
const actualizarCantidad = async (itemId, nuevaCantidad) => {
  try {
    const response = await fetch(`https://karmaapi-z51n.onrender.com/api/carrito/${itemId}/cantidad`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cantidad: nuevaCantidad
      })
    });
    
    if (!response.ok) throw new Error('Error al actualizar cantidad');
    
    // Actualizar carrito después de cambiar cantidad
    consultarCarrito();
    
  } catch (error) {
    console.error("Error:", error);
    setError('No se pudo actualizar la cantidad');
  }
};
```

#### Eliminar producto del carrito

**Endpoint**: `DELETE /carrito/{id}`

```javascript
// Ejemplo de eliminar producto del carrito
const eliminarDelCarrito = async (itemId) => {
  try {
    const response = await fetch(`https://karmaapi-z51n.onrender.com/api/carrito/${itemId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) throw new Error('Error al eliminar del carrito');
    
    // Actualizar carrito después de eliminar
    consultarCarrito();
    
  } catch (error) {
    console.error("Error:", error);
    setError('No se pudo eliminar el producto del carrito');
  }
};
```

### 3. Proceso de Checkout

#### Crear una venta

**Endpoint**: `POST /ventas`

```javascript
// Ejemplo de crear una venta
const crearVenta = async (carritoItems, clienteId = 1, usuarioId = 2) => {
  try {
    // Preparar los datos de la venta
    const ventaData = {
      cliente_id: clienteId,
      usuario_id: usuarioId,
      items: carritoItems,      // Array de items del carrito
      actualizar_inventario: true,
      vaciar_carrito: true
    };
    
    const response = await fetch('https://karmaapi-z51n.onrender.com/api/ventas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ventaData)
    });
    
    if (!response.ok) throw new Error('Error al crear la venta');
    const venta = await response.json();
    
    // Guardar el ID de la venta para el proceso de pago
    return venta.venta.id;
    
  } catch (error) {
    console.error("Error:", error);
    setError('No se pudo crear la venta');
    return null;
  }
};
```

#### Registrar un pago

**Endpoint**: `POST /pagos`

```javascript
// Ejemplo de registrar pago
const registrarPago = async (ventaId, metodoPago, monto) => {
  try {
    const pagoData = {
      venta_id: ventaId,
      metodo_pago: metodoPago,  // 'efectivo', 'tarjeta', etc.
      monto: monto,
      referencia: `Pago por venta #${ventaId}`
    };
    
    const response = await fetch('https://karmaapi-z51n.onrender.com/api/pagos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pagoData)
    });
    
    if (!response.ok) throw new Error('Error al procesar el pago');
    const pago = await response.json();
    
    return true; // Pago exitoso
    
  } catch (error) {
    console.error("Error:", error);
    setError('No se pudo procesar el pago');
    return false;
  }
};
```

#### Pago dividido (múltiples métodos)

**Endpoint**: `POST /pagos/split`

```javascript
// Ejemplo de pago dividido
const registrarPagoDividido = async (ventaId, pagos) => {
  try {
    const pagoData = {
      venta_id: ventaId,
      pagos: pagos // Array de objetos {metodo_pago, monto, referencia}
    };
    
    const response = await fetch('https://karmaapi-z51n.onrender.com/api/pagos/split', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pagoData)
    });
    
    if (!response.ok) throw new Error('Error al procesar los pagos');
    const resultado = await response.json();
    
    return resultado.total_procesado === ventaTotalMonto; // Verificar si se pagó todo
    
  } catch (error) {
    console.error("Error:", error);
    setError('No se pudieron procesar los pagos divididos');
    return false;
  }
};
```

### 4. Flujo Completo (Función Integrada)

```javascript
// Ejemplo de flujo completo de compra
const procesarCompra = async (clienteId, metodoPago) => {
  try {
    // 1. Obtener carrito actual
    const carritoResponse = await fetch(`https://karmaapi-z51n.onrender.com/api/carrito/${clienteId}`);
    if (!carritoResponse.ok) throw new Error('Error al cargar el carrito');
    const carrito = await carritoResponse.json();
    
    if (carrito.items.length === 0) {
      setError('El carrito está vacío');
      return false;
    }
    
    // 2. Crear la venta
    const ventaData = {
      cliente_id: clienteId,
      usuario_id: 2, // ID del vendedor (ajustar según corresponda)
      items: carrito.items,
      actualizar_inventario: true,
      vaciar_carrito: true
    };
    
    const ventaResponse = await fetch('https://karmaapi-z51n.onrender.com/api/ventas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ventaData)
    });
    
    if (!ventaResponse.ok) throw new Error('Error al crear la venta');
    const venta = await ventaResponse.json();
    const ventaId = venta.venta.id;
    
    // 3. Procesar el pago
    const pagoData = {
      venta_id: ventaId,
      metodo_pago: metodoPago,
      monto: venta.venta.total,
      referencia: `Pago venta #${ventaId}`
    };
    
    const pagoResponse = await fetch('https://karmaapi-z51n.onrender.com/api/pagos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pagoData)
    });
    
    if (!pagoResponse.ok) throw new Error('Error al procesar el pago');
    
    // 4. Redirigir a confirmación y mostrar detalles
    navigate('/confirmacion', { 
      state: { 
        ventaId: ventaId, 
        total: venta.venta.total 
      } 
    });
    
    return true;
    
  } catch (error) {
    console.error("Error:", error);
    setError('Error en el proceso de compra: ' + error.message);
    return false;
  }
};
```

## Consultas y Verificaciones

### Verificar estado de una venta

**Endpoint**: `GET /ventas/{venta_id}`

```javascript
// Ejemplo de consultar estado de venta
const consultarVenta = async (ventaId) => {
  try {
    const response = await fetch(`https://karmaapi-z51n.onrender.com/api/ventas/${ventaId}`);
    if (!response.ok) throw new Error('Error al consultar venta');
    const venta = await response.json();
    
    // Verificar si está completamente pagada
    const estaPagada = venta.saldo_pendiente <= 0;
    
    return {
      venta: venta.venta,
      detalles: venta.detalles,
      pagos: venta.pagos,
      totalPagado: venta.total_pagado,
      saldoPendiente: venta.saldo_pendiente,
      estaPagada: estaPagada
    };
    
  } catch (error) {
    console.error("Error:", error);
    setError('No se pudo consultar la venta');
    return null;
  }
};
```

### Obtener métodos de pago disponibles

**Endpoint**: `GET /pagos/metodos`

```javascript
// Ejemplo de obtener métodos de pago
const obtenerMetodosPago = async () => {
  try {
    const response = await fetch('https://karmaapi-z51n.onrender.com/api/pagos/metodos');
    if (!response.ok) throw new Error('Error al cargar métodos de pago');
    const metodos = await response.json();
    
    // Guardar en estado para usar en formularios
    setMetodosPago(metodos);
    
  } catch (error) {
    console.error("Error:", error);
    // Usar métodos predeterminados en caso de error
    setMetodosPago([
      {id: "efectivo", nombre: "Efectivo"},
      {id: "tarjeta", nombre: "Tarjeta"}
    ]);
  }
};
```

## Consideraciones Importantes

1. **Manejo de errores**: Siempre verifica el código de respuesta HTTP y proporciona feedback adecuado al usuario.

2. **Estado de carga**: Implementa indicadores visuales durante las operaciones asíncronas.

3. **Validaciones**: Valida los datos en el frontend antes de enviarlos al servidor.

4. **Optimistic UI**: Para mejorar la experiencia, actualiza la UI inmediatamente y luego confirma con el servidor.

5. **Inventario**: La API actualiza automáticamente el inventario, pero es buena práctica verificar disponibilidad antes de finalizar la compra.

6. **Timeout**: Configura timeouts adecuados para las peticiones (recomendado: 10-15 segundos).

## Ejemplo de Componente Completo (React)

```jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CarritoCompra = () => {
  const [carrito, setCarrito] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [metodosPago, setMetodosPago] = useState([]);
  const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState('efectivo');
  
  const navigate = useNavigate();
  const clienteId = 1; // Este valor vendría de la autenticación
  
  // Cargar carrito al montar el componente
  useEffect(() => {
    consultarCarrito();
    obtenerMetodosPago();
  }, []);
  
  const consultarCarrito = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://karmaapi-z51n.onrender.com/api/carrito/${clienteId}`);
      if (!response.ok) throw new Error('Error al cargar el carrito');
      const data = await response.json();
      setCarrito(data.items || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Error:", error);
      setError('No se pudo cargar el carrito');
    } finally {
      setLoading(false);
    }
  };
  
  const obtenerMetodosPago = async () => {
    try {
      const response = await fetch('https://karmaapi-z51n.onrender.com/api/pagos/metodos');
      if (!response.ok) throw new Error('Error al cargar métodos de pago');
      const metodos = await response.json();
      setMetodosPago(metodos);
    } catch (error) {
      console.error("Error:", error);
      setMetodosPago([
        {id: "efectivo", nombre: "Efectivo"},
        {id: "tarjeta", nombre: "Tarjeta"}
      ]);
    }
  };
  
  const actualizarCantidad = async (itemId, nuevaCantidad) => {
    if (nuevaCantidad < 1) return;
    setLoading(true);
    try {
      const response = await fetch(`https://karmaapi-z51n.onrender.com/api/carrito/${itemId}/cantidad`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cantidad: nuevaCantidad })
      });
      
      if (!response.ok) throw new Error('Error al actualizar cantidad');
      consultarCarrito();
    } catch (error) {
      console.error("Error:", error);
      setError('No se pudo actualizar la cantidad');
    } finally {
      setLoading(false);
    }
  };
  
  const eliminarProducto = async (itemId) => {
    setLoading(true);
    try {
      const response = await fetch(`https://karmaapi-z51n.onrender.com/api/carrito/${itemId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Error al eliminar producto');
      consultarCarrito();
    } catch (error) {
      console.error("Error:", error);
      setError('No se pudo eliminar el producto');
    } finally {
      setLoading(false);
    }
  };
  
  const procesarCompra = async () => {
    if (carrito.length === 0) {
      setError('El carrito está vacío');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // 1. Crear la venta
      const ventaData = {
        cliente_id: clienteId,
        usuario_id: 2,
        items: carrito,
        actualizar_inventario: true,
        vaciar_carrito: true
      };
      
      const ventaResponse = await fetch('https://karmaapi-z51n.onrender.com/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ventaData)
      });
      
      if (!ventaResponse.ok) throw new Error('Error al crear la venta');
      const venta = await ventaResponse.json();
      const ventaId = venta.venta.id;
      
      // 2. Procesar el pago
      const pagoData = {
        venta_id: ventaId,
        metodo_pago: metodoPagoSeleccionado,
        monto: total,
        referencia: `Pago web venta #${ventaId}`
      };
      
      const pagoResponse = await fetch('https://karmaapi-z51n.onrender.com/api/pagos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pagoData)
      });
      
      if (!pagoResponse.ok) throw new Error('Error al procesar el pago');
      
      // 3. Redirigir a confirmación
      navigate('/confirmacion', { 
        state: { ventaId: ventaId, total: total } 
      });
      
    } catch (error) {
      console.error("Error:", error);
      setError('Error en el proceso de compra: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="carrito-container">
      <h1>Tu Carrito de Compra</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      {loading ? (
        <div className="loading">Cargando...</div>
      ) : (
        <>
          {carrito.length === 0 ? (
            <p>Tu carrito está vacío</p>
          ) : (
            <>
              <div className="carrito-items">
                {carrito.map(item => (
                  <div key={item.id} className="carrito-item">
                    <div className="item-info">
                      <h3>{item.nombre}</h3>
                      <p>${item.precio} x {item.cantidad} = ${item.precio * item.cantidad}</p>
                    </div>
                    <div className="item-actions">
                      <button onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}>-</button>
                      <span>{item.cantidad}</span>
                      <button onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}>+</button>
                      <button onClick={() => eliminarProducto(item.id)} className="delete-btn">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="carrito-summary">
                <h2>Total: ${total}</h2>
                
                <div className="metodo-pago">
                  <label>Método de pago:</label>
                  <select 
                    value={metodoPagoSeleccionado}
                    onChange={(e) => setMetodoPagoSeleccionado(e.target.value)}
                  >
                    {metodosPago.map(metodo => (
                      <option key={metodo.id} value={metodo.id}>
                        {metodo.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                
                <button 
                  onClick={procesarCompra} 
                  className="checkout-btn"
                  disabled={loading}
                >
                  {loading ? 'Procesando...' : 'Completar Compra'}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default CarritoCompra;
```

---

Este documento brinda las instrucciones esenciales para integrar el frontend con la API de Karma. Para casos específicos o funcionalidades adicionales, consulta la documentación completa o contacta al equipo de backend.