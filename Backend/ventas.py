#Propósito: Registro de ventas completadas y generación de reportes.

from flask import Blueprint, request, jsonify
from supabase import create_client
import datetime

# Supabase credenciales para la conexion
SUPABASE_URL = "https://mhtytsmkqwydaixzjngz.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1odHl0c21rcXd5ZGFpeHpqbmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwNTE1MzIsImV4cCI6MjA1NjYyNzUzMn0.FBJE6ltV55xQwS1Ob_pHITgpryo3pNcT3kj--vA2JKI"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

ventas_bp = Blueprint('ventas', __name__)

@ventas_bp.route('/ventas', methods=['POST'])
def crear_venta():
    try:
        data = request.get_json()
        
        # Validar que contenga los datos mínimos
        if 'items' not in data or not isinstance(data['items'], list):
            return jsonify({"error": "Se requiere una lista de items para la venta"}), 400
            
        # Verificar si hay un total proporcionado, si no, calcularlo
        if 'total' not in data:
            total = 0
            for item in data['items']:
                if 'precio' in item and 'cantidad' in item:
                    total += item['precio'] * item['cantidad']
            data['total'] = total
            
        # Agregar fecha actual si no se proporciona
        if 'fecha' not in data:
            data['fecha'] = datetime.datetime.now().isoformat()
            
        # Registrar la venta
        nueva_venta = supabase.table('ventas').insert(data).execute()
        
        # Si hay detalles de items, guardarlos relacionados a la venta
        venta_id = nueva_venta.data[0]['id']
        
        detalles_guardados = []
        for item in data['items']:
            # Agregar venta_id a cada item
            item['venta_id'] = venta_id
            
            # Guardar detalle de item
            detalle = supabase.table('detalles_venta').insert(item).execute()
            detalles_guardados.append(detalle.data[0])
            
            # Actualizar inventario si está configurado
            if 'actualizar_inventario' in data and data['actualizar_inventario'] and 'producto_id' in item:
                producto_id = item['producto_id']
                cantidad = item['cantidad']
                
                # Obtener stock actual
                producto = supabase.table('productos').select('stock').eq('id', producto_id).execute()
                
                if producto.data:
                    stock_actual = producto.data[0]['stock']
                    nuevo_stock = max(0, stock_actual - cantidad)  # Evitar stock negativo
                    
                    # Actualizar stock
                    supabase.table('productos').update({'stock': nuevo_stock}).eq('id', producto_id).execute()
        
        # Vaciar carrito si está configurado
        if 'vaciar_carrito' in data and data['vaciar_carrito']:
            try:
                supabase.table('carrito').delete().neq('id', 0).execute()
            except Exception as e:
                print(f"Error al vaciar carrito: {str(e)}")
                
        return jsonify({
            "mensaje": "Venta registrada correctamente",
            "venta": nueva_venta.data[0],
            "detalles": detalles_guardados
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@ventas_bp.route('/ventas', methods=['GET'])
def obtener_ventas():
    try:
        # Obtener parámetros de filtrado
        fecha_desde = request.args.get('fecha_desde')
        fecha_hasta = request.args.get('fecha_hasta')
        limite = int(request.args.get('limite', 100))
        
        # Construir consulta
        query = supabase.table('ventas').select('*')
        
        if fecha_desde:
            query = query.gte('fecha', fecha_desde)
            
        if fecha_hasta:
            query = query.lte('fecha', fecha_hasta)
            
        # Ejecutar consulta ordenada por fecha descendente
        ventas = query.order('fecha', desc=True).limit(limite).execute()
        
        return jsonify(ventas.data), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@ventas_bp.route('/ventas/<int:venta_id>', methods=['GET'])
def obtener_venta(venta_id):
    try:
        # Obtener venta
        venta = supabase.table('ventas').select('*').eq('id', venta_id).execute()
        
        if not venta.data:
            return jsonify({"error": "Venta no encontrada"}), 404
            
        # Obtener detalles de la venta
        detalles = supabase.table('detalles_venta').select('*').eq('venta_id', venta_id).execute()
        
        # Obtener pagos asociados
        pagos = supabase.table('pagos').select('*').eq('venta_id', venta_id).execute()
        
        # Calcular total pagado
        total_pagado = sum(pago['monto'] for pago in pagos.data)
        
        return jsonify({
            "venta": venta.data[0],
            "detalles": detalles.data,
            "pagos": pagos.data,
            "total_pagado": total_pagado,
            "saldo_pendiente": venta.data[0]['total'] - total_pagado if venta.data else 0
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@ventas_bp.route('/ventas/reportes/diario', methods=['GET'])
def reporte_ventas_diario():
    try:
        # Obtener parámetros
        fecha = request.args.get('fecha', datetime.datetime.now().strftime('%Y-%m-%d'))
        
        # Consultar ventas del día
        # Esto asume que 'fecha' en la tabla ventas es un campo de fecha ISO
        inicio_dia = f"{fecha}T00:00:00"
        fin_dia = f"{fecha}T23:59:59"
        
        ventas = supabase.table('ventas').select('*').gte('fecha', inicio_dia).lte('fecha', fin_dia).execute()
        
        # Calcular totales
        total_ventas = len(ventas.data)
        monto_total = sum(venta['total'] for venta in ventas.data)
        
        # Agrupar por método de pago
        pagos = supabase.table('pagos').select('*').gte('fecha', inicio_dia).lte('fecha', fin_dia).execute()
        
        metodos_pago = {}
        for pago in pagos.data:
            metodo = pago['metodo_pago']
            monto = pago['monto']
            
            if metodo in metodos_pago:
                metodos_pago[metodo] += monto
            else:
                metodos_pago[metodo] = monto
                
        return jsonify({
            "fecha": fecha,
            "total_ventas": total_ventas,
            "monto_total": monto_total,
            "ventas": ventas.data,
            "metodos_pago": [{"metodo": metodo, "monto": monto} for metodo, monto in metodos_pago.items()]
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@ventas_bp.route('/ventas/reportes/producto', methods=['GET'])
def reporte_ventas_producto():
    try:
        # Obtener parámetros
        fecha_desde = request.args.get('fecha_desde')
        fecha_hasta = request.args.get('fecha_hasta', datetime.datetime.now().isoformat())
        producto_id = request.args.get('producto_id')
        
        # Construir consulta para ventas
        ventas_query = supabase.table('ventas').select('id')
        
        if fecha_desde:
            ventas_query = ventas_query.gte('fecha', fecha_desde)
            
        ventas_query = ventas_query.lte('fecha', fecha_hasta)
        ventas = ventas_query.execute()
        
        # Si no hay ventas, retornar reporte vacío
        if not ventas.data:
            return jsonify({
                "fecha_desde": fecha_desde,
                "fecha_hasta": fecha_hasta,
                "productos_vendidos": []
            }), 200
            
        # Obtener IDs de las ventas
        venta_ids = [venta['id'] for venta in ventas.data]
        
        # Construir consulta para detalles
        detalles_query = supabase.table('detalles_venta').select('*')
        
        # Filtrar por producto si se proporciona
        if producto_id:
            detalles_query = detalles_query.eq('producto_id', int(producto_id))
            
        # Filtrar por ventas del período
        detalles = detalles_query.in_('venta_id', venta_ids).execute()
        
        # Agrupar por producto
        productos_vendidos = {}
        
        for detalle in detalles.data:
            producto_id = detalle['producto_id']
            cantidad = detalle['cantidad']
            subtotal = detalle['precio'] * cantidad
            
            if producto_id in productos_vendidos:
                productos_vendidos[producto_id]['cantidad'] += cantidad
                productos_vendidos[producto_id]['subtotal'] += subtotal
            else:
                productos_vendidos[producto_id] = {
                    "producto_id": producto_id,
                    "nombre": detalle.get('nombre', f"Producto {producto_id}"),
                    "cantidad": cantidad,
                    "subtotal": subtotal
                }
                
        return jsonify({
            "fecha_desde": fecha_desde,
            "fecha_hasta": fecha_hasta,
            "productos_vendidos": list(productos_vendidos.values())
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
