# Scripts de Prueba para KarmaWebApp

Este directorio contiene scripts automatizados para probar la funcionalidad de la aplicación KarmaWebApp (versión optimizada).

## Flujo de Producto (`flujo_producto.test.js`)

Este script prueba el flujo completo de trabajo de un producto, desde su creación hasta su venta:

1. **Login** - Inicio de sesión en la aplicación
2. **Registro de Producto** - Creación de un nuevo producto en el inventario
3. **Generación de Etiqueta QR** - Creación de etiquetas QR para el producto
4. **Escaneo de Producto** - Simulación de escaneo para añadir al carrito
5. **Selección de Método de Pago** - Elección del método de pago (efectivo)
6. **Confirmación de Pago** - Procesamiento del pago
7. **Verificación de Inventario** - Comprobación de que el stock se actualizó correctamente

### Requisitos previos

- Node.js 14 o superior
- npm
- La aplicación KarmaWebApp debe estar ejecutándose en http://localhost:3000

### Dependencias

- Puppeteer - Para la automatización del navegador
- Chai - Para las aserciones (cuando se agregan pruebas unitarias)

### Instalación de dependencias

```bash
npm install puppeteer chai
```

### Ejecución del script

```bash
node tests/flujo_producto.test.js
```

### Resultados

El script genera:

1. **Capturas de pantalla** - Se guardan en la carpeta `tests/screenshots` con nombres que indican el paso del flujo
2. **Reporte de prueba** - Se guarda un archivo de texto con el resultado de la prueba en la misma carpeta de screenshots

### Configuración

Puede modificar los siguientes valores al principio del script:

- `URL_BASE` - URL donde se está ejecutando la aplicación
- `CREDENCIALES` - Datos de usuario para iniciar sesión
- `PRODUCTO_PRUEBA` - Datos del producto que se creará durante la prueba
- `TIMEOUT_LARGO` - Tiempo de espera para operaciones que pueden ser lentas

### Entornos de CI/CD

Para entornos de integración continua, cambie el modo "headless" a `true` en la función `ejecutarFlujoPrueba`:

```javascript
browser = await puppeteer.launch({
  headless: true,  // Cambiar de false a true
  defaultViewport: null,
  args: ['--start-maximized', '--disable-web-security']
});
```

### Solución de problemas

1. **Error de conexión**: Asegúrese de que la aplicación esté ejecutándose y sea accesible en la URL configurada.
2. **Errores de timeout**: Si los tiempos de espera son insuficientes, aumente el valor de `TIMEOUT_LARGO`.
3. **Errores de selección de elementos**: El script intenta varias estrategias para encontrar elementos. Si falla, revise la estructura HTML actual y ajuste los selectores.

## Integración con Optimizaciones

Este script ha sido adaptado para la versión optimizada de KarmaWebApp, donde:

- Se ha reemplazado AnimatedBackground por StaticBackground para mejor rendimiento
- Se ha eliminado dependencias de jsPDF y html2canvas en favor de la impresión nativa
- Se ha simplificado la interfaz de usuario para un mejor rendimiento

El script detecta y documenta qué optimizaciones están efectivamente implementadas durante la ejecución de la prueba.
