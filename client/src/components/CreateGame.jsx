import { useNavigate } from "react-router";
import { useEffect, useState, useRef } from "react";
import { SOCKET_URL } from '../util/config';

export default function CreateGame() {
    const [gameName, setGameName] = useState('');
    const [validGameName, setValidGameName] = useState(false);
    const socket = useRef(null); // WebSocket reference
    const [message, setMessage] = useState('');
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
        };

        socket.current.onerror = (error) => {
            console.error("WebSocket error:", error);
            setMessage('WebSocket error occured. Please try again.')
        };

        socket.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log("Received from server:", data);

            if (data.type === "game_created") {
                // If game is successfully created, navigate to the lobby
                navigate(`/lobby/${data.game_id}`);
            } else if (data.type === "error") {
                setMessage(data.message);
            }
        };

        // Cleanup WebSocket connection when the component is unmounted
        return () => {
            if (socket.current) {
                socket.current.close();
            }
        };
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
                game_name: gameName
            };

            // Send the message to the server via WebSocket
            socket.current.send(JSON.stringify(requestPayload));

            // Set a message while waiting for the server response
            setMessage("Creating game, please wait...");
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


/*
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";

import { API_URL } from '../util/config';

export default function () {

    // Redirect back to main menu if no name
    let navigate = useNavigate();
    if (localStorage.getItem('name') == null) navigate('/');
    
    
    
    // TODO: function to send request to backend to create game
    function sendCreateRequest() {
        console.log('Creating game....');
    }
    
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-red-600 p-4">
            <div className="w-80 bg-white p-6 rounded-2xl shadow-lg flex flex-col gap-4">
                <h2 className="text-center text-lg font-bold text-black">Create Game</h2>
                
                <button
                    className="w-full bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-yellow-700"
                    onClick={() => navigate('/')}
                >
                    Back
                </button>
            </div>
        </div>
    )


}
    */