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

    const socket = useSocket();
    let navigate = useNavigate();

    const sendGetInfo = () => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(
                JSON.stringify({ type: "get_game_info", game_id: gameId })
            );
        }
    }

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
                    if (!data.currentPlayers?.includes(sessionStorage.getItem("name"))) {
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
    }, [socket, navigate]);

    // Send a request when the page loads
    useEffect(() => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            sendGetInfo();
        } else {
            const checkSocketInterval = setInterval(() => {
                if (socket && socket.readyState === WebSocket.OPEN) {
                    sendGetInfo();
                    clearInterval(checkSocketInterval);
                }
            }, 500);

            return () => clearInterval(checkSocketInterval);
        }
    }, [socket, gameId]);

    // Poll for gamestate
    useEffect(() => {
        const pollInterval = setInterval(() => {
            sendGetInfo();
        }, 3000);

        return () => clearInterval(pollInterval);
    }, [socket]);

    // Timeout and show error if the basic game data cannot be found on load
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (isLoading) {
                setErrorMessage("Failed to receive game info. Please try again later.");
                setIsLoading(false);
            }
        }, 2500);

        return () => clearTimeout(timeout);
    }, [isLoading]);

    return (
        <div>
            {isLoading ? (
                <div className="flex flex-col justify-center items-center min-h-screen">
                    <p className="p-8">Connecting...</p>
                    <div className="w-16 h-16 border-4 border-t-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
            ) : null}

            {!isLoading ? (
                <div>
                    {errorMessage != "" ? (
                        <div className="flex flex-col justify-center items-center min-h-screen">
                            <p className="text-red-500">
                                {errorMessage}
                            </p>
                            <button
                                className={`w-80 bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-yellow-700`}
                                onClick={() => navigate('/')}>
                                Back
                            </button>
                        </div>
                    ) : (
                        <UnoBoard gameInfo={gameInfo} />
                    )}
                </div>
            ) : null}

        </div>
    )
}