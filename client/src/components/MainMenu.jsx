import { useState } from "react";
import { useNavigate } from "react-router";

export default function UnoMainMenu() {
  const [playerName, setPlayerName] = useState("");
  const [validName, setValidName] = useState(false);
  const [saved, setSaved] = useState(false);
  
  let navigate = useNavigate();

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
      </div>
    </div>
  );
}
