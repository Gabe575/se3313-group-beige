import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useSocket } from "./WebSocketProvider";

export default function MainMenu() {
    // Player name is stored in sessionStorage so if name is in storage display that instead so it still shows and they dont have to put their name in again after reloading or switching pages
    const [playerName, setPlayerName] = useState(sessionStorage.getItem('name') || "");

    const [saved, setSaved] = useState(sessionStorage.getItem('name') ? true : false);

    // For the join game functionality
    const [gameName, setGameName] = useState("");

    // The game they requested to join (if any)
    const requestedToJoin = useRef(null);

    let navigate = useNavigate();
    const socket = useSocket();

    useEffect(() => {

        if (socket) {
            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log("Received message:", data);

                if (data.type === "name_confirmation") {
                    if (data.status === "ok") {
                        sessionStorage.setItem("name", data.name);
                        console.log("Set name to " + data.name);
                        setSaved(true);
                    } else {
                        alert("Name taken.");
                    }
                }

                // If they recieve confirmation to join the lobby they requested to join, join
                if (data.type === "join_confirmation" && requestedToJoin.current === data.game_id) {
                    navigate(`/lobby/${requestedToJoin.current}`);
                }



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
        setSaved(false);

        if (e.target.value === sessionStorage.getItem('name')) {
            setSaved(true);
        } 
    };

    const submit = () => {
        if (playerName.trim() === "") {
            return alert("Please enter a valid name!");
        }

        if (saved) return console.log('Name already saved');


        if (!socket || socket.readyState !== WebSocket.OPEN) {
            alert("WebSocket not connected. Please try again.");
            return;
        }

        // Send player name to the server
        socket.send(
            JSON.stringify({ type: "create_player", player_name: playerName })
        );
    };


    const handleGameNameChange = (e) => {
        setGameName(e.target.value);
    }

    const joinGame = () => {
        if (!gameName.trim()) {
            alert("Please enter a game name!");
            return;
        }

        // Ensure the name saved in storage is the name used to join
        let name = sessionStorage.getItem('name');

        // Set ref 
        requestedToJoin.current = gameName;

        // Ask to join the lobby
        socket.send(
            JSON.stringify({ type: "join_game", game_id: gameName, player_name: name })
        );
    };

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
                    onClick={() => joinGame()}
                    disabled={!saved}>
                    Join Game
                </button>
            </div>
            <div className="my-10 text-white">SE3313 Group Beige</div>
        </div>
    );
}
