'use client';

import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config'; // Import the API base URL

interface ChatInfo {
  id: number;
  title: string;
}

interface ChatHistoryPanelProps {
  onSelectChat: (id: number) => void;
  activeChatId: number | null;
  refreshKey: number;
}

const ChatHistoryPanel = ({ onSelectChat, activeChatId, refreshKey }: ChatHistoryPanelProps) => {
  const [chats, setChats] = useState<ChatInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/history/chats`);
        if (!response.ok) {
          throw new Error('Failed to fetch chat history');
        }
        const data = await response.json();
        setChats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error("Error fetching chats:", err);
      }
    };

    fetchChats();
  }, [refreshKey]); // Refreshes when a new chat is created

  return (
    <div className="w-64 bg-gray-800 text-white p-4 flex flex-col">
      <h2 className="text-xl font-bold mb-4">Chat History</h2>
      {error && <p className="text-red-400">{error}</p>}
      <ul className="flex-1 overflow-y-auto">
        {chats.map((chat) => (
          <li key={chat.id} className="mb-2">
            <button
              onClick={() => onSelectChat(chat.id)}
              className={`w-full text-left p-2 rounded-md transition-colors ${
                activeChatId === chat.id
                  ? 'bg-blue-600'
                  : 'hover:bg-gray-700'
              }`}
            >
              {chat.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ChatHistoryPanel; 