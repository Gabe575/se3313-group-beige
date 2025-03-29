import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSocket } from "./WebSocketProvider";

export default function Lobby() {
    const { gameId } = useParams();
    const [gameInfo, setGameInfo] = useState(null);

    const socket = useSocket();

    useEffect(() => {
        if (socket) {
            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log('Received message:', event.data);

                // TODO: check this with backend structure
                if (data.type === "game_info") {
                    // Update the lobby info and player count
                    setGameInfo(data.gameInfo);
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
            socket.send(
                JSON.stringify({ type: "get_game_info", game_id: gameId })
            );
        }
    }, [gameId]);

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
                <p className="text-center">
                    {gameInfo?.currentPlayers?.length} {gameInfo?.currentPlayers?.length === 1 ? "Player" : "Players"} in the Lobby
                </p>

                <ul>
                    {gameInfo?.currentPlayers?.map((player, index) => (
                        <li key={index} className="text-center">{player}</li>
                    ))}
                </ul>

                {gameInfo?.currentPlayers?.length == 4 && gameInfo?.host == localStorage.getItem('name') ? (
                    <button
                        className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex justify-center items-center"
                        onClick={startGame}>
                        Start Game!
                    </button>
                ) : (
                    null
                )}
            </div>
        </div>
    );
}
