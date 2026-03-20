# Documentación de API Karma - Proceso de Compra

## Resumen

Este documento describe el flujo completo del proceso de compra en la API de Karma, desde agregar productos al carrito hasta finalizar una venta y procesar los pagos. Está destinado al equipo de frontend para facilitar la integración con los endpoints correspondientes.

## URL Base

```
https://karmaapi-z51n.onrender.com/api
```

## Diagrama de Flujo

```
┌────────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐
│  Consultar │     │   Agregar  │     │  Consultar │     │   Generar  │     │  Registrar │
│  Producto  │────▶│ al Carrito │────▶│   Carrito  │────▶│    Venta   │────▶│    Pago    │
└────────────┘     └────────────┘     └────────────┘     └────────────┘     └────────────┘
```

## 1. Consultar Productos

### Endpoint: `GET /productos`

Obtiene la lista completa de productos disponibles.

**Respuesta (200 OK):**
```json
[
  {
    "id": 300,
    "nombre": "Pulsera de Oro",
    "descripcion": "Pulsera elegante bañada en oro de 18k",
    "precio": 120.00,
    "categoria": "Mujer",
    "color": "Dorado",
    "stock": 9,
    "disponible": true
  },
  // ...más productos
]
```

### Endpoint: `GET /productos/{id}`

Obtiene los detalles de un producto específico.

**Respuesta (200 OK):**
```json
{
  "id": 300,
  "nombre": "Pulsera de Oro",
  "descripcion": "Pulsera elegante bañada en oro de 18k",
  "precio": 120.00,
  "categoria": "Mujer",
  "color": "Dorado",
  "stock": 9,
  "disponible": true
}
```

## 2. Gestión del Carrito

### Endpoint: `POST /carrito/agregar`

Agrega un producto al carrito del cliente.

**Solicitud:**
```json
{
  "producto_id": 300,
  "cantidad": 1,
  "cliente_id": 1
}
```

**Respuesta (201 Created):**
```json
{
  "id": 42,
  "producto_id": 300,
  "cantidad": 1,
  "cliente_id": 1
}
```

### Endpoint: `GET /carrito/{cliente_id}`

Obtiene el contenido del carrito de un cliente.

**Respuesta (200 OK):**
```json
{
  "items": [
    {
      "id": 42,
      "producto_id": 300,
      "cantidad": 1,
      "nombre": "Pulsera de Oro",
      "precio": 120.00,
      "color": "Dorado"
    }
  ],
  "total": 120.00,
  "total_items": 1
}
```

### Endpoint: `DELETE /carrito/{id}`

Elimina un producto específico del carrito.

**Respuesta (200 OK):**
```json
{
  "message": "Producto eliminado del carrito"
}
```

### Endpoint: `PUT /carrito/{id}/cantidad`

Actualiza la cantidad de un producto en el carrito.

**Solicitud:**
```json
{
  "cantidad": 2
}
```

**Respuesta (200 OK):**
```json
{
  "id": 42,
  "producto_id": 300,
  "cantidad": 2,
  "cliente_id": 1
}
```

## 3. Creación de Ventas

### Endpoint: `POST /ventas`

Crea una nueva venta con los productos del carrito.

**Solicitud:**
```json
{
  "cliente_id": 1,
  "usuario_id": 2,
  "items": [
    {
      "producto_id": 300,
      "nombre": "Pulsera de Oro",
      "precio": 120.00,
      "cantidad": 1
    }
  ],
  "actualizar_inventario": true,
  "vaciar_carrito": true
}
```

**Respuesta (201 Created):**
```json
{
  "mensaje": "Venta registrada correctamente",
  "venta": {
    "id": 501,
    "cliente_id": 1,
    "usuario_id": 2,
    "fecha": "2025-04-17T20:00:00",
    "total": 120.00
  },
  "detalles": [
    {
      "id": 701,
      "venta_id": 501,
      "producto_id": 300,
      "nombre": "Pulsera de Oro",
      "precio": 120.00,
      "cantidad": 1
    }
  ]
}
```

## 4. Procesamiento de Pagos

### Endpoint: `POST /pagos`

Registra un pago para una venta.

**Solicitud:**
```json
{
  "venta_id": 501,
  "metodo_pago": "efectivo",
  "monto": 120.00,
  "referencia": "Pago en efectivo"
}
```

**Respuesta (201 Created):**
```json
{
  "mensaje": "Pago procesado correctamente",
  "pago": {
    "id": 201,
    "venta_id": 501,
    "metodo_pago": "efectivo",
    "monto": 120.00,
    "fecha": "2025-04-17T20:05:00",
    "referencia": "Pago en efectivo"
  }
}
```

