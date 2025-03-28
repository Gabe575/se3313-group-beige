#include <crow.h>
#include <nlohmann/json.hpp>
#include <unordered_map>
#include <set>
#include <mutex>
#include <vector>
#include <algorithm>
#include <iostream>

using json = nlohmann::json;


// Move to game_logic??  If i have to look at another include error I'm throwing my computer
/*
class GameSession {
    public:
        std::string game_id;
        std::string game_name;
        std::vector<std::string> players;
        std::mutex game_mutex;
    
        GameSession() = default;
        GameSession(const std::string &id, const std::string &name)
            : game_id(id), game_name(name) {}
    
        void add_player(const std::string &player_id) {
            std::lock_guard<std::mutex> lock(game_mutex);
            players.push_back(player_id);
        }
    
        void remove_player(const std::string &player_id) {
            std::lock_guard<std::mutex> lock(game_mutex);
            players.erase(std::remove(players.begin(), players.end(), player_id), players.end());
        }
    
        json to_json() {
            std::lock_guard<std::mutex> lock(game_mutex);
            json j;
            j["game_id"] = game_id;
            j["game_name"] = game_name;
            j["players"] = players;
            return j;
        }
    
        size_t player_count() {
            std::lock_guard<std::mutex> lock(game_mutex);
            return players.size();
        }
    };

    */
// Global game sessions and connection management
//std::unordered_map<std::string, GameSession> game_sessions;
std::set<crow::websocket::connection*> connections;
std::mutex game_mutex, conn_mutex;

void on_message(crow::websocket::connection& conn, const std::string& data, bool is_binary) {
    std::string game_id = "";
    std::string player_id = "";
    std::string type = "";

    // Parse the message
    try {

        // Type is required, other fields are not(?)
        json received = json::parse(data);

        if (received.contains("game_id") && received["game_id"].is_string()) {
            game_id = received["game_id"];
        }
        if (received.contains("player_id") && received["player_id"].is_string()) {
            player_id = received["player_id"];
        }
        if (received.contains("type") && received["type"].is_string()) {
            type = received["type"];
        } else {
            throw std::invalid_argument("Invalid or missing 'type'");
        }
    } catch (const std::exception& e) {
        std::cerr << "Error processing message: " << e.what() << std::endl;
        type = "bad_message";
    }

    // Handle different message types
    if (type == "get_available_games") {
        std::lock_guard<std::mutex> lock(game_mutex);
        json available_games = json::array();

        /*
        for (const auto& [game_id, game] : game_sessions) {
            available_games.push_back({ {"id", game.game_id}, {"name", game.game_name} });
        }
            */
        available_games.push_back({ {"id", "test"}, {"name", "testname"} });

        // Send available games to client
        json response;
        response["type"] = "available_games";
        response["games"] = available_games;
        conn.send_text(response.dump());
    }
    /*
    else if (type == "create_game") {
        std::lock_guard<std::mutex> lock(game_mutex);
        GameSession new_game(game_id, "Game " + game_id);
        game_sessions[game_id] = std::move(new_game);

        json response;
        response["type"] = "game_created";
        response["game_id"] = game_id;
        conn.send_text(response.dump());
    }
    else if (type == "join_game") {
        std::lock_guard<std::mutex> lock(game_mutex);
        if (game_sessions.find(game_id) != game_sessions.end()) {
            game_sessions[game_id].add_player(player_id);

            json response;
            response["type"] = "player_joined";
            response["game_id"] = game_id;
            response["player_count"] = game_sessions[game_id].player_count();
            conn.send_text(response.dump());

            // Broadcast updated game state to all players
            json broadcast_message;
            broadcast_message["type"] = "game_state_updated";
            broadcast_message["game_id"] = game_id;
            broadcast_message["player_count"] = game_sessions[game_id].player_count();
            broadcast_message["players"] = game_sessions[game_id].to_json()["players"];
            for (auto* other_conn : connections) {
                other_conn->send_text(broadcast_message.dump());
            }
        } else {
            json error_response;
            error_response["type"] = "error";
            error_response["message"] = "Game not found.";
            conn.send_text(error_response.dump());
        }
            
    }
        */
    // Handle other types (e.g., play_card)










}

void on_open(crow::websocket::connection& conn) {
    std::lock_guard<std::mutex> lock(conn_mutex);
    connections.insert(&conn);
}

void on_close(crow::websocket::connection& conn, const std::string& reason, uint16_t code) {
    std::lock_guard<std::mutex> lock(conn_mutex);
    connections.erase(&conn);
}

int main() {
    crow::SimpleApp app;

    CROW_ROUTE(app, "/ws")
    .websocket(&app)
    .onopen([](crow::websocket::connection& conn) {
        on_open(conn);
        CROW_LOG_INFO << "WebSocket connection opened.";
    })
    .onclose([](crow::websocket::connection& conn, const std::string& reason, uint16_t code) {
        on_close(conn, reason, code);
        CROW_LOG_INFO << "WebSocket closed: " << reason << ", code: " << code;
    })
    .onmessage([](crow::websocket::connection& conn, const std::string& data, bool is_binary) {
        on_message(conn, data, is_binary);
    });
    

    app.port(9002).multithreaded().run();
}
