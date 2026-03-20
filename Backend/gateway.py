#Propósito: Redirigir solicitudes a los microservicios correspondientes.

from dotenv import load_dotenv
import os
# Cargar variables de entorno desde el archivo .env
load_dotenv()

from flask import Flask
from flask_cors import CORS
from productos import productos_bp
from carrito import carrito_bp
from inventario import inventario_bp
from pagos import pagos_bp
from ventas import ventas_bp
from usuarios import usuarios_bp
from flask import Blueprint, jsonify

# Crear el blueprint en lugar de una app independiente
gateway_bp = Blueprint('gateway', __name__)

# Ruta para verificar que el API gateway esté funcionando
# Cambiando de '/gateway' a '/' para que con el prefijo '/api' funcione como '/api/gateway'
@gateway_bp.route('/', methods=['GET'])
def gateway_index():
    return jsonify({
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
    })

# No necesitamos crear una app aquí ya que este archivo solo define el blueprint
# La aplicación principal y el registro de blueprints se manejan en app.py
