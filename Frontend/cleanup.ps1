# Script de limpieza para KarmaWebApp - Windows PowerShell

Write-Host "Iniciando limpieza de KarmaWebApp..." -ForegroundColor Cyan

# Eliminar componentes pesados
Write-Host "Eliminando componentes pesados..." -ForegroundColor Yellow
Remove-Item -Path "src\components\AnimatedBackground.jsx" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "src\components\MetaBalls.jsx" -Force -ErrorAction SilentlyContinue

# Eliminar archivos de configuración Firebase
Write-Host "Eliminando archivos de Firebase..." -ForegroundColor Yellow
Remove-Item -Path "firebase.json" -Force -ErrorAction SilentlyContinue
Remove-Item -Path ".firebaserc" -Force -ErrorAction SilentlyContinue
Remove-Item -Path ".firebase" -Recurse -Force -ErrorAction SilentlyContinue

# Desinstalar dependencias innecesarias
Write-Host "Desinstalando dependencias innecesarias..." -ForegroundColor Yellow
npm uninstall @emotion/react @emotion/styled @mui/icons-material @mui/material firebase font-awesome html2canvas jspdf ogl

# Limpiar caché de npm
Write-Host "Limpiando caché npm..." -ForegroundColor Yellow
npm cache clean --force

# Reconstruir node_modules con dependencias actualizadas
Write-Host "Reconstruyendo node_modules..." -ForegroundColor Yellow
Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
npm install

Write-Host "Limpieza completada con éxito." -ForegroundColor Green
Write-Host "Ahora puede ejecutar 'npm start' para iniciar la aplicación optimizada." -ForegroundColor Green