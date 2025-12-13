@echo off

REM Este script ahora solo ejecuta el publicador de Python, que es más robusto.
echo Ejecutando el publicador de GLauncher...

REM Asegúrate de que Python esté en tu PATH.
python admin/publisher.py

REM La pausa ya está manejada dentro del script de Python.