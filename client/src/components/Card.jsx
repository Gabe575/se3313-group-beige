import { act, useEffect } from "react";



export default function Card({ action, colour, digit, disableShadow, id, playable }) {

    useEffect(() => {
        console.log(action)
    }, [action])


    // TODO: check
    const onClick = () => {
        if (playable) {
            console.log(`Card played: ${id}`);

            // TODO: send card played message

        }
    };

    const getFrontContent = () => {

        if (colour === "black" && action === "wild") {
            return (
                <img
                    src="/assets/images/wild.png"
                    alt="Wild Card"
                    className="w-28 h-20 object-contain"
                />
            );
        }

        if (colour === "black") {
            return (
                <>
                    <img
                        src={`/assets/images/front-${colour}.png`}
                        alt={`${colour} card`}
                        className="w-28 h-20 object-contain"
                    />
                    <img
                        src="/assets/images/draw4.png"
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20"
                        alt="Draw 4 Icon"
                    />
                    <img
                        className="absolute top-3 left-3 w-6"
                        src={`/assets/images/${action}-blank.png`}
                        alt="Action icon"
                    />
                </>
            );
        }

        if (action) {
            return (
                <>
                    <img
                        src={`/assets/images/front-${colour}.png`}
                        alt={`${colour} card`}
                        className="w-28 h-20 object-contain"
                    />
                    <img
                        src={`/assets/images/${action}-${colour}.png`}
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16"
                        alt={`${action} icon`}
                    />
                    <img
                        className="absolute top-3 left-3 w-6"
                        src={`/assets/images/${action}-blank.png`}
                        alt="Action icon"
                    />
                </>
            );
        }

        return (
            <>
                <img
                    src={`/assets/images/front-${colour}.png`}
                    alt={`${colour} card`}
                    className="w-28 h-20 object-contain"
                />
                <p className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-xl font-bold text-shadow-lg">
                    {digit}
                </p>
                <p className="absolute top-2 left-3 text-white text-sm">{digit}</p>
                <p className="absolute bottom-2 right-3 text-white text-sm">{digit}</p>
            </>
        );


    }





    return (


        <div
            className={`relative w-24 h-32 rounded-lg shadow-lg ${disableShadow ? "shadow-none" : "shadow-xl"} ${playable ? "cursor-pointer" : "cursor-default"
                } transition-all`}
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
                    src="/assets/images/backside.png"
                    alt="Back of the card"
                    className="w-28 h-20 object-contain"
                />
            </div>
        </div>



    );
}