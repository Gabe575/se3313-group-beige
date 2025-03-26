cmake_minimum_required(VERSION 3.10)
project(uno_backend_cpp)

set(CMAKE_CXX_STANDARD 17)

find_package(Boost REQUIRED)
include_directories(${Boost_INCLUDE_DIRS})

add_executable(uno_backend_cpp src/server.cpp src/game_logic.cpp)
target_link_libraries(uno_backend_cpp pthread)
