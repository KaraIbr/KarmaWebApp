from flask import Flask, request, jsonify
from supabase import create_client
from flask_cors import CORS
import hashlib
import os
import sys
from dotenv import load_dotenv

# Cargar variables de entorno desde .env si existe
load_dotenv()

# Importar el Blueprint de usuarios
from usuarios import usuarios_bp

# Importar otros blueprints
from productos import productos_bp
from carrito import carrito_bp
from ventas import ventas_bp
from pagos import pagos_bp

app = Flask(__name__)
# Registrar el Blueprint de usuarios con prefijo de URL
app.register_blueprint(usuarios_bp, url_prefix='/usuarios')
# Registrar otros blueprints
app.register_blueprint(productos_bp, url_prefix='/productos')
app.register_blueprint(carrito_bp, url_prefix='/carrito')
app.register_blueprint(ventas_bp, url_prefix='/ventas')
app.register_blueprint(pagos_bp, url_prefix='/pagos')

# Determinar los orígenes permitidos por CORS basados en el entorno
ALLOWED_ORIGINS = [
    "http://127.0.0.1:5501",
    "http://localhost:5501",
    "http://localhost:3000", 
    "http://127.0.0.1:3000",
    "http://localhost:3001", 
    "http://127.0.0.1:3001",
]

# Añadir dominio de producción de Render si está definido
FRONTEND_URL = os.environ.get('FRONTEND_URL')
if FRONTEND_URL:
    ALLOWED_ORIGINS.append(FRONTEND_URL)
else:
    # Dominios de producción por defecto
    ALLOWED_ORIGINS.extend([
        "https://karma-webapp.onrender.com",
        "https://karma-frontend.onrender.com"
    ])

# Configuración de CORS para desarrollo y producción
CORS(app, resources={
    r"/*": {
        "origins": ALLOWED_ORIGINS,
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# Supabase credenciales para la conexion - usando variables de entorno
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY')

# Verificar que las credenciales de Supabase están configuradas
if not SUPABASE_URL or not SUPABASE_KEY:
    # En desarrollo, usa los valores predeterminados
    if os.environ.get('FLASK_ENV') == 'development':
        SUPABASE_URL = "https://mhtytsmkqwydaixzjngz.supabase.co"
        SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1odHl0c21rcXd5ZGFpeHpqbmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwNTE1MzIsImV4cCI6MjA1NjYyNzUzMn0.FBJE6ltV55xQwS1Ob_pHITgpryo3pNcT3kj--vA2JKI"
        print("Warning: Using default Supabase credentials for development")
    else:
        # En producción, deben estar configuradas las variables de entorno
        print("Error: SUPABASE_URL and SUPABASE_KEY environment variables must be set in production")
        # No detener la aplicación por este error, pero registrar claramente el problema

# Inicializar cliente de Supabase
try:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    print(f"Error initializing Supabase client: {e}")
    if os.environ.get('FLASK_ENV') != 'development':
        # En producción, es un error crítico
        sys.exit(1)

# Agregar una ruta raíz para health check mejorada
@app.route('/')
def health_check():
    try:
        # Intenta una operación simple de Supabase para verificar conectividad
        supabase.table('usuarios').select('id').limit(1).execute()
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return jsonify({
        "status": "ok",
        "database": db_status,
        "environment": os.environ.get('FLASK_ENV', 'production'),
        "api_version": "1.0.0", 
        "message": "API de Karma funcionando correctamente"
    })

if __name__ == '__main__':
    # Get port from environment variable (Render will set this) or default to 5000
    port = int(os.environ.get('PORT', 5000))
    # In production, you don't want to run in debug mode
    debug = os.environ.get('FLASK_ENV') == 'development'
    # Run the app
    app.run(host='0.0.0.0', port=port, debug=debug)
