#Propósito: Gestión de pagos divididos y registro de pagos sin pasarela.

from flask import Blueprint, request, jsonify
from supabase import create_client
import datetime
import os
import sys
from dotenv import load_dotenv

# Cargar variables de entorno desde .env si existe
load_dotenv()

# Supabase credenciales para la conexion - usando variables de entorno
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY')

# Verificar que las credenciales de Supabase están configuradas
if not SUPABASE_URL or not SUPABASE_KEY:
    # En desarrollo, usa los valores predeterminados
    if os.environ.get('FLASK_ENV') == 'development':
        SUPABASE_URL = "https://mhtytsmkqwydaixzjngz.supabase.co"
        SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1odHl0c21rcXd5ZGFpeHpqbmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwNTE1MzIsImV4cCI6MjA1NjYyNzUzMn0.FBJE6ltV55xQwS1Ob_pHITgpryo3pNcT3kj--vA2JKI"
        print("Warning: Using default Supabase credentials for development in pagos.py")
    else:
        # En producción, deben estar configuradas las variables de entorno
        print("Error: SUPABASE_URL and SUPABASE_KEY environment variables must be set in production")
        # No detener el módulo por este error, pero registrar claramente el problema

# Inicializar cliente de Supabase
try:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    print(f"Error initializing Supabase client in pagos.py: {e}")
    if os.environ.get('FLASK_ENV') != 'development':
        # En producción, es un error crítico pero no detenemos todo el sistema
        print("Critical error in pagos module, payment functionality may not work")

pagos_bp = Blueprint('pagos', __name__)

