const express = require("express");
const path = require("path");
const app = express();
const WebSocket = require("ws");
const Redis = require("ioredis");

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

const port = Number(process.argv[2]);
const socketPort = Number(process.argv[3]);

app.listen(port, () => {
    console.log(`listening http://localhost:${port}`);
});

const socketServer = new WebSocket.Server({ port: socketPort });

let messages = [`Start Chatting!`];

// create redis publisher
const publisher = Redis.createClient();
// create redis subscriber
const subscriber = Redis.createClient();
// subscribe to publisher
subscriber.subscribe("newMsg");

// turn subscriber on
subscriber.on("message", (channel, message) => {
    console.log(`Received msg from ${channel}`);
    console.log("Received data: ", JSON.parse(message));

    // broadcast this msg to all clients
    broadcast(JSON.parse(message), socketServer);
    // update msg history
});

// when someone connects to socket server
socketServer.on("connection", (socketClient) => {
    console.log("WEBSOCKET", socketServer);
    console.log("ON CONNECTION");
    console.log("Number of clients: ", socketServer.clients.size);

    socketClient.send(JSON.stringify(messages));

    // when a message is sent
    socketClient.on("message", (message) => {
        console.log("ON MESSAGE");
        console.log("MESSAGE: ", message);

        if (messages.length > 24) {
            messages.shift();
        }

        messages.push(message);
        console.log("MESSAGES: ", messages);

        // publish the message history
        publisher.publish("newMsg", JSON.stringify(message));
        console.log("PUBLISHING AN EVENT USING REDIS");

        broadcast(message, socketClient);
    });

    // when someone disconnects
    socketClient.on("close", (socketClient) => {
        console.log("closed");
        console.log("Number of clients: ", socketServer.clients.size);
    });
});

function broadcast(message, socketClient) {
    socketServer.clients.forEach((client) => {
        console.log("EACH CLIENT: ", client);
        // if client is connected and socket is open
        if (client !== socketClient && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify([message]));
        }
    });
}
