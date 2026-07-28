'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  Search,
  Send,
  Paperclip,
  Mic,
  Image as ImageIcon,
  MoreVertical,
  Phone,
  Video,
  CheckCheck,
  Circle,
  Users,
  Building2,
  Calendar,
  Smile,
  FileText,
  X,
  Play,
  Pause,
  Volume2,
  Pin,
  Check,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';

// Static Mock Data for Team Chat & Event Group Channels
const MOCK_CONVERSATIONS = [
  {
    id: 'c1',
    name: 'Royal Wedding Setup Team',
    type: 'group',
    avatar: null,
    isOnline: true,
    unreadCount: 3,
    eventInfo: 'Royal Palace Resort • 28 Oct',
    lastMessage: 'Kuldeep: Main Godown se 500 Gold Chairs loading complete.',
    lastTime: '10:42 AM',
    membersCount: 8,
  },
  {
    id: 'c2',
    name: 'Kuldeep Kumawat',
    type: 'direct',
    role: 'Store Manager',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    isOnline: true,
    unreadCount: 0,
    lastMessage: 'Jaipur Godown stock audit report ready hai sir.',
    lastTime: '09:15 AM',
  },
  {
    id: 'c3',
    name: 'Ramesh Sharma (Driver)',
    type: 'direct',
    role: 'Logistics Lead',
    avatar: null,
    isOnline: false,
    unreadCount: 1,
    lastMessage: 'Truck RJ-14-GA-1234 dispatch location par pahunch gaya.',
    lastTime: 'Yesterday',
  },
  {
    id: 'c4',
    name: 'Light & Sound Crew',
    type: 'group',
    avatar: null,
    isOnline: true,
    unreadCount: 0,
    eventInfo: 'Fairmont Hotel Sangeet',
    lastMessage: 'Sunil: Generator unit testing passed.',
    lastTime: 'Yesterday',
    membersCount: 5,
  },
  {
    id: 'c5',
    name: 'Sunita Verma',
    type: 'direct',
    role: 'Event Supervisor',
    avatar: null,
    isOnline: true,
    unreadCount: 0,
    lastMessage: 'Site Receipt signed by client.',
    lastTime: '24 Oct',
  },
];

const INITIAL_MESSAGES: Record<string, any[]> = {
  c1: [
    {
      id: 'm1',
      sender: 'Kuldeep Kumawat',
      senderId: 'u2',
      text: 'Good morning team! Royal Palace Resort event ke loading slips generate ho chuke hain.',
      time: '09:00 AM',
      isMe: false,
    },
    {
      id: 'm2',
      sender: 'Sunita Verma',
      senderId: 'u3',
      text: 'Main Godown se 500 Gold Chairs aur 20 Tents load ho rahe hain.',
      time: '09:15 AM',
      isMe: false,
    },
    {
      id: 'm3',
      sender: 'Me',
      senderId: 'me',
      text: 'Great. Make sure damage inspection verification checklist fill ki jaye dispatch se pehle.',
      time: '09:30 AM',
      isMe: true,
      status: 'read',
    },
    {
      id: 'm4',
      sender: 'Kuldeep Kumawat',
      senderId: 'u2',
      text: 'Main Godown se 500 Gold Chairs loading complete.',
      time: '10:42 AM',
      isMe: false,
      hasVoiceNote: true,
      audioDuration: '0:24',
    },
  ],
  c2: [
    {
      id: 'm21',
      sender: 'Kuldeep Kumawat',
      senderId: 'u2',
      text: 'Sir, Jaipur Godown stock count check kar liya hai.',
      time: '08:45 AM',
      isMe: false,
    },
    {
      id: 'm22',
      sender: 'Kuldeep Kumawat',
      senderId: 'u2',
      text: 'Jaipur Godown stock audit report ready hai sir.',
      time: '09:15 AM',
      isMe: false,
    },
  ],
};

