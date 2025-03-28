cmake_minimum_required(VERSION 3.10)
project(uno_backend_cpp)

set(CMAKE_CXX_STANDARD 17)

# Find Boost
find_package(Boost REQUIRED)

# Include directories for dependencies and your project's headers
include_directories(
    ${Boost_INCLUDE_DIRS}
    /opt/homebrew/include  # ASIO is installed via Homebrew
    /opt/homebrew/Cellar/websocketpp/0.8.2/include  # WebSocket++ explicit path
    /opt/homebrew/include/nlohmann  # JSON
    ${CMAKE_SOURCE_DIR}/include  # Add the include directory where game_logic.h is located
)

# Add executable
add_executable(uno_backend_cpp src/server.cpp src/game_logic.cpp)

# Link necessary libraries
target_link_libraries(uno_backend_cpp pthread)
