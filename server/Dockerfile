# ---------- Builder Stage ----------
FROM gcc:13 as build

# Install build tools and dependencies
RUN apt update && \
    apt install -y cmake git libssl-dev pkg-config zip

# Set working directory
WORKDIR /app

# Clone and bootstrap vcpkg
RUN git clone https://github.com/microsoft/vcpkg.git && \
    ./vcpkg/bootstrap-vcpkg.sh

# Copy local source files into container
COPY . .

# Run CMake and build the app (include header directory explicitly)
RUN cmake -Bbuild -S. \
    -DCMAKE_TOOLCHAIN_FILE=/app/vcpkg/scripts/buildsystems/vcpkg.cmake \
    -DCMAKE_CXX_FLAGS="-I/app/include" && \
    cmake --build build

# ---------- Runtime Stage ----------
FROM gcc:13

# Set working directory
WORKDIR /app

# Copy built binary from builder stage
COPY --from=build /app/build/uno_server /app/uno_server

# Expose port 8080 for Cloud Run
ENV PORT=8080
EXPOSE 8080

# Launch the server
CMD ["./uno_server"]
