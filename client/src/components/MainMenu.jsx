import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useSocket } from "./WebSocketProvider";

export default function MainMenu() {
    // Player name is stored in localstorage so if name is in storage display that instead so it still shows and they dont have to put their name in again after reloading or switching pages
    const [playerName, setPlayerName] = useState(localStorage.getItem('name') ? localStorage.getItem('name') : "");
    const [validName, setValidName] = useState(localStorage.getItem('name') ? true : false);
    const [saved, setSaved] = useState(localStorage.getItem('name') ? true : false);

    const [gameName, setGameName] = useState("");

    let navigate = useNavigate();

    const socket = useSocket();

    // TODO: the client should be sending a request for a name, not just claiming it and then sending it to the server. They should send the name on submit, and wait until the 
    //          server replies okay and then set the username and allow the user to enter into the other pages
    useEffect(() => {
        if (socket) {
            socket.onmessage = (event) => {
                console.log('Received message:', event.data);
            };
        }
        return () => {
            if (socket) {
                socket.onmessage = null;
            }
        };
    }, [socket]);

    const handleNameChange = (e) => {
        setPlayerName(e.target.value);
        setValidName(e.target.value.trim() !== "");
        setSaved(false);
    };

    const submit = () => {
        if (validName) {
            localStorage.setItem("name", playerName);
            setSaved(true);
        }

        // Send player name to the server
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(
                JSON.stringify({ type: "create_player", player_name: playerName })
            );
        }
    };
    
    
    const handleGameNameChange = (e) => {
        setGameName(e.target.value);
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-red-600 p-4">
            <img
                src="/images/unoLogo.png"
                alt="Uno Logo"
                className="w-48 mb-6"
            />
            <div className="w-80 bg-white p-6 rounded-2xl shadow-lg flex flex-col gap-4">
                <div className="text-lg font-bold text-center">Enter Player Name:</div>
                <input
                    type="text"
                    placeholder="Enter name..."
                    value={playerName}
                    onChange={handleNameChange}
                    className="w-full text-center border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex justify-center items-center"
                    onClick={submit}>
                    {saved ? "Name saved ✔" : "Save"}
                </button>
                <button
                    className={`w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg ${saved ? "hover:bg-blue-700" : "opacity-50 cursor-not-allowed"}`}
                    onClick={() => navigate('/game-list')}
                    disabled={!saved}>
                    Game List
                </button>
                <button
                    className={`w-full bg-green-500 text-white font-bold py-2 px-4 rounded-lg ${saved ? "hover:bg-green-700" : "opacity-50 cursor-not-allowed"}`}
                    onClick={() => navigate('/create-game')}
                    disabled={!saved}>
                    Create Game
                </button>

                <div className="text-lg font-bold text-center">Or join a game by name:</div>
                <input
                    type="text"
                    placeholder="Enter game name..."
                    value={gameName}
                    onChange={handleGameNameChange}
                    className={`w-full text-center border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${saved ? "" : "opacity-50 cursor-not-allowed"}`}
                />
                <button
                    className={`w-full bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg ${saved ? "hover:bg-yellow-700" : "opacity-50 cursor-not-allowed"}`}
                    onClick={() => gameName != "" ? navigate(`/lobby/${gameName}`) : alert("Please enter a game name!")}
                    disabled={!saved}>
                    Join Game
                </button>
            </div>
        </div>
    );
}
