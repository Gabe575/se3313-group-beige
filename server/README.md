# UNO Server (C++)

This is the backend server for the UNO game project. It's written in C++ using CMake and supports unit testing with Google Test.

---

## ✅ Requirements

- CMake 3.14+
- C++17 compiler
  - Windows: MSVC (via Visual Studio 2022)
  - Mac/Linux: g++ or clang
- [vcpkg](https://github.com/microsoft/vcpkg) (for dependency management)

---

## 🔧 Setup Instructions

### 1. Clone the repo

```bash
git clone https://github.com/Gabe575/se3313-group-beige.git
cd se3313-group-beige/server
```

### 2. Install dependencies using vcpkg

```bash

git clone https://github.com/microsoft/vcpkg.git
cd vcpkg
./bootstrap-vcpkg.bat  # Windows
# or
./bootstrap-vcpkg.sh   # Linux/macOS
```

Then ./vcpkg integrate install
Followed by ./vcpkg install

### 3. Configure CMake

```bash
cd ..
cmake -B build -S .
```

### 4. Build the Project

```bash
cmake --build build
```

### 5. Run Unit Tests

```bash
cd build
ctest --output-on-failure
```

Run with

.\Debug\uno_server.exe

So after each edit run:
cd .. (get to server folder)
cmake -B build -S .
cmake --build build
cd build
.\Debug\uno_server.exe

or go to this folder in file explorer and double click on runserver.bat
or .\runserver.bat
(from /server)



On mac run with:
cmake -B build -S . -DCMAKE_TOOLCHAIN_FILE=./vcpkg/scripts/buildsystems/vcpkg.cmake -DVCPKG_TARGET_TRIPLET=arm64-osx
cmake --build build
./build/uno_server