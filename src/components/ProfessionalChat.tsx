// Professional Chat Interface Component
// Developed by Zorost Intelligence

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2, AlertCircle, CheckCircle2, Copy, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  sources?: Array<{
    id: string;
    score?: number;
    [key: string]: unknown;
  }>;
  metadata?: {
    model?: string;
    responseTime?: number;
    tokensUsed?: number;
  };
}

interface ProfessionalChatProps {
  className: string;
  onSendMessage: (message: string) => Promise<{
    answer: string;
    sources?: unknown[];
    metadata?: Record<string, unknown>;
  }>;
  isLoading?: boolean;
  placeholder?: string;
}

export default function ProfessionalChat({ 
  className, 
  onSendMessage, 
  isLoading: externalLoading = false,
  placeholder = "Ask a question about your data..."
}: ProfessionalChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Add welcome message
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'system',
        content: `Welcome to the AI Assistant. I can help you query and understand your vector database data in ${className}.`,
        timestamp: new Date(),
      }]);
    }
  }, [className, messages.length]);

  useEffect(() => {
    // Auto-scroll to bottom on new messages
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading || externalLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await onSendMessage(input.trim());
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer || 'No response generated.',
        timestamp: new Date(),
        sources: response.sources as Array<{ id: string; score?: number; [key: string]: unknown }>,
        metadata: response.metadata as { model?: string; responseTime?: number; tokensUsed?: number },
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError('Failed to get response. Please try again.');
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const clearChat = () => {
    setMessages([{
      id: 'welcome-' + Date.now(),
      role: 'system',
      content: `Chat cleared. Ready for new questions about ${className}.`,
      timestamp: new Date(),
    }]);
    setError(null);
  };

  const exportChat = () => {
    const chatData = messages.map(m => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp.toISOString(),
    }));
    
    const dataStr = JSON.stringify(chatData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat-${className}-${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="flex flex-col h-full border-muted/40 shadow-lg">
      <CardHeader className="pb-3 border-b bg-gradient-to-r from-background to-muted/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Assistant</CardTitle>
              <CardDescription className="text-xs mt-1">
                RAG-powered chat for <Badge variant="secondary" className="text-xs">{className}</Badge>
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearChat}
              className="h-8 w-8 p-0"
              title="Clear chat"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={exportChat}
              className="h-8 w-8 p-0"
              title="Export chat"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea ref={scrollAreaRef} className="flex-1 px-4 py-6">
          <div className="space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} max-w-[85%] gap-3`}
                >
                  {/* Avatar */}
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : message.role === 'system'
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>

                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : message.role === 'system'
                          ? 'bg-muted/50 text-muted-foreground border border-border'
                          : 'bg-secondary/50 text-secondary-foreground border border-border'
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {message.content}
                      </p>

                      {/* Metadata */}
                      {message.metadata && (
                        <div className="mt-3 pt-3 border-t border-current/10">
                          <div className="flex items-center gap-3 text-xs opacity-70">
                            {message.metadata.model && (
                              <span>Model: {message.metadata.model}</span>
                            )}
                            {message.metadata.responseTime && (
                              <span>Time: {message.metadata.responseTime}ms</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Sources */}
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-current/10">
                          <p className="text-xs font-medium mb-2 opacity-70">Sources ({message.sources.length}):</p>
                          <div className="space-y-1">
                            {message.sources.slice(0, 3).map((source, idx) => (
                              <div key={idx} className="text-xs opacity-60 flex items-center gap-2">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Object: {source.id?.toString().slice(0, 12)}...</span>
                                {source.score && <span>Score: {Number(source.score).toFixed(3)}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {message.role !== 'system' && (
                      <div className="flex items-center gap-2 mt-2 px-2">
                        <span className="text-xs text-muted-foreground">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => copyMessage(message.content)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {(isLoading || externalLoading) && (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[85%]">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-secondary text-secondary-foreground">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="rounded-2xl px-4 py-3 bg-secondary/50 border border-border">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Analyzing your data...</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex justify-center">
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <Separator />

        {/* Input Area */}
        <div className="p-4 bg-muted/30">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={placeholder}
              disabled={isLoading || externalLoading}
              className="flex-1 bg-background border-muted-foreground/20 focus-visible:ring-primary"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <Button
              type="submit"
              disabled={!input.trim() || isLoading || externalLoading}
              className="px-4"
            >
              {isLoading || externalLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Powered by Zorost Intelligence | Press Enter to send
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
