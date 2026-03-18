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
        // Obter token do LocalStorage ou usar um hardcoded compatível com o middleware do Gateway
        const token = localStorage.getItem("andromeda_token") || "andromeda-secret-token";

        const newSocket = io("ws://localhost:5000", {
            auth: { token },
            transports: ["websocket"]
        });

        newSocket.on("connect", () => {
            console.log("Conectado ao Gateway:", newSocket.id);
            setIsConnected(true);

            // Criando uma sessão para testes com UUID provisório ou pedimos do backend
            const demoSessionId = "session-demo-mvp03";
            newSocket.emit("session.join", demoSessionId);
            setSession({ sessionId: demoSessionId });
        });

        newSocket.on("connect_error", (err) => {
            console.error("Erro de conexão WS:", err.message);
        });

        newSocket.on("disconnect", () => {
            console.log("Desconectado do Gateway");
            setIsConnected(false);
        });

        // O Gateway emite tudo no canal genérico 'gateway.event'
        newSocket.on("gateway.event", (payload) => {
            console.log("Evento do Gateway recebido:", payload);

            if (payload.type === "task.updated") {
                setActiveTask((prev: any) => ({ ...prev, status: payload.status, taskId: payload.taskId }));
            } else if (payload.type === "task.completed") {
                setActiveTask((prev: any) => ({ ...prev, result: payload.result, taskId: payload.taskId }));
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
