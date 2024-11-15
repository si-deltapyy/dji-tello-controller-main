import { Injectable } from '@angular/core';

declare var chrome: any;
declare var Player: any;  // Broadway.js Playe
@Injectable({
  providedIn: 'root',
})
export class TelloService {
  private telloAddress = '192.168.10.1';
  private telloPort = 8889;
  private videoPort = 11111;
  private socketId: number | null = null;
  private videoSocketId: number | null = null;
  private player: any;
  private batteryStatusCallback: (status: number) => void = () => {};
  private accelerationCallback: (accel: {x: number, y: number, z: number}) => void = () => {};
  private lastResponseTime: number = 0;
  battery: number = 0;

  constructor() {
    document.addEventListener('deviceready', () => {
      this.createSocket();
      this.createVideoSocket();
      window.addEventListener('resize', this.updateCanvasSize.bind(this));
    }, false);
  }

  // Membuat socket untuk komunikasi kontrol drone
  createSocket() {
    if (chrome && chrome.sockets && chrome.sockets.udp) {
      chrome.sockets.udp.create({}, (socketInfo: any) => {
        this.socketId = socketInfo.socketId;
        console.log('Socket dibuat dengan ID:', this.socketId);
        this.bindSocket();
      });
    } else {
      console.error('Socket UDP tidak tersedia. Pastikan plugin terinstal.');
    }
  }

  bindSocket() {
    if (this.socketId !== null) {
      chrome.sockets.udp.bind(this.socketId, '0.0.0.0', 0, (result: any) => {
        if (result < 0) {
          console.error('Gagal bind socket:', chrome.runtime.lastError);
        } else {
          console.log('Socket berhasil di-bind ke port yang tersedia');
          this.startReceiving();
        }
      });
    }
  }

  // Membuat socket untuk video stream
  createVideoSocket() {
    if (chrome && chrome.sockets && chrome.sockets.udp) {
      chrome.sockets.udp.create({}, (socketInfo: any) => {
        this.videoSocketId = socketInfo.socketId;
        chrome.sockets.udp.bind(this.videoSocketId, '0.0.0.0', this.videoPort, (result: any) => {
          if (result < 0) {
            console.error('Gagal bind video socket:', chrome.runtime.lastError);
          } else {
            console.log('Socket video berhasil di-bind ke port:', this.videoPort);
            // Tunda inisialisasi player hingga video socket siap
            setTimeout(() => {
              this.initializePlayer();
              this.startReceivingVideo();
            }, 1000);
          }
        });
      });
    }
  }

  // Menginisialisasi Broadway.js player
  initializePlayer() {
    const canvas = document.getElementById('drone-video') as HTMLCanvasElement;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      this.player = new Player({
        useWorker: true,
        workerFile: '../../assets/js/Broadway/Player/Decoder.js',
        webgl: "auto",
        // wasm: '../../assets/js/Broadway/Decoder/js/avc.wasm',
        size: { width: canvas.width, height: canvas.height },
      });

      canvas.parentNode?.replaceChild(this.player.canvas, canvas);
    } else {
      console.error('Canvas video tidak ditemukan.');
    }
  }

  // Mulai menerima video stream
  startReceivingVideo() {
    if (this.videoSocketId !== null) {
      chrome.sockets.udp.onReceive.addListener((info: any) => {
        if (info.socketId === this.videoSocketId) {
          try {
            const dataArray = new Uint8Array(info.data);
            console.log('Data video diterima:', dataArray);

            if (this.player) {
              console.log('Mengirim data ke player');
              this.player.decode(dataArray);
            } else {
              console.error('Player tidak diinisialisasi.');
            }
          } catch (error) {
            console.error('Kesalahan saat memproses data video:', error);
          }
        }
      });

      this.sendCommand('streamon');
    }
  }

  startReceiving() {
    if (this.socketId !== null) {
      chrome.sockets.udp.onReceive.addListener((info: any) => {
        if (info.socketId === this.socketId) {
          try {
            const dataArray = new Uint8Array(info.data);
            const message = new TextDecoder().decode(dataArray);
            console.log('Pesan diterima:', message);

            // Cek apakah responsnya adalah akselerasi
            if (message.startsWith('acceleration')) {
              const accelerationData = message.trim();
              console.log('Data akselerasi:', accelerationData);
            } else if (typeof message === 'string') {
              // Penanganan respons lain, seperti status baterai
              const batteryLevel = parseInt(message.trim(), 10);
              if (!isNaN(batteryLevel)) {
                this.battery = batteryLevel;
                if (this.batteryStatusCallback) {
                  this.batteryStatusCallback(this.battery);
                }
                this.lastResponseTime = Date.now();
              }
            } else {
              console.error('Data yang diterima bukan string:', message);
            }
          } catch (error) {
            console.error('Kesalahan saat memproses data:', error);
          }
        }
      });
    }
  }

  sendCommand(command: string) {
    if (this.socketId !== null) {
      const data = new TextEncoder().encode(command);
      chrome.sockets.udp.send(this.socketId, data.buffer, this.telloAddress, this.telloPort, (sendInfo: any) => {
        if (sendInfo.resultCode < 0) {
          console.error('Pengiriman gagal:', chrome.runtime.lastError);
        } else {
          console.log('Perintah dikirim:', command);
        }
      });
    }
  }

  // Mendapatkan status baterai
  getBatteryStatus(callback: (status: number) => void) {
    this.batteryStatusCallback = callback;
    this.sendCommand('battery?');
  }

  getAcceleration() {
    this.sendCommand('acceleration?'); // Mengirim perintah untuk mendapatkan data akselerasi
  }

  // Memeriksa status koneksi drone
  checkConnectionStatus(): boolean {
    const currentTime = Date.now();
    return (currentTime - this.lastResponseTime) < 3000;
  }

  // Memulai streaming video
  startVideoStream() {
    this.sendCommand('streamon');
  }

  // Menghentikan streaming video
  stopVideoStream() {
    this.sendCommand('streamoff');
  }

  // Menyesuaikan ukuran canvas saat ukuran jendela berubah
  updateCanvasSize() {
    const canvas = document.getElementById('drone-video') as HTMLCanvasElement;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (this.player) {
        this.player.setSize(canvas.width, canvas.height);
      }
    }
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.updateCanvasSize.bind(this));
  }
}
