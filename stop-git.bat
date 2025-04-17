@echo off
echo Deteniendo procesos de Git...

:: Matar cualquier proceso de Git que pueda estar ejecutándose
taskkill /f /im git.exe 2>nul
taskkill /f /im git-remote-https.exe 2>nul

:: Limpiar bloqueos de Git en el repositorio actual
echo Limpiando bloqueos de Git...
if exist .git\index.lock del /f .git\index.lock
if exist .git\refs\heads\*.lock del /f .git\refs\heads\*.lock
if exist .git\HEAD.lock del /f .git\HEAD.lock

:: Abortar cualquier operación en curso
echo Abortando operaciones en curso...
git merge --abort 2>nul
git rebase --abort 2>nul
git cherry-pick --abort 2>nul
git am --abort 2>nul

echo Operaciones de Git detenidas. Estado actual del repositorio:
git status

echo.
echo Si necesitas restablecer completamente tu repositorio a su último estado bueno:
echo git reset --hard HEAD
echo.
echo Si deseas descartar todos los cambios locales:
echo git clean -fd
echo.
pause
