import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface WsContextData {
    socket: Socket | null;
    isConnected: boolean;
    session: any | null;
    activeTask: any | null;
}

const WsContext = createContext<WsContextData>({
    socket: null,
    isConnected: false,
    session: null,
    activeTask: null,
});

export const useWs = () => useContext(WsContext);

export const WsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [session, setSession] = useState<any | null>(null);
    const [activeTask, setActiveTask] = useState<any | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("andromeda_token") || "andromeda_dev_web_token";
        const protocol = window.location.protocol === "https:" ? "wss" : "ws";
        const host = window.location.hostname || "127.0.0.1";
        const port = window.location.port === "5173" ? "5005" : (window.location.port || "5005");

        const newSocket = io(`${protocol}://${host}:${port}`, {
            auth: { token },
            transports: ["websocket"]
        });

        newSocket.on("connect", () => {
            setIsConnected(true);

            const demoSessionId = "session-demo-mvp03";
            newSocket.emit("session.join", demoSessionId);
            setSession({ sessionId: demoSessionId });
        });

        newSocket.on("connect_error", (error) => {
            console.error("Erro de conexão WS:", error.message);
        });

        newSocket.on("disconnect", () => {
            setIsConnected(false);
        });

        newSocket.on("gateway.event", (payload) => {
            if (payload.type === "task.updated") {
                setActiveTask((previous: any) => ({ ...previous, status: payload.status, taskId: payload.taskId }));
            } else if (payload.type === "task.completed") {
                setActiveTask((previous: any) => ({ ...previous, result: payload.result, taskId: payload.taskId }));
            } else if (payload.type === "task.created") {
                setActiveTask({ status: "CREATED", taskId: payload.taskId, sessionId: payload.sessionId });
            }
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, []);

    return (
        <WsContext.Provider value={{ socket, isConnected, session, activeTask }}>
            {children}
        </WsContext.Provider>
    );
};
