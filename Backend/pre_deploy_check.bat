@echo off
echo ===== VERIFICACIÓN PRE-DESPLIEGUE =====

echo 1. Ejecutando pruebas...
python -m pytest

echo 2. Verificando formato del código...
python -m pycodestyle --max-line-length=120 app.py usuarios.py productos.py carrito.py ventas.py pagos.py inventario.py || echo "ADVERTENCIA: Se encontraron problemas de formato. Considera corregirlos antes de desplegar."

echo 3. Verificando variables de entorno...
python -c "import os; required_vars=['SUPABASE_URL', 'SUPABASE_KEY']; missing = [var for var in required_vars if not os.environ.get(var)]; print('Variables de entorno verificadas: ' + ('OK' if not missing else 'Faltan: ' + ', '.join(missing)))"

echo ===== VERIFICACIÓN COMPLETADA =====
echo Recuerda actualizar render.yaml si has realizado cambios en las dependencias o configuraciones.