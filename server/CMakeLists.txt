cmake_minimum_required(VERSION 3.20)
project(uno_server)

# Set C++ standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Use vcpkg toolchain if not already defined
if(NOT DEFINED CMAKE_TOOLCHAIN_FILE)
    set(CMAKE_TOOLCHAIN_FILE "${CMAKE_SOURCE_DIR}/vcpkg/scripts/buildsystems/vcpkg.cmake"
        CACHE STRING "Vcpkg toolchain file")
endif()

# Add include directory for headers
include_directories(
    ${CMAKE_SOURCE_DIR}/include
    ${CMAKE_SOURCE_DIR}/vcpkg_installed/x64-windows/include
)

# Add source files
add_executable(uno_server
    src/server.cpp
    src/game_logic.cpp
    src/player_manager.cpp
    src/utils.cpp
)