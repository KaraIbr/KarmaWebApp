#Propósito: Registro de ventas completadas y generación de reportes.

from flask import Blueprint, request, jsonify
from supabase import create_client
import datetime
import os

# Supabase credenciales para la conexion - usando variables de entorno
SUPABASE_URL = os.environ.get('SUPABASE_URL', "https://mhtytsmkqwydaixzjngz.supabase.co")
SUPABASE_KEY = os.environ.get('SUPABASE_KEY', "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1odHl0c21rcXd5ZGFpeHpqbmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwNTE1MzIsImV4cCI6MjA1NjYyNzUzMn0.FBJE6ltV55xQwS1Ob_pHITgpryo3pNcT3kj--vA2JKI")

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
            
        # Extraer flags de comportamiento antes de insertar en la base de datos
        actualizar_inventario = data.pop('actualizar_inventario', False)
        vaciar_carrito = data.pop('vaciar_carrito', False)
        
        # Extraer información de pago para procesarlo junto con la venta
        info_pago = {
            'metodo_pago': data.get('metodoPago', 'efectivo'),
            'detalles': data.get('detallesPago', {})
        }
        
        # Registrar información para depuración
        print(f"Datos recibidos: {data}")
        print(f"Items para venta: {data.get('items', [])}")
        print(f"Método de pago: {info_pago['metodo_pago']}")
        
        # Filtrar solo campos válidos para la tabla ventas según la estructura actual
        venta_data = {
            'cliente_id': data.get('cliente_id'),
            'usuario_id': data.get('usuario_id'),
            'fecha': data.get('fecha'),
            'total': data.get('total'),
            'subtotal': data.get('subtotal', data.get('total', 0)),
            'descuento': data.get('descuento', 0)
        }
        
        # Eliminar campos None para evitar errores
        venta_data = {k: v for k, v in venta_data.items() if v is not None}
        
        # Registrar la venta
        nueva_venta = supabase.table('ventas').insert(venta_data).execute()
        
        if not nueva_venta.data:
            return jsonify({"error": "Error al registrar la venta"}), 500
            
        # Obtener el ID de la venta creada
        venta_id = nueva_venta.data[0]['id']
        
        # Array para almacenar productos procesados
        productos_venta = []
        
        # Actualizar inventario si está configurado
        if actualizar_inventario:
            for item in data['items']:
                try:
                    if 'producto_id' in item:
                        producto_id = item['producto_id']
                        cantidad = item['cantidad']
                        
                        # Obtener stock actual
                        producto = supabase.table('productos').select('*').eq('id', producto_id).execute()
                        
                        if producto.data:
                            # Guardar info del producto para la respuesta
                            productos_venta.append({
                                'id': producto_id,
                                'nombre': producto.data[0].get('nombre', item.get('nombre', 'Producto sin nombre')),
                                'cantidad': cantidad,
                                'precio': item.get('precio', producto.data[0].get('precio', 0)),
                                'sku': producto.data[0].get('sku', ''),
                                'codigo_barras': producto.data[0].get('codigo_barras', '')
                            })
                            
                            # Registrar en detalles_venta
                            detalle_venta = {
                                'venta_id': venta_id,
                                'producto_id': producto_id,
                                'nombre': producto.data[0].get('nombre', item.get('nombre', 'Producto sin nombre')),
                                'precio': item.get('precio', producto.data[0].get('precio', 0)),
                                'cantidad': cantidad,
                                'sku': producto.data[0].get('sku', ''),
                                'codigo_barras': producto.data[0].get('codigo_barras', '')
                            }
                            supabase.table('detalles_venta').insert(detalle_venta).execute()
                            
                            # Actualizar stock
                            stock_actual = producto.data[0].get('stock', 0)
                            nuevo_stock = max(0, stock_actual - cantidad)  # Evitar stock negativo
                            supabase.table('productos').update({'stock': nuevo_stock}).eq('id', producto_id).execute()
                    else:
                        print(f"Advertencia: item sin producto_id: {item}")
                except Exception as item_error:
                    print(f"Error procesando item: {str(item_error)}")
                    # Continuar con el siguiente item si este falla
        
        # Registrar el pago según el esquema actual de la tabla pagos
        try:
            # Para pagos mixtos (múltiples pagos para una venta)
            if info_pago['metodo_pago'] == 'mixto' and 'mixedPayments' in info_pago['detalles']:
                for pago_mixto in info_pago['detalles']['mixedPayments']:
                    # Crear un registro de pago por cada método mixto
                    pago_data = {
                        'venta_id': venta_id,
                        'metodo_pago': pago_mixto['methodId'],
                        'monto': float(pago_mixto['amount']),
                        'fecha': venta_data.get('fecha', datetime.datetime.now().isoformat()),
                        'referencia': pago_mixto.get('reference', ''),
                        'estado': 'completado',
                        'datos_adicionales': pago_mixto
                    }
                    
                    # Registrar pago individual
                    supabase.table('pagos').insert(pago_data).execute()
            else:
                # Para pagos simples (un solo método)
                pago_data = {
                    'venta_id': venta_id,
                    'metodo_pago': info_pago['metodo_pago'],
                    'monto': venta_data['total'],
                    'fecha': venta_data.get('fecha', datetime.datetime.now().isoformat()),
                    'referencia': str(info_pago['detalles'].get('reference', '')),
                    'estado': 'completado' if info_pago['metodo_pago'] != 'credito' else 'pendiente',
                    'datos_adicionales': info_pago['detalles']
                }
                
                # Registrar pago simple
                supabase.table('pagos').insert(pago_data).execute()
        except Exception as e:
            print(f"Error al registrar pago: {str(e)}")
            # No interrumpir el flujo completo si falla el registro del pago
        
        # Vaciar carrito si está configurado
        if vaciar_carrito:
            try:
                supabase.table('carrito').delete().neq('id', 0).execute()
                print("Carrito vaciado correctamente")
            except Exception as e:
                print(f"Error al vaciar carrito: {str(e)}")
                
        # Obtener información completa de la venta para devolver al cliente
        venta_completa = supabase.table('ventas').select('*').eq('id', venta_id).execute()
        
        # Si no hay resultados, usar los datos originales
        venta_response = venta_completa.data[0] if (venta_completa and venta_completa.data) else nueva_venta.data[0]
        
        # Preparar respuesta completa
        respuesta = {
            "mensaje": "Venta registrada correctamente",
            "venta": venta_response,
            "productos": productos_venta,
            "pago": {
                "metodo": info_pago['metodo_pago'],
                "detalles": info_pago['detalles']
            }
        }
        
        print(f"Respuesta generada: {respuesta}")
        
        # Retornar respuesta exitosa con todos los datos
        return jsonify(respuesta), 201
        
    except Exception as e:
        error_mensaje = str(e)
        print(f"Error general al crear venta: {error_mensaje}")
        # Asegurarse de enviar una respuesta detallada en caso de error
        return jsonify({"error": error_mensaje, "mensaje": "Error al procesar la venta"}), 500

