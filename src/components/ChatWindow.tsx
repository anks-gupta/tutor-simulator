import React, { useRef, useEffect } from 'react';
import type { Persona } from '../services/tutorService';
import { HITESH_SUGGESTIONS, PIYUSH_SUGGESTIONS, CLASH_SUGGESTIONS } from '../constants/tutor';
import type { ChatMessage } from '../App';

interface ChatWindowProps {
  persona: Persona;
  messages: ChatMessage[];
  inputValue: string;
  onChangeInput: (val: string) => void;
  onSend: () => void;
  isLoading: boolean;
  onSelectSuggestion: (suggestion: string) => void;
  chatMode: 'single' | 'clash';
}

// Custom Markdown Renderer to support bullet lists, headers, paragraphs, and copy-able code blocks
const MarkdownText: React.FC<{ text: string }> = ({ text }) => {
  // Regex split to identify code blocks (three backticks)
  const parts = text.split(/(```[\s\S]*?```)/g);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('```')) {
          // Extract code content and optional language spec
          const lines = part.split('\n');
          const firstLine = lines[0].replace('```', '').trim();
          const language = firstLine || 'code';
          const codeContent = lines.slice(1, -1).join('\n');

          return (
            <div key={index} className="code-block-wrapper" style={{ margin: '12px 0', position: 'relative' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#111827',
                borderTopLeftRadius: '8px',
                borderTopRightRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                borderBottom: '1px solid var(--glass-border)'
              }}>
                <span>{language.toUpperCase()}</span>
                <button
                  onClick={() => copyToClipboard(codeContent)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.75rem'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                >
                  📋 Copy Code
                </button>
              </div>
              <pre style={{ margin: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
                <code>{codeContent}</code>
              </pre>
            </div>
          );
        }

        // Group adjacent list items together under a single ol/ul block to prevent resetting count to 1
        const rawLines = part.split('\n');
        const elements: React.ReactNode[] = [];
        let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;

        const flushList = (key: string) => {
          if (!currentList) return;
          if (currentList.type === 'ul') {
            elements.push(
              <ul key={key} style={{ margin: '6px 0 6px 20px', listStyleType: 'disc' }}>
                {currentList.items.map((item, itemIdx) => (
                  <li key={itemIdx} style={{ margin: '6px 0' }}>{parseInlineMarkdown(item)}</li>
                ))}
              </ul>
            );
          } else {
            elements.push(
              <ol key={key} style={{ margin: '6px 0 6px 20px', listStyleType: 'decimal' }}>
                {currentList.items.map((item, itemIdx) => (
                  <li key={itemIdx} style={{ margin: '6px 0' }}>{parseInlineMarkdown(item)}</li>
                ))}
              </ol>
            );
          }
          currentList = null;
        };

        for (let lIdx = 0; lIdx < rawLines.length; lIdx++) {
          const line = rawLines[lIdx];
          const trimmedLine = line.trim();

          // Skip empty lines when a list is active to keep it grouped,
          // but we can add spacing/margin between items naturally.
          if (trimmedLine === '') {
            if (currentList) {
              continue; // Do not flush or render separate div, keep accumulating
            }
            elements.push(<div key={lIdx} style={{ height: '8px' }}></div>);
            continue;
          }

          // Bullet lists (support optional leading spaces/tabs)
          if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
            const cleaned = trimmedLine.substring(2);
            if (currentList && currentList.type === 'ul') {
              currentList.items.push(cleaned);
            } else {
              flushList(`list-${index}-${lIdx}`);
              currentList = { type: 'ul', items: [cleaned] };
            }
            continue;
          }

          // Numbered / Ordered lists (support optional leading spaces/tabs)
          const matchOrdered = trimmedLine.match(/^(\d+)\.\s(.*)/);
          if (matchOrdered) {
            const cleaned = matchOrdered[2];
            if (currentList && currentList.type === 'ol') {
              currentList.items.push(cleaned);
            } else {
              flushList(`list-${index}-${lIdx}`);
              currentList = { type: 'ol', items: [cleaned] };
            }
            continue;
          }

          // Non-list line: flush any accumulated lists first
          flushList(`list-${index}-${lIdx}`);

          if (trimmedLine.startsWith('### ')) {
            elements.push(<h4 key={lIdx} style={{ fontSize: '1.05rem', fontWeight: 600, margin: '12px 0 6px', color: 'var(--text-primary)' }}>{trimmedLine.replace('### ', '')}</h4>);
          } else if (trimmedLine.startsWith('## ')) {
            elements.push(<h3 key={lIdx} style={{ fontSize: '1.15rem', fontWeight: 600, margin: '14px 0 8px', color: 'var(--text-primary)' }}>{trimmedLine.replace('## ', '')}</h3>);
          } else if (trimmedLine.startsWith('# ')) {
            elements.push(<h2 key={lIdx} style={{ fontSize: '1.25rem', fontWeight: 700, margin: '16px 0 10px', color: 'var(--text-primary)' }}>{trimmedLine.replace('# ', '')}</h2>);
          } else {
            elements.push(<p key={lIdx} style={{ margin: '6px 0' }}>{parseInlineMarkdown(line)}</p>);
          }
        }

        // Flush any trailing lists at the end of this text section
        flushList(`list-end-${index}`);

        return (
          <span key={index}>
            {elements}
          </span>
        );
      })}
    </>
  );
};

