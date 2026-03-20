#Gestión CRUD de productos y generación de códigos por seleccion del usuario siendo QR  o barras

from flask import Blueprint, request, jsonify
from supabase import create_client
import hashlib
import os
import re

# Supabase credenciales para la conexion - usando variables de entorno
SUPABASE_URL = os.environ.get('SUPABASE_URL', "https://mhtytsmkqwydaixzjngz.supabase.co")
SUPABASE_KEY = os.environ.get('SUPABASE_KEY', "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1odHl0c21rcXd5ZGFpeHpqbmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwNTE1MzIsImV4cCI6MjA1NjYyNzUzMn0.FBJE6ltV55xQwS1Ob_pHITgpryo3pNcT3kj--vA2JKI")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

productos_bp = Blueprint('productos', __name__)

# Función para generar SKU basado en nombre, color y un contador
def generar_sku(nombre, color):
    try:
        # Obtener las dos primeras letras del nombre y color
        prefijo_nombre = re.sub(r'[^a-zA-Z]', '', nombre).upper()[:2] if nombre else "XX"
        prefijo_color = re.sub(r'[^a-zA-Z]', '', color).upper()[:2] if color else "XX"
        
        # Buscar productos existentes con el mismo prefijo para obtener el último número
        prefijo_busqueda = f"{prefijo_nombre}{prefijo_color}%"
        resultado = supabase.table('productos').select('sku').like('sku', prefijo_busqueda).execute()
        
        # Obtener el número más alto actual
        max_num = 0
        if resultado.data:
            for prod in resultado.data:
                if prod.get('sku'):
                    # Extraer el número al final del SKU
                    match = re.search(r'(\d+)$', prod['sku'])
                    if match:
                        num = int(match.group(1))
                        max_num = max(max_num, num)
        
        # Generar el nuevo SKU con el número incrementado
        nuevo_num = max_num + 1
        nuevo_sku = f"{prefijo_nombre}{prefijo_color}{nuevo_num}"
        
        return nuevo_sku
    
    except Exception as e:
        print(f"Error generando SKU: {str(e)}")
        # Si hay algún error, generar un SKU basado en timestamp
        import time
        return f"SKU{int(time.time())}"

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
        # Generar SKU automáticamente si no se proporciona
        if 'sku' not in data or not data['sku']:
            data['sku'] = generar_sku(data.get('nombre'), data.get('color'))
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
        
        # Usar el SKU si existe, de lo contrario generar uno
        sku = producto.data[0].get('sku')
        if not sku:
            # Si no tiene SKU asignado, generarlo y actualizarlo
            sku = generar_sku(producto.data[0].get('nombre'), producto.data[0].get('color'))
            # Actualizar el producto con el nuevo SKU
            supabase.table('productos').update({'sku': sku}).eq('id', id).execute()
        
        # Generar el código QR que contenga tanto el SKU como el ID
        qr_text = f"{sku}|{id}"
        
        # Devolver el código generado
        return jsonify({
            "producto_id": id,
            "qr_code": qr_text,
            "sku": sku,
            "producto_info": producto.data[0]
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@productos_bp.route('/productos/<int:id>/barcode', methods=['GET'])
def generar_codigo_barras(id):
    try:
        # Verificar que el producto existe
        producto = supabase.table('productos').select('*').eq('id', id).execute()
        if not producto.data:
            return jsonify({"error": "Producto no encontrado"}), 404
        
        # Usar el SKU si existe, de lo contrario generar uno nuevo
        sku = producto.data[0].get('sku')
        if not sku:
            # Si no tiene SKU asignado, generarlo y actualizarlo
            sku = generar_sku(producto.data[0].get('nombre'), producto.data[0].get('color'))
            # Actualizar el producto con el nuevo SKU
            supabase.table('productos').update({'sku': sku}).eq('id', id).execute()
        
        # El código de barras se genera a partir del SKU
        barcode_text = sku
        
        # Devolver el código generado
        return jsonify({
            "producto_id": id,
            "barcode": barcode_text,
            "sku": sku,
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
            # Usar el SKU existente o generar uno nuevo si no existe
            sku = producto.get('sku')
            if not sku:
                sku = generar_sku(producto.get('nombre'), producto.get('color'))
                # Actualizar el producto con el nuevo SKU
                supabase.table('productos').update({'sku': sku}).eq('id', producto['id']).execute()
            
            # Crear contenido para QR (SKU|ID) y código de barras (solo SKU)
            qr_content = f"{sku}|{producto['id']}"
            barcode_content = sku
            
            etiqueta = {
                "producto_id": producto['id'],
                "sku": sku,
                "nombre": producto['nombre'],
                "precio": producto['precio'],
                "color": producto.get('color', 'N/A'),
                "qr_code": qr_content,
                "barcode": barcode_content
            }
            
            etiquetas.append(etiqueta)
        
        return jsonify(etiquetas), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500