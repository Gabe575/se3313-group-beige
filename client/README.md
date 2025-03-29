To run:
cd client
npm install
npm run dev

Go to localhost page




WEBSOCKETS


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



Lobbys navigate to navigate(`/lobby/${data.game_id}`);