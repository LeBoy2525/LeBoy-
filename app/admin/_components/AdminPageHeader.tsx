"use client";

import { ReactNode } from "react";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function AdminPageHeader({ title, description, actions }: AdminPageHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-gray-600 font-light">{description}</p>
          )}
        </div>
        {actions && <div className="ml-4 flex items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}

