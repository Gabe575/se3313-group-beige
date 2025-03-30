import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSocket } from "./WebSocketProvider";
import { useNavigate } from "react-router";

export default function Lobby() {
    const { gameId } = useParams();
    const [gameInfo, setGameInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");


    const [requestSent, setRequestSent] = useState(false);

    const socket = useSocket();

    let navigate = useNavigate();

    function sendGetInfo() {
        if (socket && socket.readyState === WebSocket.OPEN) {
            setIsLoading(true);
            setErrorMessage("");

            socket.send(
                JSON.stringify({ type: "get_game_info", game_id: gameId })
            );

            setRequestSent(true);
        }
    }

    useEffect(() => {
        if (socket) {
            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log('Received message:', event.data);

                if (data.type === "game_info") {

                    // If no game exists, tell the user
                    if (data.status === "not_found") setErrorMessage(`No lobby found "${gameId}"!`);
                    
                    // Update the lobby info
                    setGameInfo(data);
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
            }, 500); // Check every 500ms
    
            return () => clearInterval(interval);
        }
    }, [socket]);

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

    const startGame = () => {
        // Send request to server to start game
        console.log('Not implemented! Send request to start to server');
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="w-80 bg-white p-6 rounded-2xl shadow-lg flex flex-col gap-4">
                <h2 className="text-center text-lg font-bold text-black">
                    Lobby: {gameId}
                </h2>

                {errorMessage && (
                    <div className="text-red-500 text-center">
                        {errorMessage}
                    </div>
                )}

                {isLoading ? (
                    <div className="text-center">Loading...</div>
                ) : null}
                
                {(!isLoading && errorMessage == "") ? (
                    <>
                        <div className="text-center">
                            {gameInfo?.currentPlayers?.length}{" "}
                            {gameInfo?.currentPlayers?.length === 1
                                ? "Player"
                                : "Players"}{" "}
                            in the Lobby
                        </div>
                        <ul>
                            {gameInfo?.currentPlayers?.map((player, index) => (
                                <li key={index} className="text-center">{player}</li>
                            ))}
                        </ul>
                    </>
                ) : null}

                {gameInfo?.currentPlayers?.length == 4 && gameInfo?.host == localStorage.getItem('name') ? (
                    <button
                        className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex justify-center items-center"
                        onClick={startGame}>
                        Start Game!
                    </button>
                ) : null}

                <button
                    className={`w-full bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-yellow-700`}
                    onClick={() => navigate(`/`)}>
                    Leave lobby
                </button>


            </div>
        </div>
    );
}
