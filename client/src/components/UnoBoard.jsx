import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useParams } from "react-router-dom";









const testGameState = {
    type: "game_state", 
    currentPlayers: ["p1", "p2", "p3", "p4"], 
    host: "p1", 
    game_id: "a", 
    turnName: "p1", 
    playDirection: "forward", 
    remainingCards: 15,
    discardPile: [{card}, {card}]
}

const testPlayerInfo = {
    type: player_info, 
    player: {
        name: "p1", 
        numCards: 5, 
        hand: [{card}, {card}], 
        status: "active"
    }, 
    game_id: "a"
}



export default function UnoBoard({ gameInfo }) {

    const [gameState, setGameState] = useState(null);
    const [playerInfo, setPlayerInfo] = useState(null);

    const { gameId } = useParams();

    let navigate = useNavigate();

    // TODO: potentially move this so that it waits for players to reconnect
    // Validates the gameInfo and checks the player is allowed to be in this game
    useEffect(() => {

        // If invalid gameInfo, send them back to the lobby
        if (gameInfo.currentPlayers.length != 4) navigate(`/lobby/${gameId}`);


        // TODO redirect them or something if their name isnt in the player list
        if (!gameInfo.currentPlayers.includes(localStorage.getItem('name'))) {
            console.log('player not allowed in lobby!');
        }

        // Just in case the url lobby name doesnt match the recieved id from the server
        if (gameId!=gameInfo.game_id) console.log('Error occured with mismatch between the expected game id and actual game id');



        // TODO: remove this is to test the layout
        setGameState(testGameState);
        setPlayerInfo(testPlayerInfo);

    }, [gameInfo]);






    return (

        <div>

        </div>



    );



}