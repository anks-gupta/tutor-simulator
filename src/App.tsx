"use client";

import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { chatWithTutor, generateDebate } from './services/tutorService';
import type { Persona } from './services/tutorService';

export interface ChatMessage {
  id: string;
  role: 'user' | 'hitesh' | 'piyush';
  text: string;
  timestamp: Date;
}

export default function App() {
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // Initial states set to defaults to ensure server-client HTML matching
  const [activePersona, setActivePersona] = useState<Persona>('hitesh');
  const [hiteshMessages, setHiteshMessages] = useState<ChatMessage[]>([]);
  const [piyushMessages, setPiyushMessages] = useState<ChatMessage[]>([]);
  const [chatMode, setChatMode] = useState<'single' | 'clash'>('single');
  const [clashMessages, setClashMessages] = useState<ChatMessage[]>([]);

  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 1. Client-side state hydration
  useEffect(() => {
    setIsMounted(true);

    const savedPersona = localStorage.getItem('tutor_chat_active_persona');
    if (savedPersona === 'hitesh' || savedPersona === 'piyush') {
      setActivePersona(savedPersona);
    }

    const savedMode = localStorage.getItem('tutor_chat_mode');
    if (savedMode === 'single' || savedMode === 'clash') {
      setChatMode(savedMode);
    }

    try {
      const savedHitesh = localStorage.getItem('tutor_chat_hitesh_messages');
      if (savedHitesh) {
        const parsed = JSON.parse(savedHitesh);
        if (Array.isArray(parsed)) {
          setHiteshMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
        }
      }
    } catch (e) {
      console.error(e);
    }

    try {
      const savedPiyush = localStorage.getItem('tutor_chat_piyush_messages');
      if (savedPiyush) {
        const parsed = JSON.parse(savedPiyush);
        if (Array.isArray(parsed)) {
          setPiyushMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
        }
      }
    } catch (e) {
      console.error(e);
    }

    try {
      const savedClash = localStorage.getItem('tutor_chat_clash_messages');
      if (savedClash) {
        const parsed = JSON.parse(savedClash);
        if (Array.isArray(parsed)) {
          setClashMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // 2. Action triggers to modify and persist values securely
  const handleChangePersona = (persona: Persona) => {
    setActivePersona(persona);
    localStorage.setItem('tutor_chat_active_persona', persona);
  };

  const handleChangeChatMode = (mode: 'single' | 'clash') => {
    setChatMode(mode);
    localStorage.setItem('tutor_chat_mode', mode);
  };

  // Dynamically update CSS custom properties for Glassmorphism accents
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (activePersona === 'hitesh') {
        root.style.setProperty('--active-accent', 'var(--accent-hitesh)');
        root.style.setProperty('--active-glow', 'var(--accent-hitesh-glow)');
      } else {
        root.style.setProperty('--active-accent', 'var(--accent-piyush)');
        root.style.setProperty('--active-glow', 'var(--accent-piyush-glow)');
      }
    }
  }, [activePersona]);

  const handleSend = async (textToSend: string = inputValue) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    const newUserMessage: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      role: 'user',
      text: trimmed,
      timestamp: new Date()
    };

    if (chatMode === 'clash') {
      setClashMessages((prev) => {
        const next = [...prev, newUserMessage];
        localStorage.setItem('tutor_chat_clash_messages', JSON.stringify(next));
        return next;
      });
      setInputValue('');
      triggerClashResponse(trimmed);
      return;
    }

    if (activePersona === 'hitesh') {
      const next = [...hiteshMessages, newUserMessage];
      setHiteshMessages(next);
      localStorage.setItem('tutor_chat_hitesh_messages', JSON.stringify(next));
      triggerAIResponse('hitesh', next);
    } else {
      const next = [...piyushMessages, newUserMessage];
      setPiyushMessages(next);
      localStorage.setItem('tutor_chat_piyush_messages', JSON.stringify(next));
      triggerAIResponse('piyush', next);
    }

    setInputValue('');
  };

  const triggerClashResponse = async (topic: string) => {
    setIsLoading(true);

    try {
      const debateScript = await generateDebate(topic);

      for (let i = 0; i < debateScript.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const turn = debateScript[i];
        const newAIMessage: ChatMessage = {
          id: Math.random().toString(36).substring(2, 9),
          role: turn.tutor,
          text: turn.text,
          timestamp: new Date()
        };

        setClashMessages((prev) => {
          const next = [...prev, newAIMessage];
          localStorage.setItem('tutor_chat_clash_messages', JSON.stringify(next));
          return next;
        });
      }
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        role: 'hitesh',
        text: `⚠️ Clash Error: ${err.message || 'Failed to generate debate script.'}`,
        timestamp: new Date()
      };
      setClashMessages((prev) => {
        const next = [...prev, errorMessage];
        localStorage.setItem('tutor_chat_clash_messages', JSON.stringify(next));
        return next;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const triggerAIResponse = async (tutor: Persona, history: ChatMessage[]) => {
    setIsLoading(true);

    const apiHistory = history.map((m) => ({
      role: m.role === 'user' ? ('user' as const) : ('model' as const),
      text: m.text
    }));

    try {
      const reply = await chatWithTutor(tutor, apiHistory);

      const newAIMessage: ChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        role: tutor,
        text: reply,
        timestamp: new Date()
      };

      if (tutor === 'hitesh') {
        setHiteshMessages((prev) => {
          const next = [...prev, newAIMessage];
          localStorage.setItem('tutor_chat_hitesh_messages', JSON.stringify(next));
          return next;
        });
      } else {
        setPiyushMessages((prev) => {
          const next = [...prev, newAIMessage];
          localStorage.setItem('tutor_chat_piyush_messages', JSON.stringify(next));
          return next;
        });
      }
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        role: tutor,
        text: `⚠️ Error: ${err.message || 'Something went wrong.'}`,
        timestamp: new Date()
      };

      if (tutor === 'hitesh') {
        setHiteshMessages((prev) => {
          const next = [...prev, errorMessage];
          localStorage.setItem('tutor_chat_hitesh_messages', JSON.stringify(next));
          return next;
        });
      } else {
        setPiyushMessages((prev) => {
          const next = [...prev, errorMessage];
          localStorage.setItem('tutor_chat_piyush_messages', JSON.stringify(next));
          return next;
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    handleSend(suggestion);
  };

  const activeMessages = activePersona === 'hitesh' ? hiteshMessages : piyushMessages;

  // Render a clean structural layout shell during SSR mounting to prevent hydration jumps
  if (!isMounted) {
    return (
      <div className="app-container" style={{ opacity: 0 }}>
        <div className="glow-blobs-container">
          <div className="glow-blob glow-blob-1"></div>
          <div className="glow-blob glow-blob-2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Premium Ambient Glow Blobs Background */}
      <div className="glow-blobs-container">
        <div className="glow-blob glow-blob-1"></div>
        <div className="glow-blob glow-blob-2"></div>
      </div>

      {/* Sidebar Navigation */}
      <Sidebar
        activePersona={activePersona}
        onChangePersona={handleChangePersona}
        chatMode={chatMode}
        onChangeChatMode={handleChangeChatMode}
      />

      {/* Main Interactive Chat Window */}
      <ChatWindow
        persona={activePersona}
        messages={chatMode === 'clash' ? clashMessages : activeMessages}
        inputValue={inputValue}
        onChangeInput={setInputValue}
        onSend={() => handleSend()}
        isLoading={isLoading}
        onSelectSuggestion={handleSelectSuggestion}
        chatMode={chatMode}
      />
    </div>
  );
}
