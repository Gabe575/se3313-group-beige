#include "game_logic.h"
#include <iostream>
#include <random>

GameSession::GameSession() : game_id(""), host(""), current_turn(0), wild_color("") {}

// initialize game session with a given game ID
GameSession::GameSession(std::string id) : game_id(id) {
    initialize_deck(); // setup UNO deck at start of game
}

// initializes UNO deck and shuffles it
void GameSession::initialize_deck() {
    std::vector<std::string> colors = {"red", "blue", "green", "yellow"}; // 4 colours
    std::vector<std::string> special_cards = {"skip", "reverse", "plus2"}; // special cards
    std::vector<std::string> wild_cards = {"wild", "wild_plus4"}; // wild cards

    // Create the deck with all possible color-number combinations.
    for (const auto& color : colors) {
        // add one 0 card per colour
        deck.push_back(color  + "_0");

        // add two of each number from 1 to 9 per colour
        for (int i = 1; i <= 9; i++) {
            std::string card = color + "_" + std::to_string(i);
            deck.push_back(card);
        }
        // add two of each action card per colour: Skip, Draw Two, Reverse  
        for (const auto& special : special_cards) {
            std::string card = color + "_" + special;
            deck.push_back(card);
            deck.push_back(card);
        }
    }
    
    // Add 4 Wild and 4 Wild Draw Four cards (no color)
    for (int i = 0; i < 4; i++) {
        deck.push_back("wild");
        deck.push_back("wild_plus4");
    }
    
    // random number generator
    std::random_device rd;
    std::mt19937 rng(rd());

    // randomly shuffle deck
    std::shuffle(deck.begin(), deck.end(), rng);

    while (!deck.empty() && 
           (deck.back() == "wild" || deck.back() == "wild_plus4")) {
        std::shuffle(deck.begin(), deck.end(), rng); // Reshuffle to avoid wild cards starting
    }

    // Set initial discard card
    discard_pile.push_back(deck.back());

    deck.pop_back();
}

// add new player to game if max limit (4 players) is not reached
void GameSession::add_player(std::string player_id) {
    if (players.size() < 4) {
        players.push_back(player_id);

        // set host if first player
        if (players.size() == 1) {
            host = player_id;
        }

        hands[player_id] = std::vector<std::string>(); // create empty hand for player

        // deal 7 cards to new player
        for (int i = 0; i < 7; i++) {
            if (!deck.empty()) {
                draw_card_unchecked(player_id);
            }

        }
        has_drawn[player_id] = false;
    }
}

// handles playing a card. Returns true if successful, false if invalid
bool GameSession::play_card(std::string player_id, std::string card, std::string chosen_color) {
    // Check if it's the player's turn
    if (player_id != players[current_turn]) return false;
    
    // Check if the player has the card in their hand
    auto& hand = hands[player_id];
    auto it = std::find(hand.begin(), hand.end(), card);
    if (it == hand.end()) return false;
    
    // Extract the top card from the discard pile
    if (discard_pile.empty()) return false;
    std::string top_card = discard_pile.back();

    // Extract color and value from cards (assuming format "Red_5", "Blue_Draw2", etc.)
    std::string played_color = card.substr(0, card.find('_'));
    std::string played_value = card.substr(card.find('_') + 1);
    std::string top_color = top_card.substr(0, top_card.find('_'));
    std::string top_value = top_card.substr(top_card.find('_') + 1);

    // Wild card always playable, but must include color
    if (card.find("wild") == 0) {
        if (chosen_color.empty()) return false; // need a chosen color
        wild_color = chosen_color; // set wild color
        std::cout << player_id << " chose wild color: " << wild_color << std::endl;
    } else {
        // if last card was a wild, compare to chosen color
        if (!wild_color.empty()) {
            if (played_color != wild_color) return false;
        } else {
            // last card was not a wild, so you need to match number or color
            if (played_color != top_color && played_value != top_value) return false;
        }
        wild_color = ""; // clear wild card color if not wild card
    }

    // announce the move
    std::cout << player_id << " played " << card << std::endl;

    // remove played card from player's hand and add to discard pile
    hand.erase(it);
    discard_pile.push_back(card);
       
    // apply special card effects
    apply_card_effect(player_id, card);
    for (auto& [player, drawn] : has_drawn) {
        drawn = false; // reset draw tracker after successful play
    }

    // Double check the next player is allowed to draw a card
    for (auto& [player, drawn] : has_drawn) {
        drawn = false; // Reset draw tracker at the start of each player's turn
    }

    return true;
}

