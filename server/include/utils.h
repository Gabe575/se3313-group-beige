#ifndef UTILS_H
#define UTILS_H

#include <string>
#include <vector>

class Utils {
public:
    static std::string generate_game_id();
    static void shuffle_deck(std::vector<std::string>& deck);
    static void log_message(const std::string& message);
};

#endif
