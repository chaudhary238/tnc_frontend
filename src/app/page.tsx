'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { Message, Policy, ChatInfo, ImportantTerm } from './types';
import ChatBubble from './ChatBubble';
import InsurerAnalytics from './InsurerAnalytics';
import PolicyRecommendation from './PolicyRecommendation';

type ActiveTab = 'chat' | 'compare' | 'analytics';

const INITIAL_GREETING: Message = {
  from: 'ai',
  text: "Hello! I'm your AI assistant for health insurance policies. Feel free to ask me about a specific plan, or I can help you find a new one. How can I help you today?"
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_GREETING]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatInfo[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');

  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('/api/chat-history');
        if (response.ok) {
          const data: ChatInfo[] = await response.json();
          setChatHistory(data);
        }
      } catch (error) {
        console.error("Failed to fetch chat history:", error);
      }
    };
    fetchHistory();
  }, []);

  const handleNewChat = () => {
    setActiveChatId(null);
    setSelectedPolicy(null);
    setMessages([INITIAL_GREETING]);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    setActiveTab('chat');
  };

  const loadChat = async (chatId: string) => {
    if (activeChatId === chatId) return;
    setIsLoading(true);
    setActiveTab('chat');
    try {
      const response = await fetch(`/api/chat-history/${chatId}`);
      if (response.ok) {
        const data = await response.json();
        setActiveChatId(chatId);
        setMessages(data.messages || []);
        setSelectedPolicy(data.selected_policy || null);
      } else {
        console.error("Failed to load chat session:", await response.text());
        handleNewChat();
      }
    } catch (error) {
      console.error("Error loading chat session:", error);
      handleNewChat();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (isLoading || !inputRef.current?.value) return;

    const userQuery = inputRef.current.value;
    const userMessage: Message = { from: 'user', text: userQuery };
    
    setMessages(prev => [...prev, userMessage, { from: 'ai', text: 'Thinking...' }]);
    setIsLoading(true);

    try {
      // Filter out the initial greeting from the history sent to the API by comparing text content
      const history = messages.filter(m => m.text !== INITIAL_GREETING.text).slice(-8);

      const response = await fetch('/api/ask-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userQuery,
          policy_id: selectedPolicy?.id,
          history: history,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }
      
      const responseData = await response.json();

      // --- Handle Multi-Stage Responses ---
      let finalAiMessage: Message;
      if (responseData.action === 'clarification') {
        finalAiMessage = { 
          from: 'ai', 
          text: responseData.answer,
          policies: responseData.policies, // Attach policies for clarification
        };
      } else {
        // This handles regular agent chats, RAG answers, and future structured data
        finalAiMessage = { 
          from: 'ai', 
          text: responseData.answer || "Sorry, I encountered an issue and couldn't get a response.",
          recommendedPoliciesWithMetrics: responseData.recommended_policies_with_metrics
        };
      }
      
      setMessages(prev => [...prev.slice(0, -1), finalAiMessage]);

    } catch (error) {
      console.error("Failed to get response:", error);
      setMessages(prev => [...prev.slice(0, -1), { from: 'ai', text: "Sorry, I'm having trouble connecting. Please try again later." }]);
    } finally {
      setIsLoading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handlePolicySelect = async (policy: Policy) => {
    setSelectedPolicy(policy);
    const userMessage: Message = { from: 'user', text: `Tell me more about "${policy.policy_name}"` };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/get-crucial-terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policy_id: policy.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch crucial terms');
      }
      const crucialTerms: ImportantTerm[] = await response.json();

      let termsText = `Here are the crucial terms for **${policy.policy_name}**:`;
      if (crucialTerms && crucialTerms.length > 0) {
          const firstTerm = crucialTerms[0];
          termsText += `\n\n**${firstTerm.term}**: ${firstTerm.description}`;
          
          if (crucialTerms.length > 1) {
              termsText += `\n\nI can also tell you about other terms like:`;
              crucialTerms.slice(1, 4).forEach(term => {
                  termsText += `\n- *${term.term}*`;
              });
          }
      } else {
          termsText += `\nNo crucial terms found for **${policy.policy_name}**`;
      }
      
      termsText += `\n\nWhat would you like to know about ${policy.policy_name}? You can ask questions like "what is the waiting period?"`;

      setMessages(prev => [...prev, { from: 'ai', text: termsText }]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { from: 'ai', text: `Sorry, I couldn't get the details for ${policy.policy_name}.` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex h-screen bg-gray-100">
      <div className="w-64 bg-white p-4 border-r border-gray-200 flex flex-col">
        <h1 className="text-2xl font-bold mb-6">PolicyAI</h1>
        <nav className="flex flex-col space-y-2 mb-6">
          <button onClick={() => setActiveTab('chat')} className={`w-full text-left py-2 px-4 rounded ${activeTab === 'chat' ? 'bg-blue-500 text-white' : 'text-gray-900 hover:bg-gray-200'}`}>
            Chat
          </button>
          <button onClick={() => setActiveTab('compare')} className={`w-full text-left py-2 px-4 rounded ${activeTab === 'compare' ? 'bg-blue-500 text-white' : 'text-gray-900 hover:bg-gray-200'}`}>
            Compare Policies
          </button>
          <button onClick={() => setActiveTab('analytics')} className={`w-full text-left py-2 px-4 rounded ${activeTab === 'analytics' ? 'bg-blue-500 text-white' : 'text-gray-900 hover:bg-gray-200'}`}>
            Insurer Analytics
          </button>
        </nav>
        <div className="flex-grow border-t pt-4">
          <h2 className="text-lg font-semibold mb-3">Chat History</h2>
          <button onClick={handleNewChat} className="mb-3 w-full text-left py-2 px-3 rounded bg-blue-500 text-white hover:bg-blue-600 text-sm">
            + New Chat
          </button>
          <div className="flex-grow overflow-y-auto">
            {chatHistory.map(chat => (
              <button
                key={chat.id}
                onClick={() => loadChat(chat.id)}
                className={`w-full text-left py-2 px-3 rounded truncate text-sm ${activeChatId === chat.id ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}
              >
                {chat.title || "Untitled Chat"}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col bg-white">
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col p-4 overflow-hidden">
            <h1 className="text-2xl font-bold mb-4 text-gray-800">Policy Chatbot</h1>
            {selectedPolicy && (
              <div className="mb-4 p-2 bg-blue-100 rounded-lg">
                <p className="text-sm font-semibold">Chatting about: {selectedPolicy.policy_name}</p>
              </div>
            )}
            <div ref={chatContainerRef} className="flex-1 space-y-4 overflow-y-auto pr-4">
              {messages
                .filter(Boolean) 
                .map((message, index) => (
                <ChatBubble
                  key={index}
                  message={message}
                  isLastMessage={index === messages.length - 1}
                  onPolicySelect={handlePolicySelect}
                />
              ))}
              {isLoading && messages.length > 0 && messages[messages.length - 1]?.from !== 'ai' && (
                <ChatBubble
                  message={{ from: 'ai', text: 'Thinking...' }}
                  isLastMessage={true}
                  onPolicySelect={() => {}}
                />
              )}
            </div>
            <div className="mt-4">
              <form onSubmit={handleSearch}>
                <div className="flex items-center">
                  <input
                    type="text"
                    ref={inputRef}
                    placeholder={isLoading ? "Thinking..." : (selectedPolicy ? `Ask about ${selectedPolicy.policy_name}...` : "Type your message...")}
                    className="flex-grow p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  <button type="submit" disabled={isLoading} className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300">
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {activeTab === 'compare' && <PolicyRecommendation />}
        {activeTab === 'analytics' && <InsurerAnalytics />}
      </div>
    </main>
  );
}