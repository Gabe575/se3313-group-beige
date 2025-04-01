REM I WILL NOT TYPE 5 COMMANDS EVERY TIME I RUN THE SERVER

@echo off
REM Navigate to the server folder
REM cd /d C:\Users\Aiden\Desktop\SE3313\se3313-group-beige\server ** I COMMENTED THIS OUT BECAUSE IT DEPENDS ON LOCAL MACHINE. JUST cd to server/ before running **

REM Run CMake to configure and build the project
cmake -B build -S .
cmake --build build

REM Navigate to the build directory
cd build

REM Run the server executable
.\Debug\uno_server.exe
