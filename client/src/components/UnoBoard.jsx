import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useParams } from "react-router-dom";

import Card from "./Card";
import CardStack from "./CardStack";

export default function UnoBoard({ gameInfo }) {

    const [gameState, setGameState] = useState(null);
    const [playerInfo, setPlayerInfo] = useState(null);

    // Self, left, top, right
    const [leftPlayerInfo, setLeftPlayerInfo] = useState(null);
    const [topPlayerInfo, setTopPlayerInfo] = useState(null);
    const [rightPlayerInfo, setRightPlayerInfo] = useState(null);


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
        if (gameId != gameInfo.game_id) console.log('Error occured with mismatch between the expected game id and actual game id');



        // TODO: remove this is to test the layout
        setGameState(testGameState);
        setPlayerInfo(testPlayerInfo);


        setLeftPlayerInfo(testPlayer2Info);
        setTopPlayerInfo(testPlayer3Info);
        setRightPlayerInfo(testPlayer4Info);


    }, [gameInfo]);



    function getRandomCard() {

        const colours = ['red', 'blue', 'green', 'yellow'];
        const actions = ['skip', 'reverse', 'plus2', 'wild', 'plus4'];
        const randomColour = colours[Math.floor(Math.random() * colours.length)];
        const randomAction = actions[Math.floor(Math.random() * actions.length)];

        return {
            colour: randomColour,
            digit: Math.floor(Math.random() * 10), // Can be 0-9
            action: randomAction,
            id: Math.random().toString(36).substr(2, 9), // Random unique ID
            playable: true, // Assume the card is playable for now
            disableShadow: false,
        };





    }

    const getSomeCards = (length) => {
        let cards = [];
        for (let i = 0; i < length; i++) {
            cards.push(getRandomCard());
        }
        return cards;
    };







    const renderPlayerHand = (playerIndex) => {
        let playerHand = [];
        if (playerIndex === 0) playerHand = testPlayerInfo.player.hand;
        if (playerIndex === 1) playerHand = testPlayer2Info.player.hand;
        if (playerIndex === 2) playerHand = testPlayer3Info.player.hand;
        if (playerIndex === 3) playerHand = testPlayer4Info.player.hand;

        const isOverlapping = playerHand.length > 4;
        const isVertical = playerHand.length > 4;

        return (
            <div
                className={`flex ${playerIndex === 0 || playerIndex === 3
                        ? isVertical
                            ? "flex-col items-center space-y-2"
                            : "justify-center space-x-2"
                        : isVertical
                            ? "flex-col items-center space-y-2"
                            : "flex-col space-y-2"
                    } ${isOverlapping ? "overflow-y-auto" : ""}`}
            >
                {playerHand.map((card, index) => (
                    <Card
                        key={index}
                        {...card}
                        className={`${isOverlapping ? "overlap" : ""}`}
                    />
                ))}
            </div>
        );
    };


    const testGameState = {
        type: "game_state",
        currentPlayers: ["p1", "p2", "p3", "p4"],
        host: "p1",
        game_id: "a",
        turnName: "p1",
        playDirection: "forward",
        remainingCards: 15,
        discardPile: getSomeCards(1)
    }

    const testPlayerInfo = {
        type: "player_info",
        player: {
            name: "p1",
            numCards: 5,
            hand: getSomeCards(1),
            status: "active"
        },
        game_id: "a"
    }

    const testPlayer2Info = {
        type: "player_info",
        player: {
            name: "p2",
            numCards: 5,
            hand: getSomeCards(10),
            status: "active"
        },
        game_id: "a"
    }
    const testPlayer3Info = {
        type: "player_info",
        player: {
            name: "p3",
            numCards: 5,
            hand: getSomeCards(5),
            status: "active"
        },
        game_id: "a"
    }
    const testPlayer4Info = {
        type: "player_info",
        player: {
            name: "p4",
            numCards: 5,
            hand: getSomeCards(7),
            status: "active"
        },
        game_id: "a"
    }




    return (
        <div className="relative w-full h-[1000px] bg-red-100">
            <div className="absolute top-50 left-1/2 transform -translate-x-1/2">
                <CardStack cards={getSomeCards(20)} direction="horizontal" />
            </div>
            


        </div>
    );



}

/*

<div className="absolute top-0 left-1/2 transform -translate-x-1/2">
<h2 className="text-xl text-center mb-4">{gameInfo.currentPlayers[0]}</h2>
{renderPlayerHand(0)}
</div>

<div className="absolute top-1/2 left-0 transform -translate-y-1/2">
<h2 className="text-xl text-center mb-4">{gameInfo.currentPlayers[1]}</h2>
{renderPlayerHand(1)}
</div>


<div className="absolute top-1/2 right-0 transform -translate-y-1/2">
<h2 className="text-xl text-center mb-4">{gameInfo.currentPlayers[2]}</h2>
{renderPlayerHand(2)}
</div>


<div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 mb-8">
<h2 className="text-xl text-center mb-4">{gameInfo.currentPlayers[3]}</h2>
{renderPlayerHand(3)}
</div>

*/