#!/bin/bash
# Este es un script de inicio para Render

# Instalar dependencias (Render ya lo hace, pero por si acaso)
pip install -r requirements.txt

# Iniciar la aplicación con Gunicorn
# Especificando el puerto explícitamente
exec gunicorn --bind 0.0.0.0:$PORT app:app