# Infinite Chat Project

Infinite Chat is a simple application build with Node, Express, WebSocket, and Redis that allows participants to chat once connected.

## Final Product

#### Application

!["Home Page"](./public/images/Home%20Page.jpg)

#### Demo Video

![Dashboard](./public/images/Demo%20Vid.gif)

Both of these examples are local. They have been tested on AWS using the Load Balancer.

## Features

-   A fully functional chat application that allows a user to connect, type in a user name and send messages to all users connected.
-   The message history (assuming the users were connected from the start) persists up to 25 messages.

# Getting Started

#### Local - Easier

-   Requires the installation of [redis](https://redis.io/docs/getting-started/installation/).
-   Install all dependencies (using the `npm install ci` command).
-   To run local instance:
    -   In `server.js`, remove host and port configurations for Redis.createClient (Line 30 and 35).
    -   Run `redis-server` to start redis
    -   Run the development web server using the `node server.js 8080 3030` (for one instance) and `node server.js 8090 3040` (for a second instance) commands.
        -   This is due to only being able to use one local port (8080 and 8090) at a time for the server and one websocket port (3030 and 3040).
-   When you visit the instance, you will need to pass in a params into the URL.
    -   `localhost:8080`/?port=`8080`&socketUrl=`localhost`
        -   port is equal to the `local server port` you want to connect to (8080 or 8090) and socketUrl to `localhost`

#### AWS - Difficult

-   **Be careful as you will be billed for these services.**
-   You will need to create at least 2 `AWS EC2` instances for the servers.
    -   This will require you to SSH into the instance (unless you use Amazon Connect), install `nvm/node`, cloning the github repo and installing all dependencies.
        -   You will need the correct authorized SSH keys.
-   You will need to create `Amazon Elasticache Redis Cluster`.
    -   Once created, rename the `.envexample` file to `.env` and put in your own `Elasticache IP Address` for the `REDIS_HOST` and `PORT` for `REDIS_PORT` (default `6379`).
-   You will need to create an `Elastic Load Balancer (ELB)`.
    -   This will be the `Application Load Balancer` using the default port `80` and forward the Listener to the 2 instances created (create a target group and use port `8080`).
    -   For health check configurations, the path is `/health`
-   For all these AWS services, don't forget to have security groups to allow for access.
-   You will need to update the `wsAddress` with the ELB address (Line 46 in `index.html`)

# Learning Outcomes

![Dashboard](./public/images/Scalable%20Chat%20App%20Design.PNG)

-   The intial setup was to create a simple frontend to serve the backend that allows you to post messages.
-   As no database is being used, I had to persist the data using other means (initially persisted locally as an array).
-   Once a WebSocket and Redis was setup, it was quite difficult to setup the logic to publish messages.
    -   Redis Pub/Sub was used to publish messages to all servers, while WebSockets were used to broadcast to all local clients.
-   Working through AWS to setup `EC2`, `Elasticache`, `ELB` were quite difficult as there are many ways to set things up.
    -   Especially security groups and permissions took a bit of time to figure out.

# Dependencies

-   nodemon
-   dotenv
-   express
-   ioredis
-   moment
-   uuid
-   ws
