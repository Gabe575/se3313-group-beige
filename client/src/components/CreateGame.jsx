import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { useSocket } from "./WebSocketProvider";

export default function CreateGame() {
    const [gameName, setGameName] = useState('');
    const [validGameName, setValidGameName] = useState(false);
    const [message, setMessage] = useState('');

    const navigate = useNavigate();

    const socket = useSocket();
    
    const [timeoutReached, setTimeoutReached] = useState(false);

    useEffect(() => {
        if (socket) {
            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log('Received message:', data);

                if (data.type === "game_created") {
                    // Go to that lobby
                    navigate(`/lobby/${data.game_id}`);
                }
            };
        }
        return () => {
            if (socket) {
                socket.onmessage = null;
            }
        };
    }, [socket]);

    // Redirect back to main menu if no name
    useEffect(() => {
        if (localStorage.getItem('name') == null) {
            navigate('/');
        }
    }, [navigate]);

    const handleGameNameChange = (e) => {
        setGameName(e.target.value);
        setValidGameName(e.target.value.trim() !== "");
    };

    const sendCreateRequest = () => {
        if (validGameName) {
            const playerName = localStorage.getItem('name');

            // Send request to create a new game
            const requestPayload = {
                type: "create_game",
                player_name: playerName,
                game_id: gameName
            };

            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(
                    JSON.stringify(requestPayload)
                ); 
            }

            // Set a message while waiting for the server response
            setMessage("Creating game, please wait...");
            
            setTimeoutReached(false);
            
            // If longer than 5 seconds, show error
            setTimeout(() => {
                if (!timeoutReached) {
                    setMessage("No response when trying to create game. Please try again.");
                }
            }, 5000);
            
        } else {
            setMessage("Please enter a valid game name.");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-red-600 p-4">
            <div className="w-80 bg-white p-6 rounded-2xl shadow-lg flex flex-col gap-4">
                <h2 className="text-center text-lg font-bold text-black">Create Game</h2>

                <input
                    type="text"
                    value={gameName}
                    onChange={handleGameNameChange}
                    placeholder="Enter game name"
                    className="w-full text-center border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <button
                    className={`w-full bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-yellow-700 ${validGameName ? '' : 'opacity-50 cursor-not-allowed'}`}
                    onClick={sendCreateRequest}
                    disabled={!validGameName}
                >
                    Create Game
                </button>

                {message && <div className="text-center text-red-500">{message}</div>}

                <button
                    className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700"
                    onClick={() => navigate('/')}
                >
                    Back
                </button>
            </div>
        </div>
    );
}