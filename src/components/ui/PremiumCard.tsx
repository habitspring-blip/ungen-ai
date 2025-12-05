"use client";

import React, { ReactNode } from 'react';

interface PremiumCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
  gradient?: string;
}

export default function PremiumCard({
  title,
  subtitle,
  children,
  actions,
  className = '',
  gradient = 'from-slate-50 to-slate-100'
}: PremiumCardProps) {
  return (
    <div
      className={`bg-gradient-to-br ${gradient} border border-slate-200 rounded-2xl shadow-soft overflow-hidden ${className}`}
    >
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            {subtitle && (
              <p className="text-sm text-slate-600 mt-1">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-6">
        {children}
      </div>
    </div>
  );
}