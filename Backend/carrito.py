#Propósito: Gestión de carritos, cálculo de precios, descuentos y totales.

from flask import Blueprint, request, jsonify
from supabase import create_client
import os

# Supabase credenciales para la conexion - usando variables de entorno
SUPABASE_URL = os.environ.get('SUPABASE_URL', "https://mhtytsmkqwydaixzjngz.supabase.co")
SUPABASE_KEY = os.environ.get('SUPABASE_KEY', "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1odHl0c21rcXd5ZGFpeHpqbmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwNTE1MzIsImV4cCI6MjA1NjYyNzUzMn0.FBJE6ltV55xQwS1Ob_pHITgpryo3pNcT3kj--vA2JKI")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

carrito_bp = Blueprint('carrito', __name__)

@carrito_bp.route('/carrito', methods=['GET'])
def obtener_carrito():
    try:
        # Obtiene todos los elementos del carrito con información del producto
        carrito = supabase.table('carrito').select('*, productos(*)').execute()
        return jsonify(carrito.data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@carrito_bp.route('/carrito', methods=['POST'])
def agregar_carrito():
    try:
        data = request.get_json()

        # Verifica que los datos contengan los campos necesarios
        if 'producto_id' not in data or 'cantidad' not in data:
            return jsonify({"error": "Faltan datos: producto_id y cantidad son necesarios"}), 400

        # Verificar si el producto existe
        producto = supabase.table('productos').select('*').eq('id', data['producto_id']).execute()
        if not producto.data:
            return jsonify({"error": "El producto no existe"}), 404
        
        # Verificar si ya existe en el carrito
        item_existente = supabase.table('carrito').select('*').eq('producto_id', data['producto_id']).execute()
        
        if item_existente.data:
            # Si ya existe, actualizar la cantidad
            nueva_cantidad = item_existente.data[0]['cantidad'] + data['cantidad']
            item_actualizado = supabase.table('carrito').update({'cantidad': nueva_cantidad}).eq('id', item_existente.data[0]['id']).execute()
            return jsonify(item_actualizado.data), 200
        else:
            # Si no existe, insertar nuevo
            new_item = supabase.table('carrito').insert(data).execute()
            return jsonify(new_item.data), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@carrito_bp.route('/carrito/<int:id>', methods=['DELETE'])
def eliminar_carrito(id):
    try:
        # Elimina el producto del carrito por ID
        deleted_item = supabase.table('carrito').delete().eq('id', id).execute()
        return jsonify({"message": "Producto eliminado del carrito"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@carrito_bp.route('/carrito/vaciar', methods=['DELETE'])
def vaciar_carrito():
    try:
        # Elimina todos los productos del carrito
        supabase.table('carrito').delete().neq('id', 0).execute()  # Elimina todos los registros
        return jsonify({"message": "Carrito vaciado correctamente"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@carrito_bp.route('/carrito/total', methods=['GET'])
def calcular_total():
    try:
        # Obtener todos los items del carrito con información de productos
        carrito = supabase.table('carrito').select('*, productos(*)').execute()
        items = carrito.data
        
        # Calcular subtotal, descuentos y total
        subtotal = 0
        total_descuentos = 0
        
        for item in items:
            precio_unitario = item['productos']['precio']
            cantidad = item['cantidad']
            subtotal += precio_unitario * cantidad
            
            # Aplicar descuentos si existen en el producto
            if 'descuento' in item['productos'] and item['productos']['descuento'] > 0:
                descuento = precio_unitario * cantidad * (item['productos']['descuento'] / 100)
                total_descuentos += descuento
        
        total = subtotal - total_descuentos
        
        return jsonify({
            "subtotal": subtotal,
            "descuentos": total_descuentos,
            "total": total,
            "items": len(items)
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@carrito_bp.route('/carrito/<int:id>/cantidad', methods=['PUT'])
def actualizar_cantidad(id):
    try:
        data = request.get_json()
        
        # Verificar que se proporcionó la cantidad
        if 'cantidad' not in data:
            return jsonify({"error": "Falta el campo cantidad"}), 400
        
        nueva_cantidad = data['cantidad']
        
        # Validar que la cantidad sea positiva
        if nueva_cantidad <= 0:
            return jsonify({"error": "La cantidad debe ser mayor que cero"}), 400
        
        # Actualizar la cantidad del item
        item_actualizado = supabase.table('carrito').update({'cantidad': nueva_cantidad}).eq('id', id).execute()
        
        # Verificar si se encontró el item
        if not item_actualizado.data:
            return jsonify({"error": "Producto no encontrado en el carrito"}), 404
            
        return jsonify(item_actualizado.data), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
