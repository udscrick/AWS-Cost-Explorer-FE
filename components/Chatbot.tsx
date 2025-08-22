
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { SendIcon, BotIcon } from './icons';
import LoadingSpinner from './LoadingSpinner';

interface ChatbotProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const Chatbot: React.FC<ChatbotProps> = ({ messages, onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg flex flex-col h-[calc(100vh-18rem)] max-h-[700px]">
      <div className="p-4 border-b border-gray-700 flex items-center space-x-3">
        <BotIcon className="fa-xl text-sky-400" />
        <h3 className="text-lg font-bold text-white">FinOps Copilot</h3>
      </div>
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.length === 0 && (
            <div className="text-center text-gray-400 text-sm mt-4">
                Ask me anything about your cost data, like "Why did my costs spike?" or "What services can I downgrade safely?".
            </div>
        )}
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
            {msg.sender === 'bot' && <BotIcon className="fa-lg text-sky-400 flex-shrink-0" />}
            <div
              className={`max-w-xs md:max-w-sm lg:max-w-md rounded-lg px-4 py-2 ${
                msg.sender === 'user'
                  ? 'bg-sky-600 text-white'
                  : 'bg-gray-700 text-gray-200'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
         {isLoading && (
            <div className="flex items-start gap-3">
                 <BotIcon className="fa-lg text-sky-400 flex-shrink-0" />
                 <div className="bg-gray-700 rounded-lg px-4 py-3">
                    <LoadingSpinner className="w-5 h-5" />
                 </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-gray-700">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-sky-500 text-white rounded-md hover:bg-sky-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center w-10 h-10"
          >
            <SendIcon />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chatbot;
