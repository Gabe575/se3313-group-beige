#include <crow.h>
#include <nlohmann/json.hpp>
#include <unordered_map>
#include <set>
#include <mutex>
#include <vector>
#include <algorithm>
#include <iostream>
#include "game_logic.h"
#include <unordered_set>

using json = nlohmann::json;

// Global game sessions and connection management
std::unordered_map<std::string, GameSession> game_sessions;
std::unordered_set<std::string> active_players;
std::unordered_map<crow::websocket::connection*, std::string> connection_to_player;
std::set<crow::websocket::connection*> connections;
std::mutex game_mutex, player_mutex, conn_mutex;

void on_message(crow::websocket::connection& conn, const std::string& data, bool is_binary) {
    std::string type = "";
    json received;

    // Parse the message
    try {
        // Type is required, other fields are not(?)
        received = json::parse(data);
        if (!received.contains("type")) throw std::invalid_argument("Missing type field");
        type = received["type"];
    } catch (...) {
        conn.send_text(R"({"type":"error","message":"Invalid JSON or missing type"})");
        return;
    }

    // Handle player creation
    if (type == "create_player") {
        std::string name =  received["player_name"];
        std::lock_guard<std::mutex> lock(player_mutex);
        json response;
        response["type"] =  "name_confirmation";
        response["name"] = name;
        if (active_players.count(name)) {
            response["status"] = "taken";
        } else {
            active_players.insert(name);
            connection_to_player[&conn] = name;
            response["status"] = "ok";
        }
        conn.send_text(response.dump());
    }

    // handle game creation
    else if (type == "create_game") {
        std::string name = received["game_id"];
        std::string player = received["player_name"];
        std::lock_guard<std::mutex> lock(game_mutex);
        json response;
        response["type"] = "game_created";
        response["game_id"] = name;

        if (game_sessions.count(name)) {
            response["status"] = "exists";
        } else {
            GameSession session(name);
            session.add_player(player);
            game_sessions[name] = std::move(session);
            response["status"] = "ok";
        }

        conn.send_text(response.dump());
    }

    // handle joining games
    else if (type == "join_game") {
        std::string id = received["game_id"];
        std::string player = received["player_name"];
        json response;

        response["type"] = "join_confirmation";
        response["game_id"] = id;

        std::lock_guard<std::mutex> lock(game_mutex);

        if (!game_sessions.count(id)) {
            response["status"] = "not_found";
        } else if (std::find(game_sessions[id].players.begin(), game_sessions[id].players.end(), player) == game_sessions[id].players.end()) {
            if (game_sessions[id].players.size() >= 4) {
                response["status"] = "full";
            } else {
                game_sessions[id].add_player(player);
                response["status"] = "ok";
            }
        } else {
            response["status"] = "ok"; // already in game
        }
        conn.send_text(response.dump());     
    }

    // handle player leaving a game or lobby
    else if (type =="leave_game") {
        std::string id = received["game_id"];
        std::string player = received["player_name"];
        json response;

        response["type"] = "leave_confirmation";
        response["game_id"] = id;

        std::lock_guard<std::mutex> lock(game_mutex);

        if (!game_sessions.count(id)) {
            response["status"] = "not_found";
        } else {
            GameSession& session = game_sessions[id];
            auto it = std::find(session.players.begin(), session.players.end(), player);

            if (it != session.players.end()) {
                // Remove player from game
                session.players.erase(it);
                session.hands.erase(player);
    
                // If the player was the host, reassign host
                if (session.host == player) {
                    session.host = session.players.empty() ? "" : session.players.front();
                }
    
                // If the game is empty, remove the session
                if (session.players.empty()) {
                    game_sessions.erase(id);
                }
    
                response["status"] = "ok";
            } else {
                response["status"] = "not_in_game";
            }
        }
        conn.send_text(response.dump());
    }

    // Handle getting available games
    else if (type == "get_available_games") {
        json response;
        response["type"] = "available_games";
        json games = json::array();

        std::lock_guard<std::mutex> lock(game_mutex);
        for (const auto& [id, session] : game_sessions) {
            if (session.players.size() < 4) games.push_back({"id", id});
        }
        response["games"] = games;
        conn.send_text(response.dump());
    }

    // handle getting game info
    else if (type == "get_game_info") {
        std::string id = received["game_id"];
        json response;
        response["type"] = "game_info";

        std::lock_guard<std::mutex> lock(game_mutex);

        if (!game_sessions.count(id)) {
            response["status"] = "not_found";
        } else {
            GameSession& session = game_sessions[id];
            response["game_id"] = id;
            response["currentPlayers"] = session.players;
            response["host"] = session.players.empty() ? "" : session.players.front();
            response["status"] = "ok";
            // To tell the players polling for game_info that the game has started
            response["game_started"] = session.game_started;
            response["discard_pile"] = session.discard_pile;
            json player_hands = json::object();
            for (const auto &[player, hand] : session.hands) {
                player_hands[player] = hand.size();
            }
            response["player_hands"] = player_hands;
        }
        conn.send_text(response.dump());
    }

    // handle host starting a game
    else if (type == "start_game") {
        std::string id = received["game_id"];
        std::string player = received["player_name"];
        json response;
    
        response["type"] = "start_confirmation";
        response["game_id"] = id;
    
        std::lock_guard<std::mutex> lock(game_mutex);
    
        if (!game_sessions.count(id)) {
            response["status"] = "not_found";
        } else {
            GameSession& session = game_sessions[id];
    
            if (session.host != player) {
                response["status"] = "not_host";
            } else if (session.game_started) {
                response["status"] = "already_started";
            } else {
                session.game_started = true; 
                response["status"] = "ok";
            }
        }
        conn.send_text(response.dump());
    }

    // handle requests for a hand of cards based on game id and player name
    else if (type == "get_player_hand") {
        std::string id = received["game_id"];
        std::string player = received["player_name"];
        json response;
    
        response["type"] = "player_hand";
        response["game_id"] = id;
        response["player_name"] = player;
    
        std::lock_guard<std::mutex> lock(game_mutex);
    
        if (!game_sessions.count(id)) {
            response["status"] = "not_found";
        } else if (!game_sessions[id].hands.count(player)) {
            response["status"] = "no_hand";
        } else {
            response["status"] = "ok";
            response["hand"] = game_sessions[id].hands[player];
        }
        conn.send_text(response.dump());
    }




    // Handle other types (e.g., play_card)

}

