import { io, Socket } from "socket.io-client";
import * as SecureStore from "expo-secure-store";

const SOCKET_URL = "http://localhost:4000";

class SocketService {
  private socket: Socket | null = null;

  async connect(): Promise<Socket> {
    if (this.socket?.connected) {
      return this.socket;
    }

    const token = await SecureStore.getItemAsync("token");

    this.socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: false,
    });

    this.socket.connect();

    this.socket.on("connect", () => {
      console.log("Partner App socket transmitter connected ID:", this.socket?.id);
    });

    this.socket.on("connect_error", (err) => {
      console.error("Partner socket connection error:", err.message);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log("Partner socket disconnected");
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketService = new SocketService();
export default socketService;
