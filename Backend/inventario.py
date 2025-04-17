#Propósito: Actualización de stock y registro de historial de cambios.

from flask import Blueprint, request, jsonify
from supabase import create_client
import datetime

# Supabase credenciales para la conexion
SUPABASE_URL = "https://mhtytsmkqwydaixzjngz.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1odHl0c21rcXd5ZGFpeHpqbmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwNTE1MzIsImV4cCI6MjA1NjYyNzUzMn0.FBJE6ltV55xQwS1Ob_pHITgpryo3pNcT3kj--vA2JKI"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

inventario_bp = Blueprint('inventario', __name__)

@inventario_bp.route('/inventario', methods=['GET'])
def obtener_inventario():
    try:
        # Obtener todos los productos con su información de stock
        productos = supabase.table('productos').select('id, nombre, stock, precio').execute()
        
        # Filtrar productos con stock bajo (menos de 10 unidades)
        stock_bajo = [p for p in productos.data if p['stock'] < 10]
        
        return jsonify({
            "productos": productos.data,
            "total_productos": len(productos.data),
            "stock_bajo": stock_bajo,
            "productos_sin_stock": [p for p in productos.data if p['stock'] <= 0]
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@inventario_bp.route('/inventario/<int:producto_id>', methods=['GET'])
def obtener_stock_producto(producto_id):
    try:
        # Obtener la información de stock de un producto específico
        producto = supabase.table('productos').select('id, nombre, stock, precio').eq('id', producto_id).execute()
        
        if not producto.data:
            return jsonify({"error": "Producto no encontrado"}), 404
            
        # Obtener historial de cambios si existe una tabla para ello
        try:
            historial = supabase.table('historial_inventario').select('*').eq('producto_id', producto_id).order('fecha', desc=True).limit(10).execute()
            historial_data = historial.data
        except:
            historial_data = []
            
        return jsonify({
            "producto": producto.data[0],
            "historial": historial_data
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@inventario_bp.route('/inventario/<int:producto_id>', methods=['PUT'])
def actualizar_stock(producto_id):
    try:
        data = request.get_json()
        
        # Verificar que se proporcionó el nuevo stock
        if 'stock' not in data:
            return jsonify({"error": "Falta el campo stock"}), 400
            
        nuevo_stock = data['stock']
        
        # Validar que el stock sea un número no negativo
        if nuevo_stock < 0:
            return jsonify({"error": "El stock no puede ser negativo"}), 400
            
        # Obtener stock actual para registrar el cambio
        producto_actual = supabase.table('productos').select('stock').eq('id', producto_id).execute()
        
        if not producto_actual.data:
            return jsonify({"error": "Producto no encontrado"}), 404
            
        stock_anterior = producto_actual.data[0]['stock']
        
        # Actualizar el stock del producto
        producto_actualizado = supabase.table('productos').update({'stock': nuevo_stock}).eq('id', producto_id).execute()
        
        # Registrar el cambio en el historial
        try:
            historial = {
                "producto_id": producto_id,
                "stock_anterior": stock_anterior,
                "stock_nuevo": nuevo_stock,
                "diferencia": nuevo_stock - stock_anterior,
                "fecha": datetime.datetime.now().isoformat(),
                "usuario": data.get('usuario', 'sistema'),
                "motivo": data.get('motivo', 'Actualización manual')
            }
            
            supabase.table('historial_inventario').insert(historial).execute()
        except Exception as e:
            # Si la tabla no existe, continuamos sin registrar historial
            print(f"Error al registrar historial: {str(e)}")
        
        return jsonify({
            "mensaje": "Stock actualizado correctamente",
            "producto": producto_actualizado.data[0],
            "cambio": nuevo_stock - stock_anterior
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@inventario_bp.route('/inventario/ajuste', methods=['POST'])
def ajuste_inventario():
    try:
        data = request.get_json()
        
        if not isinstance(data, list):
            return jsonify({"error": "Se espera una lista de ajustes"}), 400
            
        resultados = []
        
        for ajuste in data:
            if 'producto_id' not in ajuste or 'cantidad' not in ajuste:
                resultados.append({
                    "producto_id": ajuste.get('producto_id', 'desconocido'),
                    "exito": False,
                    "error": "Faltan campos requeridos"
                })
                continue
                
            producto_id = ajuste['producto_id']
            cantidad = ajuste['cantidad']  # Puede ser positivo (entrada) o negativo (salida)
            motivo = ajuste.get('motivo', 'Ajuste de inventario')
            
            # Obtener stock actual
            producto = supabase.table('productos').select('id, nombre, stock').eq('id', producto_id).execute()
            
            if not producto.data:
                resultados.append({
                    "producto_id": producto_id,
                    "exito": False,
                    "error": "Producto no encontrado"
                })
                continue
                
            stock_actual = producto.data[0]['stock']
            nuevo_stock = stock_actual + cantidad
            
            # Verificar que el stock no sea negativo
            if nuevo_stock < 0:
                resultados.append({
                    "producto_id": producto_id,
                    "exito": False,
                    "error": "El stock resultante sería negativo"
                })
                continue
                
            # Actualizar stock
            producto_actualizado = supabase.table('productos').update({'stock': nuevo_stock}).eq('id', producto_id).execute()
            
            # Registrar en historial
            try:
                historial = {
                    "producto_id": producto_id,
                    "stock_anterior": stock_actual,
                    "stock_nuevo": nuevo_stock,
                    "diferencia": cantidad,
                    "fecha": datetime.datetime.now().isoformat(),
                    "usuario": ajuste.get('usuario', 'sistema'),
                    "motivo": motivo
                }
                
                supabase.table('historial_inventario').insert(historial).execute()
            except Exception as e:
                print(f"Error al registrar historial: {str(e)}")
                
            resultados.append({
                "producto_id": producto_id,
                "nombre": producto.data[0]['nombre'],
                "exito": True,
                "stock_anterior": stock_actual,
                "stock_nuevo": nuevo_stock,
                "diferencia": cantidad
            })
            
        return jsonify({
            "resultados": resultados,
            "exitosos": sum(1 for r in resultados if r.get('exito', False)),
            "fallidos": sum(1 for r in resultados if not r.get('exito', False))
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@inventario_bp.route('/inventario/historial', methods=['GET'])
def obtener_historial():
    try:
        # Obtener parámetros de filtrado
        producto_id = request.args.get('producto_id')
        fecha_desde = request.args.get('fecha_desde')
        fecha_hasta = request.args.get('fecha_hasta')
        limite = int(request.args.get('limite', 100))
        
        # Construir consulta
        query = supabase.table('historial_inventario').select('*')
        
        if producto_id:
            query = query.eq('producto_id', int(producto_id))
            
        if fecha_desde:
            query = query.gte('fecha', fecha_desde)
            
        if fecha_hasta:
            query = query.lte('fecha', fecha_hasta)
            
        # Ejecutar consulta ordenada por fecha descendente
        historial = query.order('fecha', desc=True).limit(limite).execute()
        
        return jsonify(historial.data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
