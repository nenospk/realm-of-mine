if not "%minimized%"=="" goto :minimized
set minimized=true
@echo off

cd %cd%

start /min cmd /C "nodemon server.js"
goto :EOF
:minimized