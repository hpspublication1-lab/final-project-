'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface PasswordStrengthProps {
  password: string;
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  const checks = [
    { key: 'ps-len', label: '8+ characters', pass: password.length >= 8 },
    { key: 'ps-upper', label: 'Uppercase', pass: /[A-Z]/.test(password) },
    { key: 'ps-num', label: 'Number', pass: /\d/.test(password) },
    { key: 'ps-special', label: 'Special char', pass: /[!@#$%^&*]/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;
  const levels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', 'bg-error', 'bg-warning', 'bg-ma', 'bg-success'];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={`ps-bar-${i}`}
            className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${i <= score ? colors[score] : 'bg-border'}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {checks.map((c) => (
            <span key={c.key} className={`text-xs flex items-center gap-0.5 ${c.pass ? 'text-success' : 'text-muted-foreground'}`}>
              <CheckCircle2 size={10} className={c.pass ? 'text-success' : 'text-border'} />
              {c.label}
            </span>
          ))}
        </div>
        {score > 0 && (
          <span className={`text-xs font-semibold ${score === 4 ? 'text-success' : score === 3 ? 'text-ma' : score === 2 ? 'text-warning' : 'text-error'}`}>
            {levels[score]}
          </span>
        )}
      </div>
    </div>
  );
}
