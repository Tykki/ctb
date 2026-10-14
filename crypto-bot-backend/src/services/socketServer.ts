import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';

export class SocketServer {
  private wss: WebSocketServer;
  // Use a Type-safe Set container to manage active connected client visual dashboards
  private activeClients: Set<WebSocket> = new Set();

  constructor(port: number) {
    // 1. Fire up a dedicated WebSocket pipeline independent of Vite's asset compiler
    this.wss = new WebSocketServer({ port }, () => {
      console.log(`[SOCKET_SERVER] Infrastructure active. Listening on ws://localhost:${port}`);
    });

    this.initializeLifecycleListeners();
  }

  /**
   * Orchestrates base listener handshakes across the socket lifecycle grid
   */
  private initializeLifecycleListeners(): void {
    this.wss.on('connection', (socket: WebSocket, req: IncomingMessage) => {
      const clientIp = req.socket.remoteAddress ?? 'UNKNOWN_IP';
      console.log(`[SOCKET_SERVER] Handshake completed successfully. Dashboard linked from: ${clientIp}`);

      // Register the socket connection to receive live block updates
      this.activeClients.add(socket);

      // Handle structural connection cuts cleanly
      socket.on('close', () => {
        console.log(`[SOCKET_SERVER] Client connection disconnected. Removing socket footprint.`);
        this.activeClients.delete(socket);
      });

      // Catch underlying TCP socket layer communication anomalies
      socket.on('error', (err: Error) => {
        console.error(`[SOCKET_SERVER] Client communication anomaly detected: ${err.message}`);
        this.activeClients.delete(socket);
      });
    });
  }

  /**
   * Broadcasts high-frequency engine metrics to all subscribed client dashboards
   * @param eventName Unique identifier string to map incoming streams to UI views
   * @param payload Fully typed data structures computed off-chain by the engine
   */
  public broadcast(eventName: string, payload: unknown): void {
    if (this.activeClients.size === 0) return;

    // Stringify data frames cleanly using modern JSON protocol specs
    const telemetryFrame = JSON.stringify({
      event: eventName,
      data: payload,
      timestamp: Date.now(),
    });

    for (const client of this.activeClients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(telemetryFrame);
      }
    }
  }

  /**
   * Performs an ordered system shutdown to release network ports cleanly
   */
  public shutdown(): Promise<void> {
    return new Promise((resolve) => {
      console.log('[SOCKET_SERVER] Commencing orderly port release procedures...');
      for (const client of this.activeClients) {
        client.close();
      }
      this.wss.close(() => {
        console.log('[SOCKET_SERVER] All network ports released cleanly.');
        resolve();
      });
    });
  }
}
