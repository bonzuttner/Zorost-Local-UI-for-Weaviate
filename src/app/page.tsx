'use client';

import React, { useState, useEffect } from 'react';
import { 
  Database, Search, Settings, RotateCcw, BarChart3, 
  Trash2, Eye, MoreHorizontal, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, Maximize2, Server,
  Sun, Moon, Monitor,
  Plus, MessageSquare, Send, Bot, User as UserIcon,
  Edit, Download, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import ApiKeysModal from '@/components/ApiKeysModal';
import CreateClassModal from '@/components/CreateClassModal';
import AppendDataModal from '@/components/AppendDataModal';
import ChunkManagementModal from '@/components/ChunkManagementModal';
import type { DatabaseClass, DatabaseObject, DatabaseStats, ChatMessage } from '@/types';

export default function Home() {
  // State management
  const [classes, setClasses] = useState<DatabaseClass[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('');
  const [objects, setObjects] = useState<DatabaseObject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingObject, setViewingObject] = useState<DatabaseObject | null>(null);
  const [selectedObjects, setSelectedObjects] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 20,
    totalItems: 0
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [theme, setTheme] = useState('system');
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassDescription, setNewClassDescription] = useState('');
  
  // Class management states
  const [showEditClassModal, setShowEditClassModal] = useState(false);
  const [editingClass, setEditingClass] = useState<DatabaseClass | null>(null);
  const [editClassName, setEditClassName] = useState('');
  const [editClassDescription, setEditClassDescription] = useState('');
  
  // Append data and chunk management
  const [showAppendDataModal, setShowAppendDataModal] = useState(false);
  const [showChunkManagementModal, setShowChunkManagementModal] = useState(false);
  const [selectedClassForAppend, setSelectedClassForAppend] = useState('');
  
  // Chat states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [selectedChatClass, setSelectedChatClass] = useState('');
  const [showApiKeysModal, setShowApiKeysModal] = useState(false);
  const [apiKeys, setApiKeys] = useState({
    openai: '',
    openrouter: '',
    cohere: '',
    huggingface: '',
    localLLM: ''
  });
  const [selectedModels, setSelectedModels] = useState({
    openai: 'gpt-4-turbo-preview',
    openrouter: 'anthropic/claude-3.7-sonnet',
    cohere: 'command-r-plus',
    huggingface: 'meta-llama/Llama-2-70b-chat-hf',
    localLLM: 'llama2'
  });

  useEffect(() => {
    checkConnection();
    fetchClasses();
    fetchStats();
    
    const savedTheme = localStorage.getItem('weaviate-app-theme') || 'system';
    setTheme(savedTheme);
    applyTheme(savedTheme);

    // Load saved API keys and selected models
    const savedKeys = localStorage.getItem('weaviate-app-api-keys');
    if (savedKeys) {
      try {
        setApiKeys(JSON.parse(savedKeys));
      } catch (error) {
        console.error('Error loading API keys:', error);
      }
    }

    const savedModels = localStorage.getItem('weaviate-app-selected-models');
    if (savedModels) {
      try {
        setSelectedModels(JSON.parse(savedModels));
      } catch (error) {
        console.error('Error loading selected models:', error);
      }
    }
  }, []);

  const applyTheme = (newTheme: string) => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(newTheme);
    }
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('weaviate-app-theme', newTheme);
    applyTheme(newTheme);
  };

  const checkConnection = async () => {
    try {
      const response = await fetch('/api/weaviate/status');
      const data = await response.json();
      setIsConnected(data.connected);
    } catch {
      setIsConnected(false);
    }
  };

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/weaviate/classes');
      const data = await response.json();
      setClasses(data.classes || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/weaviate/stats');
      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchObjects = async (className: string, page: number = 1) => {
    try {
      const offset = (page - 1) * pagination.pageSize;
      const response = await fetch(`/api/weaviate/objects/${className}?limit=${pagination.pageSize}&offset=${offset}`);
      const data = await response.json();
      
      setObjects(data.objects || []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching objects:', error);
      setObjects([]);
    }
  };

  const handleClassSelect = (className: string) => {
    setSelectedClass(className);
    setSelectedObjects(new Set());
    setSearchQuery('');
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    fetchObjects(className, 1);
  };

  const handlePageChange = (newPage: number) => {
    if (selectedClass && newPage >= 1 && newPage <= pagination.totalPages) {
      fetchObjects(selectedClass, newPage);
    }
  };

  const handleSearch = async () => {
    if (!selectedClass || !searchQuery.trim()) {
      fetchObjects(selectedClass, 1);
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await fetch('/api/weaviate/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          className: selectedClass,
          query: searchQuery,
          limit: 50
        })
      });
      const data = await response.json();
      setObjects(data.results || []);
      
      setPagination(prev => ({
        ...prev,
        currentPage: 1,
        totalPages: 1,
        totalItems: data.results?.length || 0
      }));
    } catch (error) {
      console.error('Error searching objects:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateClass = async () => {
    if (!newClassName.trim()) {
      alert('Please enter a class name');
      return;
    }
    
    try {
      const response = await fetch('/api/weaviate/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          className: newClassName,
          description: newClassDescription,
          properties: [],
          vectorizer: 'none'
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setShowCreateClassModal(false);
        setNewClassName('');
        setNewClassDescription('');
        await fetchClasses();
        await fetchStats();
        alert(`Class "${newClassName}" created successfully!`);
      } else {
        alert(`Error creating class: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating class:', error);
      alert(`Error creating class: ${error}`);
    }
  };

  const handleDeleteClass = async (className: string) => {
    try {
      const response = await fetch(`/api/weaviate/classes/${className}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchClasses();
        fetchStats();
        if (selectedClass === className) {
          setSelectedClass('');
          setObjects([]);
        }
      }
    } catch (error) {
      console.error('Error deleting class:', error);
    }
  };

  const handleEditClass = (cls: DatabaseClass) => {
    setEditingClass(cls);
    setEditClassName(cls.class);
    setEditClassDescription(cls.description || '');
    setShowEditClassModal(true);
  };

  // Note: handleUpdateClass removed as Weaviate doesn't support updating class metadata

  const handleExportJSON = async (className: string) => {
    try {
      const response = await fetch(`/api/weaviate/export/${className}?format=json`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${className}_export.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting JSON:', error);
    }
  };

  const handleExportCSV = async (className: string) => {
    try {
      const response = await fetch(`/api/weaviate/export/${className}?format=csv`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${className}_export.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  const handleDeleteObject = async (objectId: string) => {
    if (!selectedClass) return;
    
    try {
      const response = await fetch(`/api/weaviate/objects/${selectedClass}/${objectId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchObjects(selectedClass);
        fetchStats();
      }
    } catch (error) {
      console.error('Error deleting object:', error);
    }
  };

  const handleViewObject = (obj: DatabaseObject) => {
    setViewingObject(obj);
    setShowViewModal(true);
  };

  const toggleObjectSelection = (objectId: string) => {
    const newSelection = new Set(selectedObjects);
    if (newSelection.has(objectId)) {
      newSelection.delete(objectId);
    } else {
      newSelection.add(objectId);
    }
    setSelectedObjects(newSelection);
  };

  const formatObjectProperties = (properties: Record<string, unknown>) => {
    if (!properties) return 'No properties';
    
    return Object.entries(properties)
      .map(([key, value]) => {
        const valueStr = typeof value === 'string' && value.length > 100
          ? `"${value.substring(0, 100)}..."`
          : JSON.stringify(value);
        return `${key}: ${valueStr}`;
      })
      .join('\n') || 'Empty object';
  };

  const handleApiKeysSave = (keys: typeof apiKeys, models?: typeof selectedModels) => {
    setApiKeys(keys);
    localStorage.setItem('weaviate-app-api-keys', JSON.stringify(keys));
    
    if (models) {
      setSelectedModels(models);
      localStorage.setItem('weaviate-app-selected-models', JSON.stringify(models));
    }
  };

  const handleChatSubmit = async () => {
    if (!chatInput.trim() || !selectedChatClass) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
      timestamp: new Date(),
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);
    
    try {
      // Determine which LLM provider to use
      const llmProvider = apiKeys.openrouter ? 'openrouter' : (apiKeys.openai ? 'openai' : (apiKeys.localLLM ? 'local' : 'context-only'));
      
      // Get the selected model for the provider
      const selectedModel = selectedModels[llmProvider as keyof typeof selectedModels] || undefined;
      
      // For local LLM, we need to get the endpoint from localStorage
      let apiKeysWithEndpoint = { ...apiKeys };
      if (llmProvider === 'local' && typeof window !== 'undefined') {
        const storedEndpoint = localStorage.getItem('localLLMEndpoint');
        if (storedEndpoint) {
          apiKeysWithEndpoint.localLLM = storedEndpoint;
        }
      }
      
      const response = await fetch('/api/chat/enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: chatInput,
          className: selectedChatClass,
          limit: 5,
          apiKeys: apiKeysWithEndpoint,
          llmProvider,
          selectedModel,
        })
      });
      
      const data = await response.json();
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer || 'Sorry, I could not generate an answer.',
        timestamp: new Date(),
        sources: data.sources,
        metadata: data.metadata
      };
      
      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, there was an error processing your request.',
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4">
              {/* Weaviate Logo */}
              <svg className="h-10 w-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Hexagonal outline */}
                <path 
                  d="M50 5 L85 27.5 L85 72.5 L50 95 L15 72.5 L15 27.5 Z" 
                  stroke="currentColor" 
                  strokeWidth="8" 
                  fill="none"
                  className="text-[#3d5a80] dark:text-[#5a7ca8]"
                />
                {/* W shape inside */}
                <path 
                  d="M30 35 L38 65 L45 45 L50 55 L55 45 L62 65 L70 35" 
                  stroke="currentColor" 
                  strokeWidth="6" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  fill="none"
                  className="text-[#3d5a80] dark:text-[#5a7ca8]"
                />
              </svg>
              <div className="space-y-1">
                <h1 className="text-xl font-bold">Zorost Local UI for Weaviate</h1>
                <a 
                  href="https://zorost.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  Developed by Zorost Intelligence
                </a>
              </div>
            </div>
            <div className={`flex items-center space-x-3 px-4 py-2 rounded-full text-sm font-medium ${
              isConnected 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={() => { fetchStats(); fetchClasses(); }} variant="ghost" size="sm">
              <RotateCcw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div>
                    <Label className="text-sm font-medium">Theme</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <Button
                        variant={theme === 'light' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleThemeChange('light')}
                        className="flex items-center space-x-2"
                      >
                        <Sun className="h-4 w-4" />
                        <span>Light</span>
                      </Button>
                      <Button
                        variant={theme === 'dark' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleThemeChange('dark')}
                        className="flex items-center space-x-2"
                      >
                        <Moon className="h-4 w-4" />
                        <span>Dark</span>
                      </Button>
                      <Button
                        variant={theme === 'system' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleThemeChange('system')}
                        className="flex items-center space-x-2"
                      >
                        <Monitor className="h-4 w-4" />
                        <span>System</span>
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button variant="outline" onClick={() => setShowSettingsModal(false)}>
                      Close
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content with Tabs */}
      <div className="flex-1 p-4 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="mb-4">
            <TabsTrigger value="stats" className="flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="browser" className="flex items-center">
              <Database className="h-4 w-4 mr-2" />
              Data Browser
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="stats" className="flex-1 space-y-4 overflow-auto">
            <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-8 gap-3">
              <Card className="col-span-1 md:col-span-2 lg:col-span-2 py-3 px-3">
                <div className="flex flex-col space-y-1.5">
                  <div className="text-[10px] font-bold flex items-center uppercase tracking-wide text-muted-foreground">
                    <Database className="h-3 w-3 mr-1" />
                    Total Classes
                  </div>
                  <div className="text-xl font-bold tracking-tight pl-0.5">{stats?.totalClasses || 0}</div>
                </div>
              </Card>
              <Card className="col-span-1 md:col-span-2 lg:col-span-2 py-3 px-3">
                <div className="flex flex-col space-y-1.5">
                  <div className="text-[10px] font-bold flex items-center uppercase tracking-wide text-muted-foreground">
                    <BarChart3 className="h-3 w-3 mr-1" />
                    Total Objects
                  </div>
                  <div className="text-xl font-bold tracking-tight pl-0.5">{stats?.totalObjects || 0}</div>
                </div>
              </Card>
              <Card className="col-span-1 md:col-span-2 lg:col-span-2 py-3 px-3">
                <div className="flex flex-col space-y-1.5">
                  <div className="text-[10px] font-bold flex items-center uppercase tracking-wide text-muted-foreground">
                    <Settings className="h-3 w-3 mr-1" />
                    Version
                  </div>
                  <div className="flex flex-col pl-0.5">
                    <div className="text-lg font-bold tracking-tight leading-tight">
                      {stats?.version && stats.version !== 'unknown' ? stats.version : '1.0.0'}
                    </div>
                    <div className="text-[9px] text-muted-foreground font-medium leading-tight">Zorost Local UI</div>
                  </div>
                </div>
              </Card>
              <Card className="col-span-1 md:col-span-2 lg:col-span-2 py-3 px-3">
                <div className="flex flex-col space-y-1.5">
                  <div className="text-[10px] font-bold flex items-center uppercase tracking-wide text-muted-foreground">
                    <Server className="h-3 w-3 mr-1" />
                    Node
                  </div>
                  <div className="text-sm font-semibold font-mono tracking-tight pl-0.5 break-all">{stats?.nodeInfo || 'Unknown'}</div>
                </div>
              </Card>
            </div>

            {/* Class Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Class Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class</TableHead>
                      <TableHead>Objects</TableHead>
                      <TableHead>Properties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats?.classStats?.map((stat) => (
                      <TableRow key={stat.name}>
                        <TableCell className="font-medium">{stat.name}</TableCell>
                        <TableCell>{stat.objectCount}</TableCell>
                        <TableCell>{stat.properties}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Browser Tab */}
          <TabsContent value="browser" className="flex-1 overflow-hidden">
            <div className="grid grid-cols-12 gap-4 h-full">
              {/* Classes Sidebar */}
              <div className="col-span-3">
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Classes</CardTitle>
                      <div className="flex space-x-1">
                        <Button onClick={fetchClasses} size="sm" variant="ghost">
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                        <Button onClick={() => setShowCreateClassModal(true)} size="sm" variant="default">
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="py-0">
                    <ScrollArea className="h-[calc(100vh-280px)]">
                      <div className="space-y-1">
                        {loading ? (
                          [...Array(3)].map((_, i) => (
                            <div key={i} className="h-10 bg-muted rounded animate-pulse" />
                          ))
                        ) : (
                          classes.map((cls: DatabaseClass) => (
                            <div key={cls.class} className="flex items-center justify-between">
                              <Button
                                onClick={() => handleClassSelect(cls.class)}
                                variant={selectedClass === cls.class ? "default" : "ghost"}
                                size="sm"
                                className="flex-1 justify-start text-sm"
                              >
                                {cls.class}
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => handleClassSelect(cls.class)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Objects
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedClassForAppend(cls.class);
                                    setShowChunkManagementModal(true);
                                  }}>
                                    <Settings className="h-4 w-4 mr-2" />
                                    Manage Chunks
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedClassForAppend(cls.class);
                                    setShowAppendDataModal(true);
                                  }}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Append Data
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditClass(cls)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Class
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleExportJSON(cls.class)}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Export JSON
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleExportCSV(cls.class)}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Export CSV
                                  </DropdownMenuItem>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Class
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Class</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete &ldquo;{cls.class}&rdquo;? This will permanently delete all objects in this class.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteClass(cls.class)}>
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Objects Panel */}
              <div className="col-span-9">
                <Card className="h-full flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CardTitle className="text-lg">
                          {selectedClass ? selectedClass : 'Select a class'}
                        </CardTitle>
                        {selectedClass && (
                          <Badge variant="secondary">
                            {pagination.totalItems} objects
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Input
                          placeholder="Search objects..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                          className="w-64"
                        />
                        <Button 
                          onClick={handleSearch}
                          disabled={!selectedClass || isSearching}
                          variant="outline"
                          size="sm"
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="py-0 flex-1 flex flex-col">
                    {selectedClass ? (
                      <>
                        <div className="flex-1 overflow-hidden">
                          <ScrollArea className="h-[calc(100vh-380px)]">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-12">
                                    <input
                                      type="checkbox"
                                      checked={selectedObjects.size === objects.length && objects.length > 0}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedObjects(new Set(objects.map(obj => obj.id)));
                                        } else {
                                          setSelectedObjects(new Set());
                                        }
                                      }}
                                    />
                                  </TableHead>
                                  <TableHead className="w-32">ID</TableHead>
                                  <TableHead>Properties</TableHead>
                                  <TableHead className="w-32">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {objects.map((obj: DatabaseObject) => (
                                  <TableRow key={obj.id}>
                                    <TableCell>
                                      <input
                                        type="checkbox"
                                        checked={selectedObjects.has(obj.id)}
                                        onChange={() => toggleObjectSelection(obj.id)}
                                      />
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">
                                      {obj.id?.slice(0, 8)}...
                                    </TableCell>
                                    <TableCell>
                                      <div className="text-xs bg-muted p-2 rounded w-full">
                                        <pre className="whitespace-pre-wrap text-xs break-all">
                                          {formatObjectProperties(obj.properties)}
                                        </pre>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex space-x-1">
                                        <Button 
                                          onClick={() => handleViewObject(obj)}
                                          variant="outline"
                                          size="sm"
                                          title="View Details"
                                        >
                                          <Maximize2 className="h-3 w-3" />
                                        </Button>
                                        <Button 
                                          onClick={() => handleDeleteObject(obj.id)}
                                          variant="destructive"
                                          size="sm"
                                          title="Delete"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                            {objects.length === 0 && (
                              <div className="text-center py-12 text-muted-foreground">
                                <Database className="mx-auto h-12 w-12 mb-4" />
                                <p>No objects found</p>
                              </div>
                            )}
                          </ScrollArea>
                        </div>
                        
                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                          <div className="mt-4 flex items-center justify-between border-t pt-4">
                            <div className="text-sm text-muted-foreground">
                              Page {pagination.currentPage} of {pagination.totalPages}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                onClick={() => handlePageChange(1)}
                                disabled={pagination.currentPage === 1}
                                variant="outline"
                                size="sm"
                              >
                                <ChevronsLeft className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => handlePageChange(pagination.currentPage - 1)}
                                disabled={pagination.currentPage === 1}
                                variant="outline"
                                size="sm"
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </Button>
                              <span className="px-4 py-2 text-sm">
                                {pagination.currentPage}
                              </span>
                              <Button
                                onClick={() => handlePageChange(pagination.currentPage + 1)}
                                disabled={pagination.currentPage === pagination.totalPages}
                                variant="outline"
                                size="sm"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => handlePageChange(pagination.totalPages)}
                                disabled={pagination.currentPage === pagination.totalPages}
                                variant="outline"
                                size="sm"
                              >
                                <ChevronsRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground flex-1 flex items-center justify-center">
                        <div>
                          <Database className="mx-auto h-12 w-12 mb-4" />
                          <p>Select a class to view objects</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat" className="flex-1 overflow-hidden">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3 space-y-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center">
                    <Bot className="h-5 w-5 mr-2 text-primary" />
                    AI Chat Assistant
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowApiKeysModal(true)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configure LLM
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Select Collection</Label>
                  <select
                    value={selectedChatClass}
                    onChange={(e) => setSelectedChatClass(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
                  >
                    <option value="">Choose a collection to chat with...</option>
                    {classes.map((cls) => (
                      <option key={cls.class} value={cls.class}>
                        {cls.class} ({cls.objectCount || 0} objects)
                      </option>
                    ))}
                  </select>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                <ScrollArea className="flex-1 p-6">
                  <div className="space-y-4">
                    {chatMessages.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <MessageSquare className="mx-auto h-12 w-12 mb-4" />
                        <p className="font-medium">Ask questions about your data</p>
                        <p className="text-xs mt-2">
                          Powered by{' '}
                          <a 
                            href="https://zorost.com" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-semibold"
                          >
                            Zorost Intelligence
                          </a>
                        </p>
                        <p className="text-xs mt-1 text-muted-foreground/60">
                          RAG-powered AI assistant for vector databases
                        </p>
                      </div>
                    )}
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-4 ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <div className="flex items-start space-x-2">
                            {message.role === 'assistant' && (
                              <Bot className="h-5 w-5 mt-0.5 flex-shrink-0" />
                            )}
                            {message.role === 'user' && (
                              <UserIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                              {message.sources && message.sources.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-border/50">
                                  <p className="text-xs font-semibold mb-1">Sources:</p>
                                  <div className="text-xs space-y-1">
                                    {message.sources.slice(0, 3).map((source, idx) => (
                                      <div key={idx} className="text-muted-foreground">
                                        • Object {source.id?.slice(0, 8)}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {isChatLoading && (
                      <div className="flex justify-start">
                        <div className="max-w-[80%] rounded-lg p-4 bg-muted">
                          <div className="flex items-center space-x-2">
                            <Bot className="h-5 w-5 animate-pulse" />
                            <span className="text-sm">Thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
                <div className="p-4 border-t">
                  <div className="flex space-x-2">
                    <Input
                      placeholder={selectedChatClass ? "Ask a question..." : "Select a class first"}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleChatSubmit()}
                      disabled={!selectedChatClass || isChatLoading}
                      className="flex-1"
                    />
                    {chatMessages.length > 0 && (
                      <Button 
                        onClick={() => setChatMessages([])}
                        variant="outline"
                        size="sm"
                        title="Clear chat history"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      onClick={handleChatSubmit}
                      disabled={!selectedChatClass || !chatInput.trim() || isChatLoading}
                      size="sm"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <footer className="border-t bg-card px-4 py-3 mt-2">
        <div className="flex items-center justify-between gap-4">
          {/* Left - Zorost Info */}
          <div className="flex flex-col justify-center space-y-0.5 max-w-lg flex-shrink-0">
            <span className="text-xs text-muted-foreground font-semibold leading-tight whitespace-nowrap">
              Zorost Intelligence Company - Leading AI-Powered Data, Cloud & Enterprise Automation Solutions
            </span>
            <p className="text-[10px] text-muted-foreground/75 leading-tight">
              Delivering cutting-edge vector databases, RAG systems, and scalable cloud architectures that transform
              <br />
              how businesses leverage artificial intelligence, machine learning, and advanced data analytics
            </p>
          </div>
          
          {/* Center - Weaviate Link with Shine Effect */}
          <div className="flex flex-col items-center justify-center flex-shrink-0 self-center space-y-1">
            <a 
              href="https://github.com/weaviate/weaviate" 
              target="_blank" 
              rel="noopener noreferrer"
              className="relative group"
            >
              <span className="text-base font-bold bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%] hover:scale-110 transition-transform duration-300 whitespace-nowrap">
                Weaviate
              </span>
              <span className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-purple-500/20 to-primary/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 rounded"></span>
            </a>
            <p className="text-[7px] text-muted-foreground/50 leading-tight text-center max-w-[200px]">
              This project is an independent UI built for local Weaviate instances. It is not affiliated with or endorsed by Semi Technologies B.V.
            </p>
          </div>
          
          {/* Right - Links with extra margin to avoid floating icon */}
          <div className="flex items-center justify-end space-x-3 mr-12 flex-shrink-0 self-center">
            <a 
              href="https://github.com/zorost/Zorost-Local-UI-for-Weaviate" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium whitespace-nowrap"
            >
              GitHub
            </a>
            <a 
              href="https://zorost.com/contact" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium whitespace-nowrap"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>

      {/* View Object Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Object Details</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Object ID</Label>
                <div className="mt-1 p-2 bg-muted rounded font-mono text-sm">
                  {viewingObject?.id}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Properties</Label>
                <div className="mt-1 p-4 bg-muted rounded">
                  <pre className="text-sm whitespace-pre-wrap">
                    {JSON.stringify(viewingObject?.properties, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Create Class Modal with Document Processing */}
      <CreateClassModal
        open={showCreateClassModal}
        onOpenChange={setShowCreateClassModal}
        onSuccess={() => {
          fetchClasses();
          fetchStats();
        }}
      />

      {/* Edit Class Modal */}
      <Dialog open={showEditClassModal} onOpenChange={setShowEditClassModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> Weaviate doesn't support modifying class metadata (including descriptions) after creation. 
                You can view the current class information below.
              </p>
            </div>
            <div>
              <Label htmlFor="editClassName">Class Name</Label>
              <Input
                id="editClassName"
                value={editClassName}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Class name cannot be changed after creation
              </p>
            </div>
            <div>
              <Label htmlFor="editClassDescription">Description</Label>
              <Input
                id="editClassDescription"
                value={editClassDescription}
                disabled
                className="bg-muted"
                placeholder="No description available"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Description cannot be modified after creation
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEditClassModal(false)}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* API Keys Modal */}
      <ApiKeysModal
        open={showApiKeysModal}
        onOpenChange={setShowApiKeysModal}
        apiKeys={apiKeys}
        selectedModels={selectedModels}
        onSave={handleApiKeysSave}
      />

      {/* Append Data Modal */}
      <AppendDataModal
        open={showAppendDataModal}
        onOpenChange={setShowAppendDataModal}
        className={selectedClassForAppend}
        onSuccess={() => {
          if (selectedClass === selectedClassForAppend) {
            fetchObjects(selectedClass, currentPage);
          }
          fetchClasses();
          fetchStats();
        }}
      />

      {/* Chunk Management Modal */}
      <ChunkManagementModal
        open={showChunkManagementModal}
        onOpenChange={setShowChunkManagementModal}
        className={selectedClassForAppend}
        onUpdate={() => {
          if (selectedClass === selectedClassForAppend) {
            fetchObjects(selectedClass, currentPage);
          }
          fetchClasses();
          fetchStats();
        }}
      />
    </div>
  );
}
