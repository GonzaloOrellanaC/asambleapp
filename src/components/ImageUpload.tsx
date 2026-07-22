import React, { useCallback, useState } from 'react';
import imageCompression from 'browser-image-compression';
import { ImageCropper } from './ImageCropper';
import { Camera, UploadCloud } from 'lucide-react';

interface ImageUploadProps {
  currentImageUrl: string;
  onImageUploaded: (url: string) => void;
  className?: string;
  isProfile?: boolean;
  maxWidthOrHeight?: number;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ currentImageUrl, onImageUploaded, className, isProfile = false, maxWidthOrHeight = 1024 }) => {
  const [dragActive, setDragActive] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageToCrop(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      alert("Solo se permiten imágenes PNG o JPEG.");
    }
  };

  const handleCropComplete = async (croppedFile: File) => {
    setImageToCrop(null);
    setIsUploading(true);
    try {
      // Compress the image
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: maxWidthOrHeight,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(croppedFile, options);

      // Upload to server
      const formData = new FormData();
      formData.append('image', compressedFile, 'image.jpg');

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al subir la imagen');
      }

      const data = await response.json();
      if (data.success) {
        onImageUploaded(data.url);
      } else {
        throw new Error(data.error || 'Error al subir la imagen');
      }
    } catch (e) {
      console.error(e);
      alert('Hubo un error al procesar la imagen.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <div 
        className={`relative group cursor-pointer ${className}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className={`w-full h-full relative overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-700 transition-all ${dragActive ? 'border-2 border-blue-500 bg-blue-50 dark:bg-slate-600' : ''}`}>
          {currentImageUrl ? (
            <img src={currentImageUrl} alt="Upload" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center text-slate-400">
              {isProfile ? <User size={48} /> : <UploadCloud size={48} />}
            </div>
          )}
          
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
             <Camera className="text-white mb-2" size={24} />
             <span className="text-white text-xs font-bold text-center px-2">{isUploading ? 'Subiendo...' : 'Arrastra o haz click'}</span>
          </div>
        </div>
        <input 
          type="file" 
          accept="image/jpeg, image/png" 
          onChange={handleChange} 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
          disabled={isUploading}
        />
      </div>

      {imageToCrop && (
        <ImageCropper 
          imageSrc={imageToCrop} 
          onCropComplete={handleCropComplete} 
          onCancel={() => setImageToCrop(null)} 
        />
      )}
    </>
  );
};

// Add missing icon
const User = ({ size = 24 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);
