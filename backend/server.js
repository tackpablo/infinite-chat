require("dotenv").config();
console.log(process.env);

const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 8080 });

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

// connect to ws
wss.on("connection", function connection(ws) {
    // when a message is sent
    ws.on("message", function incoming(data) {
        // for every client (user connected)
        wss.clients.forEach(function each(client) {
            // if client is not the one who sent the message and client is connected and socket is open
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                // send data
                client.send(data);
                console.log("WSSENTDATA", data);
            }
        });
    });
});
