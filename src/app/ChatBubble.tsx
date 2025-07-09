'use client';

import React from 'react';
import { Message, Policy, RecommendedPolicyWithMetrics } from './types';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { useTypewriter } from '../hooks/useTypewriter';

interface ChatBubbleProps {
  message: Message;
  onPolicySelect: (policy: Policy) => void;
  isLastMessage: boolean; // To control the typewriter effect
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, onPolicySelect, isLastMessage }) => {
  const isAi = message.from === 'ai';
  // Call hook unconditionally at the top level
  const typedText = useTypewriter(message.text);
  // Use the hook's return value conditionally
  const displayedText = isAi && isLastMessage ? typedText : message.text;

  return (
    <div className={`flex items-start ${isAi ? 'justify-start' : 'justify-end'}`}>
      {isAi && (
        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
          {/* New AI Chip Icon */}
          <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M12 6V5m0 14v-1m6-7h1M5 12H4m12 0a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      )}

      <div className={`mx-3 p-3 rounded-lg shadow-md max-w-2xl ${isAi ? 'bg-white text-gray-800' : 'bg-blue-500 text-white'}`}>
        <div className="text-sm whitespace-pre-line">
          <ReactMarkdown
            rehypePlugins={[rehypeRaw]}
            components={{
              p: ({...props}) => <p className="mb-0 last:mb-0" {...props} />,
              strong: ({...props}) => <strong className="font-bold" {...props} />,
              em: ({...props}) => <i className="italic" {...props} />,
              ul: ({...props}) => <ul className="mb-0 last:mb-0 pl-5 list-disc" {...props} />,
              ol: ({...props}) => <ol className="mb-0 last:mb-0 pl-5 list-decimal" {...props} />,
              li: ({...props}) => <li className="mb-1" {...props} />,
              br: ({...props}) => <br {...props} />,
            }}
          >
            {displayedText}
          </ReactMarkdown>
        </div>
        {isAi && message.policies && message.policies.length > 0 && (
          <div className="mt-4 border-t pt-3">
            <p className="font-semibold text-lg mb-3">Suggested Policies:</p>
            {message.policies.map((policy) => (
              <button
                key={policy.id}
                onClick={() => onPolicySelect(policy)}
                className="w-full text-left p-3 mb-2 rounded-lg bg-gray-50 hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <p className="font-semibold text-blue-600">{policy.policy_name}</p>
                <p className="text-sm text-gray-600 mt-1">{policy.policy_summary}</p>
              </button>
            ))}
          </div>
        )}
        {isAi && message.recommendedPoliciesWithMetrics && message.recommendedPoliciesWithMetrics.length > 0 && (
          <div className="mt-4 border-t pt-3">
            <p className="font-semibold text-lg mb-3">Recommended Policies:</p>
            {(() => {
              const groupedByInsurer: { [insurerName: string]: { metrics: RecommendedPolicyWithMetrics['insurer_metrics']; policies: Policy[] } } = {};
              message.recommendedPoliciesWithMetrics.forEach(item => {
                const insurerName = (item.insurer_metrics?.insurer_name as string) || 'Unknown Insurer';
                if (!groupedByInsurer[insurerName]) {
                  groupedByInsurer[insurerName] = {
                    metrics: item.insurer_metrics,
                    policies: []
                  };
                }
                groupedByInsurer[insurerName].policies.push(item.policy);
              });
              return Object.entries(groupedByInsurer).map(([insurerName, data]) => (
                <div key={insurerName} className="mb-6 p-4 border rounded-lg bg-gray-50 shadow-sm">
                  <h3 className="font-bold text-blue-700 text-lg mb-2">{insurerName}</h3>
                  {data.metrics && (
                    <div className="overflow-x-auto mb-4">
                      <table className="min-w-full bg-white border border-gray-300 rounded-md">
                        <thead>
                          <tr>
                            <th className="py-2 px-4 border-b text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Metric</th>
                            <th className="py-2 px-4 border-b text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(data.metrics).map(([key, value]) => (
                            <tr key={key} className="border-b last:border-b-0">
                              <td className="py-2 px-4 text-sm text-gray-700">{key.replace(/_/g, ' ').replace(/Total /g, 'Total: ').replace(/Actual /g, 'Actual: ')}</td>
                              <td className="py-2 px-4 text-sm text-gray-700">{typeof value === 'number' ? value.toFixed(4) : (typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value))}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <p className="font-semibold text-gray-800 mb-2">Policies from {insurerName}:</p>
                  <div className="space-y-2">
                    {data.policies.map(policy => (
                      <div key={policy.id}>
                        <button
                          onClick={() => onPolicySelect(policy)}
                          className="w-full text-left p-3 mb-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <p className="font-semibold text-blue-600">{policy.policy_name}</p>
                          <p className="text-sm text-gray-600 mt-1">{policy.policy_summary}</p>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>
        )}
      </div>

      {!isAi && (
        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
          {/* New User Icon */}
          <svg className="w-6 h-6 text-blue-100" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
          </svg>
        </div>
      )}
    </div>
  );
};

export default ChatBubble;