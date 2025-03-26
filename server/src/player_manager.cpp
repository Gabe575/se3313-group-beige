#include "player_manager.h"
#include <iostream>

void PlayerManager::add_player(const std::string& player_id) {
    if (players.size() < max_players) {
        players.push_back(player_id);
        std::cout << "Player added: " << player_id << std::endl;
    } else {
        std::cerr << "Game is full! Cannot add player: " << player_id << std::endl;
    }
}

bool PlayerManager::remove_player(const std::string& player_id) {
    auto it = std::find(players.begin(), players.end(), player_id);
    if (it != players.end()) {
        players.erase(it);
        std::cout << "Player removed: " << player_id << std::endl;
        return true;
    }
    return false;
}

std::string PlayerManager::get_current_player() {
    return players[current_turn];
}

void PlayerManager::next_turn() {
    current_turn = (current_turn + 1) % players.size();
    std::cout << "Next turn: Player " << players[current_turn] << std::endl;
}

bool PlayerManager::is_valid_turn(const std::string& player_id) {
    return players[current_turn] == player_id;
}
