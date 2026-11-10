import { broadcastQueueUpdate as hubBroadcastQueue, notifyAgentJobAvailable as hubNotifyAgent } from '@/server/socket-hub';

const globalForSocket = global as unknown as {
  io?: {
    to: (room: string) => { emit: (event: string, data?: any) => void };
    emit: (event: string, data?: any) => void;
  };
};

export function broadcastQueueUpdate() {
  try {
    hubBroadcastQueue();
    globalForSocket.io?.to('queue_room').emit('QUEUE_UPDATED');
  } catch {
    // Ignore when running without custom socket server
  }
}

export function notifyAgentJobAvailable() {
  try {
    hubNotifyAgent();
    globalForSocket.io?.to('agent_room').emit('JOB_AVAILABLE');
  } catch {
    // Ignore when running without custom socket server
  }
}
