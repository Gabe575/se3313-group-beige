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
            if (game_sessions[id].players.size() >= 4 || game_sessions[id].game_started) {
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
            if (session.players.size() < 4 && !session.game_started) games.push_back({"id", id});
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

    // handling getting game state
    if (type == "get_game_state") {
        std::string game_id = received["game_id"];
        std::lock_guard<std::mutex> lock(game_mutex);
        json response;
        response["type"] = "game_state";

        if (!game_sessions.count(game_id)) {
            response["status"] = "not_found";
        } else {
            GameSession& session = game_sessions[game_id];
            response["game_id"] = game_id;
            response["currentPlayers"] = session.players;
            response["host"] = session.host;
            response["turnName"] = session.players[session.current_turn];
             // response["playDirection"] = session.play_direction; ** Currently don't have a play_direction attribute, only add if we need it
            response["remainingCards"] = session.deck.size();
            response["discardPile"] = session.discard_pile; 
        }
        conn.send_text(response.dump());
    }

    else if (type == "get_player_info") {
        std::string game_id = received["game_id"];
        std::string player = received["player_name"];
        std::lock_guard<std::mutex> lock(game_mutex);
        json response;
        response["type"] = "player_info";
        response["game_id"] = game_id;

        if (!game_sessions.count(game_id)) {
            response["status"] = "not_found";
        } else {
            GameSession& session = game_sessions[game_id];
            json player_data;
            player_data["name"] = player;
            player_data["numCards"] = session.hands[player].size();
            player_data["hand"] = session.hands[player];
            player_data["status"] = "active"; // optionally track this
            response["player"] = player_data;
        }
        conn.send_text(response.dump());
    }

    else if (type == "play_card") {
        std::string game_id = received["game_id"];
        std::string player = received["player_name"];
        std::string card = received["card"]; // assuming the card is a string

        std::lock_guard<std::mutex> lock(game_mutex);
        json response;
        response["type"] = "card_played";
        response["player_name"] = player;
        response["card"] = card;

        if (!game_sessions.count(game_id)) {
            response["status"] = "not_found";
        } else {
            GameSession& session = game_sessions[game_id];
            session.play_card(player, card);
            json updated;
            updated["type"] = "game_state";
            updated["game_id"] = game_id;
            updated["currentPlayers"] = session.players;
            updated["host"] = session.host;
            updated["turnName"] = session.players[session.current_turn];
            // updated["playDirection"] = session.play_direction;
            updated["remainingCards"] = session.deck.size();
            updated["discardPile"] = session.discard_pile;
            response["updated_game_state"] = updated;
        }
        conn.send_text(response.dump());
    }

    else if (type == "draw_card") {
        std::string game_id = received["game_id"];
        std::string player = received["player_name"];

        std::lock_guard<std::mutex> lock(game_mutex);
        json response;
        response["type"] = "card_drawn";
        response["player_name"] = player;

        if (!game_sessions.count(game_id)) {
            response["status"] = "not_found";
        } else {
            GameSession& session = game_sessions[game_id];
            std::string drawn = session.draw_card(player);
            response["card"] = drawn;

            json updated;
            updated["type"] = "game_state";
            updated["game_id"] = game_id;
            updated["currentPlayers"] = session.players;
            updated["host"] = session.host;
            updated["turnName"] = session.players[session.current_turn];
            // updated["playDirection"] = session.play_direction;
            updated["remainingCards"] = session.deck.size();
            updated["discardPile"] = session.discard_pile;
            response["updated_game_state"] = updated;
        }
        conn.send_text(response.dump());
    }

    // action special card
    else if (type == "action_special_card") {

        // Harrison TO DO: how is this different than playing a normal card?

        std::cout << "Action special card..." << std::endl;

        std::string game_id = received["game_id"];
        std::string player = received["player_name"];
        std::string card_color = received["card"]["color"];
        std::string card_value = received["card"]["value"];
        std::string card = card_color + "_" + card_value;

        std::lock_guard<std::mutex> lock(game_mutex);
        json response;
        response["type"] = "special_card_played";
        response["player_name"] = player;
        response["card"] = card;

        if (!game_sessions.count(game_id)) {
            response["status"] = "not_found";
        } else {
            GameSession& session = game_sessions[game_id];
            bool valid = session.play_card(player, card);

            if (!valid) {
                response["status"] = "invalid_play";
            } else {
                std::string next_player = session.players[session.current_turn];
                response["next_player_name"] = next_player;

                json updated;
                updated["type"] = "game_state";
                updated["game_id"] = game_id;
                updated["currentPlayers"] = session.players;
                updated["host"] = session.host;
                updated["turnName"] = session.players[session.current_turn];
                // updated["playDirection"] = session.play_direction;
                updated["remainingCards"] = session.deck.size();
                updated["discardPile"] = session.discard_pile;
                response["updated_game_state"] = updated;
            }
        }

        conn.send_text(response.dump());

    }

    else if (type == "call_uno") {
        std::string game_id = received["game_id"];
        std::string player = received["player_name"];

        std::lock_guard<std::mutex> lock(game_mutex);
        json response;
        response["type"] = "uno_called";
        response["player_name"] = player;
        
        if (!game_sessions.count(game_id)) {
            response["status"] = "not_found";
        } else {
            GameSession& session = game_sessions[game_id];
            if (session.hands[player].size() == 1) {
                // Display notification on screen?
                // For now, just log cout
                std::cout << player << " called UNO!" << std::endl;
                // mark UNO called? Probably not needed
            }

            json updated;
            updated["type"] = "game_state";
            updated["game_id"] = game_id;
            updated["currentPlayers"] = session.players;
            updated["host"] = session.host;
            updated["turnName"] = session.players[session.current_turn];
            // updated["playDirection"] = session.play_direction;
            updated["remainingCards"] = session.deck.size();
            updated["discardPile"] = session.discard_pile;
            response["updated_game_state"] = updated;
        }

        conn.send_text(response.dump());
    }

    // get winner info
    else if (type == "get_winner_info") {
        std::string game_id = received["game_id"];
        std::lock_guard<std::mutex> lock(game_mutex);
        json response;
        response["type"] = "game_over";
        response["game_id"] = game_id;

        if (!game_sessions.count(game_id)){
            response["status"] = "not_found"; 
        } else {
            GameSession& session = game_sessions[game_id];

            std::string winner;
            std::unordered_map<std::string, int> final_scores;

            int lowest = INT_MAX;
            for (const auto& [player, hand] : session.hands) {
                int score = 0;
                for (const auto& card : hand) {
                    // wilds/plus4 are 50 points
                    if (card.find("wild_plus4") != std::string::npos) score += 50;
                    else if (card.find("wild") != std::string::npos) score += 50;
                    // plus2, reverse, skips are 20 points
                    else if (card.find("skip") != std::string::npos) score += 20;
                    else if (card.find("plus2") != std::string::npos) score += 20;
                    else if (card.find("reverse") != std::string::npos) score += 20;
                    // regular cards are based on face value
                    else {
                        try {
                            score += std::stoi(card.substr(card.find('_') + 1));
                        } catch (...) {
                            score += 0;
                        }
                    }
                }

                final_scores[player] = score;
                if (score < lowest) {
                    lowest = score;
                    winner = player;
                }
            }

            response["winner"] = winner;
            response["final_scores"] = final_scores;
        }

        conn.send_text(response.dump());
    }

    else if (type == "player_disconnected") {
        std::string game_id = received["game_id"];
        std::string player = received["player_name"];

        std::lock_guard<std::mutex> lock(game_mutex);
        json response;
        response["type"] = "player_disconnected";
        response["player_name"] = player;

        if (game_sessions.count(game_id)) {
            GameSession& session = game_sessions[game_id];
            
            // remove from players and hands
            session.players.erase(
                std::remove(session.players.begin(), session.players.end(), player),
                session.players.end()
            );
            session.hands.erase(player);

            // Reassign host if necessary
            if (session.host == player) {
                session.host = session.players.empty() ? "" : session.players.front();
            }

            // Remove empty session
            if (session.players.empty()) {
                game_sessions.erase(game_id);
            }

            json updated;
            updated["type"] = "game_state";
            updated["game_id"] = game_id;
            updated["currentPlayers"] = session.players;
            updated["host"] = session.host;
            updated["turnName"] = session.players[session.current_turn];
            // updated["playDirection"] = session.play_direction;
            updated["remainingCards"] = session.deck.size();
            updated["discardPile"] = session.discard_pile;
            response["updated_game_state"] = updated;
        } else {
            response["status"] = "not_found";
        }
        conn.send_text(response.dump());
    }
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