export function ChatView() {
  const [activeTab, setActiveTab] = useState<'all' | 'direct' | 'groups' | 'unread'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConvId, setSelectedConvId] = useState('c1');
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputMsg, setInputMsg] = useState('');
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const selectedConv = MOCK_CONVERSATIONS.find((c) => c.id === selectedConvId) || MOCK_CONVERSATIONS[0];
  const currentMessages = messages[selectedConvId] || [];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const newMsg = {
      id: `m_${Date.now()}`,
      sender: 'Me',
      senderId: 'me',
      text: inputMsg.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      status: 'sent',
    };

    setMessages((prev) => ({
      ...prev,
      [selectedConvId]: [...(prev[selectedConvId] || []), newMsg],
    }));

    setInputMsg('');
  };

  const filteredConversations = MOCK_CONVERSATIONS.filter((conv) => {
    const matchesSearch = conv.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeTab === 'direct') return conv.type === 'direct';
    if (activeTab === 'groups') return conv.type === 'group';
    if (activeTab === 'unread') return conv.unreadCount > 0;
    return true;
  });

  return (
    <div className="h-[calc(100vh-6.5rem)] flex bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      {/* ── Left Sidebar: Conversations List ─────────────────────────── */}
      <div className="w-full md:w-80 lg:w-96 border-r border-border flex flex-col bg-muted/20 shrink-0">
        {/* Header & Search */}
        <div className="p-4 border-b border-border/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Team Chat</h2>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              Live Socket
            </span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search chat or team members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1">
            {[
              { key: 'all', label: 'All Chats' },
              { key: 'direct', label: 'Direct' },
              { key: 'groups', label: 'Groups' },
              { key: 'unread', label: 'Unread' },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key as any)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                  activeTab === t.key
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conversations Scroll Area */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/40">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">No conversations found</div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = conv.id === selectedConvId;
              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  className={`p-4 flex items-start gap-3 cursor-pointer transition-all hover:bg-muted/50 ${
                    isSelected ? 'bg-primary/10 border-l-4 border-primary' : ''
                  }`}
                >
                  {/* Avatar / Icon */}
                  <div className="relative shrink-0">
                    {conv.avatar ? (
                      <img src={conv.avatar} alt={conv.name} className="w-11 h-11 rounded-full object-cover" />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-sm">
                        {conv.type === 'group' ? <Users className="w-5 h-5" /> : conv.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    {conv.isOnline && (
                      <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-card absolute bottom-0 right-0"></span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-foreground truncate">{conv.name}</h4>
                      <span className="text-[10px] text-muted-foreground shrink-0">{conv.lastTime}</span>
                    </div>

                    {conv.eventInfo && (
                      <div className="text-[10px] font-semibold text-primary truncate flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 shrink-0" /> {conv.eventInfo}
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground truncate mt-1">{conv.lastMessage}</p>
                  </div>

                  {/* Unread Badge */}
                  {conv.unreadCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-sm">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Main Chat Area ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-card min-w-0">
        {/* Active Chat Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-card">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              {selectedConv.avatar ? (
                <img src={selectedConv.avatar} alt={selectedConv.name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-sm">
                  {selectedConv.type === 'group' ? (
                    <Users className="w-5 h-5" />
                  ) : (
                    selectedConv.name.slice(0, 2).toUpperCase()
                  )}
                </div>
              )}
              {selectedConv.isOnline && (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-card absolute bottom-0 right-0"></span>
              )}
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-bold text-foreground truncate">{selectedConv.name}</h3>
              <p className="text-[11px] text-muted-foreground truncate">
                {selectedConv.type === 'group'
                  ? `${selectedConv.membersCount || 8} team members • ${selectedConv.eventInfo || 'Active Channel'}`
                  : selectedConv.role || (selectedConv.isOnline ? 'Online' : 'Offline')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors">
              <Phone className="w-4 h-4" />
            </button>
            <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors">
              <Video className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowRightPanel(!showRightPanel)}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Thread Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10">
          {currentMessages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
                <span>{msg.sender}</span>
                <span>•</span>
                <span>{msg.time}</span>
              </div>

              <div
                className={`max-w-md p-3.5 rounded-2xl shadow-sm space-y-2 ${
                  msg.isMe
                    ? 'bg-primary text-white rounded-tr-none'
                    : 'bg-card border border-border text-foreground rounded-tl-none'
                }`}
              >
                {/* Voice Note Mock Player */}
                {msg.hasVoiceNote && (
                  <div className="flex items-center gap-3 p-2 rounded-xl bg-black/10 dark:bg-white/10">
                    <button
                      onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                      className="p-2 rounded-full bg-white text-primary shadow-sm hover:scale-105 transition-all"
                    >
                      {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </button>
                    <div className="flex-1 space-y-1">
                      <div className="h-1.5 bg-white/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-white rounded-full transition-all"
                          style={{ width: isPlayingAudio ? '60%' : '0%' }}
                        ></div>
                      </div>
                      <span className="text-[10px] font-semibold opacity-90">{msg.audioDuration}</span>
                    </div>
                  </div>
                )}

                <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                {msg.isMe && (
                  <div className="flex justify-end text-[10px] opacity-80 pt-0.5">
                    <CheckCheck className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Message Input Box */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-border bg-card flex items-center gap-2">
          <button
            type="button"
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          <input
            type="text"
            placeholder="Type a message or record voice note..."
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            className="flex-1 px-4 py-2.5 text-xs bg-muted/30 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
          />

          <button
            type="button"
            className="p-2.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-xl transition-colors"
          >
            <Mic className="w-4 h-4" />
          </button>

          <Button type="submit" size="sm" className="gap-1.5 rounded-xl px-4">
            <Send className="w-3.5 h-3.5" /> Send
          </Button>
        </form>
      </div>

      {/* ── Right Panel: Details Sidebar (Toggleable) ────────────────── */}
      {showRightPanel && (
        <div className="w-72 border-l border-border bg-muted/10 p-5 hidden lg:flex flex-col space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-bold text-foreground">Channel Info</h3>
            <button onClick={() => setShowRightPanel(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xl mx-auto shadow-sm">
              {selectedConv.name.slice(0, 2).toUpperCase()}
            </div>
            <h4 className="text-sm font-bold text-foreground">{selectedConv.name}</h4>
            <p className="text-xs text-muted-foreground">{selectedConv.eventInfo || selectedConv.role}</p>
          </div>

          <div className="space-y-3 pt-2">
            <h5 className="text-xs font-bold text-foreground uppercase tracking-wider">Shared Attachments</h5>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="p-2.5 rounded-xl bg-card border border-border flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary shrink-0" />
                <span className="truncate">Loading_Checklist_Royal.pdf</span>
              </div>
              <div className="p-2.5 rounded-xl bg-card border border-border flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="truncate">Stage_Layout_Photo.jpg</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