// Parser to support inline code markdown (e.g. `const x = 5`) and bold markdown (e.g. **bold**)
function parseInlineMarkdown(text: string): React.ReactNode[] {
  // First split by backticks to extract code snippets
  const parts = text.split(/(`[^`]+`)/g);

  return parts.flatMap((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return [
        <code key={`code-${index}`} style={{
          fontFamily: 'var(--font-mono)',
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '0.85rem'
        }}>
          {part.substring(1, part.length - 1)}
        </code>
      ];
    }
    
    // Now split the non-code part by double asterisks to extract bold snippets
    const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
    return boldParts.map((bPart, bIndex) => {
      if (bPart.startsWith('**') && bPart.endsWith('**')) {
        return (
          <strong key={`bold-${index}-${bIndex}`} style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
            {bPart.substring(2, bPart.length - 2)}
          </strong>
        );
      }
      return bPart;
    });
  });
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  persona,
  messages,
  inputValue,
  onChangeInput,
  onSend,
  isLoading,
  onSelectSuggestion,
  chatMode
}) => {
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const activeSuggestions = chatMode === 'clash'
    ? CLASH_SUGGESTIONS
    : (persona === 'hitesh' ? HITESH_SUGGESTIONS : PIYUSH_SUGGESTIONS);

  // Auto Scroll
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const getTutorDisplayName = () => {
    return persona === 'hitesh' ? 'Hitesh Choudhary' : 'Piyush Garg';
  };

  return (
    <div className="chat-area glass">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-tutor">
          <div className="status"></div>
          <h2>{chatMode === 'clash' ? 'Hitesh VS Piyush (Debate Arena)' : `Talking to ${getTutorDisplayName()}`}</h2>
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {chatMode === 'clash' ? '⚔️ Crossover Battle' : (persona === 'hitesh' ? '🍵 Brewing concepts' : '🚀 Build Mode')}
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--text-secondary)',
            textAlign: 'center',
            gap: '12px',
            padding: '24px'
          }}>
            {chatMode === 'clash' ? (
              <>
                <span className="welcome-illustration pulse" style={{ fontSize: '3.5rem', display: 'inline-block', marginBottom: '8px' }}>
                  🍵 VS 🚀
                </span>
                <h3>Tutor Debate Arena</h3>
                <p style={{ fontSize: '0.85rem', maxWidth: '420px' }}>
                  Enter a controversial coding, stack, or career topic below and watch Hitesh Choudhary & Piyush Garg banter and clash in a friendly debate script!
                </p>
              </>
            ) : (
              <>
                <span 
                  className={`welcome-illustration ${persona === 'piyush' ? 'pulse' : ''}`}
                  style={{ fontSize: '3rem', display: 'inline-block', marginBottom: '8px' }}
                >
                  {persona === 'hitesh' ? '☕' : '💻'}
                </span>
                <h3>
                  Start a conversation with {getTutorDisplayName()}
                  {persona === 'piyush' && <span className="terminal-cursor" />}
                </h3>
                <p style={{ fontSize: '0.85rem', maxWidth: '380px' }}>
                  {persona === 'hitesh' 
                    ? "Ask about JavaScript, React, web frameworks, ed-tech career options, or just start a Chai Break conversation." 
                    : "Ask about Next.js, production architecture, system design, or request feedback to get a direct roast on your projects."}
                </p>
              </>
            )}
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`message-bubble ${msg.role}`}>
              <div className="message-sender" style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '6px', opacity: 0.9 }}>
                {msg.role === 'hitesh' && '🍵 Hitesh Choudhary'}
                {msg.role === 'piyush' && '⚡ Piyush Garg'}
                {msg.role === 'user' && '👤 You'}
              </div>
              <MarkdownText text={msg.text} />
              <div className="message-meta">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))
        )}

        {/* Loading / Typing State */}
        {isLoading && (
          <div className="message-bubble model">
            <div className="typing-indicator">
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Chat Footer */}
      <div className="chat-footer">
        {/* Quick Prompts Suggestions */}
        {!isLoading && (
          <div className="suggestions-pane">
            {activeSuggestions.map((sug, idx) => (
              <button 
                key={idx} 
                className="suggestion-chip" 
                onClick={() => onSelectSuggestion(sug)}
              >
                {sug}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="chat-input-bar">
          <input
            type="text"
            className="chat-input"
            value={inputValue}
            onChange={(e) => onChangeInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={`Message ${getTutorDisplayName()}...`}
            disabled={isLoading}
          />
          <button 
            className="btn-send" 
            onClick={onSend}
            disabled={isLoading || !inputValue.trim()}
          >
            ➔
          </button>
        </div>
      </div>
    </div>
  );
};
