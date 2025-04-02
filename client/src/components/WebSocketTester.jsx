import React, { useState, useEffect } from "react";

export default function WebSocketTester() {
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");

    useEffect(() => {
        const ws = new WebSocket("ws://localhost:9002/ws");

        ws.onopen = () => {
            console.log("WebSocket connected.");
            setMessages(prev => [...prev, "Connected to server."]);
        };

        ws.onmessage = event => {
            console.log("Received: ", event.data);
            setMessages(prev => [...prev, event.data]);
        };

        ws.onerror = err => {
            console.error("WebSocket error:", err);
            setMessages(prev => [...prev, "Error: " + err.message]);
        };

        ws.onclose = () => {
            setMessages(prev => [...prev, "Disconnected"]);
        };

        setSocket(ws);

        return () => {
            ws.close();
        };
    }, []);

    const sendMessage = () => {
        if (!socket || socket.readyState !== WebSocket.OPEN){
            alert("Web Socket is not open");
            return;
        }
        
        try {
            const parsed = JSON.parse(input);
            socket.send(JSON.stringify(parsed));
            setMessages(prev => [...prev, input]);
        } catch (error) {
            alert("Invalid JSON");
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-2">WebSocket Tester</h2>
            <textarea
                className="w-full p-2 border rounded mb-2"
                rows="4"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Example:
                    {
                    "type": "create_player",
                    "player_name": "tester"
                    }`
                }
            />
            <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-800"
                onClick={sendMessage}
            >
                Send
            </button>
            <div className="mt-4">
                <h3 className="font-semibold">Log:</h3>
                <pre className="bg-gray-100 p-2 mt-2 max-h-80 overflow-auto">
                    {messages.join("\n")}
                </pre>
            </div>
        </div>
    )
}