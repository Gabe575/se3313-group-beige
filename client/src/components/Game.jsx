import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSocket } from "./WebSocketProvider";
import { useNavigate } from "react-router";

import UnoBoard from "./UnoBoard";

export default function Game() {
    const { gameId } = useParams();

    const [gameInfo, setGameInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    const [gameState, setGameState] = useState(null);

    const [requestSent, setRequestSent] = useState(false);

    const socket = useSocket();
    let navigate = useNavigate();

    // Listen for messages from the socket
    useEffect(() => {
        if (socket) {
            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log('Received message:', event.data);

                if (data.type === "game_info") {

                    // If no game exists, tell the user
                    if (data.status === "not_found") {
                        alert("Lobby not found!");
                        navigate('/');
                        return;
                    }

                    // Update the game info
                    setGameInfo(data);
                    setIsLoading(false);

                    // If the player isnt in the list of players, kick them to menu
                    if (!data.currentPlayers?.find(player => player===sessionStorage.getItem('name'))) {
                        alert("Cannot join lobby. Invalid permissions.")
                        navigate('/');
                        return;
                    }

                    // If the game hasnt started yet, kick them to lobby
                    if (!data.game_started) {
                        navigate(`/lobby/${data.game_id}`);
                    }
                }
            };
        }
        return () => {
            if (socket) {
                socket.onmessage = null;
            }
        };
    }, [socket]);

    // Send a request when the page loads
    useEffect(() => {
        console.log('here')
        if (socket && socket.readyState === WebSocket.OPEN) {
            setIsLoading(true);
            setErrorMessage("");

            socket.send(
                JSON.stringify({ type: "get_game_info", game_id: gameId })
            );

        }
    }, [socket, gameId]);

    // Send a request when the page loads or reloads
    useEffect(() => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            sendGetInfo();
        } else {
            const interval = setInterval(() => {
                if (socket && socket.readyState === WebSocket.OPEN) {
                    sendGetInfo();
                    clearInterval(interval);
                }
            }, 500);
    
            return () => clearInterval(interval);
        }
    }, [socket]);

    function sendGetInfo() {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(
                JSON.stringify({ type: "get_game_info", game_id: gameId })
            );
            setRequestSent(true);
        }
    }



    // Timeout and show error if the basic game data cannot be found on load
    useEffect(() => {
        if (!requestSent) sendGetInfo();
        if (isLoading) {
            const timeout = setTimeout(() => {
                setErrorMessage("Failed to receive game info. Please try again later.");
                setIsLoading(false);
            }, 2500);

            return () => clearTimeout(timeout);
        }
    }, [isLoading]);


    // TODO: put gameinfo into uno board component

    const testGameInfo = {
        currentPlayers: ["p1", "p2", "p3", "p4"],
        host: "",
        game_id: "a"
    }



    // Keep this its good I just need to not redirect away right now during testing

    
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">

            {isLoading ? (
                <div className="flex flex-col justify-center items-center min-h-screen">
                    <p className="p-8">Connecting...</p>
                    <div className="w-16 h-16 border-4 border-t-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
            ) : null}

            {!isLoading ? (
                <div>
                    {errorMessage != "" ? (
                        <p className="text-red-500">
                            {errorMessage}
                        </p>
                    ) : (
                        <UnoBoard gameInfo={gameInfo} />
                    )}
                </div>
            ) : null}

        </div>
    )
    
    //return (<UnoBoard gameInfo={gameInfo} />);


}