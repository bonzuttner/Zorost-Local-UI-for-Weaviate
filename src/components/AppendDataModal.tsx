'use client';

import React, { useState, useEffect } from 'react';
import { 
  Upload, Settings, FileText, File, FileJson, X, 
  Sparkles, Brain, ChevronDown, ChevronUp, AlertCircle, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

interface AppendDataModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className: string;
  onSuccess: () => void;
}

interface UploadedFile {
  file: File;
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

export default function AppendDataModal({ open, onOpenChange, className, onSuccess }: AppendDataModalProps) {
  // File upload
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  // Embedding configuration
  const [embeddingProvider, setEmbeddingProvider] = useState<'openai' | 'openrouter' | 'local' | 'none'>('none');
  const [embeddingModel, setEmbeddingModel] = useState('');
  const [embeddingApiKey, setEmbeddingApiKey] = useState('');
  const [embeddingEndpoint, setEmbeddingEndpoint] = useState('http://localhost:11434/api/embeddings');
  
  // Model options for different providers
  const modelOptions = {
    openai: [
      { value: 'text-embedding-3-small', label: 'text-embedding-3-small (Recommended)' },
      { value: 'text-embedding-3-large', label: 'text-embedding-3-large' },
      { value: 'text-embedding-ada-002', label: 'text-embedding-ada-002' },
    ],
    openrouter: [
      { value: 'openai/text-embedding-3-small', label: 'OpenAI text-embedding-3-small' },
      { value: 'openai/text-embedding-3-large', label: 'OpenAI text-embedding-3-large' },
      { value: 'openai/text-embedding-ada-002', label: 'OpenAI text-embedding-ada-002' },
    ],
    local: [
      { value: 'nomic-embed-text', label: 'nomic-embed-text (Recommended)' },
      { value: 'mxbai-embed-large', label: 'mxbai-embed-large' },
      { value: 'all-minilm', label: 'all-minilm' },
      { value: 'custom', label: 'Custom Model' },
    ],
  };
  
  // Chunking configuration
  const [enableChunking, setEnableChunking] = useState(true);
  const [chunkSize, setChunkSize] = useState(500);
  const [chunkOverlap, setChunkOverlap] = useState(50);
  const [chunkingStrategy, setChunkingStrategy] = useState<'fixed' | 'semantic' | 'recursive'>('recursive');
  
  // Advanced settings
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  // Load saved embedding configuration from localStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('weaviate-embedding-config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        if (config.provider) setEmbeddingProvider(config.provider);
        if (config.model) setEmbeddingModel(config.model);
        if (config.apiKey) setEmbeddingApiKey(config.apiKey);
        if (config.endpoint) setEmbeddingEndpoint(config.endpoint);
        if (config.chunkSize !== undefined) setChunkSize(config.chunkSize);
        if (config.chunkOverlap !== undefined) setChunkOverlap(config.chunkOverlap);
        if (config.chunkingStrategy) setChunkingStrategy(config.chunkingStrategy);
        if (config.enableChunking !== undefined) setEnableChunking(config.enableChunking);
        console.log('Loaded embedding config in AppendDataModal:', config);
      } catch (error) {
        console.error('Error loading embedding config:', error);
      }
    }
  }, []);

  // Save embedding configuration to localStorage whenever it changes
  useEffect(() => {
    const config = {
      provider: embeddingProvider,
      model: embeddingModel,
      apiKey: embeddingApiKey,
      endpoint: embeddingEndpoint,
      chunkSize,
      chunkOverlap,
      chunkingStrategy,
      enableChunking,
    };
    localStorage.setItem('weaviate-embedding-config', JSON.stringify(config));
  }, [embeddingProvider, embeddingModel, embeddingApiKey, embeddingEndpoint, chunkSize, chunkOverlap, chunkingStrategy, enableChunking]);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const newFiles: UploadedFile[] = Array.from(files).map(file => ({
      file,
      id: `${file.name}-${Date.now()}`,
      status: 'pending' as const,
    }));
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

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
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      case 'json':
        return <FileJson className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const handleAppend = async () => {
    if (uploadedFiles.length === 0) {
      alert('Please upload at least one file');
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      const formData = new FormData();
      formData.append('className', className);
      formData.append('embeddingProvider', embeddingProvider);
      formData.append('embeddingModel', embeddingModel);
      formData.append('embeddingApiKey', embeddingApiKey);
      formData.append('embeddingEndpoint', embeddingEndpoint);
      formData.append('enableChunking', enableChunking.toString());
      formData.append('chunkSize', chunkSize.toString());
      formData.append('chunkOverlap', chunkOverlap.toString());
      formData.append('chunkingStrategy', chunkingStrategy);
      
      uploadedFiles.forEach(({ file }) => {
        formData.append('files', file);
      });

      setProcessingProgress(30);

      const response = await fetch('/api/documents/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process documents');
      }

      setProcessingProgress(100);
      
      // Reset and close
      setTimeout(() => {
        setUploadedFiles([]);
        setIsProcessing(false);
        setProcessingProgress(0);
        onOpenChange(false);
        onSuccess();
      }, 500);
      
    } catch (error) {
      console.error('Error appending data:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center">
            <Plus className="h-5 w-5 mr-2 text-primary" />
            Append Data to "{className}"
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload Section */}
          <div className="space-y-3">
            <Label>Upload Documents</Label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                transition-colors duration-200
                ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
              `}
              onClick={() => document.getElementById('appendFileInput')?.click()}
            >
              <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">
                Drag & drop files here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Supports: PDF, TXT, DOCX, CSV, JSON, MD
              </p>
              <input
                id="appendFileInput"
                type="file"
                multiple
                accept=".pdf,.txt,.docx,.csv,.json,.md"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
            </div>

            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Uploaded Files ({uploadedFiles.length})</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {uploadedFiles.map((uploadedFile) => (
                    <div
                      key={uploadedFile.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        {getFileIcon(uploadedFile.file.name)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {uploadedFile.file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(uploadedFile.file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(uploadedFile.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Embedding Configuration */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Brain className="h-4 w-4 text-primary" />
              <Label className="text-base font-semibold">Embedding Configuration</Label>
            </div>

            <div className="space-y-2">
              <Label>Embedding Provider</Label>
              <Select value={embeddingProvider} onValueChange={(v: any) => setEmbeddingProvider(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (No embedding)</SelectItem>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="openrouter">OpenRouter</SelectItem>
                  <SelectItem value="local">Local LLM</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {embeddingProvider !== 'none' && (
              <>
                <div className="space-y-2">
                  <Label>Embedding Model</Label>
                  <Select 
                    value={embeddingModel} 
                    onValueChange={setEmbeddingModel}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select embedding model..." />
                    </SelectTrigger>
                    <SelectContent>
                      {embeddingProvider === 'openai' && modelOptions.openai.map(model => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                      {embeddingProvider === 'openrouter' && modelOptions.openrouter.map(model => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                      {embeddingProvider === 'local' && modelOptions.local.map(model => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {embeddingProvider === 'openai' && 'OpenAI embedding models for high-quality vectors'}
                    {embeddingProvider === 'openrouter' && 'Access OpenAI models through OpenRouter'}
                    {embeddingProvider === 'local' && 'Use locally-hosted embedding models (Ollama)'}
                  </p>
                </div>

                {embeddingModel === 'custom' && embeddingProvider === 'local' && (
                  <div className="space-y-2">
                    <Label>Custom Model Name</Label>
                    <Input
                      placeholder="Enter custom model name..."
                      className="text-sm"
                      onChange={(e) => setEmbeddingModel(e.target.value)}
                    />
                  </div>
                )}

                {embeddingProvider !== 'local' && (
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <Input
                      type="password"
                      value={embeddingApiKey}
                      onChange={(e) => setEmbeddingApiKey(e.target.value)}
                      placeholder="Enter API key..."
                      className="text-sm font-mono"
                    />
                  </div>
                )}

                {embeddingProvider === 'local' && (
                  <div className="space-y-2">
                    <Label>Local Endpoint</Label>
                    <Input
                      value={embeddingEndpoint}
                      onChange={(e) => setEmbeddingEndpoint(e.target.value)}
                      placeholder="http://localhost:11434/api/embeddings"
                      className="text-sm font-mono"
                    />
                    <p className="text-xs text-muted-foreground">
                      Ollama default endpoint. Change if using a different port or service.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <Separator />

          {/* Chunking Configuration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Settings className="h-4 w-4 text-primary" />
                <Label className="text-base font-semibold">Chunking Configuration</Label>
              </div>
              <Switch
                checked={enableChunking}
                onCheckedChange={setEnableChunking}
              />
            </div>

            {enableChunking && (
              <>
                <div className="space-y-2">
                  <Label>Chunking Strategy</Label>
                  <Select value={chunkingStrategy} onValueChange={(v: any) => setChunkingStrategy(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed Size</SelectItem>
                      <SelectItem value="recursive">Recursive (Recommended)</SelectItem>
                      <SelectItem value="semantic">Semantic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Chunk Size (tokens)</Label>
                    <Input
                      type="number"
                      value={chunkSize}
                      onChange={(e) => setChunkSize(Number(e.target.value))}
                      min="100"
                      max="2000"
                      step="50"
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Overlap (tokens)</Label>
                    <Input
                      type="number"
                      value={chunkOverlap}
                      onChange={(e) => setChunkOverlap(Number(e.target.value))}
                      min="0"
                      max="500"
                      step="10"
                      className="text-sm"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Processing Progress */}
        {isProcessing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Processing...</span>
              <span className="font-medium">{processingProgress}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${processingProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-end space-x-2 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAppend}
            disabled={uploadedFiles.length === 0 || isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Append Data'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

