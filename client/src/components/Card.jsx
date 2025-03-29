



// For testing -gives a random card component
export function getRandomCard() {

    const colour = ['red', ]





}




export default function Card({ card }) {

    // TODO: check
    const onClick = () => {
        if (card.playable) {
            console.log(`Card played: ${card.id}`);

            // TODO: send card played message

        }
    };

    const getFrontContent = () => {

        if (card.colour === "black" && card.action === "wild") {
            return (
                <Image
                    src="/assets/images/wild.png"
                    alt="Wild Card"
                    width={118}
                    height={88}
                />
            );
        }

        if (card.colour === "black") {
            return (
                <>
                    <Image
                        src={`/assets/images/front-${card.colour}.png`}
                        alt={`${card.colour} card`}
                        width={118}
                        height={88}
                    />
                    <img
                        src="/assets/images/draw4.png"
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20"
                        alt="Draw 4 Icon"
                    />
                    <img
                        className="absolute top-3 left-3 w-6"
                        src={`/assets/images/${card.action}-blank.png`}
                        alt="Action icon"
                    />
                </>
            );
        }

        if (action) {
            return (
                <>
                    <Image
                        src={`/assets/images/front-${card.colour}.png`}
                        alt={`${card.colour} card`}
                        width={118}
                        height={88}
                    />
                    <img
                        src={`/assets/images/${card.action}-${card.colour}.png`}
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16"
                        alt={`${card.action} icon`}
                    />
                    <img
                        className="absolute top-3 left-3 w-6"
                        src={`/assets/images/${card.action}-blank.png`}
                        alt="Action icon"
                    />
                </>
            );
        }

        return (
            <>
                <Image
                    src={`/assets/images/front-${card.colour}.png`}
                    alt={`${card.colour} card`}
                    width={118}
                    height={88}
                />
                <p className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-xl font-bold text-shadow-lg">
                    {card.digit}
                </p>
                <p className="absolute top-2 left-3 text-white text-sm">{card.digit}</p>
                <p className="absolute bottom-2 right-3 text-white text-sm">{card.digit}</p>
            </>
        );


    }





    return (
        <motion.div
            layoutId={layoutId}
            className={`relative w-24 h-32 rounded-lg shadow-lg ${disableShadow ? "shadow-none" : "shadow-xl"} ${playable ? "cursor-pointer" : "cursor-default"
                } ${selectable ? "opacity-50" : "opacity-100"} transition-all`}
            style={{
                transform: `rotateY(${flip ? 180 - rotationY : rotationY}deg)`,
                transformStyle: "preserve-3d",
            }}
            onClick={onClick}
            whileHover={{
                y: playable ? -10 : 0,
                transition: { duration: 0.3 },
            }}
        >


            {/* Front Face */}
            <div
                className="absolute inset-0 bg-white rounded-lg flex items-center justify-center overflow-hidden"
                style={{ backfaceVisibility: "hidden" }}
            >
                {getFrontContent()}
            </div>

            {/* Back Face */}
            <div
                className="absolute inset-0 bg-gray-300 rounded-lg flex items-center justify-center overflow-hidden"
                style={{
                    transform: "rotateY(180deg)",
                    backfaceVisibility: "hidden",
                }}
            >
                <Image
                    src="/assets/images/backside.png"
                    alt="Back of the card"
                    width={118}
                    height={88}
                />
            </div>
        </motion.div>
    );
}