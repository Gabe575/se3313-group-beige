// Creates a card that shows the corresponding card image to the properties etc

import { useState } from "react";
import { useSocket } from "./WebSocketProvider";

export default function Card({ action, colour, digit, disableShadow = false, id, playable, className, hidden, name, game }) {

    const socket = useSocket();
    const [showColourPicker, setShowColourPicker] = useState(false);
    const [selectedColor, setSelectedColor] = useState(null);

    const onClick = () => {

        if (name == 'draw_card') {

            console.log('card drawn')

            // Player clicked on draw card

            // Check that it's their turn

            // Check that they havent already drawn a card this turn

            // Send draw_card


            return;
        }

        if (!playable) return;

        console.log(`Card played: ${name}`);

        // Show colour picker for wild cards
        if (action === "wild" || action === "wild_plus4") {
            setShowColourPicker(true);
        } else {
            sendCardPlayMessage();
        }
    };


    const sendCardPlayMessage = (colourChoice = "") => {
        const message = {
            type: "play_card",
            game_id: game,
            player_name: sessionStorage.getItem('name'),
            card: name,
            colour: colourChoice
        };

        if (socket && socket.readyState === WebSocket.OPEN) {
            console.log(JSON.stringify(message));
            socket.send(JSON.stringify(message));
            console.log('Socket sent... card played');
        }

        setShowColourPicker(false);
    };

    const handleColorSelect = (color) => {
        setSelectedColor(color);
        sendCardPlayMessage(color);
    };

    const getContent = () => {
        let imagePath = "";

        if (action) {
            if (action == "wild") imagePath = `/assets/images/wild.png`;
            else if (action == "wild_plus4") imagePath = `/assets/images/wild_plus4.png`;
            else imagePath = `/assets/images/${colour}_${action}.png`;
        } else if (digit !== undefined) {
            // Regular number cards (0-9)
            imagePath = `/assets/images/${colour}_${digit}.png`;
        }

        // Overwrite with backside if hidden
        if (hidden) imagePath = `/assets/images/back.png`;

        return (
            <img
                src={imagePath}
                alt={`${colour} ${action || digit} card`}
                className="w-full h-full object-cover"
            />
        );
    }

    return (
        <div className="relative">
            <div
                className={`relative w-21 h-32 rounded-lg shadow-lg ${disableShadow ? "shadow-none" : "shadow-xl"} ${playable ? "cursor-pointer" : "cursor-default"} transition-all ${className}`}
                style={{ transformStyle: "preserve-3d" }}
                onClick={onClick}
            >
                <div className="absolute inset-0 bg-white rounded-lg flex items-center justify-center overflow-hidden" style={{ backfaceVisibility: "hidden" }}>
                    {getContent()}
                </div>
            </div>

            {showColourPicker && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-2 bg-white shadow-lg rounded-md flex space-x-2">
                    {["red", "blue", "green", "yellow"].map((colour) => (
                        <button
                            key={colour}
                            className={`w-8 h-8 rounded-full border-2 border-black`}
                            style={{ backgroundColor: colour }}
                            onClick={() => handleColorSelect(colour)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}