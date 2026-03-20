#!/bin/bash
# Script de limpieza para KarmaWebApp - Linux/macOS

echo "Iniciando limpieza de KarmaWebApp..."

# Eliminar componentes pesados
echo "Eliminando componentes pesados..."
rm -f src/components/AnimatedBackground.jsx
rm -f src/components/MetaBalls.jsx

# Eliminar archivos de configuración Firebase
echo "Eliminando archivos de Firebase..."
rm -f firebase.json
rm -f .firebaserc
rm -rf .firebase/

# Desinstalar dependencias innecesarias
echo "Desinstalando dependencias innecesarias..."
npm uninstall @emotion/react @emotion/styled @mui/icons-material @mui/material firebase font-awesome html2canvas jspdf ogl

# Limpiar caché de npm
echo "Limpiando caché npm..."
npm cache clean --force

# Reconstruir node_modules con dependencias actualizadas
echo "Reconstruyendo node_modules..."
rm -rf node_modules
npm install

echo "Limpieza completada con éxito."
echo "Ahora puede ejecutar 'npm start' para iniciar la aplicación optimizada."