@pagos_bp.route('/pagos', methods=['POST'])
def procesar_pago():
    try:
        data = request.get_json()
        
        # Validación básica de datos
        if not data:
            return jsonify({"error": "No se recibieron datos del pago"}), 400
            
        # Validar campos requeridos
        campos_requeridos = ['venta_id', 'metodo_pago', 'monto']
        campos_faltantes = [campo for campo in campos_requeridos if campo not in data]
        if campos_faltantes:
            return jsonify({
                "error": "Datos incompletos", 
                "campos_faltantes": campos_faltantes
            }), 400
            
        # Validar monto positivo
        if not isinstance(data['monto'], (int, float)) or data['monto'] <= 0:
            return jsonify({"error": "El monto del pago debe ser un número mayor que cero"}), 400
            
        # Verificar si la venta existe y obtener detalles
        try:
            # Usar transacción para mantener consistencia
            with supabase.table('ventas').select('*').eq('id', data['venta_id']) as venta_query:
                venta = venta_query.execute()
                
                if not venta.data:
                    return jsonify({"error": "La venta especificada no existe"}), 404
                    
                venta_data = venta.data[0]
                total_venta = venta_data['total']
                
                # Validar estado de la venta
                if venta_data.get('estado') == 'pagado':
                    return jsonify({"error": "Esta venta ya está pagada completamente"}), 400
                
                # Obtener pagos existentes
                pagos = supabase.table('pagos').select('monto').eq('venta_id', data['venta_id']).execute()
                total_pagado = sum(pago['monto'] for pago in pagos.data)
                saldo_pendiente = total_venta - total_pagado
                
                # Validar que no exceda el saldo pendiente
                if data['monto'] > saldo_pendiente:
                    return jsonify({
                        "error": "El monto excede el saldo pendiente",
                        "saldo_pendiente": saldo_pendiente,
                        "monto_recibido": data['monto']
                    }), 400
                
                # Preparar datos del pago
                pago_data = {
                    'venta_id': data['venta_id'],
                    'metodo_pago': data['metodo_pago'],
                    'monto': data['monto'],
                    'referencia': data.get('referencia', ''),
                    'estado': 'completado',
                    'fecha': data.get('fecha', datetime.datetime.now().isoformat())
                }
                
                # Registrar el pago
                nuevo_pago = supabase.table('pagos').insert(pago_data).execute()
                
                # Actualizar estado de la venta si es necesario
                if total_pagado + data['monto'] >= total_venta:
                    supabase.table('ventas').update({
                        'estado': 'pagado',
                        'fecha_pago': datetime.datetime.now().isoformat()
                    }).eq('id', data['venta_id']).execute()
                
                return jsonify({
                    "mensaje": "Pago procesado correctamente",
                    "pago": nuevo_pago.data[0],
                    "total_venta": total_venta,
                    "total_pagado": total_pagado + data['monto'],
                    "saldo_pendiente": max(0, total_venta - (total_pagado + data['monto'])),
                    "pago_completado": total_pagado + data['monto'] >= total_venta
                }), 201
                
        except Exception as e:
            return jsonify({"error": f"Error al procesar el pago: {str(e)}"}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@pagos_bp.route('/pagos/<int:pago_id>', methods=['GET'])
def obtener_pago(pago_id):
    try:
        pago = supabase.table('pagos').select('*').eq('id', pago_id).execute()
        
        if not pago.data:
            return jsonify({"error": "Pago no encontrado"}), 404
            
        return jsonify(pago.data[0]), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@pagos_bp.route('/pagos/venta/<int:venta_id>', methods=['GET'])
def obtener_pagos_venta(venta_id):
    try:
        pagos = supabase.table('pagos').select('*').eq('venta_id', venta_id).execute()
        
        # Calcular total pagado
        total_pagado = sum(pago['monto'] for pago in pagos.data)
        
        return jsonify({
            "pagos": pagos.data,
            "total_pagado": total_pagado,
            "cantidad_pagos": len(pagos.data)
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@pagos_bp.route('/pagos/split', methods=['POST'])
def procesar_pago_dividido():
    try:
        data = request.get_json()
        
        # Validación básica de la solicitud
        if not data:
            return jsonify({"error": "No se recibieron datos del pago"}), 400
            
        # Validar campos requeridos
        if 'pagos' not in data or not isinstance(data['pagos'], list):
            return jsonify({"error": "Se requiere una lista de pagos"}), 400
        if not data['pagos']:
            return jsonify({"error": "La lista de pagos está vacía"}), 400
            
        if 'venta_id' not in data:
            return jsonify({"error": "Falta el ID de venta"}), 400
            
        # Validar la venta y obtener el total
        try:
            # Usar transacción para mantener consistencia
            with supabase.table('ventas').select('total,estado').eq('id', data['venta_id']) as venta_query:
                venta = venta_query.execute()
                if not venta.data:
                    return jsonify({"error": "La venta especificada no existe"}), 404
                    
                venta_data = venta.data[0]
                total_venta = venta_data['total']
                
                # Validar que la venta no esté ya pagada
                if venta_data.get('estado') == 'pagado':
                    return jsonify({"error": "Esta venta ya está pagada completamente"}), 400
                
                # Obtener pagos existentes
                pagos_existentes = supabase.table('pagos').select('monto').eq('venta_id', data['venta_id']).execute()
                total_pagado_existente = sum(pago['monto'] for pago in pagos_existentes.data)
                saldo_pendiente = total_venta - total_pagado_existente
                
                # Validar que existe saldo pendiente
                if saldo_pendiente <= 0:
                    return jsonify({
                        "error": "La venta ya está pagada completamente",
                        "total_venta": total_venta,
                        "total_pagado": total_pagado_existente
                    }), 400
                
                # Validar suma de pagos nuevos
                total_pagos_nuevos = sum(pago.get('monto', 0) for pago in data['pagos'])
                if total_pagos_nuevos > saldo_pendiente:
                    return jsonify({
                        "error": "El total de los pagos excede el saldo pendiente",
                        "saldo_pendiente": saldo_pendiente,
                        "total_pagos": total_pagos_nuevos
                    }), 400
                    
                resultados = []
                total_procesado = 0
                
                # Procesar cada pago
                for pago in data['pagos']:
                    # Validar campos mínimos
                    if not pago.get('metodo_pago') or not isinstance(pago.get('monto'), (int, float)) or pago['monto'] <= 0:
                        resultados.append({
                            "exito": False,
                            "error": "Datos de pago inválidos",
                            "pago": pago
                        })
                        continue
                    
                    # Preparar datos del pago
                    pago_data = {
                        'venta_id': data['venta_id'],
                        'metodo_pago': pago['metodo_pago'],
                        'monto': pago['monto'],
                        'referencia': pago.get('referencia', ''),
                        'estado': 'completado',
                        'fecha': pago.get('fecha', datetime.datetime.now().isoformat())
                    }
                    
                    # Registrar el pago
                    try:
                        nuevo_pago = supabase.table('pagos').insert(pago_data).execute()
                        total_procesado += pago['monto']
                        resultados.append({
                            "exito": True,
                            "pago": nuevo_pago.data[0]
                        })
                    except Exception as e:
                        resultados.append({
                            "exito": False,
                            "error": str(e),
                            "pago": pago
                        })
                
                # Actualizar estado de la venta si se completó el pago
                if total_pagado_existente + total_procesado >= total_venta:
                    supabase.table('ventas').update({
                        'estado': 'pagado',
                        'fecha_pago': datetime.datetime.now().isoformat()
                    }).eq('id', data['venta_id']).execute()
                
                return jsonify({
                    "mensaje": f"Procesados {len([r for r in resultados if r['exito']])} de {len(data['pagos'])} pagos",
                    "total_procesado": total_procesado,
                    "saldo_pendiente": max(0, saldo_pendiente - total_procesado),
                    "resultados": resultados
                }), 201
                
        except Exception as e:
            return jsonify({"error": f"Error al procesar los pagos: {str(e)}"}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@pagos_bp.route('/pagos/metodos', methods=['GET'])
def obtener_metodos_pago():
    try:
        # Métodos de pago predefinidos o desde base de datos
        metodos = [
            {"id": "efectivo", "nombre": "Efectivo"},
            {"id": "tarjeta", "nombre": "Tarjeta de Crédito/Débito"},
            {"id": "transferencia", "nombre": "Transferencia Bancaria"},
            {"id": "movil", "nombre": "Pago Móvil"}
        ]
        
        # Intentar obtener métodos de pago personalizados de la base de datos
        try:
            metodos_db = supabase.table('metodos_pago').select('*').execute()
            # Si existen en la base de datos, usar esos
            if metodos_db.data:
                metodos = metodos_db.data
        except:
            # Si la tabla no existe, usar los predefinidos
            pass
            
        return jsonify(metodos), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@pagos_bp.route('/pagos/metodos', methods=['POST'])
def agregar_metodo_pago():
    try:
        data = request.get_json()
        
        # Validar que contenga los campos necesarios
        if 'id' not in data or 'nombre' not in data:
            return jsonify({"error": "Falta id o nombre del método de pago"}), 400
            
        # Intentar agregar a la base de datos
        try:
            nuevo_metodo = supabase.table('metodos_pago').insert(data).execute()
            return jsonify(nuevo_metodo.data[0]), 201
        except:
            # Si la tabla no existe, crear la tabla e intentar nuevamente
            try:
                # Aquí se podría añadir lógica para crear la tabla, pero depende de
                # cómo se manejan las migraciones en tu aplicación
                return jsonify({"error": "No se pudo crear el método de pago. Tabla no existe."}), 500
            except Exception as e:
                return jsonify({"error": str(e)}), 500
                
    except Exception as e:
        return jsonify({"error": str(e)}), 500