// draw a card from the deck
std::string GameSession::draw_card(const std::string& player_id) {

    // check if its your turn
    if (player_id != players[current_turn]) return ""; // not your turn
    if (has_drawn[player_id]) return ""; // already drew

    if (!deck.empty()) {
        std::string drawn_card = deck.back();
        deck.pop_back();
        hands[player_id].push_back(drawn_card);
        has_drawn[player_id] = true;
        return drawn_card;
    } else {
        return "";
    }
}

// draw card unchecked (used for dealing cards at start of game)
std::string GameSession::draw_card_unchecked(const std::string& player_id){
    if (!deck.empty()){
        std::string drawn_card = deck.back();
        deck.pop_back();
        hands[player_id].push_back(drawn_card);
        return drawn_card;
    } else {
        return "";
    }
}

bool GameSession::check_game_over(std::string& winner, std::unordered_map<std::string, int>& final_scores) {
    for (const auto& [player, hand] : hands) {
        if (hand.empty()){
            winner = player;

            // calculate scores
            int lowest = INT_MAX;
            for (const auto& [p, h] : hands){
                int score = 0;
                for (const auto& card : h) {
                    if (card.find("wild_plus4") != std::string::npos || card.find("wild") != std::string::npos) score += 50;
                    else if (card.find("skip") != std::string::npos || card.find("reverse") != std::string::npos || card.find("plus2") != std::string::npos) score += 20;
                    else {
                        try {
                            score += std::stoi(card.substr(card.find("_") + 1));
                        } catch (...) {};
                    }
                }
                final_scores[p] = score;
            }
            return true;
        }
    }
    return false;
}

// applies the effect of special UNO cards
void GameSession::apply_card_effect(std::string player_id, std::string card) {
    // Skip card
    if (card.find("skip") != std::string::npos) {
        std::cout << "Skip card played! Next player loses turn." << std::endl;
        current_turn = (current_turn + 2) % players.size();
    } 
    // Reverse card
    else if (card.find("reverse") != std::string::npos) {
        std::cout << "Reverse card played! Turn order reversed." << std::endl;
        std::reverse(players.begin(), players.end());

         // Update the current_turn index to point to the same player after reversing
        for (size_t i = 0; i < players.size(); ++i) {
            if (players[i] == players[current_turn]) {
                current_turn = (i + 1) % players.size(); // move to the next player in reversed order
                break;
            }
        }
    } 
    // Draw two
    else if (card.find("plus2") != std::string::npos) {
        std::cout << "Draw Two card played! Next player draws 2 cards." << std::endl;
        int next_player = (current_turn + 1) % players.size();
        for (int i = 0; i < 2; i++) {
            draw_card_unchecked(players[next_player]);
        }
        current_turn = (current_turn + 2) % players.size();
    } 
    // Wild Draw Four
    else if (card.find("wild_plus4") != std::string::npos) {
        std::cout << "Wild Draw Four card played! Next player draws 4." << std::endl;
        int next_player = (current_turn + 1) % players.size();
        for (int i = 0; i < 4; i++) {
            draw_card_unchecked(players[next_player]);
        }
        
        std::cout << "Waiting for " << player_id << " to choose a color..." << std::endl;
        current_turn = (current_turn + 2) % players.size();
    } 
    // Wild Card
    else if (card.find("wild") != std::string::npos) {
        std::cout << "Wild card played! Waiting for " << player_id << " to choose a color..." << std::endl;
        
        current_turn = (current_turn + 1) % players.size();
    } 
    // Regular card, do nothing
    else {
        current_turn = (current_turn + 1) % players.size();
    }
}

void GameSession::skip_turn() {
    current_turn = (current_turn + 1) % players.size();
    // Reset drawn status for the new current player
    has_drawn[players[current_turn]] = false;
}

// convert game session to a json object
json GameSession::to_json() {
    return {
        {"game_id", game_id},
        {"players", players},
        {"current_turn", current_turn},
        {"top_card", discard_pile.back()},
        {"hands", hands},
        {"discard_pile", discard_pile},
        {"game_started", game_started},
        {"wild_color", wild_color}
    };
}
