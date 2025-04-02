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
            console.log()
        }
    })
}