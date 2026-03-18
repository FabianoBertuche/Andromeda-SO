import { createServer } from "http";
import { Server } from "socket.io";
import app from "./app";
import { globalWsGateway } from "./modules/communication/interfaces/websocket/communication.ws-gateway";

const port = process.env.PORT || 5000;

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

globalWsGateway.initialize(io);

httpServer.listen(port, () => {
    console.log(`🚀 Andromeda OS API running on port ${port} (HTTP + WS)`);
});
