import { act, useEffect } from "react";



export default function Card({ action, colour, digit, disableShadow, id, playable, className }) {

    useEffect(() => {

    }, [action])


    // TODO: check
    const onClick = () => {
        if (playable) {
            console.log(`Card played: ${id}`);

            // TODO: send card played message

        }
    };

    const getFrontContent = () => {

        let imagePath = "";

        if (action) {

            if (action == "wild") imagePath = `/assets/images/wild.png`
            else if (action == "plus4") imagePath = `/assets/images/wild_plus4.png`
            else imagePath = `/assets/images/${colour}_${action}.png`;
            
            
        } else if (digit !== undefined) {
            // Regular number cards (0-9)
            imagePath = `/assets/images/${colour}_${digit}.png`;
        }

        return (
            <img
                src={imagePath}
                alt={`${colour} ${action || digit} card`}
                className="w-28 h-20 object-contain"
            />
        );



    }





    return (
        <div
            className={`relative w-24 h-32 rounded-lg shadow-lg ${disableShadow ? "shadow-none" : "shadow-xl"} ${playable ? "cursor-pointer" : "cursor-default"} transition-all ${className}`}
            style={{
                transformStyle: "preserve-3d",
            }}
            onClick={onClick}
        >
            <div
                className="absolute inset-0 bg-white rounded-lg flex items-center justify-center overflow-hidden"
                style={{ backfaceVisibility: "hidden" }}
            >
                {getFrontContent()}
            </div>

            <div
                className="absolute inset-0 bg-gray-300 rounded-lg flex items-center justify-center overflow-hidden"
                style={{
                    transform: "rotateY(180deg)",
                    backfaceVisibility: "hidden",
                }}
            >
                <img
                    src="/assets/images/back.png"
                    alt="Back of the card"
                    className="w-28 h-20 object-contain"
                />
            </div>
        </div>
    );
}