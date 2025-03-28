import { useNavigate } from "react-router";
import { useEffect, useState } from "react";

import { API_URL } from '../util/config';

export default function () {

    // Redirect back to main menu if no name
    let navigate = useNavigate();
    if (localStorage.getItem('name') == null) navigate('/');
    
    const [games, setGames] = useState([]);
    
    // TODO: check url and adjust based on the backend
    
    // Fetch available games from the backend
    useEffect(() => {
        async function fetchGames() {
            try {
                const response = await fetch(API_URL + "/api/games");
                if (!response.ok) throw new Error("Failed to fetch games");
                const data = await response.json();
                setGames(data);
            } catch (error) {
                console.error("Error fetching games:", error);
            }
        }
        fetchGames();
    }, []);

    // TODO: fix navigation to games? how does routing work to each game?
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
                                onClick={() => navigate(`/game/${game.id}`)}
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
    )


}