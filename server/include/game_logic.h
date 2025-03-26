#ifndef GAME_LOGIC_H
#define GAME_LOGIC_H

#include <vector>
#include <string>
#include <unordered_map>
#include <algorithm>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

class GameSession {
public:
    std::string game_id;
    std::vector<std::string> players;
    std::unordered_map<std::string, std::vector<std::string>> hands;
    std::vector<std::string> deck;
    std::vector<std::string> discard_pile;
    int current_turn = 0;

    GameSession(std::string id);
    void initialize_deck();
    void add_player(std::string player_id);
    bool play_card(std::string player_id, std::string card);
    void apply_card_effect(std::string player_id, std::string card);
    json to_json();
};

#endif
