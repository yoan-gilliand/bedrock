'use client';

import { useState, useRef, useEffect } from 'react';
import ChatMessage from '../components/ChatMessage';
import {
  Send,
  Paperclip,
  X,
  FileText,
  Loader2,
  Search,
  Plus,
  Bell,
  HelpCircle,
  Settings,
  ChevronDown,
  ChevronRight,
  GitMerge,
  BarChart3,
  Shield,
  CloudUpload,
  Activity,
  MoreVertical,
  Star,
  GitFork,
  Code,
  File,
  FolderOpen,
  Lock,
  Copy,
  AlertCircle,
  MessageSquare,
  Minimize2,
  Maximize2,
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface UploadedFile {
  name: string;
  content: string;
  size: number;
  type: string;
  isImage?: boolean;
}

// GitLab logo SVG component
const GitLabLogo = () => (
  <svg width="24" height="24" viewBox="0 0 210 194" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M105.0614 193.655L105.0635 193.656L105.0657 193.655L143.798 107.192L66.3262 107.192L105.0614 193.655Z" fill="#E24329"/>
    <path d="M105.061 193.655L66.3262 107.192H19.2329L105.061 193.655Z" fill="#FC6D26"/>
    <path d="M19.2318 107.192L5.54568 148.525C4.32224 152.471 5.79355 156.819 9.16478 159.212L105.06 193.655L19.2318 107.192Z" fill="#FCA326"/>
    <path d="M19.2329 107.192H66.3262L47.3054 48.8419C46.2555 45.4995 41.4508 45.4995 40.4009 48.8419L19.2329 107.192Z" fill="#E24329"/>
    <path d="M105.061 193.655L143.798 107.192H190.891L105.061 193.655Z" fill="#FC6D26"/>
    <path d="M190.892 107.192L204.578 148.525C205.802 152.471 204.330 156.819 200.959 159.212L105.063 193.655L190.892 107.192Z" fill="#FCA326"/>
    <path d="M190.891 107.192H143.798L162.819 48.8419C163.869 45.4995 168.673 45.4995 169.723 48.8419L190.891 107.192Z" fill="#E24329"/>
  </svg>
);

export default function DashboardPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load messages from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('chat_messages');
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) {
        console.error('Failed to load messages:', e);
      }
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chat_messages', JSON.stringify(messages));
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle file uploads
  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;

    const filePromises = Array.from(files).map(async (file) => {
      const isImage = file.type.startsWith('image/');
      const isText = file.type.startsWith('text/') ||
                     file.name.match(/\.(txt|md|json|js|jsx|ts|tsx|py|java|cpp|c|h|css|html|xml|log|sh|yml|yaml|toml|ini|cfg|conf|sql|rs|go|rb|php|swift|kt|scala|r|m|mm|dart|vue|svelte)$/i);

      if (!isImage && !isText) {
        alert(`Skipping ${file.name}: Unsupported file type. Only text files and images are supported.`);
        return null;
      }

      if (file.size > 10 * 1024 * 1024) {
        alert(`Skipping ${file.name}: File too large (max 10MB)`);
        return null;
      }

      let content: string;

      if (isImage) {
        // Convert image to base64
        content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      } else {
        // Read as text
        content = await file.text();
      }

      return {
        name: file.name,
        content,
        size: file.size,
        type: file.type,
        isImage,
      };
    });

    const newFiles = (await Promise.all(filePromises)).filter(Boolean) as UploadedFile[];
    setUploadedFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFilesContext = (): string => {
    if (uploadedFiles.length === 0) return '';

    const filesXML = uploadedFiles
      .map((file) => {
        if (file.isImage) {
          return `<file path="${file.name}" type="image">\n[Image: ${file.name}]\nBase64 data available for analysis\n</file>`;
        }
        return `<file path="${file.name}">\n${file.content}\n</file>`;
      })
      .join('\n\n');

    return `\n\n--- Uploaded Files Context ---\n${filesXML}\n--- End of Files ---\n\n`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && uploadedFiles.length === 0) return;

    const userMessageContent = input.trim() + formatFilesContext();
    const userMessage: Message = {
      role: 'user',
      content: userMessageContent,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setUploadedFiles([]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') break;

              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  assistantMessage += parsed.text;
                  setMessages([...updatedMessages, { role: 'assistant', content: assistantMessage }]);
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages([
        ...updatedMessages,
        { role: 'assistant', content: 'Error: Failed to get response from the model.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#fafafa]">
      {/* Top Bar */}
      <div className="h-12 bg-white border-b border-[#dbdbdb] flex items-center px-4 gap-4 flex-shrink-0">
        <a href="#" className="flex-shrink-0">
          <GitLabLogo />
        </a>

        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#707070]" size={14} />
            <input
              type="text"
              placeholder="Search or go to..."
              className="w-full h-8 pl-9 pr-10 text-sm border border-[#dbdbdb] rounded bg-white text-[#303030] placeholder:text-[#707070] focus:outline-none focus:border-[#1068bf] focus:ring-1 focus:ring-[#1068bf]"
            />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-xs bg-[#fafafa] border border-[#dbdbdb] rounded text-[#707070] font-mono">/</kbd>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button className="p-1.5 hover:bg-[#f0f0f0] rounded text-[#525252]">
            <Plus size={18} />
          </button>
          <button className="p-1.5 hover:bg-[#f0f0f0] rounded text-[#525252] relative">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="absolute -top-1 -right-1 bg-[#1068bf] text-white text-[10px] font-semibold px-1 rounded-full min-w-[16px] text-center">1</span>
          </button>
          <button className="p-1.5 hover:bg-[#f0f0f0] rounded text-[#525252] relative">
            <GitMerge size={16} />
            <span className="absolute -top-1 -right-1 bg-[#1068bf] text-white text-[10px] font-semibold px-1 rounded-full min-w-[16px] text-center">3</span>
          </button>
          <button className="p-1.5 hover:bg-[#f0f0f0] rounded text-[#525252] relative">
            <AlertCircle size={16} />
            <span className="absolute -top-1 -right-1 bg-[#707070] text-white text-[10px] font-semibold px-1 rounded-full min-w-[16px] text-center">0</span>
          </button>
          <button className="p-1.5 hover:bg-[#f0f0f0] rounded">
            <div className="w-6 h-6 rounded-full bg-[#303030] flex items-center justify-center">
              <span className="text-white text-xs font-medium">U</span>
            </div>
          </button>
        </div>
      </div>

      {/* Banner */}
      <div className="bg-[#375a7f] px-6 py-3 flex items-center gap-3 text-white text-sm flex-shrink-0">
        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zM5.496 6.033h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286a.237.237 0 0 0 .241.247zm2.325 6.443c.61 0 1.029-.394 1.029-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94 0 .533.425.927 1.01.927z"/>
        </svg>
        <span>
          Le support aux utilisateurs et les demandes de création de comptes externes doivent être faites depuis les issues du projet{' '}
          <a href="#" className="underline hover:text-white font-medium">GitLab HEFR</a>
        </span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className={`${isSidebarCollapsed ? 'w-12' : 'w-56'} bg-[#fafafa] border-r border-[#dbdbdb] flex-shrink-0 flex flex-col transition-all duration-200`}>
          <div className="p-3 border-b border-[#dbdbdb]">
            <div className="text-xs font-semibold text-[#303030] mb-2">Project</div>
            {!isSidebarCollapsed && (
              <div className="flex items-center gap-2 px-2 py-1.5 bg-[#e9edf2] rounded">
                <div className="w-6 h-6 bg-white border border-[#dbdbdb] rounded flex items-center justify-center text-[#303030] text-sm font-medium flex-shrink-0">
                  L
                </div>
                <span className="text-sm font-normal text-[#303030] truncate">lab21-d</span>
              </div>
            )}
          </div>

          <nav className="flex-1 overflow-y-auto py-1">
            <button className="w-full flex items-center gap-2 px-4 py-1.5 text-sm text-[#303030] hover:bg-[#e5e5e5]">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              {!isSidebarCollapsed && <span>Pinned</span>}
              {!isSidebarCollapsed && <ChevronRight size={14} className="ml-auto" />}
            </button>
            <button className="w-full flex items-center gap-2 px-4 py-1.5 text-sm text-[#303030] hover:bg-[#e5e5e5]">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              {!isSidebarCollapsed && <span>Manage</span>}
              {!isSidebarCollapsed && <ChevronRight size={14} className="ml-auto" />}
            </button>
            <button className="w-full flex items-center gap-2 px-4 py-1.5 text-sm text-[#303030] hover:bg-[#e5e5e5]">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {!isSidebarCollapsed && <span>Plan</span>}
              {!isSidebarCollapsed && <ChevronRight size={14} className="ml-auto" />}
            </button>
            <button className="w-full flex items-center gap-2 px-4 py-1.5 text-sm text-[#303030] hover:bg-[#e5e5e5]">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {!isSidebarCollapsed && <span>Automate</span>}
              {!isSidebarCollapsed && <ChevronRight size={14} className="ml-auto" />}
            </button>
            <button className="w-full flex items-center gap-2 px-4 py-1.5 text-sm text-[#303030] hover:bg-[#e5e5e5] border-l-3 border-[#1068bf] bg-[#e5e9f1]">
              <Code size={16} className="flex-shrink-0 text-[#1068bf]" />
              {!isSidebarCollapsed && <span className="font-medium text-[#1068bf]">Code</span>}
              {!isSidebarCollapsed && <ChevronRight size={14} className="ml-auto text-[#1068bf]" />}
            </button>
            <button className="w-full flex items-center gap-2 px-4 py-1.5 text-sm text-[#303030] hover:bg-[#e5e5e5]">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              {!isSidebarCollapsed && <span>Build</span>}
              {!isSidebarCollapsed && <ChevronRight size={14} className="ml-auto" />}
            </button>
            <button className="w-full flex items-center gap-2 px-4 py-1.5 text-sm text-[#303030] hover:bg-[#e5e5e5]">
              <Shield size={16} className="flex-shrink-0" />
              {!isSidebarCollapsed && <span>Secure</span>}
              {!isSidebarCollapsed && <ChevronRight size={14} className="ml-auto" />}
            </button>
            <button className="w-full flex items-center gap-2 px-4 py-1.5 text-sm text-[#303030] hover:bg-[#e5e5e5]">
              <CloudUpload size={16} className="flex-shrink-0" />
              {!isSidebarCollapsed && <span>Deploy</span>}
              {!isSidebarCollapsed && <ChevronRight size={14} className="ml-auto" />}
            </button>
            <button className="w-full flex items-center gap-2 px-4 py-1.5 text-sm text-[#303030] hover:bg-[#e5e5e5]">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {!isSidebarCollapsed && <span>Operate</span>}
              {!isSidebarCollapsed && <ChevronRight size={14} className="ml-auto" />}
            </button>
            <button className="w-full flex items-center gap-2 px-4 py-1.5 text-sm text-[#303030] hover:bg-[#e5e5e5]">
              <Activity size={16} className="flex-shrink-0" />
              {!isSidebarCollapsed && <span>Monitor</span>}
              {!isSidebarCollapsed && <ChevronRight size={14} className="ml-auto" />}
            </button>
            <button className="w-full flex items-center gap-2 px-4 py-1.5 text-sm text-[#303030] hover:bg-[#e5e5e5]">
              <BarChart3 size={16} className="flex-shrink-0" />
              {!isSidebarCollapsed && <span>Analyze</span>}
              {!isSidebarCollapsed && <ChevronRight size={14} className="ml-auto" />}
            </button>
            <button className="w-full flex items-center gap-2 px-4 py-1.5 text-sm text-[#303030] hover:bg-[#e5e5e5]">
              <Settings size={16} className="flex-shrink-0" />
              {!isSidebarCollapsed && <span>Settings</span>}
              {!isSidebarCollapsed && <ChevronRight size={14} className="ml-auto" />}
            </button>
          </nav>

          <div className="border-t border-[#dbdbdb] p-2">
            <button className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-[#303030] hover:bg-[#e5e5e5] rounded">
              <HelpCircle size={14} className="flex-shrink-0" />
              {!isSidebarCollapsed && <span>What's new</span>}
              {!isSidebarCollapsed && <span className="ml-auto bg-[#1068bf] text-white text-[10px] font-semibold px-1.5 rounded-full">10</span>}
            </button>
            <button className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-[#303030] hover:bg-[#e5e5e5] rounded">
              <HelpCircle size={14} className="flex-shrink-0" />
              {!isSidebarCollapsed && <span>Help</span>}
            </button>
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-[#303030] hover:bg-[#e5e5e5] rounded"
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {!isSidebarCollapsed && <span>Collapse sidebar</span>}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Center Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Breadcrumb */}
            <div className="px-6 py-3 bg-white border-b border-[#dbdbdb] text-sm text-[#525252] flex-shrink-0">
              <div className="flex items-center gap-2">
                <a href="#" className="hover:text-[#1068bf] hover:underline">Concurrent Programming</a>
                <span>/</span>
                <a href="#" className="hover:text-[#1068bf] hover:underline">2025-2026</a>
                <span>/</span>
                <a href="#" className="hover:text-[#1068bf] hover:underline">concurp2 student labs</a>
                <span>/</span>
                <a href="#" className="hover:text-[#1068bf] hover:underline">concurp2-lab21</a>
                <span>/</span>
                <a href="#" className="hover:text-[#1068bf] hover:underline">groups</a>
                <span>/</span>
                <span className="font-semibold text-[#303030]">lab21-d</span>
              </div>
            </div>

            {/* Project Header */}
            <div className="px-6 py-4 bg-white border-b border-[#dbdbdb] flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white border border-[#dbdbdb] rounded flex items-center justify-center text-[#303030] text-xl font-medium">
                    L
                  </div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-normal text-[#303030]">lab21-d</h1>
                    <Lock size={16} className="text-[#525252]" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1 px-3 py-1.5 text-sm border border-[#dbdbdb] rounded hover:bg-[#f0f0f0] bg-white">
                    <Bell size={14} />
                    <ChevronDown size={14} />
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-[#dbdbdb] rounded hover:bg-[#f0f0f0] bg-white">
                    <Star size={14} />
                    <span>Star</span>
                    <span className="bg-[#f0f0f0] px-1.5 py-0.5 rounded text-xs ml-1">0</span>
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-[#dbdbdb] rounded hover:bg-[#f0f0f0] bg-white">
                    <GitFork size={14} />
                    <span>Fork</span>
                    <span className="bg-[#f0f0f0] px-1.5 py-0.5 rounded text-xs ml-1">0</span>
                  </button>
                  <button className="p-1.5 border border-[#dbdbdb] rounded hover:bg-[#f0f0f0] bg-white">
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1 h-8 px-3 text-sm border border-[#dbdbdb] rounded hover:bg-[#f0f0f0] bg-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                  <span>main</span>
                  <ChevronDown size={14} />
                </button>
                <button className="h-8 px-3 text-sm border border-[#dbdbdb] rounded hover:bg-[#f0f0f0] bg-white">
                  lab21-d
                </button>
                <button className="flex items-center gap-1 h-8 px-3 text-sm border border-[#dbdbdb] rounded hover:bg-[#f0f0f0] bg-white">
                  <Plus size={14} />
                  <ChevronDown size={14} />
                </button>
                <button className="h-8 px-3 text-sm text-[#525252] hover:text-[#1068bf] hover:underline">
                  Find file
                </button>
                <button className="flex items-center gap-1.5 h-8 px-4 text-sm bg-[#1068bf] text-white rounded hover:bg-[#0b5cad] ml-auto">
                  <Code size={14} />
                  <span>Code</span>
                  <ChevronDown size={14} />
                </button>
                <button className="p-1.5 border border-[#dbdbdb] rounded hover:bg-[#f0f0f0] bg-white">
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>

            {/* Commit Info Bar */}
            <div className="px-6 py-3 bg-white border-b border-[#dbdbdb] flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#525252]"></div>
                <div>
                  <div className="text-sm font-medium text-[#303030]">Merge branch 'develop'</div>
                  <div className="text-xs text-[#525252]">Yoan Gilliand authored 1 month ago</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <code className="px-2 py-1 bg-[#fafafa] border border-[#dbdbdb] rounded text-xs font-mono text-[#303030]">
                  ee4b3ad0
                </code>
                <button className="p-1.5 border border-[#dbdbdb] rounded hover:bg-[#f0f0f0] bg-white">
                  <Copy size={14} />
                </button>
                <button className="px-3 py-1.5 text-sm border border-[#dbdbdb] rounded hover:bg-[#f0f0f0] bg-white">
                  History
                </button>
              </div>
            </div>

            {/* File Browser */}
            <div className="flex-1 overflow-y-auto bg-white">
              <table className="w-full text-sm">
                <thead className="bg-[#fafafa] border-b border-[#dbdbdb] sticky top-0">
                  <tr>
                    <th className="text-left px-6 py-2.5 font-semibold text-[#303030] text-sm">Name</th>
                    <th className="text-left px-6 py-2.5 font-semibold text-[#303030] text-sm">Last commit</th>
                    <th className="text-right px-6 py-2.5 font-semibold text-[#303030] text-sm">Last update</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[#dbdbdb] hover:bg-[#f9f9f9]">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <FolderOpen size={16} className="text-[#707070] flex-shrink-0" />
                        <a href="#" className="text-[#1068bf] hover:underline">src</a>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-[#525252]">refactor: externalize RabbitMQ confi...</td>
                    <td className="px-6 py-3 text-right text-[#525252]">1 month ago</td>
                  </tr>
                  <tr className="border-b border-[#dbdbdb] hover:bg-[#f9f9f9]">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#707070] flex-shrink-0" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/>
                          <path d="M4.603 14.087a.81.81 0 0 1-.438-.42c-.195-.388-.13-.776.08-1.102.198-.307.526-.568.897-.787a7.68 7.68 0 0 1 1.482-.645 19.697 19.697 0 0 0 1.062-2.227 7.269 7.269 0 0 1-.43-1.295c-.086-.4-.119-.796-.046-1.136.075-.354.274-.672.65-.823.192-.077.4-.12.602-.077a.7.7 0 0 1 .477.365c.088.164.12.356.127.538.007.188-.012.396-.047.614-.084.51-.27 1.134-.52 1.794a10.954 10.954 0 0 0 .98 1.686 5.753 5.753 0 0 1 1.334.05c.364.066.734.195.96.465.12.144.193.32.2.518.007.192-.047.382-.138.563a1.04 1.04 0 0 1-.354.416.856.856 0 0 1-.51.138c-.331-.014-.654-.196-.933-.417a5.712 5.712 0 0 1-.911-.95 11.651 11.651 0 0 0-1.997.406 11.307 11.307 0 0 1-1.02 1.51c-.292.35-.609.656-.927.787a.793.793 0 0 1-.58.029zm1.379-1.901c-.166.076-.32.156-.459.238-.328.194-.541.383-.647.547-.094.145-.096.25-.04.361.01.022.02.036.026.044a.266.266 0 0 0 .035-.012c.137-.056.355-.235.635-.572a8.18 8.18 0 0 0 .45-.606zm1.64-1.33a12.71 12.71 0 0 1 1.01-.193 11.744 11.744 0 0 1-.51-.858 20.801 20.801 0 0 1-.5 1.05zm2.446.45c.15.163.296.3.435.41.24.19.407.253.498.256a.107.107 0 0 0 .07-.015.307.307 0 0 0 .094-.125.436.436 0 0 0 .059-.2.095.095 0 0 0-.026-.063c-.052-.062-.2-.152-.518-.209a3.876 3.876 0 0 0-.612-.053zM8.078 7.8a6.7 6.7 0 0 0 .2-.828c.031-.188.043-.343.038-.465a.613.613 0 0 0-.032-.198.517.517 0 0 0-.145.04c-.087.035-.158.106-.196.283-.04.192-.03.469.046.822.024.111.054.227.09.346z"/>
                        </svg>
                        <a href="#" className="text-[#1068bf] hover:underline">README.md</a>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-[#525252]">docs: Update README with compre...</td>
                    <td className="px-6 py-3 text-right text-[#525252]">1 month ago</td>
                  </tr>
                  <tr className="border-b border-[#dbdbdb] hover:bg-[#f9f9f9]">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#707070] flex-shrink-0" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z"/>
                        </svg>
                        <a href="#" className="text-[#1068bf] hover:underline">pyproject.toml</a>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-[#525252]">year 2425</td>
                    <td className="px-6 py-3 text-right text-[#525252]">1 year ago</td>
                  </tr>
                  {uploadedFiles.map((file, index) => (
                    <tr key={index} className="border-b border-[#dbdbdb] hover:bg-[#f9f9f9]">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          {file.isImage ? (
                            <>
                              <img
                                src={file.content}
                                alt={file.name}
                                className="w-6 h-6 object-cover rounded border border-[#dbdbdb]"
                              />
                              <span className="text-[#1068bf]">{file.name}</span>
                            </>
                          ) : (
                            <>
                              <FileText size={16} className="text-[#707070] flex-shrink-0" />
                              <span className="text-[#1068bf]">{file.name}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-[#525252]">
                        Uploaded • {(file.size / 1024).toFixed(1)} KB {file.isImage && '• Image'}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => removeFile(index)}
                          className="text-[#707070] hover:text-red-600"
                        >
                          <X size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* README Preview */}
              <div className="border-t-8 border-[#fafafa] px-6 py-4">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#dbdbdb]">
                  <svg className="w-4 h-4 text-[#303030]" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/>
                    <path d="M4.603 14.087a.81.81 0 0 1-.438-.42c-.195-.388-.13-.776.08-1.102.198-.307.526-.568.897-.787a7.68 7.68 0 0 1 1.482-.645 19.697 19.697 0 0 0 1.062-2.227 7.269 7.269 0 0 1-.43-1.295c-.086-.4-.119-.796-.046-1.136.075-.354.274-.672.65-.823.192-.077.4-.12.602-.077a.7.7 0 0 1 .477.365c.088.164.12.356.127.538.007.188-.012.396-.047.614-.084.51-.27 1.134-.52 1.794a10.954 10.954 0 0 0 .98 1.686 5.753 5.753 0 0 1 1.334.05c.364.066.734.195.96.465.12.144.193.32.2.518.007.192-.047.382-.138.563a1.04 1.04 0 0 1-.354.416.856.856 0 0 1-.51.138c-.331-.014-.654-.196-.933-.417a5.712 5.712 0 0 1-.911-.95 11.651 11.651 0 0 0-1.997.406 11.307 11.307 0 0 1-1.02 1.51c-.292.35-.609.656-.927.787a.793.793 0 0 1-.58.029zm1.379-1.901c-.166.076-.32.156-.459.238-.328.194-.541.383-.647.547-.094.145-.096.25-.04.361.01.022.02.036.026.044a.266.266 0 0 0 .035-.012c.137-.056.355-.235.635-.572a8.18 8.18 0 0 0 .45-.606zm1.64-1.33a12.71 12.71 0 0 1 1.01-.193 11.744 11.744 0 0 1-.51-.858 20.801 20.801 0 0 1-.5 1.05zm2.446.45c.15.163.296.3.435.41.24.19.407.253.498.256a.107.107 0 0 0 .07-.015.307.307 0 0 0 .094-.125.436.436 0 0 0 .059-.2.095.095 0 0 0-.026-.063c-.052-.062-.2-.152-.518-.209a3.876 3.876 0 0 0-.612-.053zM8.078 7.8a6.7 6.7 0 0 0 .2-.828c.031-.188.043-.343.038-.465a.613.613 0 0 0-.032-.198.517.517 0 0 0-.145.04c-.087.035-.158.106-.196.283-.04.192-.03.469.046.822.024.111.054.227.09.346z"/>
                  </svg>
                  <span className="text-sm font-semibold text-[#303030]">README.md</span>
                </div>

                <div className="prose prose-sm max-w-none">
                  <h2 className="text-xl font-semibold text-[#303030] mb-3">concurp2-lab21</h2>
                  <p className="text-[#303030] mb-4 text-sm leading-relaxed">
                    The translator script that is usable in a classical Unix pipe. This project implements a RabbitMQ RPC-based word-by-word translator using Python.
                  </p>

                  <h3 className="text-base font-semibold text-[#303030] mb-2 mt-6">Features</h3>
                  <ul className="space-y-2 text-sm text-[#303030]">
                    <li className="flex gap-2">
                      <span className="flex-shrink-0">•</span>
                      <span><strong>Unix Pipe Compatibility:</strong> Can be used within pipes (e.g., <code className="bg-[#fafafa] px-1.5 py-0.5 rounded text-xs font-mono border border-[#e5e5e5]">cat input.txt | python3 src/translator.py | less</code>).</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Project Information & Chat */}
          <div className="w-80 bg-white border-l border-[#dbdbdb] flex-shrink-0 flex flex-col overflow-hidden">
            {/* Project Info Section - Collapsible */}
            <div className={`${isChatOpen ? 'max-h-48' : 'flex-1'} overflow-y-auto transition-all duration-200 border-b border-[#dbdbdb]`}>
              <div className="p-4">
                <h3 className="text-sm font-semibold text-[#303030] mb-3">Project information</h3>

              <div className="mb-4">
                <div className="h-2 bg-[#1068bf] rounded-full"></div>
              </div>

              <div className="space-y-3 text-sm mb-6">
                <div className="flex items-center gap-2 text-[#303030]">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className="font-semibold">6</span>
                  <span>Commits</span>
                </div>
                <div className="flex items-center gap-2 text-[#303030]">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-semibold">2</span>
                  <span>Branches</span>
                </div>
                <div className="flex items-center gap-2 text-[#303030]">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span className="font-semibold">0</span>
                  <span>Tags</span>
                </div>
                <div className="flex items-center gap-2 text-[#303030]">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                  <span className="font-semibold">305 KiB</span>
                  <span>Project Storage</span>
                </div>
              </div>

              <div className="space-y-2">
                <a href="#" className="flex items-center gap-2 text-sm text-[#303030] hover:text-[#1068bf] hover:underline">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/>
                  </svg>
                  <span>README</span>
                </a>
                <a href="#" className="flex items-center gap-2 text-sm text-[#1068bf] hover:underline">
                  <Plus size={14} className="flex-shrink-0" />
                  <span>Add LICENSE</span>
                </a>
                <a href="#" className="flex items-center gap-2 text-sm text-[#1068bf] hover:underline">
                  <Plus size={14} className="flex-shrink-0" />
                  <span>Add CHANGELOG</span>
                </a>
                <a href="#" className="flex items-center gap-2 text-sm text-[#1068bf] hover:underline">
                  <Plus size={14} className="flex-shrink-0" />
                  <span>Add CONTRIBUTING</span>
                </a>
                <a href="#" className="flex items-center gap-2 text-sm text-[#1068bf] hover:underline">
                  <Plus size={14} className="flex-shrink-0" />
                  <span>Enable Auto DevOps</span>
                </a>
                <a href="#" className="flex items-center gap-2 text-sm text-[#1068bf] hover:underline">
                  <Plus size={14} className="flex-shrink-0" />
                  <span>Add Kubernetes cluster</span>
                </a>
                <a href="#" className="flex items-center gap-2 text-sm text-[#1068bf] hover:underline">
                  <Plus size={14} className="flex-shrink-0" />
                  <span>Set up CI/CD</span>
                </a>
                <a href="#" className="flex items-center gap-2 text-sm text-[#1068bf] hover:underline">
                  <Plus size={14} className="flex-shrink-0" />
                  <span>Add Wiki</span>
                </a>
                <a href="#" className="flex items-center gap-2 text-sm text-[#1068bf] hover:underline">
                  <Plus size={14} className="flex-shrink-0" />
                  <span>Configure Integrations</span>
                </a>
              </div>

              <div className="mt-6 pt-4 border-t border-[#dbdbdb]">
                <div className="text-sm">
                  <div className="text-[#525252] mb-1">Created on</div>
                  <div className="text-[#303030] font-medium">March 30, 2026</div>
                </div>
              </div>
              </div>
            </div>

            {/* Analysis Assistant Section */}
            <div className={`${isChatOpen ? 'flex-1' : 'h-auto'} flex flex-col transition-all duration-200 min-h-0`}>
              {/* Chat Header */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-[#fafafa] border-b border-[#dbdbdb] flex-shrink-0">
                <button
                  onClick={() => setIsChatOpen(!isChatOpen)}
                  className="flex items-center gap-2 flex-1 hover:text-[#1068bf] transition-colors text-left"
                >
                  <MessageSquare size={16} className="text-[#1068bf] flex-shrink-0" />
                  <span className="text-sm font-semibold text-[#303030]">Analysis Assistant</span>
                  {messages.length > 0 && (
                    <span className="text-xs text-[#707070]">({messages.length})</span>
                  )}
                  <ChevronDown size={14} className={`text-[#525252] transition-transform ml-auto flex-shrink-0 ${isChatOpen ? 'rotate-180' : ''}`} />
                </button>
                {messages.length > 0 && isChatOpen && (
                  <button
                    onClick={() => {
                      if (confirm('Clear all messages?')) {
                        setMessages([]);
                        localStorage.removeItem('chat_messages');
                      }
                    }}
                    className="ml-2 p-1.5 text-[#525252] hover:text-red-600 hover:bg-[#f0f0f0] rounded transition-colors"
                    title="Clear chat history"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Chat Content */}
              {isChatOpen && (
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-3 bg-white" style={{ scrollBehavior: 'smooth' }}>
                    {messages.length === 0 && (
                      <div className="text-center text-[#707070] text-xs mt-8 px-3">
                        <MessageSquare size={32} className="mx-auto mb-2 text-[#dbdbdb]" />
                        <p className="font-medium mb-1 text-[#303030]">AI Code Assistant</p>
                        <p className="text-[#999] leading-relaxed">Upload files and ask questions. I can analyze code, explain concepts, debug issues, and suggest improvements.</p>
                      </div>
                    )}

                    <div className="space-y-2">
                      {messages.map((message, index) => (
                        <ChatMessage key={index} role={message.role} content={message.content} />
                      ))}

                      {isLoading && (
                        <div className="flex justify-start mb-2">
                          <div className="bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg px-3 py-2 flex items-center gap-2">
                            <Loader2 className="animate-spin" size={14} />
                            <span className="text-xs text-[#525252]">Analyzing...</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Uploaded Files Preview */}
                  {uploadedFiles.length > 0 && (
                    <div className="px-3 py-2 border-t border-[#dbdbdb] bg-[#fafafa] max-h-24 overflow-y-auto flex-shrink-0">
                      <div className="flex flex-wrap gap-1.5">
                        {uploadedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="relative group"
                          >
                            {file.isImage ? (
                              <div className="relative w-16 h-16 rounded overflow-hidden border border-[#dbdbdb] bg-white">
                                <img
                                  src={file.content}
                                  alt={file.name}
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  onClick={() => removeFile(index)}
                                  className="absolute top-0 right-0 p-0.5 bg-red-600 text-white rounded-bl opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Remove"
                                >
                                  <X size={12} />
                                </button>
                                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[10px] px-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                                  {file.name}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 px-2 py-1 bg-white border border-[#dbdbdb] rounded text-xs">
                                <FileText size={12} className="text-[#1068bf]" />
                                <span className="max-w-[120px] truncate">{file.name}</span>
                                <button
                                  onClick={() => removeFile(index)}
                                  className="text-[#707070] hover:text-red-600"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Chat Input */}
                  <form onSubmit={handleSubmit} className="p-2.5 border-t border-[#dbdbdb] bg-white flex-shrink-0">
                    <div className="flex gap-1.5 items-end">
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".txt,.md,.json,.js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.h,.css,.html,.xml,.log,.sh,.yml,.yaml,.toml,.ini,.cfg,.conf,.sql,.rs,.go,.rb,.php,.swift,.kt,.scala,.r,.m,.mm,.dart,.vue,.svelte,image/*,text/*"
                        onChange={(e) => handleFileUpload(e.target.files)}
                        className="hidden"
                      />

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-[#525252] hover:text-[#1068bf] hover:bg-[#f0f0f0] rounded transition-colors flex-shrink-0"
                        title="Attach files (images, code)"
                      >
                        <Paperclip size={16} />
                      </button>

                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(e);
                          }
                        }}
                        placeholder="Ask about your code..."
                        className="flex-1 px-2.5 py-1.5 text-sm border border-[#dbdbdb] rounded focus:outline-none focus:ring-2 focus:ring-[#1068bf] focus:border-[#1068bf] resize-none transition-all min-h-[36px] max-h-24"
                        rows={1}
                        disabled={isLoading}
                        style={{ height: 'auto' }}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = 'auto';
                          target.style.height = Math.min(target.scrollHeight, 96) + 'px';
                        }}
                      />

                      <button
                        type="submit"
                        disabled={isLoading || (!input.trim() && uploadedFiles.length === 0)}
                        className="p-2 bg-[#1068bf] text-white rounded hover:bg-[#0b5cad] disabled:bg-[#dbdbdb] disabled:cursor-not-allowed transition-colors flex-shrink-0"
                        title="Send message (Enter)"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
