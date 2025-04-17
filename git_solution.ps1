# 1. Primero, guarda los cambios actuales que aún no has enviado (si los hay)
git add .
git commit -m "Cambios locales antes de sincronizar con remoto"

# 2. Trae los cambios del repositorio remoto
# Opción 1: Si quieres fusionar automáticamente los cambios remotos
git pull origin main

# Si encuentras conflictos después de hacer pull, resuélvelos y luego:
# git add .
# git commit -m "Resolviendo conflictos de merge"

# Opción 2: Si prefieres traer los cambios remotos sin fusionarlos automáticamente
# git fetch origin
# git merge origin/main

# 3. Cuando los cambios estén sincronizados, empuja tus cambios
git push -u origin main

# Opción alternativa: Si estás seguro de que tus cambios son correctos y quieres forzar el push
# (¡ADVERTENCIA! Esto sobrescribirá los cambios remotos - úsalo con precaución)
# git push -f origin main
