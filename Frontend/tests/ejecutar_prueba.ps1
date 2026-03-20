# Ejecutar prueba de flujo completo de producto
Write-Host "Iniciando prueba automatizada de flujo de producto en KarmaWebApp..." -ForegroundColor Cyan

# Verificar si la aplicación está en ejecución
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
    Write-Host "Aplicación detectada en http://localhost:3000" -ForegroundColor Green
} catch {
    Write-Host "¡ADVERTENCIA! No se detectó la aplicación en http://localhost:3000" -ForegroundColor Yellow
    Write-Host "Asegúrese de que la aplicación esté ejecutándose antes de continuar." -ForegroundColor Yellow
    
    $continuar = Read-Host "¿Desea continuar de todos modos? (s/n)"
    if ($continuar -ne "s") {
        Write-Host "Prueba cancelada." -ForegroundColor Red
        exit
    }
}

# Verificar dependencias
try {
    node -e "require('puppeteer'); require('chai');" 2>$null
    Write-Host "Dependencias verificadas." -ForegroundColor Green
} catch {
    Write-Host "Instalando dependencias necesarias..." -ForegroundColor Yellow
    npm install puppeteer chai --no-save
}

# Crear directorio para screenshots si no existe
$screenshotsDir = Join-Path (Get-Location) "tests\screenshots"
if (-not (Test-Path $screenshotsDir)) {
    New-Item -ItemType Directory -Path $screenshotsDir | Out-Null
    Write-Host "Directorio de screenshots creado: $screenshotsDir" -ForegroundColor Green
}

# Ejecutar la prueba
Write-Host "Ejecutando prueba de flujo completo..." -ForegroundColor Cyan
node tests/flujo_producto.test.js

# Mostrar ubicación de los screenshots
if (Test-Path $screenshotsDir) {
    $cantidadScreenshots = (Get-ChildItem -Path $screenshotsDir -Filter "*.png").Count
    Write-Host "Prueba finalizada. Se generaron $cantidadScreenshots capturas de pantalla en:" -ForegroundColor Green
    Write-Host $screenshotsDir -ForegroundColor Green
    
    # Buscar archivos de reporte
    $reportes = Get-ChildItem -Path $screenshotsDir -Filter "reporte_*.txt"
    if ($reportes.Count -gt 0) {
        $ultimoReporte = $reportes | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        Write-Host "`nReporte de la última prueba:" -ForegroundColor Cyan
        Get-Content $ultimoReporte.FullName
    }
}