void on_open(crow::websocket::connection& conn) {
    std::lock_guard<std::mutex> lock(conn_mutex);
    connections.insert(&conn);
}

void on_close(crow::websocket::connection& conn, const std::string& reason, uint16_t code) {
    {
        std::lock_guard<std::mutex> lock(conn_mutex);
        connections.erase(&conn);
    }

    std::string player_name;
    {
        std::lock_guard<std::mutex> lock(player_mutex);
        if (connection_to_player.count(&conn)){
            player_name = connection_to_player[&conn];
            active_players.erase(player_name);
            connection_to_player.erase(&conn);
        }
    }

    // Remove player from any game they were in
    if (!player_name.empty()) {
        std::lock_guard<std::mutex> lock(game_mutex);
        for (auto it = game_sessions.begin(); it != game_sessions.end(); ) {
            GameSession& session = it->second;
            auto player_it = std::find(session.players.begin(), session.players.end(), player_name);
            
            if (player_it != session.players.end()) {
                // Remove player from game
                session.players.erase(player_it);
                session.hands.erase(player_name);

                // Reassign host if necessary
                if (session.host == player_name) {
                    session.host = session.players.empty() ? "" : session.players.front();
                }

                // Remove empty games
                if (session.players.empty()) {
                    it = game_sessions.erase(it);
                    continue;
                }
            }
            ++it;
        }
    }

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
