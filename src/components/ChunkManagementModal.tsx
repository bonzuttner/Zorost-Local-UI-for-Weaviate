'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, Trash2, Search, Filter, RefreshCw, 
  ChevronLeft, ChevronRight, Eye, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { DatabaseObject } from '@/types';

interface ChunkManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className: string;
  onUpdate: () => void;
}

export default function ChunkManagementModal({ 
  open, 
  onOpenChange, 
  className, 
  onUpdate 
}: ChunkManagementModalProps) {
  const [chunks, setChunks] = useState<DatabaseObject[]>([]);
  const [filteredChunks, setFilteredChunks] = useState<DatabaseObject[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChunk, setSelectedChunk] = useState<DatabaseObject | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const totalPages = Math.ceil(filteredChunks.length / pageSize);
  const paginatedChunks = filteredChunks.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    if (open && className) {
      fetchChunks();
    }
  }, [open, className]);

  useEffect(() => {
    // Filter chunks based on search query
    if (searchQuery.trim()) {
      const filtered = chunks.filter(chunk => {
        const content = chunk.properties?.content as string || '';
        const sourceFile = chunk.properties?.source_file as string || '';
        return (
          content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          sourceFile.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
      setFilteredChunks(filtered);
    } else {
      setFilteredChunks(chunks);
    }
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchQuery, chunks]);

  const fetchChunks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/weaviate/objects?className=${className}&limit=1000`);
      const data = await response.json();
      setChunks(data.objects || []);
      setFilteredChunks(data.objects || []);
    } catch (error) {
      console.error('Error fetching chunks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChunk = async (chunkId: string) => {
    if (!confirm('Are you sure you want to delete this chunk? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/weaviate/objects/${chunkId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setChunks(prev => prev.filter(c => c.id !== chunkId));
        onUpdate();
      } else {
        alert('Failed to delete chunk');
      }
    } catch (error) {
      console.error('Error deleting chunk:', error);
      alert('Error deleting chunk');
    }
  };

  const handleBulkDelete = async (sourceFile: string) => {
    if (!confirm(`Are you sure you want to delete all chunks from "${sourceFile}"? This action cannot be undone.`)) {
      return;
    }

    const chunksToDelete = chunks.filter(c => c.properties?.source_file === sourceFile);
    
    try {
      await Promise.all(
        chunksToDelete.map(chunk =>
          fetch(`/api/weaviate/objects/${chunk.id}`, { method: 'DELETE' })
        )
      );
      
      setChunks(prev => prev.filter(c => c.properties?.source_file !== sourceFile));
      onUpdate();
    } catch (error) {
      console.error('Error bulk deleting chunks:', error);
      alert('Error deleting chunks');
    }
  };

  const handleViewChunk = (chunk: DatabaseObject) => {
    setSelectedChunk(chunk);
    setShowViewModal(true);
  };

  // Group chunks by source file
  const chunksByFile = paginatedChunks.reduce((acc, chunk) => {
    const sourceFile = chunk.properties?.source_file as string || 'Unknown';
    if (!acc[sourceFile]) {
      acc[sourceFile] = [];
    }
    acc[sourceFile].push(chunk);
    return acc;
  }, {} as Record<string, DatabaseObject[]>);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center">
              <FileText className="h-5 w-5 mr-2 text-primary" />
              Manage Chunks - "{className}"
            </DialogTitle>
          </DialogHeader>

          {/* Search and Stats */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chunks by content or source file..."
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchChunks}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <Badge variant="secondary">
                  Total: {filteredChunks.length} chunks
                </Badge>
                <Badge variant="secondary">
                  Files: {Object.keys(chunksByFile).length}
                </Badge>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Chunks List */}
          <ScrollArea className="flex-1 pr-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading chunks...
              </div>
            ) : filteredChunks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No chunks found
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(chunksByFile).map(([sourceFile, fileChunks]) => (
                  <div key={sourceFile} className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold">{sourceFile}</span>
                        <Badge variant="outline" className="text-xs">
                          {fileChunks.length} chunks
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleBulkDelete(sourceFile)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>

                    <div className="space-y-2 pl-4">
                      {fileChunks.map((chunk) => {
                        const content = chunk.properties?.content as string || '';
                        const chunkIndex = chunk.properties?.chunk_index as number || 0;
                        const chunkTotal = chunk.properties?.chunk_total as number || 0;
                        
                        return (
                          <div
                            key={chunk.id}
                            className="flex items-start justify-between p-3 bg-card border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center space-x-2">
                                <Badge variant="secondary" className="text-xs">
                                  Chunk {chunkIndex + 1}/{chunkTotal}
                                </Badge>
                                {chunk.properties?.chunk_strategy && (
                                  <Badge variant="outline" className="text-xs">
                                    {chunk.properties.chunk_strategy}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {content.substring(0, 200)}
                                {content.length > 200 && '...'}
                              </p>
                              {chunk.properties?.uploaded_at && (
                                <p className="text-xs text-muted-foreground">
                                  Uploaded: {new Date(chunk.properties.uploaded_at as string).toLocaleString()}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center space-x-1 ml-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewChunk(chunk)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteChunk(chunk.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          <div className="flex justify-end pt-4">
            <Button onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Chunk Detail Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Chunk Details</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowViewModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {selectedChunk && (
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-4">
                {/* Metadata */}
                <div className="grid grid-cols-2 gap-3 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <Label className="text-xs text-muted-foreground">Source File</Label>
                    <p className="text-sm font-medium">
                      {selectedChunk.properties?.source_file as string || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Chunk Position</Label>
                    <p className="text-sm font-medium">
                      {(selectedChunk.properties?.chunk_index as number || 0) + 1} of {selectedChunk.properties?.chunk_total || 0}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Strategy</Label>
                    <p className="text-sm font-medium capitalize">
                      {selectedChunk.properties?.chunk_strategy as string || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Uploaded</Label>
                    <p className="text-sm font-medium">
                      {selectedChunk.properties?.uploaded_at 
                        ? new Date(selectedChunk.properties.uploaded_at as string).toLocaleString()
                        : 'Unknown'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">ID</Label>
                    <p className="text-xs font-mono break-all">{selectedChunk.id}</p>
                  </div>
                </div>

                <Separator />

                {/* Content */}
                <div className="space-y-2">
                  <Label>Content</Label>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">
                      {selectedChunk.properties?.content as string || 'No content'}
                    </p>
                  </div>
                </div>

                {/* Delete Button */}
                <div className="flex justify-end">
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleDeleteChunk(selectedChunk.id);
                      setShowViewModal(false);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete This Chunk
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

