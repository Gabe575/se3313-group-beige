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















