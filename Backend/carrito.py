#Propósito: Gestión de carritos, cálculo de precios, descuentos y totales.

from flask import Blueprint, request, jsonify
from supabase import create_client
import os

# Supabase credenciales para la conexion - usando variables de entorno
SUPABASE_URL = os.environ.get('SUPABASE_URL', "https://mhtytsmkqwydaixzjngz.supabase.co")
SUPABASE_KEY = os.environ.get('SUPABASE_KEY', "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1odHl0c21rcXd5ZGFpeHpqbmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwNTE1MzIsImV4cCI6MjA1NjYyNzUzMn0.FBJE6ltV55xQwS1Ob_pHITgpryo3pNcT3kj--vA2JKI")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

carrito_bp = Blueprint('carrito', __name__)

@carrito_bp.route('/carrito', methods=['GET', 'OPTIONS'])
def obtener_carrito():
    # Manejar solicitudes OPTIONS para CORS
    if request.method == 'OPTIONS':
        return jsonify({}), 200
        
    try:
        # Obtener el vendedor_id de los parámetros de consulta
        vendedor_id = request.args.get('vendedor_id', type=int)
        
        try:
            # Construir la consulta base
            query = supabase.table('carrito').select('*, productos(*)')
            
            # Si se proporciona vendedor_id, filtrar por ese ID
            if vendedor_id:
                query = query.eq('vendedor_id', vendedor_id)
                print(f"Buscando carrito para vendedor_id: {vendedor_id}")
            
            # Ejecutar la consulta
            carrito = query.execute()
            print(f"Carrito cargado correctamente con join: {len(carrito.data)} elementos")
        except Exception as join_error:
            # Si falla el join, intentar obtener solo los elementos del carrito
            print(f"Error al cargar carrito con join: {str(join_error)}")
            carrito = supabase.table('carrito').select('*').execute()
            print(f"Carrito cargado sin join: {len(carrito.data)} elementos")
            
            # Si hay elementos en el carrito, intentar obtener los productos por separado
            if carrito.data:
                producto_ids = [item['producto_id'] for item in carrito.data if 'producto_id' in item]
                if producto_ids:
                    # Obtener productos
                    productos = supabase.table('productos').select('*').in_('id', producto_ids).execute()
                    productos_dict = {prod['id']: prod for prod in productos.data}
                    
                    # Adjuntar información de producto a cada elemento del carrito
                    for item in carrito.data:
                        if 'producto_id' in item and item['producto_id'] in productos_dict:
                            item['productos'] = productos_dict[item['producto_id']]
        
        # Verificar si hay datos en el carrito
        if not carrito.data:
            # Devolver un objeto con array vacío en lugar de error
            return jsonify({
                "items": [],
                "total": 0,
                "vendedor_id": vendedor_id
            }), 200
        
        # Calcular el total del carrito
        total = 0
        for item in carrito.data:
            try:
                precio = item.get('productos', {}).get('precio', 0)
                cantidad = item.get('cantidad', 0)
                total += precio * cantidad
            except Exception as calc_error:
                print(f"Error calculando precio para item: {calc_error}")
        
        # Devolver los datos en el formato esperado
        return jsonify({
            "items": carrito.data,
            "total": total,
            "vendedor_id": vendedor_id
        }), 200
    except Exception as e:
        print(f"Error general al obtener carrito: {str(e)}")
        # En caso de error, devolver array vacío para evitar errores en el frontend
        return jsonify([]), 200

@carrito_bp.route('/carrito', methods=['POST'])
def agregar_carrito():
    try:
        data = request.get_json()

        # Verifica que los datos contengan los campos necesarios
        if 'producto_id' not in data or 'cantidad' not in data:
            return jsonify({"error": "Faltan datos: producto_id y cantidad son necesarios"}), 400
            
        # Obtener el vendedor_id si está disponible
        vendedor_id = data.get('vendedor_id', None)

        # Verificar si el producto existe
        producto = supabase.table('productos').select('*').eq('id', data['producto_id']).execute()
        if not producto.data:
            return jsonify({"error": "El producto no existe"}), 404
        
        # Preparar los datos para insertar en carrito
        cart_data = {
            'producto_id': data['producto_id'],
            'cantidad': data['cantidad']
        }
        
        # Agregar vendedor_id si está presente
        if vendedor_id:
            cart_data['vendedor_id'] = vendedor_id
        
        # Verificar si ya existe en el carrito (con el mismo vendedor_id si aplica)
        query = supabase.table('carrito').select('*').eq('producto_id', data['producto_id'])
        
        if vendedor_id:
            query = query.eq('vendedor_id', vendedor_id)
            
        item_existente = query.execute()
        
        if item_existente.data:
            # Si ya existe, actualizar la cantidad
            nueva_cantidad = item_existente.data[0]['cantidad'] + data['cantidad']
            item_actualizado = supabase.table('carrito').update({'cantidad': nueva_cantidad}).eq('id', item_existente.data[0]['id']).execute()
            return jsonify(item_actualizado.data), 200
        else:
            # Si no existe, insertar nuevo
            new_item = supabase.table('carrito').insert(cart_data).execute()
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
        # Obtener el vendedor_id del cuerpo de la solicitud
        data = request.get_json()
        vendedor_id = data.get('vendedor_id') if data else None
        
        if vendedor_id:
            # Si hay ID de vendedor, vaciar solo su carrito
            supabase.table('carrito').delete().eq('vendedor_id', vendedor_id).execute()
            return jsonify({"message": f"Carrito del vendedor {vendedor_id} vaciado correctamente"}), 200
        else:
            # Si no hay ID de vendedor, vaciar todo el carrito
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

@carrito_bp.route('/carrito/usuario/<int:usuario_id>', methods=['GET', 'OPTIONS'])
def obtener_carrito_usuario(usuario_id):
    # Manejar solicitudes OPTIONS para CORS
    if request.method == 'OPTIONS':
        return jsonify({}), 200
        
    try:
        # Obtiene los elementos del carrito que pertenecen a un usuario específico
        # junto con la información del producto asociado
        print(f"Buscando carrito para usuario ID: {usuario_id}")
        carrito = supabase.table('carrito').select('*, productos(*)').eq('vendedor_id', usuario_id).execute()
        
        print(f"Resultado de búsqueda de carrito para usuario {usuario_id}: {len(carrito.data)} elementos")
        
        if not carrito.data:
            # Si no hay elementos, devolver un arreglo vacío en lugar de error
            return jsonify([]), 200
            
        return jsonify(carrito.data), 200
    except Exception as e:
        print(f"Error al obtener carrito de usuario {usuario_id}: {str(e)}")
        return jsonify({"error": str(e)}), 500
