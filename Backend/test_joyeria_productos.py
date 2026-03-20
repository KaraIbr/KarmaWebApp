import requests
import json
import time

# URL base de la API en producción
BASE_URL = "https://karmaapi-z51n.onrender.com/api"

def print_separator():
    print("\n" + "="*50 + "\n")

def agregar_productos_joyeria():
    print("AGREGANDO PRODUCTOS DE JOYERÍA A LA API")
    print_separator()

    # Lista de productos de joyería para agregar
    productos_joyeria = [
        {
            "nombre": "Pulsera de Oro",
            "descripcion": "Pulsera elegante bañada en oro de 18k",
            "precio": 120.00,
            "categoria": "Mujer",
            "color": "Dorado",
            "disponible": True,
            "stock": 9,
            "imagen_url": "https://images.unsplash.com/photo-1611652022419-a9419f74343c?q=80&w=1974&auto=format&fit=crop"
        },
        {
            "nombre": "Collar de Plata",
            "descripcion": "Collar de plata 925 con dije de corazón",
            "precio": 150.00,
            "categoria": "Mujer",
            "color": "Plateado",
            "disponible": True,
            "stock": 7,
            "imagen_url": "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?q=80&w=1974&auto=format&fit=crop"
        },
        {
            "color": "Plateado",
            "stock": 5
        },
        {
            "nombre": "Aretes de Perlas",
            "descripcion": "Aretes de perlas cultivadas con base de oro",
            "precio": 85.00,
            "categoria": "Mujer",
            "color": "Blanco",
            "stock": 12
        },
        {
            "nombre": "Pulsera para Hombre",
            "descripcion": "Pulsera de cuero trenzado con cierre magnético",
            "precio": 65.00,
            "categoria": "Hombre",
            "color": "Negro",
            "stock": 15
        }
    ]
    
    productos_creados = []
    
    for producto in productos_joyeria:
        try:
            print(f"Agregando producto: {producto['nombre']}")
            
            # Agregar encabezados HTTP adicionales
            headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
            
            # Imprimir los datos que se van a enviar para depuración
            print(f"Datos a enviar: {json.dumps(producto, indent=2)}")
            
            response = requests.post(f"{BASE_URL}/productos", 
                                    json=producto, 
                                    headers=headers)
            
            # Imprimir la respuesta completa para depuración
            print(f"Código de estado HTTP: {response.status_code}")
            print(f"Respuesta recibida: {response.text}")
            
            response.raise_for_status()
            producto_creado = response.json()
            
            print(f"✅ Producto creado exitosamente con ID: {producto_creado['id']}")
            productos_creados.append({
                "id": producto_creado['id'],
                "nombre": producto_creado['nombre'],
                "categoria": producto_creado['categoria'],
                "precio": producto_creado['precio']
            })
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Error al crear producto '{producto['nombre']}': {e}")
            if hasattr(e, 'response') and e.response:
                print(f"Respuesta completa del error: {e.response.text}")
        
        # Pausa breve para no sobrecargar la API
        time.sleep(1)
    
    print_separator()
    print("RESUMEN DE PRODUCTOS CREADOS:")
    
    for producto in productos_creados:
        print(f"ID: {producto['id']} - {producto['nombre']} - {producto['categoria']} - ${producto['precio']}")
    
    print(f"\nTotal de productos creados: {len(productos_creados)}")
    print_separator()

if __name__ == "__main__":
    agregar_productos_joyeria()