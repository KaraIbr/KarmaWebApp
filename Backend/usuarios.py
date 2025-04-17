# Gestión CRUD de usuarios y autenticación

from flask import Blueprint, request, jsonify
from supabase import create_client
import hashlib
import secrets
import datetime

# Supabase credenciales para la conexion
SUPABASE_URL = "https://mhtytsmkqwydaixzjngz.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1odHl0c21rcXd5ZGFpeHpqbmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwNTE1MzIsImV4cCI6MjA1NjYyNzUzMn0.FBJE6ltV55xQwS1Ob_pHITgpryo3pNcT3kj--vA2JKI"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

usuarios_bp = Blueprint('usuarios', __name__)

# Rutas para Usuarios (CRUD)
@usuarios_bp.route('/usuarios', methods=['GET'])
def obtener_usuarios():
    try:
        # Puedes añadir filtros opcionales
        role = request.args.get('role')
        
        # Eliminando la columna 'telefono' que no existe en la tabla
        query = supabase.table('usuarios').select('id, nombre, correo, direccion, role, created_at, last_login')
        
        if role:
            query = query.eq('role', role)
            
        usuarios = query.execute()
        return jsonify(usuarios.data), 200
    except Exception as e:
        print(f"Error obteniendo usuarios: {str(e)}")
        return jsonify({"error": str(e)}), 500

@usuarios_bp.route('/usuarios/<int:id>', methods=['GET'])
def obtener_usuario_by_id(id):
    try:
        # Eliminando la columna 'telefono' que no existe en la tabla
        usuario = supabase.table('usuarios').select('id, nombre, correo, direccion, role, created_at, last_login').eq('id', id).execute()
        if not usuario.data:
            return jsonify({"error": "Usuario no encontrado"}), 404
        return jsonify(usuario.data[0]), 200
    except Exception as e:
        print(f"Error obteniendo usuario {id}: {str(e)}")
        return jsonify({"error": str(e)}), 500
    
@usuarios_bp.route('/usuarios', methods=['POST'])
def crear_usuario():
    try:
        data = request.get_json()
        
        # Verificar que los campos requeridos estén presentes
        required_fields = ['nombre', 'correo', 'password']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Campo requerido: {field}"}), 400
        
        # Verificar si el correo ya existe
        check_email = supabase.table('usuarios').select('id').eq('correo', data['correo']).execute()
        if check_email.data:
            return jsonify({"error": "El correo ya está registrado"}), 409
        
        # Hashear la contraseña antes de guardarla
        password_hash = hashlib.sha256(data['password'].encode()).hexdigest()
        
        # Reemplazar la contraseña plana con el hash
        data['password'] = password_hash
        
        # Agregar campos adicionales
        data['created_at'] = datetime.datetime.now().isoformat()
        data['role'] = data.get('role', 'cliente')  # Por defecto, rol cliente
        
        # Insertar el nuevo usuario
        nuevo_usuario = supabase.table('usuarios').insert(data).execute()
        
        # No devolver la contraseña en la respuesta
        usuario_respuesta = {k: v for k, v in nuevo_usuario.data[0].items() if k != 'password'}
        
        return jsonify(usuario_respuesta), 201
    except Exception as e:
        print(f"Error creando el usuario: {str(e)}")
        return jsonify({"error": str(e)}), 500
    
@usuarios_bp.route('/usuarios/<int:id>', methods=['PUT'])
def actualizar_usuario(id):
    try:
        data = request.get_json()
        
        # Si se está actualizando la contraseña, hashearla
        if 'password' in data:
            data['password'] = hashlib.sha256(data['password'].encode()).hexdigest()
        
        # Actualizar el usuario
        usuario_actualizado = supabase.table('usuarios').update(data).eq('id', id).execute()
        
        # Verificar si el usuario existe
        if not usuario_actualizado.data:
            return jsonify({"error": "Usuario no encontrado"}), 404
            
        # No devolver la contraseña en la respuesta
        usuario_respuesta = {k: v for k, v in usuario_actualizado.data[0].items() if k != 'password'}
        
        return jsonify(usuario_respuesta), 200
    except Exception as e:
        print(f"Error actualizando el usuario {id}: {str(e)}")
        return jsonify({"error": str(e)}), 500

