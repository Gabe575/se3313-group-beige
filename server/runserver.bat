REM I WILL NOT TYPE 5 COMMANDS EVERY TIME I RUN THE SERVER

@echo off
REM Navigate to the server folder
cd /d C:\Users\Aiden\Desktop\SE3313\se3313-group-beige\server

REM Run CMake to configure and build the project
cmake -B build -S .
cmake --build build

REM Navigate to the build directory
cd build

REM Run the server executable
.\Debug\uno_server.exe
