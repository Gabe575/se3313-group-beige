import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useParams } from "react-router-dom";

import CardStack from "./CardStack";

export default function UnoBoard({ gameInfo }) {

    const [gameState, setGameState] = useState(null);
    const [allPlayersInfo, setAllPlayersInfo] = useState(null);


    const { gameId } = useParams();

    let navigate = useNavigate();

    // TODO: potentially move this so that it waits for players to reconnect
    // Validates the gameInfo and checks the player is allowed to be in this game
    useEffect(() => {

        // If invalid gameInfo, send them back to the lobby
        if (gameInfo.currentPlayers.length != 4) navigate(`/lobby/${gameId}`);


        // TODO redirect them or something if their name isnt in the player list
        if (!gameInfo.currentPlayers.includes(sessionStorage.getItem('name'))) {
            console.log('player not allowed in lobby!');
        }

        // Just in case the url lobby name doesnt match the recieved id from the server
        if (gameId != gameInfo.game_id) console.log('Error occured with mismatch between the expected game id and actual game id');



        // TODO: remove this is to test the layout
        setGameState(testGameState);

        let info = {
            p1: testPlayerInfo,
            p2: testPlayer2Info,
            p3: testPlayer3Info,
            p4: testPlayer4Info,
        }


        setAllPlayersInfo(info);

    }, [gameInfo]);



    function getRandomCard() {

        const colours = ['red', 'blue', 'green', 'yellow'];
        const actions = ['skip', 'reverse', 'plus2', 'wild', 'plus4'];
        const randomColour = colours[Math.floor(Math.random() * colours.length)];
        const randomAction = actions[Math.floor(Math.random() * actions.length)];

        let ob;
        if (Math.random() * 10 > 5) {
            ob = {
                colour: randomColour,
                digit: Math.floor(Math.random() * 10), // Can be 0-9
                action: null,
                id: Math.random().toString(36).substr(2, 9), // Random unique ID
                playable: true, // Assume the card is playable for now
                disableShadow: false,
            }
        } else {
            ob = {
                colour: randomColour,
                digit: null, // Can be 0-9
                action: randomAction,
                id: Math.random().toString(36).substr(2, 9), // Random unique ID
                playable: true, // Assume the card is playable for now
                disableShadow: false,
            }
        }

        return ob;
    }

    const getSomeCards = (length) => {
        let cards = [];
        for (let i = 0; i < length; i++) {
            cards.push(getRandomCard());
        }
        return cards;
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


    function getOpponentCards(opponentName) {
        
        // Cant render a card if you got no info
        if (!allPlayersInfo) return null;

        // Returns only the info needed for a basic hidden card
        let getHiddenCard = () => {
            return {
                id: Math.random().toString(36).substr(2, 9), // Please dont collide
                playable: false,
                hidden: true
            }
        }
        // Get number of cards in their hand currently
        let infoOnPlayer;
        for (let key in allPlayersInfo) {
            if (allPlayersInfo[key].player.name === opponentName) {
                infoOnPlayer = allPlayersInfo[key].player;
                break;
            }
        }
        let numOfCards = infoOnPlayer.hand.length;

        // Get a hidden card component for each in their hand
        let opponentCards = [];
        for (let i = 0; i < numOfCards; i++) {
            opponentCards.push(getHiddenCard());
        }
        return opponentCards;
    }

    return (
        <div className="relative w-full h-[1000px] bg-red-100">
            
            <div className="absolute top-25 left-1/2 transform -translate-x-1/2">\
                <div className="text-center">
                    <h2 className="text-xl">{gameInfo.currentPlayers[0]}</h2>
                </div>
                <div>
                    <CardStack cards={getOpponentCards(gameInfo.currentPlayers[0])} direction="horizontal" />
                </div>
                
            </div>

            <div className="absolute top-1/2 left-45 transform -translate-y-1/2">
                <h2 className="text-xl text-center">{gameInfo.currentPlayers[1]}</h2>
                <CardStack cards={getOpponentCards(gameInfo.currentPlayers[1])} direction="vertical" />
            </div>


            <div className="absolute top-1/2 right-45 transform -translate-y-1/2">
                <h2 className="text-xl text-center">{gameInfo.currentPlayers[2]}</h2>
                <CardStack cards={getOpponentCards(gameInfo.currentPlayers[2])} direction="vertical" />
            </div>


            <div className="absolute bottom-25 left-1/2 transform -translate-x-1/2 mb-8">
                <h2 className="text-xl text-center">{gameInfo.currentPlayers[3]}</h2>
                <CardStack cards={getSomeCards(7)} direction="horizontal" />
            </div>

        </div>
    );
}