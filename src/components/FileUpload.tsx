import { useCallback } from 'react';
import { Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

export const FileUpload = ({ onFileSelect }: FileUploadProps) => {
  const { toast } = useToast();

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    
    if (file && file.type === 'text/csv') {
      onFileSelect(file);
    } else {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a CSV file',
        variant: 'destructive'
      });
    }
  }, [onFileSelect, toast]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="border-2 border-dashed border-border rounded-lg p-12 text-center bg-card hover:border-primary transition-colors cursor-pointer"
    >
      <input
        type="file"
        accept=".csv"
        onChange={handleFileInput}
        className="hidden"
        id="csv-upload"
      />
      <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
          <Upload className="w-8 h-8 text-accent-foreground" />
        </div>
        <div>
          <p className="text-lg font-semibold text-foreground mb-2">
            Drop your CSV file here or click to browse
          </p>
          <p className="text-sm text-muted-foreground">
            Supports CSV files with phone numbers and bundle data
          </p>
        </div>
      </label>
    </div>
  );
};
