import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useParams } from "react-router-dom";

import CardStack from "./CardStack";

export default function UnoBoard({ gameInfo, myCards }) {

    const { gameId } = useParams();
    const [gameState, setGameState] = useState(null);
    

    let navigate = useNavigate();

    const leaveGame = () => {
        // Send a message to the server that this player is leaving
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(
                JSON.stringify({ type: "leave_game", game_id: gameId, player_name: sessionStorage.getItem('name') })
            );
            navigate(`/`);
        }
    }


    // Validates the gameInfo and checks the player is allowed to be in this game
    useEffect(() => {

        // If invalid gameInfo, send them back to the lobby
        if (gameInfo.currentPlayers.length != 4) navigate(`/lobby/${gameId}`);


        // Kick them if their name isnt in the list of players
        if (!gameInfo.currentPlayers.includes(sessionStorage.getItem('name'))) {
            console.log('player not allowed in lobby!');
        }

        // Just in case the url lobby name doesnt match the recieved id from the server
        if (gameId != gameInfo.game_id) console.log('Error occured with mismatch between the expected game id and actual game id');



        

    }, [gameInfo]);

    // These are for testing
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





    


    function getOpponentCards(numOfCards) {
        
        // Returns only the info needed for a basic hidden card
        let getHiddenCard = () => {
            return {
                id: Math.random().toString(36).substr(2, 9), // Please dont collide
                playable: false,
                hidden: true
            }
        }
        
        // Get a hidden card component for each in their hand
        let opponentCards = [];
        for (let i = 0; i < numOfCards; i++) {
            opponentCards.push(getHiddenCard());
        }
        return opponentCards;
    }

    // Returns a card object corresponding to the data passed into it
    const getCard = (cardData) => {

        let cardId = Math.random().toString(36).substr(2, 9);

        // Either colour_digit, colour_action, 
        if (cardData.colour) {
            if (cardData.digit) {
                return {
                    colour: cardData.colour,
                    digit: cardData.digit,
                    id: cardId,
                    playable: true,
                    disableShadow: false,
                    hidden: false,
                }
            } else {
                return {
                    colour: cardData.colour,
                    action: cardData.action,
                    id: cardId,
                    playable: true,
                    disableShadow: false,
                    hidden: false,
                }
            }
        } else {
            // Either wild or wild_plus4, both under action, so just set action
            return {
                action: cardData.action,
                id: cardId,
                playable: true,
                disableShadow: false,
                hidden: false,
            }
        }
    }

    // For the players cards - not hidden map list of card names to list of card objects
    function cardNameArrayToObjectArray(cardArray) {

        if (cardArray == null) return null;

        let cards = [];

        cardArray.forEach(card => {

            if (card == "wild") return cards.push(getCard({ action: 'wild' }));
            else if (card == "wild_plus4") return cards.push(getCard({ action: 'wild_plus4' }));
            
            let digit, action;
            let colour = card.split('_')[0];
            let suffix = card.split('_')[1];

            // If the second part is a number, set the digit
            if (/^[0-9]$/.test(suffix)) digit = suffix;
            else action = suffix;

            if (digit) return cards.push(getCard({ colour: colour, digit: digit }));
            else return cards.push(getCard({ colour: colour, action: action }));

        });

        return cards;

    }
        
    return (
        <>
            <div className="relative w-full h-[1000px] bg-red-100">

                <div className="absolute top-25 left-1/2 transform -translate-x-1/2">
                    <div className="text-center">
                        <h2 className="text-xl">{gameInfo.currentPlayers[0]}</h2>
                    </div>
                    <div>
                        <CardStack cards={getOpponentCards(gameInfo.player_hands[gameInfo.currentPlayers[0]])} direction="horizontal" />
                    </div>

                </div>

                <div className="absolute top-1/2 left-45 transform -translate-y-1/2">
                    <h2 className="text-xl text-center">{gameInfo.currentPlayers[1]}</h2>
                    <CardStack cards={getOpponentCards(gameInfo.player_hands[gameInfo.currentPlayers[1]])} direction="vertical" />
                </div>


                <div className="absolute top-1/2 right-45 transform -translate-y-1/2">
                    <h2 className="text-xl text-center">{gameInfo.currentPlayers[2]}</h2>
                    <CardStack cards={getOpponentCards(gameInfo.player_hands[gameInfo.currentPlayers[2]])} direction="vertical" />
                </div>


                <div className="absolute bottom-25 left-1/2 transform -translate-x-1/2 mb-8">
                    <h2 className="text-xl text-center">{gameInfo.currentPlayers[3]}</h2>
                    <CardStack cards={cardNameArrayToObjectArray(myCards)} direction="horizontal" />
                </div>


                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2">
                    
                    <CardStack cards={cardNameArrayToObjectArray(gameInfo.discard_pile) || null} direction="horizontal" />
                </div>

            </div>



            <div className="flex flex-col justify-center items-center min-h-screen">
                <button
                    className={`w-80 bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-yellow-700`}
                    onClick={() => leaveGame()}>
                    Leave game
                </button>
            </div>
        </>
    );
}






/*

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

*/