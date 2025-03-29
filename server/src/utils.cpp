#include "utils.h"
#include <iostream>
#include <random>
#include <algorithm>

std::string Utils::generate_game_id() {
    static const char alphanum[] = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    std::string id;
    for (int i = 0; i < 6; ++i) {
        id += alphanum[rand() % (sizeof(alphanum) - 1)];
    }
    return id;
}

void Utils::shuffle_deck(std::vector<std::string>& deck) {
    std::random_device rd;
    std::mt19937 g(rd());
    std::shuffle(deck.begin(), deck.end(), g);
}

void Utils::log_message(const std::string& message) {
    std::cout << "[LOG]: " << message << std::endl;
}
