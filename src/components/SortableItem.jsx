import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

const SortableItem = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    zIndex: isDragging ? 100 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} className="group relative flex items-start w-full mb-1">
      {/* Drag Handle - Only visible on hover */}
      <div 
        className="opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-grab active:cursor-grabbing absolute -left-8 top-1 h-6 w-6 text-gray-500 hover:bg-gray-800 rounded"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={14} />
      </div>
      
      {/* Block Content */}
      <div className="flex-1 w-full">
        {children}
      </div>
    </div>
  );
};

export default SortableItem;
