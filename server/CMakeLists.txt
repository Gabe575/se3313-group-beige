# Minimum required version of CMake
cmake_minimum_required(VERSION 3.20)

# Name of the project
project(uno_server)

# Set C++ standard to C++17
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Enable support for unit testing
enable_testing()

# ----------------------------------------------------------------------------
# Vcpkg-managed libraries
# These lines use vcpkg's CMake integration to find the necessary packages.
# Make sure VCPKG is bootstrapped and this CMake file is run with the 
# appropriate toolchain file (handled in Dockerfile or CMake args).
# ----------------------------------------------------------------------------

# Crow web framework
find_package(Crow CONFIG REQUIRED)

# JSON parsing library
find_package(nlohmann_json CONFIG REQUIRED)

# Google Test for unit testing
find_package(GTest CONFIG REQUIRED)

# ----------------------------------------------------------------------------
# Main executable (the actual UNO server)
# ----------------------------------------------------------------------------
add_executable(uno_server
    src/server.cpp           # Main WebSocket and game management logic
    src/game_logic.cpp       # Core game state and card logic
)

# Link against libraries provided by vcpkg
target_link_libraries(uno_server
    PRIVATE
    Crow::Crow              # Crow web framework
    nlohmann_json::nlohmann_json  # JSON library
)

# ----------------------------------------------------------------------------
# Unit tests for game logic
# ----------------------------------------------------------------------------
add_executable(game_logic_test
    tests/game_logic_test.cpp   # Your GTest unit tests
    src/game_logic.cpp          # Game logic under test
)

# Link test executable with GTest and threading (needed on Linux)
target_link_libraries(game_logic_test
    PRIVATE
    GTest::gtest
    GTest::gtest_main
    pthread                     # Required for GTest to run properly on Linux
)

# Register the test so CTest can run it
add_test(NAME GameLogicTests COMMAND game_logic_test)
