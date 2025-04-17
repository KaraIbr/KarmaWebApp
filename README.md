# Karma WebApp

KarmaWebApp es una aplicación web moderna para la gestión integral de negocios minoristas y mayoristas. Combina un sistema de punto de venta con capacidades de inventario, gestión de clientes, procesamiento de pagos múltiples y análisis de ventas.

## Características principales

- **Gestión de productos**: Catálogo completo con categorías, precios y existencias.
- **Carrito de compras**: Interfaz intuitiva para añadir productos y procesar ventas.
- **Métodos de pago múltiples**: Soporte para efectivo, tarjetas, transferencias, pago móvil y ventas a crédito.
- **Pagos mixtos**: Capacidad para combinar diferentes métodos de pago en una sola transacción.
- **Gestión de inventario**: Control de stock con alertas de existencias bajas.

## Preparación para despliegue

### Backend (Python/Flask)

1. **Requisitos previos**:
   - Python 3.11 o superior instalado
   - Cuenta en [Render.com](https://render.com) para el despliegue
   - Proyecto en [Supabase](https://supabase.com) configurado

2. **Verificación pre-despliegue**:
   ```bash
   cd Backend
   # Ejecutar el script de verificación pre-despliegue
   pre_deploy_check.bat
   ```

3. **Variables de entorno necesarias**:
   - `SUPABASE_URL`: URL del proyecto de Supabase
   - `SUPABASE_KEY`: Clave de API del proyecto de Supabase
   - `FRONTEND_URL`: URL donde estará desplegado el frontend
   - `FLASK_ENV`: Configurar como "production" para entornos de producción

4. **Despliegue en Render**:
   - Usa el archivo `render.yaml` para configurar el servicio
   - Asegúrate de configurar las variables de entorno en el panel de Render

### Frontend (React)

1. **Requisitos previos**:
   - Node.js y npm instalados
   - Cuenta en [Render.com](https://render.com) o servicio de hosting similar

2. **Construcción para producción**:
   ```bash
   cd Frontend
   npm install
   npm run build
   ```

3. **Variables de entorno para el Frontend**:
   - `REACT_APP_API_URL`: URL donde está desplegado el backend

4. **Despliegue**:
   - Sube la carpeta `build` a tu servicio de hosting
   - Configura correctamente las reglas de redirección para SPA si es necesario

## Verificación post-despliegue

1. Verificar el health check del backend: `https://karma-webapp.onrender.com/`
2. Verificar que el frontend puede conectarse al backend correctamente
3. Probar los flujos principales de la aplicación:
   - Autenticación (login/registro)
   - Gestión de productos
   - Manejo de carritos de compra
   - Proceso de pagos
   - Gestión de ventas e inventario

## Solución de problemas

- Si hay problemas de CORS, verifica la configuración de orígenes permitidos en el backend
- Para problemas de conectividad con Supabase, verifica las credenciales y la configuración de red
- Revisa los logs de Render para diagnosticar problemas del backend
