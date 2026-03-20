import requests
import json
import time

# URL base de la API en producción
BASE_URL = "https://karmaapi-z51n.onrender.com/api"

def print_separator():
    print("\n" + "="*50 + "\n")

def test_productos_crud():
    print("PRUEBAS CRUD DE PRODUCTOS")
    print_separator()

    # 1. CREATE - Crear un nuevo producto
    print("1. CREAR UN NUEVO PRODUCTO")
    
    nuevo_producto = {
        "nombre": "Café Especial del Día",
        "descripcion": "Café premium de origen colombiano",
        "precio": 45.50,
        "categoria": "bebidas",
        "disponible": True,
        "stock": 100,
        "imagen_url": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=774&auto=format&fit=crop"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/productos", json=nuevo_producto)
        response.raise_for_status()
        producto_creado = response.json()
        print(f"✅ Producto creado exitosamente con ID: {producto_creado['id']}")
        print(json.dumps(producto_creado, indent=4))
        
        # Guardar el ID para las siguientes operaciones
        producto_id = producto_creado['id']
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error al crear producto: {e}")
        if response.text:
            print(f"Respuesta: {response.text}")
        return
    
    print_separator()
    time.sleep(1)  # Pausa para no sobrecargar la API
    
    # 2. READ - Obtener todos los productos
    print("2. OBTENER TODOS LOS PRODUCTOS")
    
    try:
        response = requests.get(f"{BASE_URL}/productos")
        response.raise_for_status()
        productos = response.json()
        print(f"✅ Se encontraron {len(productos)} productos")
        print(f"Primer producto: {json.dumps(productos[0], indent=4)}")
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error al obtener productos: {e}")
        if response.text:
            print(f"Respuesta: {response.text}")
    
    print_separator()
    time.sleep(1)
    
    # 3. READ - Obtener un producto específico
    print(f"3. OBTENER EL PRODUCTO CON ID: {producto_id}")
    
    try:
        response = requests.get(f"{BASE_URL}/productos/{producto_id}")
        response.raise_for_status()
        producto = response.json()
        print(f"✅ Producto encontrado:")
        print(json.dumps(producto, indent=4))
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error al obtener el producto: {e}")
        if response.text:
            print(f"Respuesta: {response.text}")
    
    print_separator()
    time.sleep(1)
    
    # 4. UPDATE - Actualizar un producto
    print(f"4. ACTUALIZAR EL PRODUCTO CON ID: {producto_id}")
    
    actualizacion = {
        "nombre": "Café Especial del Día (Actualizado)",
        "precio": 49.90,
        "stock": 85
    }
    
    try:
        response = requests.put(f"{BASE_URL}/productos/{producto_id}", json=actualizacion)
        response.raise_for_status()
        producto_actualizado = response.json()
        print(f"✅ Producto actualizado exitosamente:")
        print(json.dumps(producto_actualizado, indent=4))
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error al actualizar el producto: {e}")
        if response.text:
            print(f"Respuesta: {response.text}")
    
    print_separator()
    time.sleep(1)
    
    # 5. Generar código QR para el producto
    print(f"5. GENERAR CÓDIGO QR PARA EL PRODUCTO ID: {producto_id}")
    
    try:
        response = requests.get(f"{BASE_URL}/productos/{producto_id}/qr")
        response.raise_for_status()
        qr_data = response.json()
        print(f"✅ Código QR generado:")
        print(json.dumps(qr_data, indent=4))
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error al generar QR: {e}")
        if response.text:
            print(f"Respuesta: {response.text}")
    
    print_separator()
    time.sleep(1)
    
    # 6. DELETE - Eliminar un producto
    print(f"6. ELIMINAR EL PRODUCTO CON ID: {producto_id}")
    
    eliminar = input("¿Deseas eliminar el producto creado? (s/n): ")
    
    if eliminar.lower() == 's':
        try:
            response = requests.delete(f"{BASE_URL}/productos/{producto_id}")
            response.raise_for_status()
            print(f"✅ Producto eliminado exitosamente")
            if response.text:
                print(f"Respuesta: {response.text}")
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Error al eliminar el producto: {e}")
            if response.text:
                print(f"Respuesta: {response.text}")
    else:
        print("Eliminación cancelada por el usuario")
    
    print_separator()
    print("PRUEBAS CRUD FINALIZADAS")

if __name__ == "__main__":
    test_productos_crud()