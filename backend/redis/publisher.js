3;
4;
5;
6;
7;
8;
9;
10;
11;
12;
13;
14;
15;
16;
17;
18;
19;
20;

const Redis = require("ioredis");

const pub = new Redis();

const channel = "garageDoor";

const sleep = (sec) =>
    new Promise((resolve) => setTimeout(resolve, sec * 1000));

async function main() {
    console.log("Started garage door publisher...");
    // Sleep 4 seconds and then publish garage door "opened" event.
    await sleep(4);
    pub.publish(channel, "opened");

    await sleep(7);
    pub.publish(channel, "closed");
    pub.disconnect();
}

main();
