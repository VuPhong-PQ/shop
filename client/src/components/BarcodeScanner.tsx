import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, CameraOff, X, Flashlight, FlashlightOff } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function BarcodeScanner({ onScan, onClose, isOpen }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFlash, setHasFlash] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [lastScanTime, setLastScanTime] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize scanner
  useEffect(() => {
    if (isOpen) {
      initializeScanner();
    } else {
      stopScanning();
    }
    
    return () => {
      stopScanning();
    };
  }, [isOpen]);

  const initializeScanner = async () => {
    try {
      setError(null);
      
      // Request camera permissions
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "environment", // Prefer back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      // Get available cameras
      const videoDevices = await navigator.mediaDevices.enumerateDevices();
      const cameras = videoDevices.filter(device => device.kind === 'videoinput');
      setDevices(cameras);
      
      // Prefer back camera if available
      const backCamera = cameras.find(camera => 
        camera.label.toLowerCase().includes('back') || 
        camera.label.toLowerCase().includes('rear') ||
        camera.label.toLowerCase().includes('environment')
      );
      
      if (backCamera) {
        setSelectedDevice(backCamera.deviceId);
      } else if (cameras.length > 0) {
        setSelectedDevice(cameras[0].deviceId);
      }
      
      // Check for flash capability
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      setHasFlash(!!capabilities.torch);
      
      stream.getTracks().forEach(track => track.stop()); // Stop initial stream
      
      // Start scanning with selected device
      startScanning();
      
    } catch (err) {
      console.error('Camera initialization error:', err);
      setError('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập camera.');
    }
  };

  const startScanning = async () => {
    try {
      setIsScanning(true);
      setError(null);
      
      // Create code reader
      if (!codeReaderRef.current) {
        codeReaderRef.current = new BrowserMultiFormatReader();
      }
      
      const deviceId = selectedDevice || undefined;
      
      // Start decoding
      await codeReaderRef.current.decodeFromVideoDevice(
        deviceId,
        videoRef.current!,
        (result, error) => {
          if (result) {
            const now = Date.now();
            // Prevent duplicate scans within 2 seconds
            if (now - lastScanTime > 2000) {
              setLastScanTime(now);
              const code = result.getText();
              console.log('📷 Camera scanned barcode:', code);
              onScan(code);
              
              // Briefly pause scanning to prevent rapid duplicate scans
              setTimeout(() => {
                if (codeReaderRef.current && videoRef.current) {
                  // Continue scanning
                }
              }, 1000);
            }
          }
          
          if (error && !(error instanceof NotFoundException)) {
            console.error('Barcode scanning error:', error);
          }
        }
      );
      
    } catch (err) {
      console.error('Scanning error:', err);
      setError('Lỗi khi quét mã vạch. Vui lòng thử lại.');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setIsScanning(false);
    setFlashOn(false);
  };

  const toggleFlash = async () => {
    if (!hasFlash || !videoRef.current) return;
    
    try {
      const stream = videoRef.current.srcObject as MediaStream;
      if (stream) {
        const track = stream.getVideoTracks()[0];
        await track.applyConstraints({
          advanced: [{ torch: !flashOn }]
        });
        setFlashOn(!flashOn);
      }
    } catch (err) {
      console.error('Flash toggle error:', err);
    }
  };

  const switchCamera = async () => {
    if (devices.length <= 1) return;
    
    const currentIndex = devices.findIndex(d => d.deviceId === selectedDevice);
    const nextIndex = (currentIndex + 1) % devices.length;
    const nextDevice = devices[nextIndex];
    
    setSelectedDevice(nextDevice.deviceId);
    
    // Restart scanning with new device
    stopScanning();
    setTimeout(() => {
      startScanning();
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto bg-white">
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-2">
              <Camera className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-900">Quét mã vạch</span>
              {isScanning && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Đang quét...
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Camera View */}
          <div className="relative bg-black aspect-square">
            {error ? (
              <div className="absolute inset-0 flex items-center justify-center text-white text-center p-4">
                <div>
                  <CameraOff className="w-12 h-12 mx-auto mb-2 text-red-400" />
                  <p className="text-sm">{error}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={initializeScanner}
                  >
                    Thử lại
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                
                {/* Scanning overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-64 h-40 border-2 border-white border-dashed rounded-lg">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br-lg"></div>
                    
                    {/* Scanning line animation */}
                    <div className="absolute inset-x-0 top-1/2 h-0.5 bg-blue-400 animate-pulse"></div>
                  </div>
                </div>
                
                {/* Controls */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
                  {/* Flash toggle */}
                  {hasFlash && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={toggleFlash}
                      className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-white border-opacity-30"
                    >
                      {flashOn ? <FlashlightOff className="w-4 h-4" /> : <Flashlight className="w-4 h-4" />}
                    </Button>
                  )}
                  
                  {/* Camera switch */}
                  {devices.length > 1 && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={switchCamera}
                      className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-white border-opacity-30"
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Instructions */}
          <div className="p-4 text-center text-sm text-gray-600">
            <p>Đưa mã vạch vào khung hình để quét tự động</p>
            <p className="text-xs text-gray-500 mt-1">
              Hỗ trợ: Code 128, EAN, UPC, QR Code và nhiều định dạng khác
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}