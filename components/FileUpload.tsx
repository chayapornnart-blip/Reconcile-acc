import React from 'react';
import { UploadCloud } from 'lucide-react';

interface FileUploadProps {
  label: string;
  onChange: (file: File) => void;
  fileName?: string;
  colorClass?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ label, onChange, fileName, colorClass = "blue" }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onChange(e.target.files[0]);
    }
  };

  return (
    <div className={`flex flex-col gap-2 p-6 border-2 border-dashed rounded-xl transition-all ${fileName ? `border-${colorClass}-500 bg-${colorClass}-50` : 'border-slate-300 hover:border-slate-400 bg-white'}`}>
      <label className="flex flex-col items-center justify-center cursor-pointer gap-2">
        <div className={`p-3 rounded-full ${fileName ? `bg-${colorClass}-100 text-${colorClass}-600` : 'bg-slate-100 text-slate-500'}`}>
          <UploadCloud className="w-6 h-6" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-slate-700">{label}</p>
          <p className="text-sm text-slate-500 max-w-[200px] truncate">
            {fileName || "Click to upload CSV"}
          </p>
        </div>
        <input 
          type="file" 
          accept=".csv" 
          className="hidden" 
          onChange={handleFileChange} 
        />
      </label>
    </div>
  );
};