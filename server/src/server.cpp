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
#include <queue>
#include <condition_variable>
#include <thread>

using json = nlohmann::json;

// Global game sessions and connection management
std::unordered_map<crow::websocket::connection*, std::queue<json>> message_queues;
std::mutex message_queue_mutex;
std::condition_variable message_queue_cv;
std::unordered_map<std::string, bool> game_thread_running;
std::mutex thread_control_mutex;


std::unordered_map<std::string, GameSession> game_sessions;
std::unordered_set<std::string> active_players;
std::unordered_map<crow::websocket::connection*, std::string> connection_to_player;
std::set<crow::websocket::connection*> connections;
std::mutex game_mutex, player_mutex, conn_mutex;

// Game thread infrastructure
std::unordered_map<std::string, std::queue<json>> incoming_game_queues;
std::unordered_map<std::string, std::mutex> game_queue_mutexes;
std::unordered_map<std::string, std::condition_variable> game_queue_cvs;
std::unordered_map<std::string, std::thread> game_threads;

void game_thread_loop(const std::string& game_id);

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

            // Initialize thread infrastructure
            incoming_game_queues[name] = std::queue<json>();
            game_queue_mutexes[name]; // default constructs the mutex
            game_queue_cvs[name];     // default constructs the condition variable

            //Launch the game thread
            game_thread_running[name] = true; // Mark thread as running
            game_threads[name] = std::thread(game_thread_loop, name);


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
                    {
                        std::lock_guard<std::mutex> lock(thread_control_mutex);
                        game_thread_running[id] = false;
                    }
                    game_queue_cvs[id].notify_one(); // wake up waiting thread
                    
                    game_sessions.erase(id);
                    if (game_threads.count(id)) {
                        if (game_threads[id].joinable())
                            game_threads[id].join();
                        game_threads.erase(id);
                    }
                    
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
            if (session.players.size() < 4 && !session.game_started) games.push_back({{"id", id}});
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
            response["turn_index"] = session.current_turn;
            response["player_hands"] = player_hands;
            
            response["wild_color"] = session.wild_color;

            response["winner"] = session.winner;
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
        std::string game_id = received["game_id"];
        received["connection_ptr"] = reinterpret_cast<uintptr_t>(&conn);
        {
            std::lock_guard<std::mutex> lock(game_queue_mutexes[game_id]);
            incoming_game_queues[game_id].push(received);
        }
        game_queue_cvs[game_id].notify_one();
        return;

    }

    // handling getting game state
    else if (type == "get_game_state") {
        std::string game_id = received["game_id"];
        received["connection_ptr"] = reinterpret_cast<uintptr_t>(&conn);
        {
            std::lock_guard<std::mutex> lock(game_queue_mutexes[game_id]);
            incoming_game_queues[game_id].push(received);
        }
        game_queue_cvs[game_id].notify_one();
        return;
    }

    else if (type == "get_player_info") {
        std::string game_id = received["game_id"];
        received["connection_ptr"] = reinterpret_cast<uintptr_t>(&conn);
        {
            std::lock_guard<std::mutex> lock(game_queue_mutexes[game_id]);
            incoming_game_queues[game_id].push(received);
        }
        game_queue_cvs[game_id].notify_one();
        return;
    }

    else if (type == "play_card") {
        std::string game_id = received["game_id"];
        received["connection_ptr"] = reinterpret_cast<uintptr_t>(&conn);
        {
            std::lock_guard<std::mutex> lock(game_queue_mutexes[game_id]);
            incoming_game_queues[game_id].push(received);
        }
        game_queue_cvs[game_id].notify_one();
        return;
    }

    else if (type == "draw_card") {
        std::string game_id = received["game_id"];
        received["connection_ptr"] = reinterpret_cast<uintptr_t>(&conn);
        {
            std::lock_guard<std::mutex> lock(game_queue_mutexes[game_id]);
            incoming_game_queues[game_id].push(received);
        }
        game_queue_cvs[game_id].notify_one();
        return;
    }

    else if (type == "player_disconnected") {
        std::string game_id = received["game_id"];
        received["connection_ptr"] = reinterpret_cast<uintptr_t>(&conn);
        {
            std::lock_guard<std::mutex> lock(game_queue_mutexes[game_id]);
            incoming_game_queues[game_id].push(received);
        }
        game_queue_cvs[game_id].notify_one();
        return;
    }
    else if (type == "skip_turn") {
        std::string game_id = received["game_id"];
        received["connection_ptr"] = reinterpret_cast<uintptr_t>(&conn);
        {
            std::lock_guard<std::mutex> lock(game_queue_mutexes[game_id]);
            incoming_game_queues[game_id].push(received);
        }
        game_queue_cvs[game_id].notify_one();
        return;
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

                // If the game is empty, remove the session
            if (session.players.empty()) {
                std::string to_erase = it->first;

                // Set game thread flag to false before erasing game session
                {
                    std::lock_guard<std::mutex> thread_lock(thread_control_mutex);
                    game_thread_running[to_erase] = false; // Mark thread as no longer running
                }

                // Notify game thread to exit
                game_queue_cvs[to_erase].notify_one();

                if (game_threads[to_erase].joinable()) {
                    game_threads[to_erase].join();  // Ensure the thread finishes properly
                }

                // Erase game session
                it = game_sessions.erase(it);

                
                continue; // Skip to next session
            }
        }
        ++it;
        }
    }

}


