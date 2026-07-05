import React from 'react';
import type { Persona } from '../services/tutorService';

interface SidebarProps {
  activePersona: Persona;
  onChangePersona: (persona: Persona) => void;
  chatMode: 'single' | 'clash';
  onChangeChatMode: (mode: 'single' | 'clash') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePersona,
  onChangePersona,
  chatMode,
  onChangeChatMode
}) => {
  return (
    <div className="sidebar glass">
      {/* App Branding */}
      <div className="sidebar-branding">
        <h1>Dev Tutor Simulator</h1>
        <p>Simulate conversations with top Indian tech educators.</p>
      </div>

      {/* Mode Selector */}
      <div className="sidebar-mode-selector">
        <button
          className={`mode-btn ${chatMode === 'single' ? 'active' : ''}`}
          onClick={() => onChangeChatMode('single')}
        >
          💬 1-on-1
        </button>
        <button
          className={`mode-btn ${chatMode === 'clash' ? 'active' : ''}`}
          onClick={() => onChangeChatMode('clash')}
        >
          ⚔️ Debate (VS)
        </button>
      </div>

      {/* Tutor Selectors */}
      <div className="sidebar-tutors">
        <h4 className="widget-title">{chatMode === 'clash' ? 'Debaters' : 'Choose your mentor'}</h4>

        {/* Hitesh Card */}
        <div
          className={`tutor-card glass ${activePersona === 'hitesh' || chatMode === 'clash' ? 'active' : ''}`}
          onClick={() => {
            if (chatMode === 'single') onChangePersona('hitesh');
          }}
          style={{ cursor: chatMode === 'clash' ? 'default' : 'pointer' }}
        >
          <div className="tutor-card-header">
            <div className="avatar-wrapper">
              <img src="https://github.com/hiteshchoudhary.png" alt="Hitesh Choudhary Avatar" onError={(e) => {
                e.currentTarget.src = "https://www.google.com/s2/favicons?sz=128&domain_url=hiteshchoudhary.com";
              }} />
            </div>
            <div className="tutor-info">
              <h3>Hitesh Choudhary</h3>
              <p>Creator, Chai aur Code</p>
            </div>
          </div>
        </div>

        {/* Piyush Card */}
        <div
          className={`tutor-card glass ${activePersona === 'piyush' || chatMode === 'clash' ? 'active' : ''}`}
          onClick={() => {
            if (chatMode === 'single') onChangePersona('piyush');
          }}
          style={{ cursor: chatMode === 'clash' ? 'default' : 'pointer' }}
        >
          <div className="tutor-card-header">
            <div className="avatar-wrapper">
              <img src="https://github.com/piyushgarg-dev.png" alt="Piyush Garg Avatar" onError={(e) => {
                e.currentTarget.src = "https://www.google.com/s2/favicons?sz=128&domain_url=piyushgarg.dev";
              }} />
            </div>
            <div className="tutor-info">
              <h3>Piyush Garg</h3>
              <p>Founder, Teachyst</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
