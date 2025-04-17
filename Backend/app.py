from flask import Flask, request, jsonify
from supabase import create_client
from flask_cors import CORS
import hashlib  # Add this import for generating hash codes
# Importar el Blueprint de usuarios
from usuarios import usuarios_bp

app = Flask(__name__)
# Registrar el Blueprint de usuarios con prefijo de URL
app.register_blueprint(usuarios_bp, url_prefix='/usuarios')

#Permitir react / js para que pueda hacer peticiones a la API
#En nuestro caso se trabajo con react asi q localhost puerto 3000
CORS(app, resources={
    r"/*": {
        "origins": [
            "http://127.0.0.1:5501",
            "http://localhost:5501",
            "http://localhost:3000", 
            "http://127.0.0.1:3000",
             "http://localhost:3001", 
            "http://127.0.0.1:3001"  
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})


# Supabase credenciales para la conexion
SUPABASE_URL = "https://mhtytsmkqwydaixzjngz.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1odHl0c21rcXd5ZGFpeHpqbmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwNTE1MzIsImV4cCI6MjA1NjYyNzUzMn0.FBJE6ltV55xQwS1Ob_pHITgpryo3pNcT3kj--vA2JKI"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


# Rutas para Productos (CRUD)
#obtenemos todos y los formateamos en json
@app.route('/productos', methods=['GET'])
def obtener_prod():
    try:
        productos = supabase.table('productos').select('*').execute()
        return jsonify(productos.data), 200

    except Exception as e:
        print(f"Error getting products: {str(e)}")
        return str(e), 500

#obtenemos por id
@app.route('/productos/<int:id>', methods=['GET'])
def obtener_prod_by_id(id):
    try:
        producto = supabase.table('productos').select('*').eq('id', id).execute()
        if not producto.data:
            return "Producto no encontrado", 404
        return str(producto.data[0]), 200
    except Exception as e:
        print(f"Error getting product {id}: {str(e)}")
        return str(e), 500
    
#agregamos un producto nuevo (devuelve el json)
@app.route('/productos', methods=['POST'])
def agregar_prod():
    try:
        data = request.get_json()
        nuevo_producto = supabase.table('productos').insert(data).execute()
        return jsonify(nuevo_producto.data[0]), 201  # Retornar el primer objeto de la lista
    except Exception as e:
        print(f"Error creando el producto: {str(e)}")
        return str(e), 500
    
#modificamos un producto existente por su id asociado
@app.route('/productos/<int:id>', methods=['PUT'])
def modificar_prod(id):
    try:
        data = request.get_json()
        producto_actualizado = supabase.table('productos').update(data).eq('id', id).execute()
        return str(producto_actualizado.data), 200
    except Exception as e:
        print(f"Error actualizando el producto {id}: {str(e)}")
        return str(e), 500

#eliminamos un producto existente por su id asociado
@app.route('/productos/<int:id>', methods=['DELETE'])
def eliminar_prod(id):
    try:
        supabase.table('productos').delete().eq('id', id).execute()
        return "Producto eliminado", 200
    except Exception as e:
        print(f"Error eliminando el producto {id}: {str(e)}")
        return str(e), 500


# usuarios obtener todos y por id
@app.route('/usuarios', methods=['GET', 'POST', 'OPTIONS'])
def obtener_user():
    if request.method == 'OPTIONS':
        return '', 200
    
    if request.method == 'GET':
        usuarios = supabase.table('usuarios').select('*').execute()
        return jsonify(usuarios.data), 200
        
 
# obteneoms usuario por
@app.route('/usuarios/<int:id>', methods=['GET'])
def usuario_operations(id):
    if request.method == 'OPTIONS':
        return '', 200
        
    if request.method == 'GET':
        usuario = supabase.table('usuarios').select('*').eq('id', id).execute()
        if not usuario.data:
            return jsonify({"error": "Usuario no encontrado"}), 404
        return jsonify(usuario.data[0]), 200
        

# Rutas para Ventas
@app.route('/ventas', methods=['POST'])
def crear_venta():
    data = request.get_json()
    new_venta = supabase.table('ventas').insert(data).execute()
    return jsonify(new_venta.data), 201


@app.route('/carrito', methods=['GET'])
def obtener_carrito():
    try:
        # Obtiene todos los elementos del carrito, sin filtro por usuario_id
        carrito = supabase.table('carrito').select('*, productos(*)').execute()
        return jsonify(carrito.data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/carrito', methods=['POST'])
def agregar_carrito():
    try:
        data = request.get_json()

        # Verifica que los datos contengan los campos necesarios (producto_id y cantidad)
        if 'producto_id' not in data or 'cantidad' not in data:
            return jsonify({"error": "Faltan datos: producto_id y cantidad son necesarios"}), 400

        new_item = supabase.table('carrito').insert(data).execute()

        print("Nuevo producto agregado:", new_item.data)

        return jsonify(new_item.data), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/carrito/<int:producto_id>', methods=['DELETE'])
def eliminar_carrito(producto_id):
    try:
        # Elimina el producto del carrito utilizando su id
        deleted_item = supabase.table('carrito').delete().eq('id', producto_id).execute()
        return jsonify({"message": "Producto eliminado"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/productos/<int:id>/qr', methods=['GET'])
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


#Nota el carrito se maneja asi y no por ID del usuario para mejor estructura ante los requerimientos 


if __name__ == '__main__':
    app.run(debug=True)
