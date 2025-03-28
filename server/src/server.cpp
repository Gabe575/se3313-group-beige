#include <iostream>
#include <websocketpp/config/asio_no_tls.hpp>
#include <websocketpp/server.hpp>
#include <nlohmann/json.hpp>
#include <unordered_map>
#include <set>
#include <mutex>
#include <vector>
#include <algorithm>
// TODO: add this back. Commented out so that random errors in dependencies go away
//#include "game_logic.h"
//#include "player_manager.h"

using json = nlohmann::json;
typedef websocketpp::server<websocketpp::config::asio> server;
typedef websocketpp::connection_hdl connection_hdl;

// TODO: vibe check
class GameSession
{
public:
    std::string game_id;
    std::string game_name;
    std::vector<std::string> players; // List of player IDs
    std::mutex game_mutex;            // Mutex for thread safety
    
    GameSession() = default;

    GameSession(const std::string &id, const std::string &name)
        : game_id(id), game_name(name) {}

    // Delete copy constructor and copy assignment operator
    GameSession(const GameSession &) = delete;
    GameSession &operator=(const GameSession &) = delete;

    // Define move constructor
    GameSession(GameSession &&other) noexcept
        : game_id(std::move(other.game_id)),
          game_name(std::move(other.game_name)),
          players(std::move(other.players))
    {
        // No need to move the mutex since it doesn't need to be copied/moved
    }

    // Define move assignment operator
    GameSession &operator=(GameSession &&other) noexcept
    {
        if (this != &other)
        {
            game_id = std::move(other.game_id);
            game_name = std::move(other.game_name);
            players = std::move(other.players);
        }
        return *this;
    }

    void add_player(const std::string &player_id)
    {
        std::lock_guard<std::mutex> lock(game_mutex);
        players.push_back(player_id);
    }

    void remove_player(const std::string &player_id)
    {
        std::lock_guard<std::mutex> lock(game_mutex);
        players.erase(std::remove(players.begin(), players.end(), player_id), players.end());
    }

    json to_json()
    {
        std::lock_guard<std::mutex> lock(game_mutex);
        json j;
        j["game_id"] = game_id;
        j["game_name"] = game_name;
        j["players"] = players;
        return j;
    }

    size_t player_count()
    {
        std::lock_guard<std::mutex> lock(game_mutex);
        return players.size();
    }
};

std::unordered_map<std::string, GameSession> game_sessions;
std::set<connection_hdl, std::owner_less<connection_hdl>> connections;
std::mutex game_mutex, conn_mutex;

void on_message(server* s, connection_hdl hdl, server::message_ptr msg) {
    
    std::string game_id = "";
    std::string player_id = "";
    std::string type = "";
    
    // Messages need a type always but may or may not have game_id and player_id
    try {
        json received = json::parse(msg->get_payload());

        // Check if the necessary fields are present and of the correct type
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
    
    
    if (type == "get_available_games") {
        // TODO: does this need mutex? added just in case
        std::lock_guard<std::mutex> lock(game_mutex);
        
        // TODO: update this to pull from the actual game_sessions array or whereever the available games are stored
        json available_games = json::array();
        available_games.push_back({ {"id", "game1"}, {"name", "UNO Game 1"} });
        available_games.push_back({ {"id", "game2"}, {"name", "UNO Game 2"} });
        
        // Send response with available games to client
        json response;
        response["type"] = "available_games";
        response["games"] = available_games;
        s->send(hdl, response.dump(), websocketpp::frame::opcode::text);
        
    } else if (type == "create_game") {
        std::lock_guard<std::mutex> lock(game_mutex);
        
        //game_sessions[game_id] = GameSession(game_id);
        
        // TODO: create game - check this
        
        GameSession new_game(game_id, "UNO Game " + game_id);
        game_sessions[game_id] = std::move(new_game);
        
        //std::string gamename = game_id;
        
        json response;
        response["type"] = "game_created";
        response["game_id"] = game_id;
        s->send(hdl, response.dump(), websocketpp::frame::opcode::text);
        
    } else if (type == "join_game") {
        std::lock_guard<std::mutex> lock(game_mutex);
        //game_sessions[game_id].add_player(player_id);
        
        if (game_sessions.find(game_id) != game_sessions.end()) {
            game_sessions[game_id].add_player(player_id);

            json response;
            response["type"] = "player_joined";
            response["game_id"] = game_id;
            response["player_count"] = game_sessions[game_id].player_count();
            s->send(hdl, response.dump(), websocketpp::frame::opcode::text);

            // Broadcast updated game state to all players
            json broadcast_message;
            broadcast_message["type"] = "game_state_updated";
            broadcast_message["game_id"] = game_id;
            broadcast_message["player_count"] = game_sessions[game_id].player_count();
            broadcast_message["players"] = game_sessions[game_id].to_json()["players"];
            for (auto& conn : connections) {
                s->send(conn, broadcast_message.dump(), websocketpp::frame::opcode::text);
            }
        } else {
            json error_response;
            error_response["type"] = "error";
            error_response["message"] = "Game not found.";
            s->send(hdl, error_response.dump(), websocketpp::frame::opcode::text);
        }
        
        
        
        
        
        
    } else if (type == "play_card") {
        std::lock_guard<std::mutex> lock(game_mutex);
        //game_sessions[game_id].play_card(player_id, received["card"]);
    }

    // Broadcast updated game state to all players
    for (auto& conn : connections) {
        //s->send(conn, game_sessions[game_id].to_json().dump(), websocketpp::frame::opcode::text);
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
