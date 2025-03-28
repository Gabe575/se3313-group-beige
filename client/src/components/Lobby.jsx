import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { SOCKET_URL } from "../util/config";

export default function Lobby() {
  const { gameId } = useParams(); // Get the gameId from the URL
  const [lobbyInfo, setLobbyInfo] = useState(null);
  const [playerCount, setPlayerCount] = useState(0);
  const socket = useRef(null);

  useEffect(() => {
    // Connect to WebSocket server for this game lobby
    socket.current = new WebSocket(SOCKET_URL);
    socket.current.onopen = () => {
      console.log("Connected to WebSocket server for lobby");

      // Request initial game info (you may need to send a request for the game's details)
      socket.current.send(
        JSON.stringify({ type: "get_game_info", game_id: gameId })
      );
    };

    socket.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Received from server:", data);

      if (data.type === "game_info") {
        // Update the lobby info and player count
        setLobbyInfo(data.game);
        setPlayerCount(data.game.players.length);
      }
    };

    // Cleanup WebSocket connection when the component is unmounted
    return () => {
      if (socket.current) {
        socket.current.close();
      }
    };
  }, [gameId]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-80 bg-white p-6 rounded-2xl shadow-lg flex flex-col gap-4">
        <h2 className="text-center text-lg font-bold text-black">
          Lobby: {lobbyInfo?.name || "Loading..."}
        </h2>
        <p className="text-center">
          {playerCount} {playerCount === 1 ? "Player" : "Players"} in the Lobby
        </p>

        {/* Display player list */}
        <ul>
          {lobbyInfo?.players?.map((player, index) => (
            <li key={index} className="text-center">{player}</li>
          ))}
        </ul>

        {/* Optionally, add more functionality like starting the game, chatting, etc. */}
      </div>
    </div>
  );
}
