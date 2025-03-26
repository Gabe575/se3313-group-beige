#include <iostream>
#include <websocketpp/config/asio_no_tls.hpp>
#include <websocketpp/server.hpp>
#include <nlohmann/json.hpp>
#include <unordered_map>
#include <set>
#include <mutex>
#include "game_logic.h"
#include "player_manager.h"

using json = nlohmann::json;
typedef websocketpp::server<websocketpp::config::asio> server;
typedef websocketpp::connection_hdl connection_hdl;

std::unordered_map<std::string, GameSession> game_sessions;
std::set<connection_hdl, std::owner_less<connection_hdl>> connections;
std::mutex game_mutex, conn_mutex;

void on_message(server* s, connection_hdl hdl, server::message_ptr msg) {
    json received = json::parse(msg->get_payload());

    std::string game_id = received["game_id"];
    std::string player_id = received["player_id"];

    if (received["type"] == "create_game") {
        std::lock_guard<std::mutex> lock(game_mutex);
        game_sessions[game_id] = GameSession(game_id);
    } else if (received["type"] == "join_game") {
        std::lock_guard<std::mutex> lock(game_mutex);
        game_sessions[game_id].add_player(player_id);
    } else if (received["type"] == "play_card") {
        std::lock_guard<std::mutex> lock(game_mutex);
        game_sessions[game_id].play_card(player_id, received["card"]);
    }

    // Broadcast updated game state to all players
    for (auto& conn : connections) {
        s->send(conn, game_sessions[game_id].to_json().dump(), websocketpp::frame::opcode::text);
    }
}

void on_open(server* s, connection_hdl hdl) {
    std::lock_guard<std::mutex> lock(conn_mutex);
    connections.insert(hdl);
}

void on_close(server* s, connection_hdl hdl) {
    std::lock_guard<std::mutex> lock(conn_mutex);
    connections.erase(hdl);
}

int main() {
    server ws_server;

    try {
        ws_server.set_open_handler(bind(&on_open, &ws_server, std::placeholders::_1));
        ws_server.set_close_handler(bind(&on_close, &ws_server, std::placeholders::_1));
        ws_server.set_message_handler(bind(&on_message, &ws_server, std::placeholders::_1, std::placeholders::_2));

        ws_server.init_asio();
        ws_server.listen(9002);
        ws_server.start_accept();

        std::cout << "UNO Server running on port 9002..." << std::endl;
        ws_server.run();
    } catch (websocketpp::exception const &e) {
        std::cerr << "Error: " << e.what() << std::endl;
    }

    return 0;
}