### Endpoint: `POST /pagos/split`

Registra múltiples pagos para una venta (pagos divididos).

**Solicitud:**
```json
{
  "venta_id": 501,
  "pagos": [
    {
      "metodo_pago": "efectivo",
      "monto": 60.00,
      "referencia": "Pago parcial en efectivo"
    },
    {
      "metodo_pago": "tarjeta",
      "monto": 60.00,
      "referencia": "Pago parcial con tarjeta"
    }
  ]
}
```

**Respuesta (201 Created):**
```json
{
  "mensaje": "Procesados 2 de 2 pagos",
  "total_procesado": 120.00,
  "resultados": [
    {
      "exito": true,
      "pago": {
        "id": 202,
        "venta_id": 501,
        "metodo_pago": "efectivo",
        "monto": 60.00,
        "fecha": "2025-04-17T20:05:00",
        "referencia": "Pago parcial en efectivo"
      }
    },
    {
      "exito": true,
      "pago": {
        "id": 203,
        "venta_id": 501,
        "metodo_pago": "tarjeta",
        "monto": 60.00,
        "fecha": "2025-04-17T20:05:00",
        "referencia": "Pago parcial con tarjeta"
      }
    }
  ]
}
```

### Endpoint: `GET /pagos/metodos`

Obtiene los métodos de pago disponibles.

**Respuesta (200 OK):**
```json
[
  {"id": "efectivo", "nombre": "Efectivo"},
  {"id": "tarjeta", "nombre": "Tarjeta de Crédito/Débito"},
  {"id": "transferencia", "nombre": "Transferencia Bancaria"},
  {"id": "movil", "nombre": "Pago Móvil"}
]
```

## 5. Consulta de Ventas y Pagos

### Endpoint: `GET /ventas/{venta_id}`

Obtiene los detalles completos de una venta, incluyendo sus pagos.

**Respuesta (200 OK):**
```json
{
  "venta": {
    "id": 501,
    "cliente_id": 1,
    "usuario_id": 2,
    "fecha": "2025-04-17T20:00:00",
    "total": 120.00
  },
  "detalles": [
    {
      "id": 701,
      "venta_id": 501,
      "producto_id": 300,
      "nombre": "Pulsera de Oro",
      "precio": 120.00,
      "cantidad": 1
    }
  ],
  "pagos": [
    {
      "id": 201,
      "venta_id": 501,
      "metodo_pago": "efectivo",
      "monto": 120.00,
      "fecha": "2025-04-17T20:05:00",
      "referencia": "Pago en efectivo"
    }
  ],
  "total_pagado": 120.00,
  "saldo_pendiente": 0.00
}
```

### Endpoint: `GET /pagos/venta/{venta_id}`

Obtiene todos los pagos asociados a una venta.

**Respuesta (200 OK):**
```json
{
  "pagos": [
    {
      "id": 201,
      "venta_id": 501,
      "metodo_pago": "efectivo",
      "monto": 120.00,
      "fecha": "2025-04-17T20:05:00",
      "referencia": "Pago en efectivo"
    }
  ],
  "total_pagado": 120.00,
  "cantidad_pagos": 1
}
```

## Gestión de Errores

Todas las API devuelven códigos de estado HTTP estándar:

- **200 OK**: Operación exitosa
- **201 Created**: Recurso creado correctamente
- **400 Bad Request**: Datos inválidos o faltantes
- **404 Not Found**: Recurso no encontrado
- **500 Internal Server Error**: Error del servidor

Estructura de error:
```json
{
  "error": "Descripción del error"
}
```

## Consideraciones para Frontend

1. **Carrito persistente**: El carrito se almacena en la base de datos y está asociado al `cliente_id`. No es necesario implementar almacenamiento local.

2. **Actualización de inventario**: Al crear una venta con `actualizar_inventario=true`, el stock se actualiza automáticamente.

3. **Pagos parciales**: Es posible registrar pagos por montos menores al total de la venta y completarlos posteriormente.

4. **Validación de disponibilidad**: Antes de finalizar una venta, verificar que el `stock` de cada producto sea suficiente.

## Ejemplo de Flujo Completo

1. Buscar productos (`GET /productos`)
2. Mostrar detalles de un producto (`GET /productos/300`)
3. Agregar al carrito (`POST /carrito/agregar`)
4. Ver carrito (`GET /carrito/1`)
5. Ajustar cantidades si es necesario (`PUT /carrito/42/cantidad`)
6. Crear venta (`POST /ventas`)
7. Procesar pago (`POST /pagos`)
8. Consultar estado de la venta (`GET /ventas/501`)

---

Documentación generada el 17 de abril de 2025
API URL: https://karmaapi-z51n.onrender.com/api