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

let filteredMsg = "";

// create redis publisher
const publisher = Redis.createClient();
// create redis publisher
const subscriber = Redis.createClient();

// create client for cache
// let client = Redis.createClient();

// const checkCache = () => {
//     client.get("msgHistory", (err, data) => {
//         if (data) {
//             let cachedData = JSON.parse(data);
//             console.log("CACHEDDATA: ", cachedData);
//             return cachedData;
//         }
//     });
// };

// subscribe to publisher
subscriber.subscribe("newMsg");

// turn subscriber on
subscriber.on("message", (channel, message) => {
    console.log(`Received msg from ${channel}`);
    console.log("Received data (msg): ", JSON.parse(message));
    // save message as a filter
    filteredMsg = JSON.parse(message);
    // broadcast msg to all clients
    broadcast(JSON.parse(message), socketServer);
});

// when someone connects to socket server
socketServer.on("connection", (socketClient) => {
    console.log("ON CONNECTION");
    console.log("Number of clients: ", socketServer.clients.size);

    // console.log("CACHECHECK: ", checkCache());

    // socketClient.send(checkCache());
    socketClient.send(JSON.stringify(messages));

    // when a message is sent
    socketClient.on("message", (message) => {
        console.log("ON MESSAGE");
        console.log("MESSAGE: ", message);

        if (messages.length > 24) {
            messages.shift();
        }

        messages.push(message);
        console.log("ALLMESSAGES: ", messages);

        // client.setex("msgHistory", 600, JSON.stringify(messages));

        // publish the message history
        publisher.publish("newMsg", JSON.stringify(message));
        console.log("PUBLISHING AN EVENT USING REDIS");

        // console.log("FILTEREDMSG: ", filteredMsg);
        // console.log("MSG: ", message);

        if (filteredMsg === message) {
            broadcast(message, socketClient);
        }
    });

    // when someone disconnects
    socketClient.on("close", (socketClient) => {
        console.log("closed");
        console.log("Number of clients: ", socketServer.clients.size);
    });
});

function broadcast(message, socketClient) {
    socketServer.clients.forEach((client) => {
        // console.log("EACH CLIENT: ", client);
        // if client is connected and socket is open
        if (client !== socketClient && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify([message]));
        }
    });
}
