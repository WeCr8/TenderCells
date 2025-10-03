import React, { useState, useRef, useEffect } from 'react';
import { Play, Calendar, Copy, Edit, Trash2, Info } from 'lucide-react';
import type { MacroFunction } from '../../types/macros';

interface FunctionContextMenuProps {
  macro: MacroFunction;
  x: number;
  y: number;
  onClose: () => void;
  onExecute: () => void;
  onSchedule: () => void;
  onDuplicate?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onInfo?: () => void;
}

export default function FunctionContextMenu({
  macro,
  x,
  y,
  onClose,
  onExecute,
  onSchedule,
  onDuplicate,
  onEdit,
  onDelete,
  onInfo
}: FunctionContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x, y });

  // Adjust position if menu would go off screen
  useEffect(() => {
    if (menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      let adjustedX = x;
      let adjustedY = y;
      
      if (x + menuRect.width > windowWidth) {
        adjustedX = windowWidth - menuRect.width - 10;
      }
      
      if (y + menuRect.height > windowHeight) {
        adjustedY = windowHeight - menuRect.height - 10;
      }
      
      setPosition({ x: adjustedX, y: adjustedY });
    }
  }, [x, y]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="absolute bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
      style={{ 
        left: position.x, 
        top: position.y,
        minWidth: '180px'
      }}
    >
      <div className="px-3 py-2 border-b border-gray-100">
        <p className="font-medium text-gray-900 truncate">{macro.name}</p>
        <p className="text-xs text-gray-500 truncate">{macro.category}</p>
      </div>
      
      <div className="py-1">
        <button
          onClick={() => { onExecute(); onClose(); }}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
        >
          <Play className="w-4 h-4 mr-3 text-farm-600" />
          <span>Execute</span>
        </button>
        
        <button
          onClick={() => { onSchedule(); onClose(); }}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
        >
          <Calendar className="w-4 h-4 mr-3 text-blue-600" />
          <span>Schedule</span>
        </button>
        
        {onInfo && (
          <button
            onClick={() => { onInfo(); onClose(); }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
          >
            <Info className="w-4 h-4 mr-3 text-gray-600" />
            <span>Details</span>
          </button>
        )}
      </div>
      
      {(onDuplicate || onEdit || onDelete) && (
        <div className="border-t border-gray-100 py-1">
          {onDuplicate && (
            <button
              onClick={() => { onDuplicate(); onClose(); }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            >
              <Copy className="w-4 h-4 mr-3 text-gray-600" />
              <span>Duplicate</span>
            </button>
          )}
          
          {onEdit && (
            <button
              onClick={() => { onEdit(); onClose(); }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            >
              <Edit className="w-4 h-4 mr-3 text-gray-600" />
              <span>Edit</span>
            </button>
          )}
          
          {onDelete && (
            <button
              onClick={() => { onDelete(); onClose(); }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
            >
              <Trash2 className="w-4 h-4 mr-3" />
              <span>Delete</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}