@usuarios_bp.route('/usuarios/<int:id>', methods=['DELETE'])
def eliminar_usuario(id):
    try:
        # Verificar si el usuario existe
        usuario = supabase.table('usuarios').select('id').eq('id', id).execute()
        if not usuario.data:
            return jsonify({"error": "Usuario no encontrado"}), 404
            
        # Eliminar el usuario
        supabase.table('usuarios').delete().eq('id', id).execute()
        return jsonify({"message": "Usuario eliminado correctamente"}), 200
    except Exception as e:
        print(f"Error eliminando el usuario {id}: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Autenticación y manejo de sesiones
@usuarios_bp.route('/auth/login', methods=['POST', 'OPTIONS'])
def login():
    # Manejar solicitudes OPTIONS para CORS preflight
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        data = request.get_json()
        
        # Verificar que correo y password estén presentes
        if 'correo' not in data or 'password' not in data:
            return jsonify({"error": "Correo y password son requeridos"}), 400
        
        # Hashear la contraseña para compararla
        password_hash = hashlib.sha256(data['password'].encode()).hexdigest()
        
        # Buscar el usuario por correo
        usuario = supabase.table('usuarios').select('*').eq('correo', data['correo']).execute()
        
        if not usuario.data:
            return jsonify({"error": "Credenciales inválidas"}), 401
        
        # Verificar la contraseña
        if usuario.data[0]['password'] != password_hash:
            return jsonify({"error": "Credenciales inválidas"}), 401
        
        # Actualizar último login
        supabase.table('usuarios').update({'last_login': datetime.datetime.now().isoformat()}).eq('id', usuario.data[0]['id']).execute()
        
        # Generar sesión o token (simplificado para el ejemplo)
        session_token = secrets.token_hex(32)
        
        # Preparar respuesta sin contraseña
        usuario_respuesta = {k: v for k, v in usuario.data[0].items() if k != 'password'}
        usuario_respuesta['token'] = session_token
        
        return jsonify({
            "message": "Login exitoso",
            "usuario": usuario_respuesta
        }), 200
        
    except Exception as e:
        print(f"Error en login: {str(e)}")
        return jsonify({"error": str(e)}), 500

@usuarios_bp.route('/auth/register', methods=['POST', 'OPTIONS'])
def register():
    # Manejar solicitudes OPTIONS para CORS preflight
    if request.method == 'OPTIONS':
        return '', 200
    
    # Reutilizar la función de crear usuario
    return crear_usuario()

@usuarios_bp.route('/auth/profile', methods=['GET', 'OPTIONS'])
def get_profile():
    # Manejar solicitudes OPTIONS para CORS preflight
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        # Aquí normalmente verificarías el token de autenticación
        # Para simplificar, asumimos que el ID viene en el query string
        user_id = request.args.get('id')
        
        if not user_id:
            return jsonify({"error": "Se requiere ID de usuario"}), 400
            
        return obtener_usuario_by_id(int(user_id))
        
    except Exception as e:
        print(f"Error obteniendo perfil: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Endpoint para cambiar contraseña
@usuarios_bp.route('/usuarios/<int:id>/change-password', methods=['POST', 'OPTIONS'])
def cambiar_password(id):
    # Manejar solicitudes OPTIONS para CORS preflight
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        data = request.get_json()
        
        if 'current_password' not in data or 'new_password' not in data:
            return jsonify({"error": "Se requieren contraseña actual y nueva"}), 400
            
        # Obtener usuario
        usuario = supabase.table('usuarios').select('*').eq('id', id).execute()
        
        if not usuario.data:
            return jsonify({"error": "Usuario no encontrado"}), 404
            
        # Verificar contraseña actual
        current_hash = hashlib.sha256(data['current_password'].encode()).hexdigest()
        if usuario.data[0]['password'] != current_hash:
            return jsonify({"error": "Contraseña actual incorrecta"}), 401
            
        # Actualizar con nueva contraseña
        new_hash = hashlib.sha256(data['new_password'].encode()).hexdigest()
        supabase.table('usuarios').update({'password': new_hash}).eq('id', id).execute()
        
        return jsonify({"message": "Contraseña actualizada correctamente"}), 200
        
    except Exception as e:
        print(f"Error cambiando contraseña: {str(e)}")
        return jsonify({"error": str(e)}), 500