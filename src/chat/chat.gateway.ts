import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket, // 👈 Brought this back!
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  // Dictionary mapping User IDs from your DB to their active Socket Connection IDs
  private userSockets = new Map<string, string>();

  // Track the Superadmin's socket specifically so we know where to send student questions
  private adminSocketId: string | null = null;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // In a real app, you would loop through userSockets and delete the one matching this client.id
  }

  // ==========================================
  // 1. IDENTIFY: Frontend tells the server who just connected
  // ==========================================
  @SubscribeMessage('identify')
  handleIdentify(
    @MessageBody() payload: { userId: string; role: string },
    @ConnectedSocket() client: Socket, // 👈 We need the client here to get their unique connection ID
  ) {
    // Save their socket ID so we can send them private messages later
    this.userSockets.set(payload.userId, client.id);

    // If it's an executive, mark them as the active admin listener
    if (payload.role === 'SUPERADMIN' || payload.role === 'ADMIN') {
      this.adminSocketId = client.id;
    }

    console.log(`Registered ${payload.role} (User: ${payload.userId})`);
  }

  // ==========================================
  // 2. STUDENT -> ADMIN (Incoming Question)
  // ==========================================
  @SubscribeMessage('studentMessage')
  handleStudentMessage(
    @MessageBody()
    payload: {
      senderId: string;
      senderName: string;
      text: string;
    },
  ) {
    const newMessage = {
      id: crypto.randomUUID(),
      senderId: payload.senderId,
      senderName: payload.senderName,
      text: payload.text,
      timestamp: new Date().toISOString(),
    };

    // Push the message directly to the Admin's screen ONLY (if they are online)
    if (this.adminSocketId) {
      this.server
        .to(this.adminSocketId)
        .emit('adminReceiveMessage', newMessage);
    }
  }

  // ==========================================
  // 3. ADMIN -> STUDENT (Direct Reply)
  // ==========================================
  @SubscribeMessage('adminReply')
  handleAdminReply(
    @MessageBody() payload: { targetStudentId: string; text: string },
  ) {
    // Look up the specific student's connection ID
    const studentSocketId = this.userSockets.get(payload.targetStudentId);

    const newMessage = {
      id: crypto.randomUUID(),
      senderName: 'ULADS Executive', // Mask the admin's personal name for professionalism
      text: payload.text,
      timestamp: new Date().toISOString(),
    };

    // Push the reply directly to that specific student's screen ONLY
    if (studentSocketId) {
      this.server.to(studentSocketId).emit('studentReceiveMessage', newMessage);
    }
  }
}
