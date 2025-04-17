#Propósito: Gestión de pagos divididos y registro de pagos sin pasarela.

from flask import Blueprint, request, jsonify
from supabase import create_client
import datetime
import os
from dotenv import load_dotenv

# Cargar variables de entorno desde .env si existe
load_dotenv()

# Supabase credenciales para la conexion - usando variables de entorno
SUPABASE_URL = os.environ.get('SUPABASE_URL', "https://mhtytsmkqwydaixzjngz.supabase.co")
SUPABASE_KEY = os.environ.get('SUPABASE_KEY', "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1odHl0c21rcXd5ZGFpeHpqbmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwNTE1MzIsImV4cCI6MjA1NjYyNzUzMn0.FBJE6ltV55xQwS1Ob_pHITgpryo3pNcT3kj--vA2JKI")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

pagos_bp = Blueprint('pagos', __name__)

@pagos_bp.route('/pagos', methods=['POST'])
def procesar_pago():
    try:
        data = request.get_json()
        
        # Validar que contenga los campos necesarios
        campos_requeridos = ['venta_id', 'metodo_pago', 'monto']
        for campo in campos_requeridos:
            if campo not in data:
                return jsonify({"error": f"Falta el campo requerido: {campo}"}), 400
                
        # Agregar fecha actual si no se proporciona
        if 'fecha' not in data:
            data['fecha'] = datetime.datetime.now().isoformat()
            
        # Registrar el pago en la base de datos
        nuevo_pago = supabase.table('pagos').insert(data).execute()
        
        return jsonify({
            "mensaje": "Pago procesado correctamente",
            "pago": nuevo_pago.data[0]
        }), 201
        
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
        
        # Validar que se proporcionen los pagos divididos
        if 'pagos' not in data or not isinstance(data['pagos'], list):
            return jsonify({"error": "Se requiere una lista de pagos"}), 400
            
        # Validar que exista el ID de venta
        if 'venta_id' not in data:
            return jsonify({"error": "Falta el ID de venta"}), 400
            
        venta_id = data['venta_id']
        pagos = data['pagos']
        
        resultados = []
        
        # Procesar cada pago individualmente
        for pago in pagos:
            # Agregar venta_id a cada pago
            pago['venta_id'] = venta_id
            
            # Validar campos mínimos en cada pago
            if 'metodo_pago' not in pago or 'monto' not in pago:
                resultados.append({
                    "exito": False,
                    "error": "Falta método de pago o monto",
                    "pago": pago
                })
                continue
                
            # Agregar fecha actual si no se proporciona
            if 'fecha' not in pago:
                pago['fecha'] = datetime.datetime.now().isoformat()
                
            # Registrar el pago
            nuevo_pago = supabase.table('pagos').insert(pago).execute()
            
            resultados.append({
                "exito": True,
                "pago": nuevo_pago.data[0]
            })
            
        # Calcular total procesado
        total_procesado = sum(resultado['pago']['monto'] for resultado in resultados if resultado['exito'])
        pagos_exitosos = sum(1 for resultado in resultados if resultado['exito'])
        
        return jsonify({
            "mensaje": f"Procesados {pagos_exitosos} de {len(pagos)} pagos",
            "total_procesado": total_procesado,
            "resultados": resultados
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@pagos_bp.route('/metodos-pago', methods=['GET'])
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

@pagos_bp.route('/metodos-pago', methods=['POST'])
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