@ventas_bp.route('/ventas', methods=['GET'])
def obtener_ventas():
    try:
        # Obtener parámetros de paginación y filtrado
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        fecha_inicio = request.args.get('fecha_inicio')
        fecha_fin = request.args.get('fecha_fin')
        estado = request.args.get('estado')
        metodo_pago = request.args.get('metodo_pago')
        
        # Para depuración
        print(f"Parámetros de consulta: page={page}, limit={limit}, fecha_inicio={fecha_inicio}, fecha_fin={fecha_fin}, estado={estado}, metodo_pago={metodo_pago}")
        
        # Calcular offset para paginación
        offset = (page - 1) * limit
        
        # Obtener ventas con join a usuarios y clientes para tener información completa
        query = supabase.table('ventas').select('*')
        
        # Aplicar filtros si están presentes
        if fecha_inicio:
            query = query.gte('fecha', fecha_inicio)
        if fecha_fin:
            query = query.lte('fecha', fecha_fin)
            
        # Ejecutar consulta con paginación, ordenando por fecha descendente
        query = query.order('fecha', desc=True).range(offset, offset + limit - 1)
        ventas_result = query.execute()
        
        print(f"Ventas encontradas: {len(ventas_result.data)}")
        
        # Contar el total de ventas para la paginación (sin los límites)
        count_query = supabase.table('ventas').select('id')
        if fecha_inicio:
            count_query = count_query.gte('fecha', fecha_inicio)
        if fecha_fin:
            count_query = count_query.lte('fecha', fecha_fin)
        count_result = count_query.execute()
        total_ventas = len(count_result.data)
        
        # Obtener los pagos para todas las ventas en una sola consulta
        if ventas_result.data:
            venta_ids = [venta['id'] for venta in ventas_result.data]
            pagos_result = supabase.table('pagos').select('*').in_('venta_id', venta_ids).execute()
            pagos_por_venta = {}  # Inicializar como diccionario vacío
                
            # Organizar pagos por venta_id
            for pago in pagos_result.data:
                venta_id = pago['venta_id']
                if venta_id not in pagos_por_venta:
                    pagos_por_venta[venta_id] = []  # Crear una lista vacía para cada venta_id
                pagos_por_venta[venta_id].append(pago)  # Agregar el pago a la lista correspondiente
            
            # Enriquecer cada venta con información de pagos
            for venta in ventas_result.data:
                pagos_venta = pagos_por_venta.get(venta['id'], [])
                
                # Determinar el método de pago principal (el de mayor monto)
                if pagos_venta:
                    # Si hay un solo pago, usar ese método
                    if len(pagos_venta) == 1:
                        venta['metodo_pago'] = pagos_venta[0]['metodo_pago']
                    # Si hay múltiples pagos, es pago mixto
                    else:
                        venta['metodo_pago'] = 'mixto'
                else:
                    # Si no hay pagos registrados pero hay un método de pago en la venta original
                    # Asumimos que el pago está completo
                    venta['metodo_pago'] = venta.get('metodo_pago', 'efectivo')
                
                # Calcular total pagado
                total_pagado = sum(pago['monto'] for pago in pagos_venta) if pagos_venta else venta['total']
                
                # Determinar estado basado en pagos
                # Importante: Una venta con método de pago ya especificado pero sin pagos registrados
                # se considera como pagada completamente
                if pagos_venta:
                    if total_pagado >= venta['total']:
                        venta['estado'] = 'pagado'
                    elif total_pagado > 0:
                        venta['estado'] = 'parcial'
                    else:
                        venta['estado'] = 'pendiente'
                else:
                    # Si no hay pagos registrados pero hay un método de pago, asumimos que está pagada
                    if venta.get('metodo_pago'):
                        venta['estado'] = 'pagado'
                    else:
                        venta['estado'] = 'pendiente'
                
                # Agregar información de pagos
                venta['pagos'] = pagos_venta
                venta['total_pagado'] = total_pagado
                venta['saldo_pendiente'] = max(0, venta['total'] - total_pagado)
                
                # Para depuración
                print(f"Venta ID {venta['id']}: método={venta['metodo_pago']}, estado={venta['estado']}, total={venta['total']}, pagado={total_pagado}")
        
        return jsonify({
            "ventas": ventas_result.data,
            "total": total_ventas,
            "page": page,
            "limit": limit,
            "pages": (total_ventas + limit - 1) // limit  # Redondear hacia arriba
        }), 200
    except Exception as e:
        print(f"Error en obtener_ventas: {str(e)}")
        return jsonify({"error": str(e)}), 500

