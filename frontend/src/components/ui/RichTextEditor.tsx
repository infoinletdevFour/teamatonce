/**
 * Rich Text Editor Component
 *
 * A reusable rich text editor using Jodit React.
 * Simplified version for forms like project descriptions.
 */

import React, { useRef, useMemo } from 'react';
import JoditEditor from 'jodit-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string | number;
  minHeight?: string | number;
  className?: string;
  disabled?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start writing...',
  height = 300,
  minHeight = 200,
  className = '',
  disabled = false,
}) => {
  const editor = useRef(null);

  // Jodit configuration - simplified toolbar for form fields
  const config = useMemo(() => ({
    readonly: disabled,
    placeholder,
    height,
    minHeight,
    toolbarButtonSize: 'small' as const,
    buttons: [
      'bold',
      'italic',
      'underline',
      '|',
      'ul',
      'ol',
      '|',
      'paragraph',
      '|',
      'link',
      '|',
      'align',
      '|',
      'undo',
      'redo',
    ],
    removeButtons: ['about'],
    showCharsCounter: false,
    showWordsCounter: false,
    showXPathInStatusbar: false,
    askBeforePasteHTML: false,
    askBeforePasteFromWord: false,
    defaultActionOnPaste: 'insert_clear_html',
    theme: 'default',
    statusbar: false,
    toolbarAdaptive: false,
    style: {
      background: 'white',
    },
  }), [disabled, placeholder, height, minHeight]);

  return (
    <div className={`rich-text-editor ${className}`}>
      <JoditEditor
        ref={editor}
        value={value}
        config={config}
        onBlur={(newContent) => onChange(newContent)}
      />
      <style>{`
        .rich-text-editor .jodit-container {
          border: 2px solid #e5e7eb !important;
          border-radius: 0.75rem !important;
          overflow: hidden;
        }
        .rich-text-editor .jodit-container:focus-within {
          border-color: #3b82f6 !important;
        }
        .rich-text-editor .jodit-toolbar__box {
          background: #f9fafb !important;
          border-bottom: 1px solid #e5e7eb !important;
        }
        .rich-text-editor .jodit-wysiwyg {
          padding: 12px 16px !important;
          min-height: ${typeof minHeight === 'number' ? minHeight + 'px' : minHeight} !important;
        }
        .rich-text-editor .jodit-placeholder {
          padding: 12px 16px !important;
          color: #9ca3af !important;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
