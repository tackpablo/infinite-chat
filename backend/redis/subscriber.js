const Redis = require("ioredis");

const redis = new Redis();

redis.on("message", (channel, message) => {
    console.log(`Received the following message from ${channel}: ${message}`);
});

const channel = "garageDoor";

redis.subscribe(channel, (error, count) => {
    if (error) {
        throw new Error(error);
    }
    console.log(
        `Subscribed to ${count} channel. Listening for updates on the ${channel} channel.`
    );
});