@ventas_bp.route('/ventas/<int:venta_id>', methods=['GET'])
def obtener_venta(venta_id):
    try:
        # Obtener venta
        venta = supabase.table('ventas').select('*').eq('id', venta_id).execute()
        
        if not venta.data:
            return jsonify({"error": "Venta no encontrada"}), 404
            
        # Obtener pagos asociados
        pagos = supabase.table('pagos').select('*').eq('venta_id', venta_id).execute()
        
        # Obtener detalles de productos de los pagos
        productos_venta = []
        
        # Intentar obtener los detalles de pagos con JSONB
        for pago in pagos.data:
            # Si hay datos_adicionales en el pago, extraer información de productos si existe
            if 'datos_adicionales' in pago and pago['datos_adicionales']:
                if isinstance(pago['datos_adicionales'], dict) and 'productos' in pago['datos_adicionales']:
                    for producto in pago['datos_adicionales']['productos']:
                        productos_venta.append(producto)
        
        # Si no hay productos extraídos de pagos, intentar buscar en la tabla productos usando producto_id
        if not productos_venta and pagos.data and 'datos_adicionales' in pagos.data[0] and pagos.data[0]['datos_adicionales']:
            producto_ids = set()
            for pago in pagos.data:
                if 'datos_adicionales' in pago and pago['datos_adicionales']:
                    if isinstance(pago['datos_adicionales'], dict) and 'producto_id' in pago['datos_adicionales']:
                        producto_ids.add(pago['datos_adicionales']['producto_id'])
            
            if producto_ids:
                # Convertir a lista para la consulta
                producto_ids_list = list(producto_ids)
                productos = supabase.table('productos').select('*').in_('id', producto_ids_list).execute()
                
                if productos.data:
                    for producto in productos.data:
                        productos_venta.append({
                            'id': producto['id'],
                            'nombre': producto['nombre'],
                            'precio': producto['precio'],
                            'cantidad': 1  # Valor por defecto si no conocemos la cantidad
                        })
        
        # Calcular valores totales
        total_pagado = sum(pago['monto'] for pago in pagos.data) if pagos.data else venta.data[0].get('total', 0)
        subtotal = venta.data[0].get('total', 0) + venta.data[0].get('descuento', 0)
        saldo_pendiente = max(0, venta.data[0].get('total', 0) - total_pagado)
        
        # Determinar el método de pago
        metodo_pago = venta.data[0].get('metodo_pago', 'efectivo')  # Usar el guardado en la venta si existe
        if pagos.data:
            if len(pagos.data) == 1:
                metodo_pago = pagos.data[0]['metodo_pago']
            else:
                metodo_pago = 'mixto'
        
        # Determinar el estado basado en los pagos o en la presencia de un método de pago
        # Si hay pagos registrados
        if pagos.data:
            if total_pagado >= venta.data[0].get('total', 0):
                estado = 'pagado'
            elif total_pagado > 0:
                estado = 'parcial'
            else:
                estado = 'pendiente'
        else:
            # Si no hay pagos registrados pero hay un método de pago en la venta, se considera pagada
            if metodo_pago:
                estado = 'pagado'
                total_pagado = venta.data[0].get('total', 0)  # Asumir que está pagado completamente
                saldo_pendiente = 0
            else:
                estado = 'pendiente'
        
        # Para depuración
        print(f"Detalle venta ID {venta_id}: método={metodo_pago}, estado={estado}, total={venta.data[0].get('total', 0)}, pagado={total_pagado}")
        
        # Preparar objeto de venta enriquecido
        venta_completa = venta.data[0]
        venta_completa['pagos'] = pagos.data
        venta_completa['productos'] = productos_venta
        venta_completa['subtotal'] = subtotal
        venta_completa['total_pagado'] = total_pagado
        venta_completa['saldo_pendiente'] = saldo_pendiente
        venta_completa['metodo_pago'] = metodo_pago
        venta_completa['estado'] = estado
        
        return jsonify(venta_completa), 200
        
    except Exception as e:
        print(f"Error en obtener_venta: {str(e)}")
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
        detalles_query = supabase.table('productos').select('*')
        
        # Filtrar por producto si se proporciona
        if producto_id:
            detalles_query = detalles_query.eq('id', int(producto_id))
            
        # Filtrar por ventas del período
        detalles = detalles_query.in_('id', venta_ids).execute()
        
        # Agrupar por producto
        productos_vendidos = {}
        
        for detalle in detalles.data:
            producto_id = detalle['id']
            cantidad = detalle.get('cantidad', 0)
            subtotal = detalle.get('precio', 0) * cantidad
            
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