void game_thread_loop(const std::string& game_id) {
    while (true) {
        {
            std::lock_guard<std::mutex> lock(thread_control_mutex);
            if (!game_thread_running[game_id]) break;
        }

        // Wait for new messages or shutdown signal
        std::unique_lock<std::mutex> lock(game_queue_mutexes[game_id]);
        game_queue_cvs[game_id].wait(lock, [&] {
            std::lock_guard<std::mutex> check(thread_control_mutex);
            return !incoming_game_queues[game_id].empty() || !game_thread_running[game_id];
        });

        {
            std::lock_guard<std::mutex> lock(thread_control_mutex);
            if (!game_thread_running[game_id]) break;
        }

        if (incoming_game_queues[game_id].empty()) continue;

        json msg;
        try {
            msg = incoming_game_queues[game_id].front();
            incoming_game_queues[game_id].pop();
            lock.unlock();  // unlock the queue for next thread ops

            std::string type = msg.at("type");
            std::string player = msg.value("player_name", "");

            auto& session = game_sessions[game_id];
            
            crow::websocket::connection* conn =
                reinterpret_cast<crow::websocket::connection*>(msg.at("connection_ptr").get<uintptr_t>());

            json response;

            // Handle message types
            if (type == "play_card") {
                std::cout << "Playing card on game thread loop..." << std::endl;
                std::cout << msg << std::endl;
                std::string card = msg["card"];
                std::string chosen_color = msg.value("colour", ""); // optional based on wild card

                response["type"] = "card_played";
                response["player_name"] = player;
                response["card"] = card;

                if (!session.hands.count(player)) {
                    response["status"] = "not_found";
                } else if (!session.play_card(player, card, chosen_color)) {
                    response["status"] = "invalid";
                } else {
                    response["status"] = "ok";

                    // check if game over
                    std::string winner;
                    std::unordered_map<std::string, int> final_scores;

                    std::cout << "Checking if game is over" << std::endl;
                    if (session.check_game_over(winner, final_scores)) {
                        std::cout << "Game over..." << std::endl;
                        // game over, send game over response type
                        response["type"] = "game_over";
                        response["winner"] = winner;
                        response["final_scores"] = final_scores;
                        response["game_id"] = game_id;

                        // Set session winner
                        session.winner = winner;

                        // mark game as inactive/complete, cleanup will happen on disconnect
                        {
                            std::lock_guard<std::mutex> lock(thread_control_mutex);
                            game_thread_running[game_id] = false;
                        }

                        game_queue_cvs[game_id].notify_one();
                    } else {
                        std::cout << "Updating game state, game is not over yet" << std::endl;
                        // normal game state response
                        //json updated = session.to_json();
                        //response["updated_game_state"] = updated;

                        json gameStateResponse;

                        gameStateResponse["game_id"] = game_id;
                        gameStateResponse["currentPlayers"] = session.players;
                        gameStateResponse["host"] = session.players.empty() ? "" : session.players.front();
                        gameStateResponse["status"] = "ok";
                        // To tell the players polling for game_info that the game has started
                        gameStateResponse["game_started"] = session.game_started;
                        gameStateResponse["discard_pile"] = session.discard_pile;
                        json player_hands = json::object();
                        for (const auto &[player, hand] : session.hands)
                        {
                            player_hands[player] = hand.size();
                        }
                        gameStateResponse["turn_index"] = session.current_turn;
                        gameStateResponse["player_hands"] = player_hands;

                        response["updated_game_state"] = gameStateResponse;

                    }                    
                }

            } else if (type == "draw_card") {
                response["type"] = "card_drawn";
                response["player_name"] = player;

                if (!session.hands.count(player)) {
                    response["status"] = "not_found";
                } else {
                    std::string drawn = session.draw_card(player);
                    if (drawn.empty()){
                        response["status"] = "invalid"; // not your turn or already drew
                    } else {
                        response["card"] = drawn;
                        response["status"] = "ok";
                        //response["updated_game_state"] = session.to_json();

                        json gameStateResponse;

                        gameStateResponse["game_id"] = game_id;
                        gameStateResponse["currentPlayers"] = session.players;
                        gameStateResponse["host"] = session.players.empty() ? "" : session.players.front();
                        gameStateResponse["status"] = "ok";
                        // To tell the players polling for game_info that the game has started
                        gameStateResponse["game_started"] = session.game_started;
                        gameStateResponse["discard_pile"] = session.discard_pile;
                        json player_hands = json::object();
                        for (const auto &[player, hand] : session.hands)
                        {
                            player_hands[player] = hand.size();
                        }
                        gameStateResponse["turn_index"] = session.current_turn;
                        gameStateResponse["player_hands"] = player_hands;

                        response["updated_game_state"] = gameStateResponse;
                    }
                }
            
            } else if (type == "skip_turn") {

                // Add 1 to the turn index

                session.skip_turn();

                // No response? Since Game state will just update and tell all the players that it's the next players turn

                // Yes response just for consistency
                response["type"] = "turn_skipped";
                response["player_name"] = player;
                response["status"] = "ok";
            

            } else if (type == "get_game_state") {
                response = session.to_json();
                response["type"] = "game_state";
                response["status"] = "ok";

            } else if (type == "get_player_hand") {
                response["type"] = "player_hand";
                response["game_id"] = game_id;
                response["player_name"] = player;

                if (!session.hands.count(player)) {
                    response["status"] = "no_hand";
                } else {
                    response["status"] = "ok";
                    response["hand"] = session.hands[player];
                }

            } else if (type == "get_player_info") {
                response["type"] = "player_info";
                response["game_id"] = game_id;

                if (!session.hands.count(player)) {
                    response["status"] = "not_found";
                } else {
                    json player_data;
                    player_data["name"] = player;
                    player_data["numCards"] = session.hands[player].size();
                    player_data["hand"] = session.hands[player];
                    player_data["status"] = "active";
                    response["player"] = player_data;
                    response["status"] = "ok";
                }

            } else if (type == "player_disconnected") {
                response["type"] = "player_disconnected";
                response["game_id"] = game_id;
                response["player_name"] = player;

                session.players.erase(
                    std::remove(session.players.begin(), session.players.end(), player),
                    session.players.end()
                );
                session.hands.erase(player);

                if (session.host == player) {
                    session.host = session.players.empty() ? "" : session.players.front();
                }

                if (session.players.empty()) {
                    std::lock_guard<std::mutex> lock(game_mutex);
                    game_sessions.erase(game_id);  // Clean up

                    // Enqueue the response for the main thread to send
                    {
                        std::lock_guard<std::mutex> lock(message_queue_mutex);
                        message_queues[conn].push(response);
                    }
                    break; // End thread
                } else {
                    //response["updated_game_state"] = session.to_json();

                    json gameStateResponse;

                    gameStateResponse["game_id"] = game_id;
                    gameStateResponse["currentPlayers"] = session.players;
                    gameStateResponse["host"] = session.players.empty() ? "" : session.players.front();
                    gameStateResponse["status"] = "ok";
                    // To tell the players polling for game_info that the game has started
                    gameStateResponse["game_started"] = session.game_started;
                    gameStateResponse["discard_pile"] = session.discard_pile;
                    json player_hands = json::object();
                    for (const auto &[player, hand] : session.hands)
                    {
                        player_hands[player] = hand.size();
                    }
                    gameStateResponse["turn_index"] = session.current_turn;
                    gameStateResponse["player_hands"] = player_hands;

                    response["updated_game_state"] = gameStateResponse;
                }
            }

            // Enqueue the response for the main thread to send
            {
                std::lock_guard<std::mutex> lock(message_queue_mutex);
                message_queues[conn].push(response);
            }

        } catch (const std::exception& e) {
            // General fallback in case of bad message
            json error;
            error["type"] = "error";
            error["message"] = std::string("Game thread exception: ") + e.what();

            if (msg.contains("connection_ptr")) {
                crow::websocket::connection* conn =
                    reinterpret_cast<crow::websocket::connection*>(msg["connection_ptr"].get<uintptr_t>());
                std::lock_guard<std::mutex> lock(message_queue_mutex);
                message_queues[conn].push(error);
            }
        }
    }
}

void flush_pending_messages() {
    std::lock_guard<std::mutex> lock(message_queue_mutex);
    for (auto& [conn, queue] : message_queues) {
        while (!queue.empty()) {
            conn->send_text(queue.front().dump());
            queue.pop();
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
    
    std::thread flusher([] {
        while (true) {
            flush_pending_messages();
            std::this_thread::sleep_for(std::chrono::milliseconds(30)); // tweak as needed
        }
    });
    flusher.detach(); // or store the thread handle if you want to control it
    

    app.port(9002).multithreaded().run();
}
