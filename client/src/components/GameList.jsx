import { useNavigate } from "react-router";
import { useEffect, useState, useRef } from "react";
import { SOCKET_URL } from '../util/config';

export default function GameList() {
    const [games, setGames] = useState([]);
    const socket = useRef(null); // WebSocket reference
    const navigate = useNavigate();

    // Redirect back to main menu if no name
    useEffect(() => {
        if (localStorage.getItem('name') == null) {
            navigate('/');
        }

        // Initialize WebSocket connection
        socket.current = new WebSocket(SOCKET_URL);
        socket.current.onopen = () => {
            console.log("Connected to WebSocket server");

            // Once connected, request the list of available games
            socket.current.send(
                JSON.stringify({ type: "get_available_games" })
            );
        };

        socket.current.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        // Handle incoming messages from the WebSocket server
        socket.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log("Received from server:", data);

            if (data.type === "available_games") {
                // Update the list of available games
                setGames(data.games);
            }
        };

        // Cleanup WebSocket connection when the component is unmounted
        return () => {
            if (socket.current) {
                socket.current.close();
            }
        };
    }, [navigate]);

    const joinGame = (gameId) => {
        const playerName = localStorage.getItem('name');

        // Send the request to join the game
        socket.current.send(
            JSON.stringify({ type: "join_game", game_id: gameId, player_name: playerName })
        );

        // TODO: should this be after the server allows them to connect? possible race condition with multiple connecting at the same time????

        //TODO: check navigation
        navigate(`/lobby/${gameId}`);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-red-600 p-4">
            <div className="w-80 bg-white p-6 rounded-2xl shadow-lg flex flex-col gap-4">
                <h2 className="text-center text-lg font-bold text-black">Available Games</h2>
                <ul className="space-y-2">
                    {games.length > 0 ? (
                        games.map((game) => (
                            <li
                                key={game.id}
                                className="p-2 bg-gray-200 rounded-lg text-center cursor-pointer hover:bg-gray-400 transition"
                                onClick={() => joinGame(game.id)} // Click to join
                            >
                                Join - {game.name}
                            </li>
                        ))
                    ) : (
                        <p className="text-center text-gray-500">No games available</p>
                    )}
                </ul>
                <button
                    className="w-full bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-yellow-700"
                    onClick={() => navigate('/')}
                >
                    Back
                </button>
            </div>
        </div>
    );
}