'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

// A custom hook for the typewriter effect
const useTypewriter = (text: string) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    setDisplayedText('');
    let i = 0;
    const intervalId = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(prev => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(intervalId);
      }
    }, 15); // Adjust typing speed here

    return () => clearInterval(intervalId);
  }, [text]);

  return displayedText;
};

// The main ChatBubble component
interface Policy {
  id: number;
  name: string;
  summary: string;
}

interface ChatBubbleProps {
  message: {
    from: 'user' | 'ai';
    text: string;
    policies?: Policy[]; // Explicitly type the policies array
  };
  isLastMessage: boolean;
  onPolicySelect: (policy: Policy) => void; // onPolicySelect is required
}

const ChatBubble = ({ message, isLastMessage, onPolicySelect }: ChatBubbleProps) => {
  const isAi = message.from === 'ai';
  const textToRender = isAi && isLastMessage ? useTypewriter(message.text) : message.text;

  return (
    <div className={`flex items-start ${isAi ? '' : 'justify-end'}`}>
      {isAi && (
        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
          AI
        </div>
      )}
      <div className={`ml-3 p-3 rounded-lg shadow-md max-w-2xl ${isAi ? 'bg-white text-gray-800' : 'bg-blue-500 text-white'}`}>
        <div className="text-sm whitespace-pre-wrap">
          <ReactMarkdown
             components={{
                p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                em: ({node, ...props}) => <i className="italic" {...props} />,
             }}
          >
            {textToRender}
          </ReactMarkdown>
        </div>
        {/* Render policy selection buttons if policies exist */}
        {message.policies && message.policies.length > 0 && onPolicySelect && (
          <div className="mt-4 border-t pt-3">
            {message.policies.map((policy) => (
              <button 
                key={policy.id} 
                onClick={() => onPolicySelect(policy)}
                className="w-full text-left p-3 mb-2 rounded-lg bg-gray-50 hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <p className="font-semibold text-blue-600">{policy.name}</p>
                <p className="text-sm text-gray-600 mt-1">{policy.summary}</p>
              </button>
            ))}
          </div>
        )}
      </div>
      {!isAi && (
        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center ml-3">
          U
        </div>
      )}
    </div>
  );
};

export default ChatBubble; 