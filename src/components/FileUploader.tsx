
import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';

interface FileUploaderProps {
    label: string;
    onFileSelect: (file: File) => void;
    accept?: string;
    currentPreview?: string;
    onClear?: () => void;
    mini?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
    label,
    onFileSelect,
    accept = "image/*",
    currentPreview,
    onClear,
    mini = false
}) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onFileSelect(e.target.files[0]);
        }
    };

    if (currentPreview) {
        return (
            <div className="relative group rounded-xl overflow-hidden border border-zinc-700 bg-zinc-900 aspect-square flex items-center justify-center">
                <img src={currentPreview} alt="Preview" className="w-full h-full object-contain" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                        onClick={onClear}
                        className="p-2 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                {!mini && (
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 rounded text-xs text-white font-mono pointer-events-none">
                        {label}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            className={`relative w-full aspect-square rounded-xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center cursor-pointer group
        ${isDragging
                    ? 'border-[#c55b9f] bg-[#c55b9f]/10'
                    : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50'
                }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept={accept}
                onChange={handleChange}
            />
            <div className={`${mini ? 'p-2' : 'p-4'} text-center pointer-events-none`}>
                <div className={`mx-auto ${mini ? 'w-8 h-8' : 'w-12 h-12'} rounded-full flex items-center justify-center ${mini ? 'mb-1' : 'mb-3'} transition-colors
          ${isDragging ? 'bg-[#c55b9f] text-white' : 'bg-zinc-800 text-zinc-400 group-hover:text-zinc-300'}`}>
                    <Upload size={mini ? 14 : 20} />
                </div>
                <p className={`${mini ? 'text-xs' : 'text-sm'} font-medium text-zinc-300 ${mini ? 'mb-0' : 'mb-1'}`}>{label}</p>
                {!mini && <p className="text-xs text-zinc-500">Ziehen & Ablegen oder Klicken</p>}
            </div>
        </div>
    );
};
