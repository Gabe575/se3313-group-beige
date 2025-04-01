#ifndef GAME_LOGIC_H
#define GAME_LOGIC_H

#include <vector>
#include <string>
#include <unordered_map>
#include <algorithm>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

/**
 * @class GameSession
 * @brief Represents a single game session of UNO, managing players, cards, turns, and game logic.
 */
class GameSession {
public:
    std::string game_id; // unique identifier for game session
    std::string host;
    std::vector<std::string> players; // list of player ids in game
    std::unordered_map<std::string, std::vector<std::string>> hands; // maps each player id to their current hand of cards
    std::vector<std::string> deck; // main draw pile for game
    std::vector<std::string> discard_pile; // pile where played cards go
    int current_turn = 0; // index of player whose turn it is
    bool game_started = false;

    std::string pending_wild_choice = "";
    std::string wild_color = "";

    GameSession();

    /**
     * @brief Constructor: Initializes the game session with a unique ID.
     * @param id The unique identifier for the game session.
     */
    GameSession(std::string id);

    /**
     * @brief Initializes the deck with all UNO cards and shuffles it.
     */
    void initialize_deck();

    /**
     * @brief Adds a player to the game and deals them a starting hand.
     * @param player_id The unique identifier of the player joining the game.
     */
    void add_player(std::string player_id);

    /**
     * @brief Handles playing a card from a player's hand.
     * @param player_id The player attempting to play a card.
     * @param card The card being played.
     * @return True if the move was valid, false otherwise.
     */
    bool play_card(std::string player_id, std::string card);

    std::string draw_card(const std::string& player_id);

    /**
     * @brief Applies special effects of action cards (Skip, Reverse, Draw Two, Wild, etc.).
     * @param player_id The player who played the special card.
     * @param card The special card that was played.
     */
    void apply_card_effect(std::string player_id, std::string card);

    /**
     * @brief Converts the current game state to JSON format for easy communication with the client.
     * @return A JSON object containing the game state.
     */
    json to_json();
};

#endif
