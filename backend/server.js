// require("dotenv").config();
// console.log(process.env);

const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 8080 });
const moment = require("moment");

// const fs = require("fs");

// const Redis = require("ioredis");

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

// redis.set("mykey", "value");

let messageHistory = [];

// connect to ws
wss.on("connection", function connection(ws) {
    console.log("ON CONNECTION");
    // when a message is sent
    ws.on("message", function incoming(data) {
        console.log("ON MESSAGE");
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

            const parsedData = JSON.parse(data);

            // timestamp messages
            const ts = moment().format("LT");
            parsedData.timestamp = ts;
            console.log("SERVERDATA: ", parsedData);

            messageHistory.push(data);
            console.log("HISTORYARR: ", messageHistory);

            const sendData = JSON.stringify(parsedData);
            // if client is not the one who sent the message and client is connected and socket is open
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                // send data
                client.send(sendData);
                // console.log("WSSENTDATA", data);
            }
        });
    });
});
