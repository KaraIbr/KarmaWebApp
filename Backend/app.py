from flask import Flask, request, jsonify
from supabase import create_client
from flask_cors import CORS
import hashlib  # Add this import for generating hash codes
import os  # Add this for environment variables
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

# Permitir react / js para que pueda hacer peticiones a la API
# Configuración de CORS para desarrollo y producción
CORS(app, resources={
    r"/*": {
        "origins": [
            "http://127.0.0.1:5501",
            "http://localhost:5501",
            "http://localhost:3000", 
            "http://127.0.0.1:3000",
            "http://localhost:3001", 
            "http://127.0.0.1:3001",
            # Añadir el dominio de producción de Render (actualizar cuando se conozca)
            "https://karma-webapp.onrender.com",
            "https://karma-frontend.onrender.com"
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# Supabase credenciales para la conexion - usando variables de entorno
SUPABASE_URL = os.environ.get('SUPABASE_URL', "https://mhtytsmkqwydaixzjngz.supabase.co")
SUPABASE_KEY = os.environ.get('SUPABASE_KEY', "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1odHl0c21rcXd5ZGFpeHpqbmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwNTE1MzIsImV4cCI6MjA1NjYyNzUzMn0.FBJE6ltV55xQwS1Ob_pHITgpryo3pNcT3kj--vA2JKI")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Las rutas específicas se han movido a sus respectivos blueprints

if __name__ == '__main__':
    # Get port from environment variable (Render will set this) or default to 5000
    port = int(os.environ.get('PORT', 5000))
    # In production, you don't want to run in debug mode
    debug = os.environ.get('FLASK_ENV', 'production') != 'production'
    # Run the app
    app.run(host='0.0.0.0', port=port, debug=debug)
