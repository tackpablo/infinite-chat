import React, { useState, useEffect } from "react";
const moment = require("moment");

const URL = "ws://127.0.0.1:8080";

const App = () => {
    const [user, setUser] = useState("Username...");
    const [message, setMessage] = useState([]);
    const [messages, setMessages] = useState([]);
    const [ws, setWs] = useState(new WebSocket(URL));

    const submitMessage = (usr, msg) => {
        const ts = moment().format("LT");
        // when message is submitted, create message object
        const message = { user: usr, message: msg, timestamp: ts };
        // stringify object into JSON and send to backend
        ws.send(JSON.stringify(message));
        console.log("STRINGIFYMSG: ", message);
        // set messages with new message and spread out old messages
        setMessages([message, ...messages]);
        console.log("MESSAGE SUBMITTED");
    };

    useEffect(() => {
        // connects to ws
        ws.onopen = (e) => {
            console.log("WebSocket Connected");
        };

        // when new message is submitted
        ws.onmessage = (e) => {
            // parses data from JSON object to normal JS object
            const message = JSON.parse(e.data);
            console.log("PARSEDMSG: ", message);
            // set messages with new message and spread out old messages
            setMessages([message, ...messages]);
        };

        // disconnects from ws
        return () => {
            ws.onclose = () => {
                console.log("WebSocket Disconnected");
                setWs(new WebSocket(URL));
            };
        };
    }, [ws.onmessage, ws.onopen, ws.onclose, messages]);

    return (
        <div style={{ padding: "10px" }}>
            <label htmlFor="user">
                Name : &nbsp;
                <input
                    type="text"
                    id="user"
                    placeholder={"Type a username..."}
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                />
            </label>

            <ul>
                {messages.map((message, index) => (
                    <li key={index}>
                        <b>
                            {message.user}({message.timestamp})
                        </b>
                        : <em>{message.message}</em>
                    </li>
                ))}
            </ul>

            <form
                action=""
                onSubmit={(e) => {
                    e.preventDefault();
                    submitMessage(user, message);
                    setMessage([]);
                }}
            >
                <input
                    type="text"
                    placeholder={"Type a message ..."}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                />
                <input type="submit" value={"Send"} />
            </form>
        </div>
    );
};

export default App;
