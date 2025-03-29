import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSocket } from "./WebSocketProvider";

import UnoBoard from "./UnoBoard";

export default function Game() {
    const { gameId } = useParams();

    const [gameInfo, setGameInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    const [gameState, setGameState] = useState(null);

    const socket = useSocket();

    // Listen for messages from the socket
    useEffect(() => {
        if (socket) {
            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log('Received message:', event.data);

                if (data.type === "game_info") {
                    // Update the lobby info
                    setGameInfo(data.gameInfo);
                    setIsLoading(false);
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
        if (socket && socket.readyState === WebSocket.OPEN) {
            setIsLoading(true);
            setErrorMessage("");

            socket.send(
                JSON.stringify({ type: "get_game_info", game_id: gameId })
            );

        }
    }, [gameId]);

    // Timeout and show error if the basic game data cannot be found on load
    useEffect(() => {
        if (isLoading) {
            const timeout = setTimeout(() => {
                setErrorMessage("Failed to receive game info. Please try again later.");
                setIsLoading(false);
            }, 5000);

            return () => clearTimeout(timeout);
        }
    }, [isLoading]);


    // TODO: put gameinfo into uno board component

    const testGameInfo = {
        currentPlayers: ["p1", "p2", "p3", "p4"], 
        host: "", 
        game_id: ""
    }



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
                        <UnoBoard gameInfo={testGameInfo} />
                    )}
                </div>
            ) : null}

        </div>
    )



}