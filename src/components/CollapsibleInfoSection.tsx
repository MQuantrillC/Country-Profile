'use client';

import React from 'react';

export const CollapsibleInfoSection = ({ title, children, isExpanded, onToggle, titleClassName }: { title: React.ReactNode, children: React.ReactNode, isExpanded: boolean, onToggle: () => void, titleClassName?: string }) => {
  return (
    <div>
      <button
        onClick={onToggle }
        aria-expanded={isExpanded}
        className="w-full text-left sm:pointer-events-none"
      >
        <h4 className={`text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-600 pb-2 flex justify-between items-center ${titleClassName}`}>
          <span>{title}</span>
          <span className="sm:hidden transform transition-transform duration-200">{isExpanded ? '▲' : '▼'}</span>
        </h4>
      </button>
      <div className={`sm:block ${isExpanded ? 'block' : 'hidden'}`}>
        {children }
      </div>
    </div>
  );
};

