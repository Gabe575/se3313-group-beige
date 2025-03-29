cmake_minimum_required(VERSION 3.20)
project(uno_server)

# Set C++ standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

enable_testing()

# Use vcpkg toolchain if not already defined
if(NOT DEFINED CMAKE_TOOLCHAIN_FILE)
    set(CMAKE_TOOLCHAIN_FILE "${CMAKE_SOURCE_DIR}/vcpkg/scripts/buildsystems/vcpkg.cmake"
        CACHE STRING "Vcpkg toolchain file")
endif()

# Detect platform for vcpkg triplet and library specifics
if(WIN32)
    set(VCPKG_TARGET_TRIPLET "x64-windows")
    set(PLATFORM_LIBS ws2_32)
else()
    set(VCPKG_TARGET_TRIPLET "x64-linux")
    set(PLATFORM_LIBS pthread)  # Needed for GTest
endif()

# Paths for vcpkg
set(VCPKG_INSTALLED_DIR "${CMAKE_SOURCE_DIR}/vcpkg_installed/${VCPKG_TARGET_TRIPLET}")
include_directories(${VCPKG_INSTALLED_DIR}/include)
link_directories(${VCPKG_INSTALLED_DIR}/lib)

# Add source files
add_executable(uno_server
    src/server.cpp
    src/game_logic.cpp
    src/player_manager.cpp
    src/utils.cpp
)

# Include headers
target_include_directories(uno_server PRIVATE ${CMAKE_SOURCE_DIR}/include)

target_link_libraries(uno_server PRIVATE
    ${PLATFORM_LIBS}
)

# Add unit tests
add_executable(game_logic_test
  tests/game_logic_test.cpp
  src/game_logic.cpp
)

# Include headers for tests
target_include_directories(game_logic_test PRIVATE ${CMAKE_SOURCE_DIR}/include)

target_link_libraries(game_logic_test PRIVATE
    gtest
)

add_test(NAME GameLogicTests COMMAND game_logic_test)