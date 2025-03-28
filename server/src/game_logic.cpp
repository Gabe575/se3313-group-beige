#include "game_logic.h"
#include <iostream>
#include <random>

// initialize game session with a given game ID
GameSession::GameSession(std::string id) : game_id(id) {
    initialize_deck(); // setup UNO deck at start of game
}

// initializes UNO deck and shuffles it
void GameSession::initialize_deck() {
    std::vector<std::string> colors = {"Red", "Blue", "Green", "Yellow"}; // 4 colours
    std::vector<std::string> values = {"0", "1", "2", "3", "4", "5", "6", "7", "8", "9"}; // numbered cards 0-9
    std::vector<std::string> special_cards = {"Skip", "Reverse", "Draw Two"}; // special cards
    std::vector<std::string> wild_cards = {"Wild", "Wild Draw Four"}; // wild cards

    // Create the deck with all possible color-number combinations.
    for (const auto& color : colors) {
        for (const auto& value : values) {
            deck.push_back(color + " " + value); // Example: Red 5
        }
        for (const auto& special : special_cards) {
            deck.push_back(color + " " + special); // Example Blue Reverse
        }
    }
    
    // add wild cards (no specific colour)
    for (const auto& wild : wild_cards) {
        deck.push_back(wild);
    }
    
    // random number generator
    std::random_device rd;
    std::mt19937 rng(rd());

    // randomly shuffle deck
    std::shuffle(deck.begin(), deck.end(), rng);

    // Set initial discard card
    discard_pile.push_back(deck.back()); 
    deck.pop_back();
}

// add new player to game if max limit (10 players) is not reached
void GameSession::add_player(std::string player_id) {
    if (players.size() < 10) {
        players.push_back(player_id);
        hands[player_id] = std::vector<std::string>(); // create empty hand for player

        // deal 7 cards to new player
        for (int i = 0; i < 7; i++) {
            hands[player_id].push_back(deck.back());
            deck.pop_back();
        }
    }
}

// handles playing a card. Returns true if successful, false if invalid
bool GameSession::play_card(std::string player_id, std::string card) {
    // check if player's turn
    if (player_id != players[current_turn]) return false;

    // check if player has the card in their hand 
    if (std::find(hands[player_id].begin(), hands[player_id].end(), card) == hands[player_id].end()) return false;

    // announce the move
    std::cout << player_id << " played " << card << std::endl;

    // remove played card from player's hand and add to discard pile
    hands[player_id].erase(std::remove(hands[player_id].begin(), hands[player_id].end(), card), hands[player_id].end());
    discard_pile.push_back(card);
       
    // apply special card effects
    apply_card_effect(player_id, card);
    return true;
}

// applies the effect of special UNO cards
void GameSession::apply_card_effect(std::string player_id, std::string card) {
    // Skip card
    if (card.find("Skip") != std::string::npos) {
        std::cout << "Skip card played! Next player loses turn." << std::endl;
        current_turn = (current_turn + 2) % players.size();
    } 
    // Reverse card
    else if (card.find("Reverse") != std::string::npos) {
        std::cout << "Reverse card played! Turn order reversed." << std::endl;
        std::reverse(players.begin(), players.end());
    } 
    // Draw two
    else if (card.find("Draw Two") != std::string::npos) {
        std::cout << "Draw Two card played! Next player draws 2 cards." << std::endl;
        int next_player = (current_turn + 1) % players.size();
        for (int i = 0; i < 2; i++) {
            hands[players[next_player]].push_back(deck.back());
            deck.pop_back();
        }
        current_turn = (current_turn + 2) % players.size();
    } 
    // Wild Card
    else if (card.find("Wild") != std::string::npos) {
        std::cout << "Wild card played! Waiting for " << player_id << " to choose a color..." << std::endl;
        
        // Ask the player to select a color
        //pending_wild_choice = player_id; // Track the player who must choose
        //wild_color = ""; // Reset wild color until the player selects one
    } 
    // Wild Draw Four
    else if (card.find("Wild Draw Four") != std::string::npos) {
        std::cout << "Wild Draw Four card played! Next player draws 4." << std::endl;
        int next_player = (current_turn + 1) % players.size();
        for (int i = 0; i < 4; i++) {
            hands[players[next_player]].push_back(deck.back());
            deck.pop_back();
        }
        
        std::cout << "Waiting for " << player_id << " to choose a color..." << std::endl;
        //pending_wild_choice = player_id; // Track player needing to select a color
        //wild_color = ""; // Reset wild color
        current_turn = (current_turn + 2) % players.size();
    } 
    // Regular card, do nothing
    else {
        current_turn = (current_turn + 1) % players.size();
    }
}

// convert game session to a json object
json GameSession::to_json() {
    return {
        {"game_id", game_id},
        {"players", players},
        {"current_turn", current_turn},
        {"top_card", discard_pile.back()},
        {"hands", hands}
    };
}
