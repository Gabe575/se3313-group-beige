import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSocket } from "./WebSocketProvider";

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
            }, 2500);

            return () => clearTimeout(timeout);
        }
    }, [isLoading]);



    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            <p>
                UNO Game
            </p>
        </div>
    )



}