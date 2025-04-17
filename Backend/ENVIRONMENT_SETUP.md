# Environment Variables Guide

Este documento explica cómo configurar y utilizar variables de entorno en la aplicación Karma WebApp.

## ¿Qué son las variables de entorno?

Las variables de entorno son valores que se configuran fuera del código de la aplicación y que afectan el comportamiento de la misma. Se utilizan para:

- **Seguridad**: Almacenar claves de API y credenciales sensibles fuera del código
- **Configuración**: Establecer diferentes valores según el entorno (desarrollo, pruebas, producción)
- **Flexibilidad**: Cambiar la configuración sin modificar el código

## Configuración del Backend (Flask)

### Archivos de entorno
- `.env`: Contiene valores para el entorno actual
- `.env.example`: Plantilla con nombres de variables requeridas (sin valores reales)

### Variables disponibles
- `FLASK_ENV`: Configura el entorno de Flask (`development` o `production`)
- `PORT`: Puerto en el que se ejecutará el servidor
- `SUPABASE_URL`: URL de tu proyecto en Supabase
- `SUPABASE_KEY`: Clave de API para tu proyecto de Supabase

### Cómo se utilizan
El backend ya está configurado para cargar estas variables mediante la biblioteca `python-dotenv`. En el código, las variables se acceden con `os.environ.get('NOMBRE_VARIABLE')`.

Ejemplo:
```python
import os
from dotenv import load_dotenv

# Cargar variables desde .env
load_dotenv()

# Usar variables de entorno
supabase_url = os.environ.get('SUPABASE_URL')
```

## Configuración del Frontend (React)

### Archivos de entorno
- `.env`: Variables para entorno de producción
- `.env.development`: Variables para entorno de desarrollo local
- `.env.example`: Plantilla con nombres de variables requeridas

### Variables disponibles
- `REACT_APP_API_URL`: URL del backend al que se conectará el frontend

### Notas importantes para React
1. Las variables deben comenzar con `REACT_APP_`
2. Las variables son inyectadas durante el build, no en tiempo de ejecución
3. Para acceder a ellas, use: `process.env.REACT_APP_NOMBRE_VARIABLE`

Ejemplo:
```javascript
const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/';
```

## Configuración inicial

1. Para el backend:
   - Copia `.env.example` a `.env` en la raíz del proyecto
   - Completa con los valores adecuados para tu entorno

2. Para el frontend:
   - Copia `.env.example` a `.env` o `.env.development` en la carpeta Frontend
   - Completa con los valores adecuados para tu entorno

## Seguridad

Nunca cometas archivos `.env` al control de versiones. El archivo `.gitignore` ya está configurado para excluirlos.

## Despliegue en Render

Para desplegar en Render, configura las variables de entorno en la sección "Environment" de tu servicio en el panel de control de Render.