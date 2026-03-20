#!/bin/bash

# Colores para terminal
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Ejecutar prueba de flujo completo de producto
echo -e "${CYAN}Iniciando prueba automatizada de flujo de producto en KarmaWebApp...${NC}"

# Verificar si la aplicación está en ejecución
if curl -s --head http://localhost:3000 > /dev/null; then
  echo -e "${GREEN}Aplicación detectada en http://localhost:3000${NC}"
else
  echo -e "${YELLOW}¡ADVERTENCIA! No se detectó la aplicación en http://localhost:3000${NC}"
  echo -e "${YELLOW}Asegúrese de que la aplicación esté ejecutándose antes de continuar.${NC}"
  
  read -p "¿Desea continuar de todos modos? (s/n) " continuar
  if [ "$continuar" != "s" ]; then
    echo -e "${RED}Prueba cancelada.${NC}"
    exit 1
  fi
fi

# Verificar dependencias
if node -e "try { require('puppeteer'); require('chai'); console.log('ok'); } catch(e) { process.exit(1); }" > /dev/null 2>&1; then
  echo -e "${GREEN}Dependencias verificadas.${NC}"
else
  echo -e "${YELLOW}Instalando dependencias necesarias...${NC}"
  npm install puppeteer chai --no-save
fi

# Crear directorio para screenshots si no existe
SCREENSHOTS_DIR="$(pwd)/tests/screenshots"
if [ ! -d "$SCREENSHOTS_DIR" ]; then
  mkdir -p "$SCREENSHOTS_DIR"
  echo -e "${GREEN}Directorio de screenshots creado: $SCREENSHOTS_DIR${NC}"
fi

# Ejecutar la prueba
echo -e "${CYAN}Ejecutando prueba de flujo completo...${NC}"
node tests/flujo_producto.test.js

# Mostrar ubicación de los screenshots
if [ -d "$SCREENSHOTS_DIR" ]; then
  NUM_SCREENSHOTS=$(ls -1 "$SCREENSHOTS_DIR"/*.png 2>/dev/null | wc -l)
  echo -e "${GREEN}Prueba finalizada. Se generaron $NUM_SCREENSHOTS capturas de pantalla en:${NC}"
  echo -e "${GREEN}$SCREENSHOTS_DIR${NC}"
  
  # Buscar archivos de reporte
  ULTIMO_REPORTE=$(ls -t "$SCREENSHOTS_DIR"/reporte_*.txt 2>/dev/null | head -n 1)
  if [ -n "$ULTIMO_REPORTE" ]; then
    echo -e "\n${CYAN}Reporte de la última prueba:${NC}"
    cat "$ULTIMO_REPORTE"
  fi
fi
