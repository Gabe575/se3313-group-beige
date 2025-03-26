#ifndef PLAYER_MANAGER_H
#define PLAYER_MANAGER_H

#include <vector>
#include <string>
#include <algorithm>

class PlayerManager {
private:
    std::vector<std::string> players;
    int current_turn = 0;
    const int max_players = 4;

public:
    void add_player(const std::string& player_id);
    bool remove_player(const std::string& player_id);
    std::string get_current_player();
    void next_turn();
    bool is_valid_turn(const std::string& player_id);
};

#endif
