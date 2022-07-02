const express = require("express");
const path = require("path");
const app = express();
const WebSocket = require("ws");
const Redis = require("ioredis");
const { v4: uuid } = require("uuid");

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

const port = Number(process.argv[2]);
const socketPort = Number(process.argv[3]);

app.listen(port, () => {
    console.log(`listening http://localhost:${port}`);
});

const socketServer = new WebSocket.Server({ port: socketPort }),
    SERVERS = [],
    CLIENTS = [];

let messages = [`Start Chatting!+:+Welcome`];

// create redis publisher
const publisher = Redis.createClient({
    host: "172.31.24.142",
    port: "6379",
});
// create redis publisher
const subscriber = Redis.createClient({
    host: "172.31.24.142",
    port: "6379",
});

// subscribe to publisher
subscriber.subscribe("newMsg");

// turn subscriber on
subscriber.on("message", (channel, message) => {
    console.log(`Received msg from ${channel}`);
    console.log("Received data (msg): ", JSON.parse(message));

    // save subscriber msg
    let subMsg = JSON.parse(message);

    // if history is longer than 24, trim it
    if (messages.length >= 24) {
        messages.shift();
    }
    // add new msg to history
    messages.push(subMsg);

    // send msg to all servers
    broadcast(subMsg);
});

let clientId = "";

// generate a server ID
socketServer.uid = uuid();
console.log("SOCKETSERVERID: ", socketServer.uid);

// when someone connects to socket server
socketServer.on("connection", (socketClient) => {
    console.log("ON CONNECTION");
    console.log("Number of clients: ", socketServer.clients.size);

    // generate a socket client ID
    socketClient.uid = uuid();
    // save this client ID in a variable
    clientId = socketClient.uid;
    console.log("SOCKETCLIENTID: ", socketClient.uid);

    // send new sockets the message history
    socketClient.send(JSON.stringify(messages));

    // add ther server ID to servers list array
    SERVERS.push(socketServer.uid);

    // if servers list array is greater than one
    if (SERVERS.length >= 1) {
        // trim it as only one ID is required for a server
        SERVERS.length = 1;
    }

    // push new socket servers to clients list array
    CLIENTS.push(socketClient.uid);

    console.log("SERVERLIST: ", SERVERS);
    console.log("CLIENTLIST: ", CLIENTS);

    // when a message is sent
    socketClient.on("message", (message) => {
        console.log("ON MESSAGE");
        console.log("MESSAGE: ", message);

        // make a message with socketServer ID
        let idMessage = `${message}+:+${socketServer.uid}`;

        // save new messages in variable
        let wsMsg = idMessage;
        console.log("WSMSG: ", wsMsg);

        // publish the msg with the appended socket server ID
        publisher.publish("newMsg", JSON.stringify(idMessage));
        console.log("PUBLISHING AN EVENT USING REDIS");

        // if the message server ID is not equal to this server ID
        if (socketServer.uid != SERVERS[0]) {
            broadcast(idMessage);
        } else {
            // do nothing
            return;
        }
    });

    // when someone disconnects
    socketClient.on("close", (socketClient) => {
        // loop through the client server IDs
        for (let i = 0; i < CLIENTS.length; i++) {
            // if they client connected is within the client list array
            if (CLIENTS[i] == String(clientId)) {
                // remove them as they are disconnecting
                CLIENTS.splice(i, 1);
                // console.log("UPDATEDCLIENTS: ", CLIENTS);
                return;
            }
        }

        console.log("closed");
        console.log("Number of clients: ", socketServer.clients.size);
    });
});

function broadcast(message) {
    socketServer.clients.forEach((client) => {
        // if client is connected and socket is open and not itself
        if (client.readyState == WebSocket.OPEN) {
            client.send(JSON.stringify([message]));
            console.log("BROADCASTED");
            return;
        }
    });
}
