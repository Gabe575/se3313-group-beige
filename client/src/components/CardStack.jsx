import { useState, useEffect } from "react";
import Card from "./Card";

const CardStack = ({ cards, direction = "vertical" }) => {


    const getOverlapDistance = (numCards) => {


        // Should be ~100 when few cards, drop off as more are added to a min of 50ish


        const maxOverlap = 100;
        const minOverlap = 50;

        // As the number of cards increases, the overlap decreases
        const overlap = Math.max(minOverlap, maxOverlap - (numCards - 1) * 10);

        return overlap;
    };

    // Calculate the stack style based on the direction (vertical or horizontal)
    const stackStyles = direction === "vertical"
        ? "flex-col"
        : "flex-row";

    return (
        <div className={`flex ${stackStyles} items-center justify-center relative`}>
            {cards.map((card, index) => {
                const overlapDistance = getOverlapDistance(cards.length);

                return (
                    <div
                        key={card.id}
                        className="absolute"
                        style={{
                            zIndex: cards.length - index,
                            transform: `translate(${direction === "horizontal" ? `${index * overlapDistance}px` : "0"}, ${direction === "vertical" ? `${index * overlapDistance}px` : "0"
                                })`,
                        }}
                    >
                        <Card {...card} />
                    </div>
                );
            })}
        </div>
    );
};

export default CardStack;
