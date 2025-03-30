// Creates a card that shows the corresponding card image to the properties etc

export default function Card({ action, colour, digit, disableShadow = false, id, playable, className, hidden }) {

    // TODO: check
    const onClick = () => {
        if (playable) {
            console.log(`Card played: ${id}`);

            // TODO: send card played message

        }
    };

    const getContent = () => {
        let imagePath = "";

        if (action) {
            if (action == "wild") imagePath = `/assets/images/wild.png`;
            else if (action == "plus4") imagePath = `/assets/images/wild_plus4.png`;
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
        <div
            className={`relative w-21 h-32 rounded-lg shadow-lg ${disableShadow ? "shadow-none" : "shadow-xl"} ${playable ? "cursor-pointer" : "cursor-default"} transition-all ${className}`}
            style={{
                transformStyle: "preserve-3d",
            }}
            onClick={onClick}
        >
            <div
                className="absolute inset-0 bg-white rounded-lg flex items-center justify-center overflow-hidden"
                style={{ backfaceVisibility: "hidden" }}
            >
                {getContent()}
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