import React, { useState, useRef } from 'react';
import { Camera, MapPin, CheckCircle, RefreshCw } from 'lucide-react';

export default function LiveGeoCamera({ onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [coords, setCoords] = useState(null);
  const [geoError, setGeoError] = useState('');

  // Get current device GPS coordinates
  const getCoordinates = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude.toFixed(6),
            lng: position.coords.longitude.toFixed(6)
          });
        },
        (err) => {
          setGeoError("GPS permission denied or unavailable");
        },
        { enableHighAccuracy: true }
      );
    } else {
      setGeoError("Geolocation not supported by this browser");
    }
  };

  // Turn on live camera stream
  const startCamera = async () => {
    getCoordinates();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      alert("Unable to access camera: " + err.message);
    }
  };

  // Capture frame & draw GPS watermark onto image
  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    // Draw current camera frame
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Overlay black metadata bar at bottom of photo
    context.fillStyle = "rgba(15, 23, 42, 0.85)";
    context.fillRect(10, canvas.height - 50, canvas.width - 20, 40);

    // Overlay GPS text watermark
    const timeStamp = new Date().toLocaleString();
    const gpsText = coords ? `LAT: ${coords.lat} | LNG: ${coords.lng}` : "GPS UNAVAILABLE";

    context.font = "bold 13px monospace";
    context.fillStyle = "#10B981"; // Emerald text
    context.fillText(`${gpsText} • ${timeStamp}`, 20, canvas.height - 25);

    // Convert frame to Base64 image URL
    const imageDataUrl = canvas.toDataURL('image/jpeg');

    // Stop active camera track
    const stream = video.srcObject;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCameraActive(false);

    // Send photo and location data back to parent dashboard
    if (onCapture) {
      onCapture({
        image: imageDataUrl,
        latitude: coords?.lat || null,
        longitude: coords?.lng || null,
        timestamp: new Date().toISOString()
      });
    }
  };

  return (
    <div className="space-y-4">
      {!isCameraActive ? (
        <button
          type="button"
          onClick={startCamera}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition shadow-lg"
        >
          <Camera className="w-5 h-5" />
          <span>Open Live Geotag Camera</span>
        </button>
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-64 object-cover"
            />
            
            {/* Live GPS badge overlay */}
            <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700 flex items-center gap-2 text-xs font-mono text-emerald-400">
              <MapPin className="w-3.5 h-3.5" />
              <span>{coords ? `${coords.lat}, ${coords.lng}` : (geoError || "Acquiring GPS Signal...")}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={capturePhoto}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Capture & Watermark Photo</span>
          </button>
        </div>
      )}

      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}