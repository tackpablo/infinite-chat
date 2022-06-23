// require("dotenv").config();
// console.log(process.env);

const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 8080 });
const moment = require("moment");

// const fs = require("fs");

const Redis = require("ioredis");

// const redis = new Redis({
//     host: process.env.REDIS_HOSTNAME,
//     port: process.env.REDIS_PORT,
//     password: process.env.REDIS_PASSWORD,
// });

// redis.set("mykey", "value");

// redis.get("mykey").then((result) => {
//     console.log(result); // Prints "value"
// });

// console.log("REDISSTATUS: ", redis.status);

const publisher = Redis.createClient();

let messageHistory = [];

const ts = moment().format("LT");

// connect to ws
wss.on("connection", function connection(ws) {
    console.log("ON CONNECTION");

    const msgHistory = JSON.stringify(
        messageHistory.length > 0
            ? messageHistory
            : { user: "Hi!", message: "Welcome to the Chat", timestamp: ts }
    );
    ws.send(msgHistory);

    // code to broadcast messages
    // for each client connected to the websocket
    // wss.clients.forEach(function each(client) {
    // we want to send a message
    // client.send(message" })

    // when a message is sent
    ws.on("message", function incoming(data) {
        console.log("ON MESSAGE");
        const parsedData = JSON.parse(data);

        // timestamp messages
        parsedData.timestamp = ts;
        console.log("SERVERDATA: ", parsedData);

        if (messageHistory.length > 24) {
            messageHistory.shift();
        }

        messageHistory.push(parsedData);
        console.log("HISTORYARR: ", messageHistory);

        publisher.publish("msgHistory", JSON.stringify(messageHistory));
        console.log("PUBLISHING AN EVENT USING REDIS");

        const sendData = JSON.stringify(parsedData);

        // for every client (user connected)
        wss.clients.forEach(function each(client) {
            console.log("EACH CLIENT");
            // fs.appendFile("message.txt", [data], function (err) {
            //     if (err) throw err;
            //     console.log("SAVING DATA FS: ", [data]);
            //     console.log("Saved!");
            // });

            // fs.readFile("message.text", "utf8", function (err, [data]) {
            //     if (err) throw err;
            //     console.log("READING DATA FS: ", [data]);
            //     console.log("Read!");
            // });

            // if client is not the one who sent the message and client is connected and socket is open
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                const subscriber = Redis.createClient();

                subscriber.subscribe("msgHistory");

                subscriber.on("message", (channel, message) => {
                    console.log(`Received msg from ${channel}`);
                    console.log("Received data: ", JSON.parse(message));
                    // send data
                    client.send(message);
                    console.log("SUBDATA SENT");
                });

                // console.log("WSSENTDATA", data);
            }
        });
    });
});
