#include "gtest/gtest.h"
#include "game_logic.h"

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
    EXPECT_FALSE(game.play_card("player1", "Red 20"));
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

    std::string skip_card = "Red Skip";
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

    std::string reverse_card = "Red Reverse";
    game.hands["player1"] = {reverse_card};

    EXPECT_TRUE(game.play_card("player1", reverse_card));
    EXPECT_EQ(game.to_json()["players"][0], "player1");
    EXPECT_EQ(game.to_json()["players"][1], "player3"); // Order reversed
}

// Test Draw Two card functionality
TEST_F(GameLogicTest, DrawTwoCardNextPlayerDrawsTwo) {
    std::string draw_two = "Red Draw Two";
    game.hands["player1"] = {draw_two};
    int original_hand_size = game.to_json()["hands"]["player2"].size();

    EXPECT_TRUE(game.play_card("player1", draw_two));
    EXPECT_EQ(game.to_json()["hands"]["player2"].size(), original_hand_size + 2);
}

// Test Wild card functionality
TEST_F(GameLogicTest, WildCardPlaysSuccessfully) {
    std::string wild = "Wild";
    game.hands["player1"] = {wild};

    EXPECT_TRUE(game.play_card("player1", wild));
    EXPECT_EQ(game.to_json()["discard_pile"].back(), wild);
}

// Test Wild Draw Four card functionality
TEST_F(GameLogicTest, WildDrawFourMakesNextDrawFour) {
    std::string wild4 = "Wild Draw Four";
    game.hands["player1"] = {wild4};
    int original_hand_size = game.to_json()["hands"]["player2"].size();

    EXPECT_TRUE(game.play_card("player1", wild4));
    EXPECT_EQ(game.to_json()["hands"]["player2"].size(), original_hand_size + 4);
}

// Test adding players up to limit
TEST_F(GameLogicTest, MaxTenPlayers) {
    for (int i = 3; i <= 11; i++) {
        game.add_player("p" + std::to_string(i));
    }
    EXPECT_EQ(game.to_json()["players"].size(), 10);
}

// Add this main() if you're not linking gtest_main
int main(int argc, char **argv) {
    ::testing::InitGoogleTest(&argc, argv);
    return RUN_ALL_TESTS();
}
