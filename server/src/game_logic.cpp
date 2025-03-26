#include "game_logic.h"
#include <iostream>
#include <random>

GameSession::GameSession(std::string id) : game_id(id) {
    initialize_deck();
}

void GameSession::initialize_deck() {
    std::vector<std::string> colors = {"Red", "Blue", "Green", "Yellow"};
    std::vector<std::string> values = {"0", "1", "2", "3", "4", "5", "6", "7", "8", "9"};
    std::vector<std::string> special_cards = {"Skip", "Reverse", "Draw Two"};
    std::vector<std::string> wild_cards = {"Wild", "Wild Draw Four"};

    for (const auto& color : colors) {
        for (const auto& value : values) {
            deck.push_back(color + " " + value);
        }
        for (const auto& special : special_cards) {
            deck.push_back(color + " " + special);
        }
    }

    for (const auto& wild : wild_cards) {
        deck.push_back(wild);
    }

    std::shuffle(deck.begin(), deck.end(), std::default_random_engine(time(0)));

    discard_pile.push_back(deck.back()); // Set initial discard card
    deck.pop_back();
}

void GameSession::add_player(std::string player_id) {
    if (players.size() < 4) {
        players.push_back(player_id);
        hands[player_id] = std::vector<std::string>();
        for (int i = 0; i < 7; i++) {
            hands[player_id].push_back(deck.back());
            deck.pop_back();
        }
    }
}

bool GameSession::play_card(std::string player_id, std::string card) {
    if (player_id != players[current_turn]) return false;
    if (std::find(hands[player_id].begin(), hands[player_id].end(), card) == hands[player_id].end()) return false;

    std::cout << player_id << " played " << card << std::endl;
    hands[player_id].erase(std::remove(hands[player_id].begin(), hands[player_id].end(), card), hands[player_id].end());
    discard_pile.push_back(card);

    apply_card_effect(player_id, card);
    return true;
}

void GameSession::apply_card_effect(std::string player_id, std::string card) {
    if (card.find("Skip") != std::string::npos) {
        std::cout << "Skip card played! Next player loses turn." << std::endl;
        current_turn = (current_turn + 2) % players.size();
    } else if (card.find("Reverse") != std::string::npos) {
        std::cout << "Reverse card played! Turn order reversed." << std::endl;
        std::reverse(players.begin(), players.end());
    } else if (card.find("Draw Two") != std::string::npos) {
        std::cout << "Draw Two card played! Next player draws 2 cards." << std::endl;
        int next_player = (current_turn + 1) % players.size();
        for (int i = 0; i < 2; i++) {
            hands[players[next_player]].push_back(deck.back());
            deck.pop_back();
        }
        current_turn = (current_turn + 2) % players.size();
    } else if (card.find("Wild") != std::string::npos) {
        std::cout << "Wild card played! Player chooses new color." << std::endl;
    } else if (card.find("Wild Draw Four") != std::string::npos) {
        std::cout << "Wild Draw Four card played! Next player draws 4." << std::endl;
        int next_player = (current_turn + 1) % players.size();
        for (int i = 0; i < 4; i++) {
            hands[players[next_player]].push_back(deck.back());
            deck.pop_back();
        }
        current_turn = (current_turn + 2) % players.size();
    } else {
        current_turn = (current_turn + 1) % players.size();
    }
}

json GameSession::to_json() {
    return {
        {"game_id", game_id},
        {"players", players},
        {"current_turn", current_turn},
        {"top_card", discard_pile.back()},
        {"hands", hands}
    };
}
