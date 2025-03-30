import { useState, useEffect } from "react";
import Card from "./Card";

const CardStack = ({ cards, direction = "vertical" }) => {

    if (!cards) return null;

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

    const centerOffset = (numCards, overlapDistance) => {
        const totalWidth = overlapDistance * (numCards - 1); // Total distance covered by cards
        return totalWidth / 2;
    };

    const overlapDistance = getOverlapDistance(cards.length);
    const offset = centerOffset(cards.length, overlapDistance);

    return (
        <div
            className={`flex ${stackStyles} items-center justify-center relative`}
            style={{
                // Center the stack horizontally if it's horizontal, or vertically if it's vertical
                transform: direction === "horizontal" ? `translateX(-${offset}px)` : `translateY(-${offset}px)`,
            }}
        >
            {cards.map((card, index) => {
                return (
                    <div
                        key={card.id}
                        className="absolute"
                        style={{
                            zIndex: cards.length - index, // Ensure later cards appear on top
                            transform: `${direction === "horizontal" ? `translateX(${index * overlapDistance}px)` : ""} ${direction === "vertical" ? `translateY(${index * overlapDistance}px)` : ""
                                }`,
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
