const express = require("express");
const path = require("path");
const WebSocket = require("ws");
const http = require("http");
const Redis = require("ioredis");
const { v4: uuid } = require("uuid");

// Port as args
const port = Number(process.argv[2]);

// Create HTTP server
const app = express();
const server = http.Server(app);

// Express server routes
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/health", (req, res) => {
    return res.status(200).send();
});

// Websocket server
const wss = new WebSocket.Server({ server: server });

// Connect redis
const publisher = Redis.createClient({
    host: "172.31.24.142",
    port: "6379",
});

const subscriber = Redis.createClient({
    host: "172.31.24.142",
    port: "6379",
});

subscriber.subscribe("newMsg");

// Start HTTP server
server.listen(port, () => {
    console.log(`listening http://localhost:${port}`);
});

// Constants
const MAX_MSG_HISTORY = 24;

// Chat app business logic
const mySocketId = uuid();
console.log("Socket server uuid: ", mySocketId);
let msgHistory = [
    { username: "System", msg: `Start Chatting!`, date: Date.now() },
];

// Listen for new Redis events
subscriber.on("message", (channel, message) => {
    console.log(`Received msg from ${channel}`);
    console.log("Received data (msg): ", JSON.parse(message));

    // Parse msg obj
    let serverMsgObj = JSON.parse(message);
    let clientMsgObj = {
        username: serverMsgObj.username,
        msg: serverMsgObj.msg,
        date: serverMsgObj.date,
    };
    let receivedSocketId = serverMsgObj.socketId;

    // If history is longer than 24, trim it
    if (msgHistory.length >= MAX_MSG_HISTORY) {
        msgHistory.shift();
    }

    // Add new msg to history
    msgHistory.push(clientMsgObj);

    // Check if the received msg was from this socket, if it is, then don't broadcast it a 2nd time
    if (receivedSocketId === mySocketId) {
        return;
    }

    // Send msg to all clients
    broadcast(clientMsgObj);
});

// When someone connects to socket server
wss.on("connection", (ws) => {
    console.log("ON CONNECTION");
    console.log("Number of clients: ", wss.clients.size);

    // Send new sockets the message history
    ws.send(JSON.stringify(msgHistory));

    // When a message is received from a client
    ws.on("message", (rawMsg) => {
        console.log("ON MESSAGE");
        console.log("MESSAGE: ", rawMsg);

        const msgObj = JSON.parse(rawMsg);

        // TODO: validation, username = string?, msg = string?, max number of characters?

        // Make a server msg obj
        const unparsedDate = Date.now();
        const date = unparsedDate
            .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            .toUpperCase();
        const clientMsgObj = {
            username: msgObj.username,
            msg: msgObj.msg,
            date: date,
        };
        const serverMsgObj = {
            username: msgObj.username,
            msg: msgObj.msg,
            date: date,
            socketId: mySocketId,
        };

        // Publish the server msg obj to all other socket servers
        publisher.publish("newMsg", JSON.stringify(serverMsgObj));
        console.log("PUBLISHING AN EVENT USING REDIS");

        console.log("lel: " + JSON.stringify(clientMsgObj));
        broadcast(clientMsgObj);
    });

    // When someone disconnects
    ws.on("close", () => {
        console.log("closed");
        console.log("Number of clients: ", wss.clients.size);
    });
});

function broadcast(clientMsgObj) {
    wss.clients.forEach((client) => {
        // if client is connected and socket is open and not itself
        if (client.readyState == WebSocket.OPEN) {
            client.send(JSON.stringify([clientMsgObj]));
            console.log("BROADCASTED");
            return;
        }
    });
}
