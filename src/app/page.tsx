'use client';

import { useState, useEffect, useRef } from 'react';
import ChatBubble from './ChatBubble';
import ChatHistoryPanel from './ChatHistoryPanel';

interface Policy {
  id: number;
  name: string;
  summary: string;
}

interface ImportantTerm {
    term: string;
    description: string;
    details?: string[];
    user_must_know: string;
}

interface Message {
  from: 'user' | 'ai';
  text: string;
  policies?: Policy[];
}

const initialMessages: Message[] = [
    { from: 'ai', text: 'Hello! How can I help you today? You can search for a policy to get started.' }
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [currentChatId, setCurrentChatId] = useState<number | null>(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isProcessing = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const saveCurrentChat = async () => {
    if (messages.length <= 1) return;
    
    try {
        await fetch('http://localhost:8000/history/chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: currentChatId,
                messages: messages,
                selected_policy: selectedPolicy,
            }),
        });
        setHistoryRefreshKey(prev => prev + 1);
    } catch (error) {
        console.error("Failed to save chat session:", error);
    }
  };

  const handleNewChat = async () => {
    await saveCurrentChat();
    setMessages(initialMessages);
    setInputValue('');
    setSelectedPolicy(null);
    setCurrentChatId(null);
  };

  const handleSelectChat = async (id: number) => {
    if (id === currentChatId) return;

    await saveCurrentChat();

    try {
      const response = await fetch(`http://localhost:8000/history/chats/${id}`);
      const data = await response.json();
      setCurrentChatId(data.id);
      setMessages(data.messages);
      setSelectedPolicy(data.selected_policy);
    } catch (error) {
      console.error("Failed to load chat session:", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const userMessage = { from: 'user' as const, text: `Uploaded file: ${file.name}` };
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      
      // Simulate AI response
      setTimeout(() => {
        setMessages((prevMessages) => [...prevMessages, { from: 'ai' as const, text: `I've received "${file.name}". Let me analyze it.` }]);
      }, 1000);
    }
  };

  const searchForPolicy = async (query: string) => {
    try {
      const response = await fetch(`http://localhost:8000/search-policy?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      if (data.length > 0) {
        const aiMessage = {
          from: 'ai' as const,
          text: 'I found these policies for you. Please select one to ask questions:',
          policies: data,
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        const aiResponse = `Sorry, I couldn't find any policies matching "${query}".`;
        setMessages((prev) => [...prev, { from: 'ai' as const, text: aiResponse }]);
      }
    } catch (error) {
      console.error("Error fetching from backend:", error);
      setMessages((prev) => [...prev, { from: 'ai' as const, text: 'Sorry, I am having trouble connecting to the server.' }]);
    }
  };

  const askAboutPolicy = async (policy: Policy, question: string) => {
    try {
      const response = await fetch('http://localhost:8000/ask-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policy_id: policy.id, question: question }),
      });
      const data = await response.json();
      setMessages((prev) => [...prev, { from: 'ai' as const, text: data.answer }]);
    } catch (error) {
      console.error("Error fetching from backend:", error);
      setMessages((prev) => [...prev, { from: 'ai' as const, text: 'Sorry, I am having trouble connecting to the server.' }]);
    }
  };

  const handleSend = async () => {
    if (inputValue.trim() && !isProcessing.current) {
      isProcessing.current = true;
      const userMessage = { from: 'user' as const, text: inputValue };
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      const currentInputValue = inputValue;
      setInputValue('');

      if (selectedPolicy) {
        await askAboutPolicy(selectedPolicy, currentInputValue);
      } else {
        await searchForPolicy(currentInputValue);
      }
      isProcessing.current = false;
    }
  };

  const handlePolicySelect = async (policy: Policy) => {
    setSelectedPolicy(policy);
    const userMessage = { from: 'user' as const, text: `Tell me more about "${policy.name}"`};
    setMessages(prev => [...prev, userMessage]);

    try {
        const response = await fetch(`http://localhost:8000/policy/${policy.id}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const terms: ImportantTerm[] = await response.json();

        let termsText = `Here are the key terms for **${policy.name}**:\n\n`;
        terms.forEach(term => {
            termsText += `**${term.term}:**\n${term.description}\n\n*User must know: ${term.user_must_know}*\n\n---\n\n`;
        });
        termsText += `\nWhat would you like to know about ${policy.name}? You can ask questions like "what is the waiting period?"`;

        const aiMessage = { from: 'ai' as const, text: termsText };
        setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
        console.error("Error fetching policy details:", error);
        setMessages((prev) => [...prev, { from: 'ai' as const, text: 'Sorry, I am having trouble fetching the policy details.' }]);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <ChatHistoryPanel 
        onSelectChat={handleSelectChat}
        activeChatId={currentChatId}
        refreshKey={historyRefreshKey}
      />
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-md p-4 flex justify-between items-center z-10">
          <h1 className="text-2xl font-bold text-gray-800">T&C Summarizer</h1>
          <button
            onClick={handleNewChat}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors"
            title="New Chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col space-y-4">
            {messages.map((msg, index) => (
              <ChatBubble
                key={index}
                message={msg}
                isLastMessage={index === messages.length - 1}
                onPolicySelect={handlePolicySelect}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </main>

        <footer className="bg-white shadow-t-md p-4">
          <div className="flex items-center">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder={selectedPolicy ? `Ask a question about ${selectedPolicy.name}...` : "Search for a policy..."}
                className="w-full rounded-full py-2 pl-12 pr-4 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                disabled={isProcessing.current}
              />
            </div>
             <button
              className="ml-4 rounded-full bg-blue-500 p-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400"
              title="Send"
              onClick={handleSend}
              disabled={isProcessing.current}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
