// API Keys Modal Component with Model Selection
// Developed by Zorost Intelligence

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExternalLink, Key, Brain, Zap, Loader2, RefreshCw } from 'lucide-react';

interface Model {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: any;
}

interface ApiKeysModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKeys: {
    openai: string;
    openrouter: string;
    cohere: string;
    huggingface: string;
    localLLM: string;
  };
  selectedModels?: {
    openai?: string;
    openrouter?: string;
    cohere?: string;
    huggingface?: string;
    localLLM?: string;
  };
  onSave: (keys: typeof apiKeys, models?: typeof selectedModels) => void;
}

export default function ApiKeysModal({ open, onOpenChange, apiKeys, selectedModels, onSave }: ApiKeysModalProps) {
  const [keys, setKeys] = useState(apiKeys);
  const [activeProvider, setActiveProvider] = useState<'openai' | 'openrouter' | 'cohere' | 'huggingface' | 'localLLM'>('openrouter');
  const [models, setModels] = useState<Model[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [selectedModelIds, setSelectedModelIds] = useState(selectedModels || {});
  const [localEndpoint, setLocalEndpoint] = useState('http://localhost:11434/api/generate');

  useEffect(() => {
    setKeys(apiKeys);
    setSelectedModelIds(selectedModels || {});
    
    // Load local LLM endpoint from localStorage
    const storedEndpoint = localStorage.getItem('localLLMEndpoint');
    if (storedEndpoint) {
      setLocalEndpoint(storedEndpoint);
    }
  }, [apiKeys, selectedModels]);

  // Fetch models when API key changes and is valid
  useEffect(() => {
    if (keys[activeProvider] && activeProvider !== 'localLLM') {
      fetchModels();
    } else if (activeProvider === 'localLLM') {
      // Load local models when endpoint changes
      fetchModels();
    }
  }, [activeProvider, localEndpoint]);

  const fetchModels = async () => {
    setLoadingModels(true);
    try {
      if (activeProvider === 'localLLM') {
        // Fetch local models
        const response = await fetch('/api/models/local', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            endpoint: localEndpoint,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setModels(data.models || []);
        } else {
          console.error('Failed to fetch local models');
          setModels([]);
        }
      } else {
        // Fetch remote models
        if (!keys[activeProvider]) {
          setModels([]);
          return;
        }

        const response = await fetch('/api/models', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: activeProvider,
            apiKey: keys[activeProvider],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setModels(data.models || []);
        } else {
          console.error('Failed to fetch models');
          setModels([]);
        }
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      setModels([]);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleSave = () => {
    // Save local LLM endpoint to localStorage
    if (localEndpoint && localEndpoint !== 'http://localhost:11434/api/generate') {
      localStorage.setItem('localLLMEndpoint', localEndpoint);
    }
    
    // Update keys with local endpoint
    const updatedKeys = { ...keys, localLLM: localEndpoint };
    
    onSave(updatedKeys, selectedModelIds);
    onOpenChange(false);
  };


  const providers = [
    {
      id: 'openrouter' as const,
      name: 'OpenRouter',
      description: 'Access 500+ models from 60+ providers with unified API',
      icon: <Zap className="h-4 w-4" />,
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      placeholder: 'sk-or-...',
      url: 'https://openrouter.ai/keys',
    },
    {
      id: 'openai' as const,
      name: 'OpenAI',
      description: 'GPT-3.5, GPT-4, and other OpenAI models',
      icon: <Brain className="h-4 w-4" />,
      color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      placeholder: 'sk-...',
      url: 'https://platform.openai.com/api-keys',
    },
    {
      id: 'cohere' as const,
      name: 'Cohere',
      description: 'Command, Embed, and other Cohere models',
      icon: <Zap className="h-4 w-4" />,
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      placeholder: 'cohere_...',
      url: 'https://dashboard.cohere.ai/api-keys',
    },
    {
      id: 'huggingface' as const,
      name: 'Hugging Face',
      description: 'Access to Hugging Face model hub',
      icon: <Key className="h-4 w-4" />,
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      placeholder: 'hf_...',
      url: 'https://huggingface.co/settings/tokens',
    },
    {
      id: 'localLLM' as const,
      name: 'Local LLM',
      description: 'Ollama, LM Studio, or other local models',
      icon: <Brain className="h-4 w-4" />,
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      placeholder: 'http://localhost:11434/api/generate',
      url: 'https://ollama.ai',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Key className="h-5 w-5" />
            <span>API Keys Configuration</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-sm text-muted-foreground">
            Configure your API keys to enable AI-powered chat with your vector database. 
            Keys are stored locally and never sent to external servers.
          </div>

          {/* Provider Tabs */}
          <div className="grid grid-cols-2 gap-2">
            {providers.map((provider) => (
              <button
                key={provider.id}
                onClick={() => setActiveProvider(provider.id)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  activeProvider === provider.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  {provider.icon}
                  <span className="font-medium text-sm">{provider.name}</span>
                  {keys[provider.id] && (
                    <Badge variant="secondary" className="text-xs">
                      Configured
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{provider.description}</p>
              </button>
            ))}
          </div>

          <Separator />

          {/* Active Provider Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {providers.find(p => p.id === activeProvider)?.icon}
                <span className="font-medium">
                  {providers.find(p => p.id === activeProvider)?.name} Configuration
                </span>
              </div>
              <a
                href={providers.find(p => p.id === activeProvider)?.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center space-x-1"
              >
                <span>Get API Key</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {activeProvider === 'localLLM' ? (
              <div className="space-y-2">
                <Label htmlFor="localLLM">Local LLM Endpoint</Label>
                <Input
                  id="localLLM"
                  value={localEndpoint}
                  onChange={(e) => setLocalEndpoint(e.target.value)}
                  placeholder="http://localhost:11434/api/generate"
                  className="font-mono text-[10px]"
                />
                <p className="text-[9px] text-muted-foreground">
                  URL endpoint for your local LLM service (Ollama, LM Studio, etc.)
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor={activeProvider}>API Key</Label>
                <Input
                  id={activeProvider}
                  type="password"
                  value={keys[activeProvider]}
                  onChange={(e) => setKeys({ ...keys, [activeProvider]: e.target.value })}
                  placeholder={providers.find(p => p.id === activeProvider)?.placeholder}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Your {providers.find(p => p.id === activeProvider)?.name} API key
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Model Selection Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Select Model</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchModels}
                disabled={loadingModels || (!keys[activeProvider] && activeProvider !== 'localLLM')}
                className="h-7 text-sm"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${loadingModels ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {!keys[activeProvider] && activeProvider !== 'localLLM' ? (
              <div className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                Please enter an API key first to load available models
              </div>
            ) : loadingModels ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">Loading models...</span>
              </div>
            ) : models.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                No models available. Check your API key or try refreshing.
              </div>
            ) : (
              <div className="space-y-3">
                {/* Model Dropdown */}
                <Select
                  value={selectedModelIds[activeProvider] || ''}
                  onValueChange={(value) => setSelectedModelIds({ ...selectedModelIds, [activeProvider]: value })}
                >
                  <SelectTrigger className="h-10 text-sm">
                    <SelectValue placeholder="Select a model...">
                      {selectedModelIds[activeProvider] && (
                        <span className="font-medium">{selectedModelIds[activeProvider]}</span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {models.map((model) => (
                      <SelectItem key={model.id} value={model.id} className="text-sm">
                        <div className="flex flex-col w-full">
                          <span className="font-medium text-sm">{model.name}</span>
                          {model.description && (
                            <span className="text-xs text-muted-foreground truncate">{model.description}</span>
                          )}
                          {model.context_length && (
                            <span className="text-xs text-muted-foreground/70">
                              Context: {model.context_length.toLocaleString()} tokens
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Selected Model Display */}
                {selectedModelIds[activeProvider] && (
                  <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    <strong>Selected:</strong> {selectedModelIds[activeProvider]}
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Footer */}
          <div className="flex justify-between items-center">
            <div className="text-xs text-muted-foreground">
              <p>Keys are stored locally in your browser</p>
              <p>Only used for AI chat functionality</p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Configuration
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
