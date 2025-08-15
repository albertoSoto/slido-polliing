import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PollingService } from './polling.service';
import { Poll } from '../common/interfaces/poll.interface';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
export class PollingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly pollingService: PollingService) {}

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
    
    // Send current poll to new client if one exists
    const currentPoll = this.pollingService.getCurrentPoll();
    if (currentPoll) {
      client.emit('poll-started', currentPoll);
    }
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
  }

  emitPollStarted(poll: Poll) {
    this.server.emit('poll-started', poll);
  }

  emitVoteUpdate(poll: Poll) {
    this.server.emit('vote-update', poll);
  }

  emitPollStopped(poll: Poll) {
    this.server.emit('poll-stopped', poll);
  }

  emitSlideChanged(data: { slideIndex: number; slide: any; totalSlides: number }) {
    this.server.emit('slide-changed', data);
  }
}