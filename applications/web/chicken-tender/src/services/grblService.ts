import type { 
  MachineStatus, 
  GCodeFile, 
  JobProgress, 
  CNCAlarm, 
  Position, 
  CoordinateSystem,
  GRBLState 
} from '../types/cnc';

/**
 * Service for GRBL CNC communication and control
 */
export class GRBLService {
  private static instance: GRBLService;
  private websocket: WebSocket | null = null;
  private statusCallbacks: ((status: MachineStatus) => void)[] = [];
  private alarmCallbacks: ((alarm: CNCAlarm) => void)[] = [];
  private progressCallbacks: ((progress: JobProgress) => void)[] = [];

  private constructor() {}

  static getInstance(): GRBLService {
    if (!GRBLService.instance) {
      GRBLService.instance = new GRBLService();
    }
    return GRBLService.instance;
  }

  /**
   * Connect to GRBL controller via WebSocket
   */
  async connect(url: string = 'ws://localhost:8080/grbl'): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.websocket = new WebSocket(url);
        
        this.websocket.onopen = () => {
          console.log('Connected to GRBL controller');
          this.startStatusPolling();
          resolve();
        };

        this.websocket.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.websocket.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.websocket.onclose = () => {
          console.log('Disconnected from GRBL controller');
          this.websocket = null;
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from GRBL controller
   */
  disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }

  /**
   * Send G-code command to GRBL
   */
  async sendCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
        reject(new Error('Not connected to GRBL controller'));
        return;
      }

      const message = {
        type: 'command',
        data: command
      };

      this.websocket.send(JSON.stringify(message));
      
      // For demo purposes, simulate response
      setTimeout(() => {
        resolve('ok');
      }, 100);
    });
  }

  /**
   * Emergency stop
   */
  async emergencyStop(): Promise<void> {
    if (this.websocket) {
      const message = {
        type: 'emergency_stop'
      };
      this.websocket.send(JSON.stringify(message));
    }
  }

  /**
   * Soft reset GRBL
   */
  async softReset(): Promise<void> {
    await this.sendCommand('\x18'); // Ctrl-X
  }

  /**
   * Home all axes
   */
  async homeAll(): Promise<void> {
    await this.sendCommand('$H');
  }

  /**
   * Home specific axis
   */
  async homeAxis(axis: 'X' | 'Y' | 'Z'): Promise<void> {
    await this.sendCommand(`$H${axis}`);
  }

  /**
   * Jog machine
   */
  async jog(axis: 'X' | 'Y' | 'Z', distance: number, feedRate: number): Promise<void> {
    const direction = distance >= 0 ? '+' : '-';
    const absDistance = Math.abs(distance);
    await this.sendCommand(`$J=G91${axis}${direction}${absDistance}F${feedRate}`);
  }

  /**
   * Set work coordinate system
   */
  async setCoordinateSystem(system: CoordinateSystem): Promise<void> {
    await this.sendCommand(system);
  }

  /**
   * Set work coordinate zero
   */
  async setWorkZero(axes?: ('X' | 'Y' | 'Z')[]): Promise<void> {
    if (axes && axes.length > 0) {
      const axisString = axes.join('');
      await this.sendCommand(`G10L20P1${axisString}0`);
    } else {
      await this.sendCommand('G10L20P1X0Y0Z0');
    }
  }

  /**
   * Override feed rate
   */
  async setFeedOverride(percentage: number): Promise<void> {
    const clampedPercentage = Math.max(10, Math.min(200, percentage));
    await this.sendCommand(`F${clampedPercentage}`);
  }

  /**
   * Override spindle speed
   */
  async setSpindleOverride(percentage: number): Promise<void> {
    const clampedPercentage = Math.max(10, Math.min(200, percentage));
    await this.sendCommand(`S${clampedPercentage}`);
  }

  /**
   * Start spindle
   */
  async startSpindle(speed?: number, clockwise: boolean = true): Promise<void> {
    const direction = clockwise ? 'M3' : 'M4';
    const command = speed ? `${direction}S${speed}` : direction;
    await this.sendCommand(command);
  }

  /**
   * Stop spindle
   */
  async stopSpindle(): Promise<void> {
    await this.sendCommand('M5');
  }

  /**
   * Upload and run G-code file
   */
  async runGCodeFile(file: GCodeFile): Promise<void> {
    const lines = file.content.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      if (line.trim() && !line.startsWith(';') && !line.startsWith('(')) {
        await this.sendCommand(line.trim());
        // Add small delay between commands
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
  }

  /**
   * Pause current job
   */
  async pauseJob(): Promise<void> {
    await this.sendCommand('!'); // Feed hold
  }

  /**
   * Resume current job
   */
  async resumeJob(): Promise<void> {
    await this.sendCommand('~'); // Cycle start
  }

  /**
   * Subscribe to status updates
   */
  onStatusUpdate(callback: (status: MachineStatus) => void): void {
    this.statusCallbacks.push(callback);
  }

  /**
   * Subscribe to alarm notifications
   */
  onAlarm(callback: (alarm: CNCAlarm) => void): void {
    this.alarmCallbacks.push(callback);
  }

  /**
   * Subscribe to job progress updates
   */
  onProgress(callback: (progress: JobProgress) => void): void {
    this.progressCallbacks.push(callback);
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'status':
          this.statusCallbacks.forEach(callback => callback(message.data));
          break;
        case 'alarm':
          this.alarmCallbacks.forEach(callback => callback(message.data));
          break;
        case 'progress':
          this.progressCallbacks.forEach(callback => callback(message.data));
          break;
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  /**
   * Start polling for status updates
   */
  private startStatusPolling(): void {
    const pollStatus = () => {
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        this.sendCommand('?'); // Status query
        setTimeout(pollStatus, 250); // Poll every 250ms
      }
    };
    pollStatus();
  }
}