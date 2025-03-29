 ### To run:
cd client
npm install
npm run dev
Go to localhost:5173 (or other port look at the console log for the link)


WEBSOCKETS

### Page breakdown
1. Main menu - enter name, go to view available games, create game
2. Game List - view available games - click to join and go to lobby for that game
    - Get list of available rooms (those in lobby, with <4 players)
3. Create Game - enter game name, send request to create thread, go to lobby
    - Send post (gamename, userid)
    - Async get gameid once creation complete, redirect to lobby
4. Lobby - Waiting for other players to connect, back button, view # of players in game (+ player names?), player who created lobby gets to start the game once 4 players have connected
    - Get # of players, and player names
    - Player who created lobby send (start game)
    - GameInfo:
        - host: ""
        - currentPlayers: ["", "",...]
        - game_id: ""
5. Game - shows all 4 players + their names, how many cards are in the other players decks, whose turn it is, the cards in the middle


### Server needs to handle requests of types:
- create_player, {player_name: playerName} 
    - send back either okay or not if that name is taken, if not - store name in list of current names (check to remove names when sockets close)
    - {type: name_confirmation, name: ""}

- get_available_games, (no params)
    - send back a list of games with < 4 players 
    - {type: available_games, games: [{id: "", name: ""}]}

- join_game, {game_id: gameId, player_name: playerName}
    - Send back an okay message (or not if the game couldn't be joined for some reason) (if okay the user redirects to the lobby of that id)
    - {type: join_confirmation, game_id: ""}

- create_game, {player_name: playerName, game_id: gameName}
    - Send back an okay message if the game was created successfully (or not)
    - {type: game_created, game_id: ""}

- get_game_info, {game_id: gameId}
    - Send back info on the game of the given gameid (if it exists)
    - {type: game_info, currentPlayers: ["", "",...], host: "", game_id: ""}








### GAME DATA
SETUP:

Send: {type: get_game_info, game_id: gameId}
Recieve: {type: game_info, currentPlayers: ["", "",...], host: "", game_id: ""}



GAME STATE:

Send: {type: get_game_state}
Recieve: {type: game_state, currentPlayers: ["", "",...], host: "", game_id: "", turnName: "", playDirection: "", remainingCards: "", discardPile: [{card}, {card},...]}
    - currentPlayers is the list of connected players
    - host is the player that created the server
    - turnName is the playerName of the player whose turn it is
    - playDirection (forward / reverse) - clockwise / counter clockwise
    - remainingCards
    - discard pile - list of cards in the discard pile


Send: {type: get_player_info, player_name: name, game_id: gameId}
Recieve: {type: player_info, player: {name: "", #ofCards: int, hand: [{card}, {card},...], status: "active" | "disconnected" | "waiting"}, game_id: gameId}



GAMEPLAY ACTIONS:

Send: {type: play_card, game_id: gameId, player_name: "player1", card: {color: "red", value: "7"}}
Recieve: {{type: card_played, player_name: "player1", card: {color: "red", value: "7"}, updated_game_state: {type: game_state......}}}
    - Only recieve this if they're allowed to perform this action
    - Game state object also sent back with this that's been updated after the card has been played


Send: {type: draw_card, game_id: gameId, player_name: "player1"}
Recieve: {type: card_drawn, player_name: "player1", card: {color: "blue", value: "5"}, updated_game_state: {type: game_state......}}



SPECIAL ACTIONS:

Send: {type: action_special_card, game_id: gameId, player_name: "player1", card: {color: "green", value: "+2"}}
Recieve: {type: special_card_played, player_name: "player1", card: {color: "green", value: "+2"}, next_player_name: "player2", updated_game_state: {...}}


Send: {type: call_uno, game_id: gameId, player_name: "player1"}
Recieve: {type: uno_called, player_name: "player1", updated_game_state: {...}}


Send: {type: get_winner_info, game_id: gameId}
Recieve: {type: game_over, winner: "player1", final_scores: {"player1": 0, "player2": 10, ...}, game_id: gameId}



ERRORS:

Send: {type: player_disconnected, game_id: gameId, player_name: "player1"}
Recieve: {{type: player_disconnected, player_name: "player1", updated_game_state: {...}}}
    - Broadcast when a player fails to respond for a given amount of time


















