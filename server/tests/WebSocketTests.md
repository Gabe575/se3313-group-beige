# WebSocket Tests

The following are JSON objects to be placed into a Postman WebSocket request to test the server functionality.

## Instructions

1. Open Postman
2. From the Sidebar, click "New", then "WebSocket".
3. Enter the following URL: ws://localhost:9002/ws
4. Click "Connect". You should see a green indicator in the top-right of the response box if this worked.
5. To make a request, copy-paste the JSON found below into the message box and hit send. You should receive a status "ok" if the request worked as expected.

### Create Player

{
"type": "create_player",
"player_name": "player1"
}

### Create Game

{
"type": "create_game",
"player_name": "player1",
"game_id": "abc"
}

### Join Game

{
"type": "join_game",
"player_name": "player2",
"game_id": "abc"
}

### Leave Game

{
"type": "leave_game",
"player_name": "player1",
"game_id": "abc"
}

### Get Available Games

{
"type": "get_available_games"
}

### Get Game Info

{
"type": "get_game_info",
"game_id": "abc"
}

### Start Game

{
"type": "start_game",
"player_name": "player2",
"game_id": "abc"
}

### Get Player Hand

{
"type": "get_player_hand",
"player_name": "player2",
"game_id": "abc"
}

### Get Player State

{
"type": "get_game_state",
"game_id": "abc"
}

### Get Player Info

{
"type": "get_player_info",
"player_name": "player2",
"game_id": "abc"
}

### Play Card

{
"type": "play_card",
"player_name": "player2",
"game_id": "abc",
"card": "red_3"
}

### Draw Card

{
"type": "draw_card",
"player_name": "player2",
"game_id": "abc"
}

### Player Disconnected

{
"type": "player_disconnected",
"player_name": "player2",
"game_id": "abc"
}
