from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from productos import productos_bp
from usuarios import usuarios_bp
from carrito import carrito_bp
from inventario import inventario_bp
from ventas import ventas_bp
from pagos import pagos_bp
from gateway import gateway_bp

app = Flask(__name__)

# Configurar CORS para permitir solicitudes desde dominios específicos
allowed_origins = [
    os.environ.get('FRONTEND_URL', 'https://karma-front.vercel.app'),  # Frontend desplegado
    "http://localhost:3000",           # Desarrollo local React
    "http://127.0.0.1:3000",          # Desarrollo local React alternativo
    "http://localhost:5000",           # Desarrollo local Flask
    "http://127.0.0.1:5000",          # Desarrollo local Flask alternativo
    "http://localhost:5501",           # Desarrollo local LiveServer
    "http://127.0.0.1:5501",          # Desarrollo local LiveServer alternativo
    "https://karma-web-app.onrender.com",    # Producción
    "https://karmawebapp.com",              # Dominio personalizado
    "https://karmawebapp.onrender.com"      # Render.com
]

# Configuración CORS más segura y específica
CORS(app, 
     resources={r"/*": {
         "origins": allowed_origins,
         "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         "allow_headers": ["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
         "supports_credentials": True
     }})

# Middleware para manejar preflight OPTIONS y mantener consistencia CORS
@app.after_request
def after_request(response):
    origin = request.headers.get('Origin')
    if origin and origin in allowed_origins:
        response.headers['Access-Control-Allow-Origin'] = origin
    if request.method == 'OPTIONS':
        response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,Accept,Origin,X-Requested-With'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
    return response

# Registrar los blueprints - orden lógico del flujo de compra
app.register_blueprint(usuarios_bp, url_prefix='/api')     # Autenticación primero
app.register_blueprint(productos_bp, url_prefix='/api')    # Catálogo de productos
app.register_blueprint(inventario_bp, url_prefix='/api')   # Gestión de inventario
app.register_blueprint(carrito_bp, url_prefix='/api')      # Carrito de compras
app.register_blueprint(ventas_bp, url_prefix='/api')       # Procesamiento de ventas
app.register_blueprint(pagos_bp, url_prefix='/api')        # Procesamiento de pagos
app.register_blueprint(gateway_bp, url_prefix='/api')      # Gateway de la API

# Endpoint de verificación
@app.route('/')
def health_check():
    return jsonify({
        "status": "ok",
        "api_version": os.environ.get('API_VERSION', '1.0.0'), 
        "message": "API de Karma funcionando correctamente"
    })

# Endpoint de prueba API
@app.route('/api-test')
def api_test():
    return jsonify({
        "status": "success",
        "message": "La API está funcionando correctamente",
        "endpoints_disponibles": [
            {"ruta": "/api/usuarios", "métodos": ["GET", "POST"]},
            {"ruta": "/api/productos", "métodos": ["GET", "POST"]},
            {"ruta": "/api/carrito", "métodos": ["GET", "POST"]},
            {"ruta": "/api/auth/login", "métodos": ["POST"]}
        ]
    })

# Este código se ejecutará cuando se inicie la aplicación directamente
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
