#Propósito: Redirigir solicitudes a los microservicios correspondientes.

from flask import Flask
from flask_cors import CORS
from productos import productos_bp
from carrito import carrito_bp
from inventario import inventario_bp
from pagos import pagos_bp
from ventas import ventas_bp
from usuarios import usuarios_bp

app = Flask(__name__)

# Configurar CORS para permitir solicitudes desde el frontend
CORS(app, resources={
    r"/*": {
        "origins": [
            "http://127.0.0.1:5501",
            "http://localhost:5501",
            "http://localhost:3000", 
            "http://127.0.0.1:3000"  
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# Registrar los blueprints de cada microservicio
app.register_blueprint(productos_bp)
app.register_blueprint(carrito_bp)
app.register_blueprint(inventario_bp)
app.register_blueprint(pagos_bp)
app.register_blueprint(ventas_bp)
app.register_blueprint(usuarios_bp)

# Ruta para verificar que el API esté funcionando
@app.route('/', methods=['GET'])
def index():
    return {
        "mensaje": "API Gateway de KarmaWebApp funcionando correctamente",
        "version": "1.0",
        "servicios": [
            {"nombre": "Productos", "ruta": "/productos"},
            {"nombre": "Carrito", "ruta": "/carrito"},
            {"nombre": "Inventario", "ruta": "/inventario"},
            {"nombre": "Pagos", "ruta": "/pagos"},
            {"nombre": "Ventas", "ruta": "/ventas"},
            {"nombre": "Usuarios", "ruta": "/usuarios"}
        ]
    }

if __name__ == '__main__':
    app.run(debug=True)
