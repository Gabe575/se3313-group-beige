#include <crow.h>

int main() {
    crow::SimpleApp app;

    CROW_ROUTE(app, "/ws")
    .websocket(&app)
    .onopen([](crow::websocket::connection& conn) {
        CROW_LOG_INFO << "WebSocket connection opened.";
    })
    .onclose([](crow::websocket::connection& conn, const std::string& reason, uint16_t code) {
        CROW_LOG_INFO << "WebSocket closed: " << reason << ", code: " << code;
    })
    .onmessage([](crow::websocket::connection& conn, const std::string& data, bool is_binary) {
        CROW_LOG_INFO << "Received: " << data;
        conn.send_text("Echo: " + data);
    });
    

    app.port(9002).multithreaded().run();
}
