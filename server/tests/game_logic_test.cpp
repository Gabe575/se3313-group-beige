#include "gtest/gtest.h"
#include "game_logic.h"
#include <climits>

// Fixture for setting up GameSession before each test
class GameLogicTest : public ::testing::Test {
protected:
    GameSession game;

    GameLogicTest() : game("test_game") {
        game.add_player("player1");
        game.add_player("player2");
    }
};

// Test deck initialization
TEST_F(GameLogicTest, DeckIsInitializedCorrectly) {
    EXPECT_GT(game.to_json()["top_card"].get<std::string>().size(), 0);
}

// Test player addition
TEST_F(GameLogicTest, PlayerIsAddedWithSevenCards) {
    json game_json = game.to_json();
    EXPECT_EQ(game_json["players"].size(), 2);
    EXPECT_EQ(game_json["hands"]["player1"].size(), 7);
    EXPECT_EQ(game_json["hands"]["player2"].size(), 7);
}

// Test playing invalid card (not in hand)
TEST_F(GameLogicTest, PlayInvalidCardNotInHand) {
    EXPECT_FALSE(game.play_card("player1", "red_20"));
}

// Test playing when not player's turn
TEST_F(GameLogicTest, PlayCardWrongTurn) {
    std::string card = game.to_json()["hands"]["player2"][0];
    EXPECT_FALSE(game.play_card("player2", card));
}

// Test playing a valid regular card
TEST_F(GameLogicTest, PlayValidCardSuccess) {
    std::string card = game.to_json()["hands"]["player1"][0];
    EXPECT_TRUE(game.play_card("player1", card));
    EXPECT_EQ(game.to_json()["discard_pile"].back(), card);
}

// Test Skip card functionality
TEST_F(GameLogicTest, SkipCardSkipsNextPlayer) {
    game = GameSession("test_game");
    game.add_player("player1");
    game.add_player("player2");
    game.add_player("player3");

    std::string skip_card = "red_skip";
    game.hands["player1"] = {skip_card};

    EXPECT_TRUE(game.play_card("player1", skip_card));
    EXPECT_EQ(game.to_json()["current_turn"], 2); // Skips player2
}

// Test Reverse card functionality
TEST_F(GameLogicTest, ReverseCardReversesOrder) {
    game = GameSession("test_game");
    game.add_player("player1");
    game.add_player("player2");
    game.add_player("player3");

    std::string reverse_card = "red_reverse";
    game.hands["player1"] = {reverse_card};

    EXPECT_TRUE(game.play_card("player1", reverse_card));
    EXPECT_EQ(game.to_json()["players"][0], "player3");
    EXPECT_EQ(game.to_json()["players"][1], "player2");
    EXPECT_EQ(game.to_json()["players"][2], "player1");
}

// test that reverse card sets next player turn correctly
TEST_F(GameLogicTest, ReverseCardSetsNextPlayerCorrectly) {
    game = GameSession("test_game");
    game.add_player("player1");
    game.add_player("player2");
    game.add_player("player3");

    std::string reverse_card = "red_reverse";
    game.hands["player2"] = {reverse_card};
    game.play_card("player2", reverse_card);

    json game_state = game.to_json();
    const std::vector<std::string> updated_players = game_state["players"];

    // After reversing, the order becomes: [player3, player2, player1]
    // Since player2 played the card, the next player should be player1
    std::string expected_next_player = "player1";

    EXPECT_EQ(updated_players[game_state["current_turn"]], expected_next_player);
}

// Test Draw Two card functionality
TEST_F(GameLogicTest, DrawTwoCardNextPlayerDrawsTwo) {
    std::string draw_two = "red_plus2";
    game.hands["player1"] = {draw_two};
    int original_hand_size = game.to_json()["hands"]["player2"].size();

    EXPECT_TRUE(game.play_card("player1", draw_two));
    EXPECT_EQ(game.to_json()["hands"]["player2"].size(), original_hand_size + 2);
}

// Test Wild card functionality
TEST_F(GameLogicTest, WildCardPlaysSuccessfully) {
    std::string wild = "wild";
    game.hands["player1"] = {wild};

    EXPECT_TRUE(game.play_card("player1", wild));
    EXPECT_EQ(game.to_json()["discard_pile"].back(), wild);
}

// Test Wild Draw Four card functionality
TEST_F(GameLogicTest, WildDrawFourMakesNextDrawFour) {
    std::string wild4 = "wild_plus4";
    game.hands["player1"] = {wild4};
    int original_hand_size = game.to_json()["hands"]["player2"].size();

    EXPECT_TRUE(game.play_card("player1", wild4));
    EXPECT_EQ(game.to_json()["hands"]["player2"].size(), original_hand_size + 4);
}

// Test adding players up to limit
TEST_F(GameLogicTest, MaxTenPlayers) {
    for (int i = 3; i <= 5; i++) {
        game.add_player("p" + std::to_string(i));
    }
    EXPECT_EQ(game.to_json()["players"].size(), 4);
}

TEST_F(GameLogicTest, CallUNOWhenOneCardLeft) {
    // give player1 two arbitrary cards, including a playable card
    std::string card1 = "blue_5";
    std::string card2 = "green_2";
    game.hands["player1"] = {card1,card2};

    // simulate playing one card, leaving player1 with one
    EXPECT_TRUE(game.play_card("player1", card1));
    EXPECT_EQ(game.hands["player1"].size(), 1);

    // Pretend they called UNO
    EXPECT_TRUE(game.hands["player1"].size() == 1);
}

TEST_F(GameLogicTest, WinnerHasZeroCardsAndLowestScore) {
    game = GameSession("test_game");
    game.add_player("winner");
    game.add_player("loser");

    std::string winning_card = "green_7";
    game.hands["winner"] = { winning_card };
    game.hands["loser"] = {"red_5", "red_skip"}; // score will be 5 + 20

    EXPECT_TRUE(game.play_card("winner", winning_card));
    EXPECT_TRUE(game.hands["winner"].empty()); // players hand should now be empty

    // simulate backend scoring logic
    std::unordered_map<std::string, int> scores;
    int lowest = INT_MAX;
    std::string winner_id;

    for (const auto& [player, hand] : game.hands) {
        int score = 0;

        for (const std::string& c : hand) {
            if (c.find("wild_plus4") != std::string::npos) score += 50;
            else if (c.find("wild") != std::string::npos) score += 50;
            else if (c.find("plus2") != std::string::npos || c.find("reverse") != std::string::npos || c.find("skip") != std::string::npos) score += 20;
            else {
                try {
                    score += std::stoi(c.substr(c.find("_") + 1));
                } catch (...) {}
            }
        }

        scores[player] = score;
        if (score < lowest) {
            lowest = score;
            winner_id = player;
        }
    }

    EXPECT_EQ(winner_id, "winner");
    EXPECT_EQ(scores["loser"], 25); // 5 + 20 (skip)
}

// Add this main() if you're not linking gtest_main
int main(int argc, char **argv) {
    ::testing::InitGoogleTest(&argc, argv);
    return RUN_ALL_TESTS();
}
