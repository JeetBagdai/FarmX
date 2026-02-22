import React from 'react';

export const BotIcon: React.FC = () => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-6 w-6" 
        viewBox="0 0 24 24" 
        strokeWidth="1.5" 
        stroke="currentColor" 
        fill="none" 
        strokeLinecap="round" 
        strokeLinejoin="round"
    >
        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
        <path d="M12 5m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path>
        <path d="M5 12v-2a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v2"></path>
        <path d="M5 12h14"></path>
        <path d="M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6"></path>
        <path d="M9 16l0 .01"></path>
        <path d="M15 16l0 .01"></path>
    </svg>
);