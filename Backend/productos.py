#Gestión CRUD de productos y generación de códigos por seleccion del usuario siendo QR  o barras

from flask import Blueprint, request, jsonify
from supabase import create_client
import hashlib
import os

# Supabase credenciales para la conexion - usando variables de entorno
SUPABASE_URL = os.environ.get('SUPABASE_URL', "https://mhtytsmkqwydaixzjngz.supabase.co")
SUPABASE_KEY = os.environ.get('SUPABASE_KEY', "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1odHl0c21rcXd5ZGFpeHpqbmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwNTE1MzIsImV4cCI6MjA1NjYyNzUzMn0.FBJE6ltV55xQwS1Ob_pHITgpryo3pNcT3kj--vA2JKI")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

productos_bp = Blueprint('productos', __name__)

# Rutas para Productos (CRUD)
@productos_bp.route('/productos', methods=['GET'])
def obtener_prod():
    try:
        productos = supabase.table('productos').select('*').execute()
        return jsonify(productos.data), 200
    except Exception as e:
        print(f"Error getting products: {str(e)}")
        return jsonify({"error": str(e)}), 500

@productos_bp.route('/productos/<int:id>', methods=['GET'])
def obtener_prod_by_id(id):
    try:
        producto = supabase.table('productos').select('*').eq('id', id).execute()
        if not producto.data:
            return jsonify({"error": "Producto no encontrado"}), 404
        return jsonify(producto.data[0]), 200
    except Exception as e:
        print(f"Error getting product {id}: {str(e)}")
        return jsonify({"error": str(e)}), 500
    
@productos_bp.route('/productos', methods=['POST'])
def agregar_prod():
    try:
        data = request.get_json()
        nuevo_producto = supabase.table('productos').insert(data).execute()
        return jsonify(nuevo_producto.data[0]), 201
    except Exception as e:
        print(f"Error creando el producto: {str(e)}")
        return jsonify({"error": str(e)}), 500
    
@productos_bp.route('/productos/<int:id>', methods=['PUT'])
def modificar_prod(id):
    try:
        data = request.get_json()
        producto_actualizado = supabase.table('productos').update(data).eq('id', id).execute()
        return jsonify(producto_actualizado.data), 200
    except Exception as e:
        print(f"Error actualizando el producto {id}: {str(e)}")
        return jsonify({"error": str(e)}), 500

@productos_bp.route('/productos/<int:id>', methods=['DELETE'])
def eliminar_prod(id):
    try:
        supabase.table('productos').delete().eq('id', id).execute()
        return jsonify({"message": "Producto eliminado"}), 200
    except Exception as e:
        print(f"Error eliminando el producto {id}: {str(e)}")
        return jsonify({"error": str(e)}), 500

@productos_bp.route('/productos/<int:id>/qr', methods=['GET'])
def generar_codigo_qr(id):
    try:
        # Verificar que el producto existe
        producto = supabase.table('productos').select('*').eq('id', id).execute()
        if not producto.data:
            return jsonify({"error": "Producto no encontrado"}), 404
        
        # Generar un texto para el QR usando el ID del producto y un algoritmo hash
        salt = "karma_product_qr_salt"  # Salt fijo para consistencia
        text_to_hash = f"{id}_{salt}"
        
        # Generar hash SHA-256
        hash_object = hashlib.sha256(text_to_hash.encode())
        hash_hex = hash_object.hexdigest()
        
        # Acortar el hash para un QR más compacto (primeros 16 caracteres)
        short_code = hash_hex[:16]
        
        # Devolver el código generado
        return jsonify({
            "producto_id": id,
            "qr_code": short_code,
            "producto_info": producto.data[0]
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Nuevo endpoint para generar etiquetas
@productos_bp.route('/productos/etiquetas', methods=['GET'])
def generar_etiquetas():
    try:
        # Obtener todos los productos o filtrar por IDs específicos
        ids = request.args.get('ids')
        if ids:
            id_list = [int(id) for id in ids.split(',')]
            productos = supabase.table('productos').select('*').in_('id', id_list).execute()
        else:
            productos = supabase.table('productos').select('*').execute()
        
        etiquetas = []
        
        # Generar datos para cada etiqueta
        for producto in productos.data:
            # Generar código QR para el producto
            id = producto['id']
            salt = "karma_product_qr_salt"
            text_to_hash = f"{id}_{salt}"
            hash_object = hashlib.sha256(text_to_hash.encode())
            hash_hex = hash_object.hexdigest()
            short_code = hash_hex[:16]
            
            etiqueta = {
                "producto_id": id,
                "nombre": producto['nombre'],
                "precio": producto['precio'],
                "qr_code": short_code
            }
            
            etiquetas.append(etiqueta)
        
        return jsonify(etiquetas), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500