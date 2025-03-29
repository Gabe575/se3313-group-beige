import React, { createContext, useContext, useEffect, useState } from 'react';
import { SOCKET_URL } from '../util/config';

// Create a Context to hold the WebSocket
const SocketContext = createContext(null);

export const useSocket = () => {
    return useContext(SocketContext);
};

// Create provider
export const WebSocketProvider = ({ children }) => {

    const [socket, setSocket] = useState(null);
    const [isWaiting, setIsWaiting] = useState(true);

    // Avoid a really dumb race condition
    useEffect(() => {
        const delay = 100;

        const timeout = setTimeout(() => {
            setIsWaiting(false);
        }, delay);

        return () => clearTimeout(timeout);
    }, []);


    useEffect(() => {

        if (isWaiting) return;

        // Initialize WebSocket connection when the app starts
        const socketInstance = new WebSocket(SOCKET_URL);
        setSocket(socketInstance);

        socketInstance.onopen = () => {
            console.log('WebSocket connection established');
        };

        socketInstance.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        socketInstance.onclose = () => {
            console.log('WebSocket disconnected');
        };

        return () => {
            if (socketInstance) {
                socketInstance.close();
            }
        };

    }, [isWaiting]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};