@echo off
title GLauncher-Web - Actualizador de Repositorio
color 0b

echo ============================================
echo   ENVIANDO ACTUALIZACION A GITHUB
echo ============================================

:: 1. Inicializar si no se ha hecho antes
if not exist .git (
    echo [+] Inicializando repositorio Git...
    git init
    git remote add origin https://github.com/dguerraaraque-a11y/GLauncher-Web
)

:: 2. Preparar los archivos
echo [+] Agregando cambios...
git add .

:: 3. Crear el mensaje de la actualizacion
set /p mensaje="Escribe que cambiaste (ej: Mejora de GUI): "
if "%mensaje%"=="" set mensaje="Actualizacion GLauncher Web - DaniCraftYT25"

:: 4. Subir al repositorio
echo [+] Subiendo a la rama principal...
git commit -m "%mensaje%"
git branch -M main
git push -u origin main

echo.
echo ============================================
echo   PROCESO TERMINADO - REVISA TU GITHUB
echo ============================================
pause