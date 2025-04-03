import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useParams } from "react-router-dom";
import { useSocket } from "./WebSocketProvider";

import CardStack from "./CardStack";
import Card from "./Card";

export default function UnoBoard({ gameInfo, myCards }) {

    const { gameId } = useParams();
    const [playerOrder, setPlayerOrder] = useState([]);

    const socket = useSocket();

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

    const skipTurn = () => {
        // It has to be their turn to skip
        if (gameInfo.currentPlayers[gameInfo.turn_index] == sessionStorage.getItem('name')) {
            // Send a message to the server to skip this players turn
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(
                    JSON.stringify({ type: "skip_turn", game_id: gameId, player_name: sessionStorage.getItem('name') })
                );
                navigate(`/`);
            }
        }
    }

    // Validates the gameInfo and checks the player is allowed to be in this game
    useEffect(() => {

        const playerName = sessionStorage.getItem('name');

        // Kick them if their name isnt in the list of players
        if (!gameInfo.currentPlayers.includes(playerName)) {
            console.log('player not allowed in lobby!');
        }

        const playerIndex = gameInfo.currentPlayers.indexOf(playerName);

        // Logic to render players in the proper order in all scenarios
        if (gameInfo.currentPlayers.length == 2) {
            if (playerIndex === 0) setPlayerOrder([gameInfo.currentPlayers[1], null, null, gameInfo.currentPlayers[0]]);
            else setPlayerOrder([gameInfo.currentPlayers[0], null, null, gameInfo.currentPlayers[1]]);
        }
        else if (gameInfo.currentPlayers.length == 3) {
            if (playerIndex === 0) setPlayerOrder([null, gameInfo.currentPlayers[1], gameInfo.currentPlayers[2], gameInfo.currentPlayers[0]]);
            else if (playerIndex === 1) setPlayerOrder([null, gameInfo.currentPlayers[2], gameInfo.currentPlayers[0], gameInfo.currentPlayers[1]]);
            else setPlayerOrder([null, gameInfo.currentPlayers[0], gameInfo.currentPlayers[1], gameInfo.currentPlayers[2]]);

        }
        else if (gameInfo.currentPlayers.length == 4) {
            if (playerIndex === 0) setPlayerOrder([gameInfo.currentPlayers[2], gameInfo.currentPlayers[1], gameInfo.currentPlayers[3], gameInfo.currentPlayers[0]]);
            else if (playerIndex === 1) setPlayerOrder([gameInfo.currentPlayers[3], gameInfo.currentPlayers[2], gameInfo.currentPlayers[0], gameInfo.currentPlayers[1]]);
            else if (playerIndex === 2) setPlayerOrder([gameInfo.currentPlayers[1], gameInfo.currentPlayers[0], gameInfo.currentPlayers[2], gameInfo.currentPlayers[3]]);
            else setPlayerOrder([gameInfo.currentPlayers[1], gameInfo.currentPlayers[0], gameInfo.currentPlayers[2], gameInfo.currentPlayers[3]]);
        }
        // If invalid gameInfo, send them back to the lobby
        else navigate(`/lobby/${gameId}`);


        // Just in case the url lobby name doesnt match the recieved id from the server
        if (gameId != gameInfo.game_id) console.log('Error occured with mismatch between the expected game id and actual game id');

    }, [gameInfo]);

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
                    playable: cardData.playable,
                    disableShadow: false,
                    hidden: false,
                    name: cardData.name,
                    game: cardData.game
                }
            } else {
                return {
                    colour: cardData.colour,
                    action: cardData.action,
                    id: cardId,
                    playable: cardData.playable,
                    disableShadow: false,
                    hidden: false,
                    name: cardData.name,
                    game: cardData.game
                }
            }
        } else {
            // Either wild or wild_plus4, both under action, so just set action
            return {
                action: cardData.action,
                id: cardId,
                playable: cardData.playable,
                disableShadow: false,
                hidden: false,
                name: cardData.name,
                game: cardData.game
            }
        }
    }

    // For the players cards - not hidden map list of card names to list of card objects
    function cardNameArrayToObjectArray(cardArray) {

        if (cardArray == null) return null;

        let cards = [];

        cardArray.forEach(card => {

            if (card == "wild") return cards.push(getCard({ action: 'wild', name: card, game: gameId, playable: true }));
            else if (card == "wild_plus4") return cards.push(getCard({ action: 'wild_plus4', name: card, game: gameId, playable: true }));

            let digit, action;
            let colour = card.split('_')[0];
            let suffix = card.split('_')[1];

            // If the second part is a number, set the digit
            if (/^[0-9]$/.test(suffix)) digit = suffix;
            else action = suffix;

            if (digit) return cards.push(getCard({ colour: colour, digit: digit, name: card, game: gameId, playable: true }));
            else return cards.push(getCard({ colour: colour, action: action, name: card, game: gameId, playable: true }));

        });

        return cards;

    }

    function getDiscardPile(cardArray) {

        if (cardArray == null) return null;

        let topCard = cardArray[cardArray.length - 1];

        let cardData = null;

        if (topCard == "wild") cardData = (getCard({ action: 'wild', name: topCard, game: gameId, playable: false }));
        else if (topCard == "wild_plus4") cardData = (getCard({ action: 'wild_plus4', name: topCard, game: gameId, playable: false }));

        // Only check for digit / action cards if its not a wild card or wild_plus4
        if (cardData == null) {

            let digit, action;
            let colour = topCard.split('_')[0];
            let suffix = topCard.split('_')[1];

            // If the second part is a number, set the digit
            if (/^[0-9]$/.test(suffix)) digit = suffix;
            else action = suffix;

            if (digit) cardData = (getCard({ colour: colour, digit: digit, name: topCard, game: gameId, playable: false }));
            else cardData = (getCard({ colour: colour, action: action, name: topCard, game: gameId, playable: false }));
        }

        return <Card {...cardData} />;

    }

    function getDrawCardPile() {
        let card = {
            id: Math.random().toString(36).substr(2, 9),
            playable: true,
            disableShadow: false,
            hidden: true,
            name: 'draw_card',
            game: gameId
        }
        return <Card {...card} />
    }

    return (
        <>
            <div className="relative w-full h-[1000px] bg-red-100">
                {/* Player 1 */}
                {playerOrder[0] && (
                    <>
                        <div className="absolute top-10 left-1/2 transform -translate-x-1/2">
                            <h2 className="text-xl">{playerOrder[0]}</h2>
                        </div>
                        <div className="absolute top-40 left-1/2 transform -translate-x-1/2">
                            <CardStack cards={getOpponentCards(gameInfo.player_hands[playerOrder[0]])} direction="horizontal" />
                        </div>
                    </>
                )}

                {/* Player 2 */}
                {playerOrder[1] && (
                    <>
                        <div className="absolute top-1/2 left-10 transform -translate-y-1/2">
                            <h2 className="text-xl text-center">{playerOrder[1]}</h2>
                        </div>
                        <div className="absolute top-1/2 left-45 transform -translate-y-1/2">

                            <CardStack cards={getOpponentCards(gameInfo.player_hands[playerOrder[1]])} direction="vertical" />
                        </div>
                    </>
                )}

                {/* Player 3 */}
                {playerOrder[2] && (
                    <>
                        <div className="absolute top-1/2 right-10 transform -translate-y-1/2">
                            <h2 className="text-xl text-center">{playerOrder[2]}</h2>
                        </div>
                        <div className="absolute top-1/2 right-45 transform -translate-y-1/2">
                            <CardStack cards={getOpponentCards(gameInfo.player_hands[playerOrder[2]])} direction="vertical" />
                        </div>
                    </>
                )}

                {/* Player 4 (Self) */}
                {playerOrder[3] && (
                    <>
                        <div className="absolute bottom-2.5 left-1/2 transform -translate-x-1/2 mb-8">
                            <h2 className="text-xl text-center">{sessionStorage.getItem('name')}</h2>
                        </div>
                        <div className="absolute bottom-35 left-1/2 transform -translate-x-1/2 mb-8">
                            <CardStack cards={cardNameArrayToObjectArray(myCards)} direction="horizontal" />
                        </div>
                    </>
                )}

                {/* Discard pile and draw pile */}
                <div className="absolute top-14/32 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {getDrawCardPile()}
                    {getDiscardPile(gameInfo.discard_pile)}
                </div>



                {/* Turn display */}
                <div className="absolute top-2/3 left-1/2 transform -translate-x-1/2">
                    <h2 className="text-xl">Turn: {gameInfo.currentPlayers[gameInfo.turn_index]}</h2>
                </div>

            </div>

            <div className="flex flex-col justify-center items-center mt-10">
                <button
                    className={`w-80 bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700`}
                    onClick={() => skipTurn()}>
                    Skip Turn
                </button>
            </div>


            <div className="flex flex-col justify-center items-center mt-10">
                <button
                    className={`w-80 bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-yellow-700`}
                    onClick={() => leaveGame()}>
                    Leave game
                </button>
            </div>

        </>
    );
}