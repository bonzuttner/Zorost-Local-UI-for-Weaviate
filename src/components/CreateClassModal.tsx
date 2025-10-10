'use client';

import React, { useState, useEffect } from 'react';
import { 
  Upload, Settings, FileText, File, FileJson, X, 
  Sparkles, Brain, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

interface CreateClassModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface UploadedFile {
  file: File;
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  preview?: string;
}

export default function CreateClassModal({ open, onOpenChange, onSuccess }: CreateClassModalProps) {
  // Basic class info
  const [className, setClassName] = useState('');
  const [classDescription, setClassDescription] = useState('');
  
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
  const [vectorizer, setVectorizer] = useState('none');
  const [removeExistingChunks, setRemoveExistingChunks] = useState(false);
  
  // Processing state
  const [isCreating, setIsCreating] = useState(false);
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
        console.log('Loaded embedding config from localStorage:', config);
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

  const handleCreate = async () => {
    if (!className.trim()) {
      alert('Please enter a class name');
      return;
    }

    // Validate class name format (should start with capital letter)
    if (!/^[A-Z][a-zA-Z0-9]*$/.test(className)) {
      alert('Class name must be in PascalCase format (e.g., MyClass, Documents, Articles)\n\n• Start with a capital letter\n• Use only letters and numbers\n• No spaces or special characters');
      return;
    }

    setIsCreating(true);
    setProcessingProgress(0);

    try {
      // Step 1: Create the class
      setProcessingProgress(10);
      const createResponse = await fetch('/api/weaviate/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          className,
          description: classDescription,
          vectorizer: 'none', // Always use 'none' - embeddings are handled manually
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.error || errorData.details || 'Failed to create class');
      }

      const createData = await createResponse.json();
      console.log('Class created successfully:', createData);
      
      setProcessingProgress(30);

      // Step 2: Process and upload files if any
      if (uploadedFiles.length > 0) {
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

        setProcessingProgress(50);

        const uploadResponse = await fetch('/api/documents/process', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to process documents');
        }

        setProcessingProgress(90);
      }

      setProcessingProgress(100);
      
      // Reset and close
      setTimeout(() => {
        setClassName('');
        setClassDescription('');
        setUploadedFiles([]);
        setIsCreating(false);
        setProcessingProgress(0);
        onOpenChange(false);
        onSuccess();
      }, 500);
      
    } catch (error) {
      console.error('Error creating class:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to create class: ${errorMessage}\n\nPlease check:\n• Class name is valid (PascalCase)\n• Weaviate is running\n• No class with this name exists`);
      setIsCreating(false);
      setProcessingProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-primary" />
            Create New Class with Document Processing
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <div className="flex justify-center mb-4">
            <TabsList className="inline-flex h-auto p-1.5 gap-1">
              <TabsTrigger value="basic" className="text-sm py-2.5 px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="upload" className="text-sm py-2.5 px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Upload Data
              </TabsTrigger>
              <TabsTrigger value="embedding" className="text-sm py-2.5 px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Embedding & Chunking
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="className">Class Name *</Label>
              <Input
                id="className"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="e.g., Documents, Articles, KnowledgeBase"
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Use PascalCase (e.g., MyClass). This will be the collection name in your vector database.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="classDescription">Description</Label>
              <Textarea
                id="classDescription"
                value={classDescription}
                onChange={(e) => setClassDescription(e.target.value)}
                placeholder="Describe what type of data this class will contain..."
                className="text-sm min-h-[80px]"
              />
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 mt-0.5 text-primary" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-semibold mb-1">What you can do:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Upload documents (PDF, TXT, DOCX, CSV, JSON)</li>
                    <li>Configure embedding models (OpenAI, OpenRouter, Local)</li>
                    <li>Set chunking strategy and size</li>
                    <li>Process and vectorize data automatically</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Upload Data Tab */}
          <TabsContent value="upload" className="space-y-4 pt-4">
            <div className="space-y-2">
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
                onClick={() => document.getElementById('fileInput')?.click()}
              >
                <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium mb-1">
                  Drag & drop files here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports: PDF, TXT, DOCX, CSV, JSON, MD
                </p>
                <input
                  id="fileInput"
                  type="file"
                  multiple
                  accept=".pdf,.txt,.docx,.csv,.json,.md"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />
              </div>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Uploaded Files ({uploadedFiles.length})</Label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
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

            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-xs text-muted-foreground">
                <strong>Note:</strong> Documents will be processed, chunked, and embedded based on your
                configuration in the Embedding & Chunking tab. You can also append new documents to this
                class later from the Data Browser.
              </p>
            </div>
          </TabsContent>

          {/* Embedding & Chunking Tab */}
          <TabsContent value="embedding" className="space-y-4 pt-4">
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
                    <p className="text-xs text-muted-foreground">
                      {chunkingStrategy === 'fixed' && 'Split text into equal-sized chunks'}
                      {chunkingStrategy === 'recursive' && 'Smart splitting that respects sentence boundaries'}
                      {chunkingStrategy === 'semantic' && 'Split based on semantic meaning (slower but better)'}
                    </p>
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
                      <p className="text-xs text-muted-foreground">
                        Recommended: 300-800
                      </p>
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
                      <p className="text-xs text-muted-foreground">
                        Recommended: 10-20% of chunk size
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Advanced Settings */}
            <Separator />
            
            <div className="space-y-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full justify-between"
              >
                <span className="flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Advanced Settings
                </span>
                {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>

              {showAdvanced && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Remove Existing Chunks</Label>
                      <p className="text-xs text-muted-foreground">
                        Delete existing data before adding new documents
                      </p>
                    </div>
                    <Switch
                      checked={removeExistingChunks}
                      onCheckedChange={setRemoveExistingChunks}
                    />
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Processing Progress */}
        {isCreating && (
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
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!className.trim() || isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Class'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

