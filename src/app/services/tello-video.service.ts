import { Injectable } from '@angular/core';
import * as dgram from 'dgram';  // For UDP communication

@Injectable({
  providedIn: 'root'
})
export class TelloVideoService {
  private socket: any;
  private videoPort = 11111;  // Default Tello video stream port
  private videoIp = '192.168.10.1';  // Default Tello IP for video stream
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    this.socket = dgram.createSocket('udp4');
  }

  // Start receiving video stream
  startStream() {
    this.socket.bind(this.videoPort, () => {
      console.log('Listening for video stream on port ' + this.videoPort);
    });

    this.socket.on('message', (msg: Buffer) => {
      // The video stream is encoded in H.264, so you'll need to decode the video frames
      // Example: Using ffmpeg.js or WebRTC to process video frames (see next step)
      this.processVideoFrame(msg);
    });
  }

  // Process and render the video frames to a canvas
  processVideoFrame(frameData: Buffer) {
    // Here you would decode the video frame (e.g., with ffmpeg.js or WebRTC) and draw it on a canvas.
    // This step is complex and depends on your preferred method of decoding video.
    // In this example, we just log the data length.
    console.log('Received frame of size: ' + frameData.length);

    // Assuming you have decoded the frame into an image:
    let img = new Image();
    img.onload = () => {
      this.ctx.drawImage(img, 0, 0);
    };
    img.src = URL.createObjectURL(new Blob([frameData], { type: 'image/jpeg' }));
  }

  // Stop the video stream
  stopStream() {
    this.socket.close();
  }

  // Set up video display on the page
  getVideoElement() {
    return this.canvas;
  }
}
