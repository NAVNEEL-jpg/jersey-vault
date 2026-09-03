import React, { useState, useRef, useEffect } from 'react';
import BrandLogo from './BrandLogo';
import { supabase } from '../supabase';

const statusLabels = ["", "ORDER PLACED", "PACKED", "SHIPPED", "OUT FOR DELIVERY", "DELIVERED"];

const GREETING = '⚽ Welcome to JerseyVault Support!\n\nAsk me anything about sizing, shipping, payments, returns, or track your order in real-time by pasting your Order ID or Tracking ID!';


const loadHistory = () => {
  try {
    const saved = sessionStorage.getItem('jv_chat_history');
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
};

const saveHistory = (h) => {
  try { sessionStorage.setItem('jv_chat_history', JSON.stringify(h)); } catch {}
};

const clearSession = () => {
  try {
    sessionStorage.removeItem('jv_chat_history');
    sessionStorage.removeItem('jv_chat_uid');
  } catch {}
};

export default function SupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState(() => loadHistory());
  const [loading, setLoading] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);

  const messagesEndRef = useRef(null);
  const chatRef = useRef(null);

  // Sync history to sessionStorage whenever it changes
  useEffect(() => {
    if (history.length > 0) saveHistory(history);
  }, [history]);

  // Watch auth state — reset chat on login/logout/account switch
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUid = session?.user?.id ?? null;
      const storedUid = sessionStorage.getItem('jv_chat_uid');

      // uid changed (new login, logout, or switch account)
      if (newUid !== storedUid) {
        clearSession();
        if (newUid) {
          sessionStorage.setItem('jv_chat_uid', newUid);
        }
        // Reset chat to fresh greeting
        setHistory([{ role: 'model', text: GREETING }]);
        setIsOpen(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Handle click outside to close chat
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isOpen && chatRef.current && !chatRef.current.contains(e.target) && !e.target.closest('.chat-fab')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Initial greeting
  useEffect(() => {
    if (history.length === 0) {
      setHistory([
        {
          role: 'model',
          text: '⚽ Welcome to JerseyVault Support!\n\nAsk me anything about sizing, shipping, payments, returns, or track your order in real-time by pasting your Order ID or Tracking ID!'
        }
      ]);
    }
  }, [history.length]);

  // Scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, loading]);

  const toggleChat = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      setHasNewMessage(false);
    }
  };

  const sendMessage = async (textToSend) => {
    const text = (textToSend || message).trim();
    if (!text) return;

    if (!textToSend) {
      setMessage('');
    }

    // Add user message to history
    const updatedHistory = [...history, { role: 'user', text }];
    setHistory(updatedHistory);
    setLoading(true);

    try {
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
      const supabaseKey = process.env.REACT_APP_SUPABASE_KEY || '';
      const response = await fetch(`${supabaseUrl}/functions/v1/chatbot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          message: text
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setHistory(prev => [...prev, { role: 'model', text: data.text, orderData: data.orderData }]);
      } else {
        setHistory(prev => [...prev, { role: 'model', text: 'Sorry, I am having trouble connecting to the support server. Please try again or reach out on WhatsApp at +91 70297 86817.' }]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setHistory(prev => [...prev, { role: 'model', text: 'An error occurred. Please verify your connection or chat with us on WhatsApp at +91 70297 86817.' }]);
    } finally {
      setLoading(false);
      if (!isOpen) {
        setHasNewMessage(true);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const handleQuickAction = (topic) => {
    if (topic === 'human') {
      const text = 'How can I contact a human support agent?';
      sendMessage(text);
    } else if (topic === 'track') {
      setHistory(prev => [...prev, 
        { role: 'user', text: 'I want to track my order' },
        { role: 'model', text: 'Sure! Please paste the **Order ID** sent to your email (starts with `pay_`, `order_`, or `COD-`) to check status. You can also query it directly on our **[Order Tracking Page](/tracking)**.' }
      ]);
    } else if (topic === 'size') {
      sendMessage('What is the sizing guide for jerseys?');
    } else if (topic === 'return') {
      sendMessage('What is your return policy?');
    }
  };

  const handleMessageClick = (e) => {
    const link = e.target.closest('a');
    if (link) {
      setIsOpen(false);

      const href = link.getAttribute('href');
      if (href === '/cart' || href === '#cart') {
        e.preventDefault();
        if (window.location.pathname === '/') {
          window.dispatchEvent(new CustomEvent('open-cart'));
        } else {
          window.location.href = '/?openCart=true';
        }
      }
    }
  };

  // Helper to convert simple markdown links, bolds, and bullet points to HTML
  const formatText = (text) => {
    if (!text) return '';
    let formatted = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Bold formatting: **text** -> <strong>text</strong>
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Bullet points & Tables formatting
    const lines = formatted.split('\n');
    let inList = false;
    let inTable = false;
    let tableHtml = '';
    const processedLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const isTableRow = line.startsWith('|') && line.endsWith('|');

      if (isTableRow) {
        const isAlignRow = /^\|[\s:\-\|]+$/.test(line);
        if (isAlignRow) {
          continue;
        }

        const cols = line.split('|').slice(1, -1).map(c => c.trim());

        if (!inTable) {
          inTable = true;
          tableHtml = '<div style="overflow-x: auto; margin: 12px 0; border: 1px solid rgba(57, 255, 20, 0.15); border-radius: 8px;"><table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: center; background: rgba(0,0,0,0.3);">';
          tableHtml += '<thead style="background: rgba(57, 255, 20, 0.1); border-bottom: 1px solid rgba(57, 255, 20, 0.25);">';
          tableHtml += '<tr>';
          cols.forEach(col => {
            tableHtml += `<th style="padding: 10px 8px; font-weight: 700; color: #39ff14; white-space: nowrap;">${col}</th>`;
          });
          tableHtml += '</tr></thead><tbody>';
        } else {
          tableHtml += '<tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">';
          cols.forEach(col => {
            tableHtml += `<td style="padding: 8px 8px; color: #eee; white-space: nowrap;">${col}</td>`;
          });
          tableHtml += '</tr>';
        }
      } else {
        if (inTable) {
          inTable = false;
          tableHtml += '</tbody></table></div>';
          processedLines.push(tableHtml);
          tableHtml = '';
        }

        if (line.startsWith('- ') || line.startsWith('* ')) {
          const itemContent = line.replace(/^[\s-*]+/, '');
          if (!inList) {
            inList = true;
            processedLines.push(`<ul style="margin-left: 16px; margin-bottom: 8px;"><li>${itemContent}</li>`);
          } else {
            processedLines.push(`<li>${itemContent}</li>`);
          }
        } else {
          if (inList) {
            inList = false;
            processedLines.push(`</ul>${line}<br/>`);
          } else {
            processedLines.push(line ? `${line}<br/>` : '<br/>');
          }
        }
      }
    }

    if (inTable) {
      tableHtml += '</tbody></table></div>';
      processedLines.push(tableHtml);
    }
    if (inList) {
      processedLines.push('</ul>');
    }

    let finalHtml = processedLines.join('');

    // 1. Handle markdown links: [text](url)
    finalHtml = finalHtml.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
      const isRelative = url.startsWith('/');
      const targetAttr = isRelative ? '' : 'target="_blank" rel="noopener noreferrer"';
      return `<a href="${url}" ${targetAttr} style="color: #39ff14; text-decoration: underline; font-weight: bold;">${text}</a>`;
    });

    // 2. Handle standard raw URLs (not already parsed into <a> tags)
    finalHtml = finalHtml.replace(
      /(?<!href=")(https?:\/\/[^\s<]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: #39ff14; text-decoration: underline;">$1</a>'
    );

    return finalHtml;
  };

  return (
    <>
      <style>{`
        .chat-fab {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #39ff14;
          color: #000;
          border: none;
          box-shadow: 0 4px 20px rgba(57, 255, 20, 0.4);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s;
        }
        .chat-fab:hover {
          transform: scale(1.08) translateY(-2px);
          box-shadow: 0 6px 24px rgba(57, 255, 20, 0.6);
        }
        .chat-fab-badge {
          position: absolute;
          top: 0;
          right: 0;
          width: 14px;
          height: 14px;
          background: #ff3b30;
          border-radius: 50%;
          border: 2px solid #39ff14;
        }
        .chat-container {
          position: fixed;
          bottom: 96px;
          right: 24px;
          width: 380px;
          height: 520px;
          background: rgba(17, 17, 17, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
          display: flex;
          flex-direction: column;
          z-index: 1000;
          overflow: hidden;
          font-family: 'Barlow', sans-serif;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          animation: chatOpen 0.25s cubic-bezier(0.25, 1, 0.5, 1) both;
          transform-origin: bottom right;
        }
        @keyframes chatOpen {
          from { opacity: 0; transform: scale(0.8) translate(10px, 10px); }
          to { opacity: 1; transform: scale(1) translate(0, 0); }
        }
        .chat-header {
          background: rgba(30, 30, 30, 0.5);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .chat-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 16px;
          letter-spacing: 2px;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .chat-title-dot {
          width: 8px;
          height: 8px;
          background: #39ff14;
          border-radius: 50%;
          box-shadow: 0 0 8px #39ff14;
        }
        .chat-close-btn {
          background: none;
          border: none;
          color: #888;
          font-size: 20px;
          cursor: pointer;
          transition: color 0.2s;
        }
        .chat-close-btn:hover {
          color: #fff;
        }
        .chat-messages {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .chat-messages::-webkit-scrollbar {
          width: 4px;
        }
        .chat-messages::-webkit-scrollbar-thumb {
          background: #39ff1450;
          border-radius: 2px;
        }
        .chat-bubble {
          max-width: 85%;
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 14px;
          line-height: 1.45;
          word-break: break-word;
        }
        .chat-bubble.model {
          background: rgba(255, 255, 255, 0.05);
          color: #e0e0e0;
          align-self: flex-start;
          border-bottom-left-radius: 2px;
          border: 1px solid rgba(255, 255, 255, 0.03);
        }
        .chat-bubble.user {
          background: #39ff1418;
          color: #fff;
          align-self: flex-end;
          border-bottom-right-radius: 2px;
          border: 1px solid rgba(57, 255, 20, 0.2);
        }
        .chat-quick-chips {
          display: flex;
          gap: 8px;
          padding: 8px 16px;
          overflow-x: auto;
          white-space: nowrap;
          border-top: 1px solid rgba(255, 255, 255, 0.04);
        }
        .chat-quick-chips::-webkit-scrollbar {
          display: none;
        }
        .chat-chip {
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          color: #bbb;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .chat-chip:hover {
          background: #39ff1410;
          border-color: #39ff14;
          color: #39ff14;
        }
        .chat-input-area {
          padding: 12px 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          gap: 8px;
          background: rgba(20, 20, 20, 0.4);
        }
        .chat-input {
          flex: 1;
          background: #181818;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 10px 12px;
          color: #fff;
          font-family: inherit;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }
        .chat-input:focus {
          border-color: #39ff14;
        }
        .chat-send-btn {
          background: #39ff14;
          color: #000;
          border: none;
          border-radius: 8px;
          padding: 0 16px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          transition: transform 0.2s, background 0.2s;
        }
        .chat-send-btn:hover {
          background: #32e612;
          transform: translateY(-1px);
        }
        .chat-send-btn:disabled {
          background: #222;
          color: #666;
          cursor: not-allowed;
          transform: none;
        }
        .typing-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
        }
        .typing-dot {
          width: 6px;
          height: 6px;
          background: #888;
          border-radius: 50%;
          animation: typingBounce 1.4s infinite both;
        }
        .typing-dot:nth-child(2) { animation-delay: .2s; }
        .typing-dot:nth-child(3) { animation-delay: .4s; }
        @keyframes typingBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        
        .chat-order-card {
          margin-top: 8px;
          background: rgba(0, 0, 0, 0.25);
          border: 1px dashed rgba(57, 255, 20, 0.3);
          border-radius: 8px;
          padding: 10px;
          font-size: 13px;
        }
        .chat-order-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        .chat-order-label {
          color: #777;
        }
        .chat-order-val {
          color: #fff;
          font-weight: 600;
        }

        @media (max-width: 480px) {
          .chat-container {
            width: calc(100% - 32px);
            height: calc(100% - 120px);
            bottom: 88px;
            right: 16px;
          }
          .chat-fab {
            bottom: 16px;
            right: 16px;
          }
        }
      `}</style>

      {/* FLOATING ACTION BUTTON */}
      <button className="chat-fab" onClick={toggleChat} aria-label="Open support chat">
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            {hasNewMessage && <div className="chat-fab-badge" />}
          </div>
        )}
      </button>

      {/* CHAT WINDOW */}
      {isOpen && (
        <div className="chat-container" ref={chatRef}>
          <div className="chat-header">
            <BrandLogo logoSize="28px" textSize="18px" onClick={(e) => { e.stopPropagation(); }} />
            <button className="chat-close-btn" onClick={toggleChat}>×</button>
          </div>

          <div className="chat-messages" onClick={handleMessageClick}>
            {history.map((msg, i) => (
              <React.Fragment key={i}>
                <div 
                  className={`chat-bubble ${msg.role}`}
                  dangerouslySetInnerHTML={{ __html: formatText(msg.text) }}
                />
                {msg.orderData && (
                  <div className="chat-bubble model chat-order-card">
                    <div style={{ fontWeight: '700', color: '#39ff14', marginBottom: '6px', borderBottom: '1px solid rgba(57,255,20,0.15)', paddingBottom: '4px' }}>
                      📋 LIVE TRACKING DETAILS
                    </div>
                    <div className="chat-order-row">
                      <span className="chat-order-label">Order ID:</span>
                      <span className="chat-order-val" style={{ fontSize: '11px' }}>{msg.orderData.id}</span>
                    </div>
                    <div className="chat-order-row">
                      <span className="chat-order-label">Tracking ID:</span>
                      <span className="chat-order-val">{msg.orderData.tracking_id || 'N/A'}</span>
                    </div>
                    <div className="chat-order-row">
                      <span className="chat-order-label">Current Status:</span>
                      <span className="chat-order-val" style={{ color: '#39ff14' }}>
                        {statusLabels[msg.orderData.status] || 'UNKNOWN'}
                      </span>
                    </div>
                    <div className="chat-order-row">
                      <span className="chat-order-label">Order Date:</span>
                      <span className="chat-order-val">
                        {new Date(msg.orderData.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#888', fontWeight: 'bold' }}>
                        <span style={{ color: msg.orderData.status >= 1 ? '#39ff14' : '#888' }}>PLACED</span>
                        <span style={{ color: msg.orderData.status >= 2 ? '#39ff14' : '#888' }}>PACKED</span>
                        <span style={{ color: msg.orderData.status >= 3 ? '#39ff14' : '#888' }}>SHIPPED</span>
                        <span style={{ color: msg.orderData.status >= 5 ? '#39ff14' : '#888' }}>DELIVERED</span>
                      </div>
                      <div style={{ position: 'relative', height: '6px', background: '#222', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ 
                          position: 'absolute', 
                          top: 0, 
                          left: 0, 
                          height: '100%', 
                          background: '#39ff14', 
                          boxShadow: '0 0 8px #39ff14',
                          width: `${Math.min(100, Math.max(15, (msg.orderData.status / 5) * 100))}%`,
                          transition: 'width 0.5s ease-out' 
                        }} />
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}

            {loading && (
              <div className="chat-bubble model" style={{ padding: '8px 12px' }}>
                <div className="typing-indicator">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-quick-chips">
            <button className="chat-chip" onClick={() => handleQuickAction('track')}>🚚 Track Order</button>
            <button className="chat-chip" onClick={() => handleQuickAction('size')}>📏 Size Guide</button>
            <button className="chat-chip" onClick={() => handleQuickAction('return')}>🔄 Return Policy</button>
            <button className="chat-chip" onClick={() => handleQuickAction('human')}>👤 Talk to Human</button>
          </div>

          <div className="chat-input-area">
            <input
              type="text"
              className="chat-input"
              placeholder="Ask a question or paste tracking ID..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              className="chat-send-btn"
              onClick={() => sendMessage()}
              disabled={loading || !message.trim()}
            >
              SEND
            </button>
          </div>
        </div>
      )}
    </>
  );
}
