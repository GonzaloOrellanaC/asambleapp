import React, { useRef, useMemo, useCallback } from 'react';
import ReactQuill, { Quill } from 'react-quill-new';
import BlotFormatter from '@enzedonline/quill-blot-formatter2';
import 'react-quill-new/dist/quill.snow.css';

Quill.register('modules/blotFormatter', BlotFormatter);

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  // Kept for backward compatibility with NewProjectPage
  editorStyles?: any;
  onStylesChange?: (styles: any) => void;
}

const modules = {
  toolbar: [
    [{ 'font': [] }, { 'size': ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'align': [] }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['link', 'image'],
    ['clean']
  ],
  blotFormatter: {}
};

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  return (
    <div className="flex flex-col h-full bg-white rounded-xl overflow-hidden border border-slate-300 shadow-sm relative">
      <div className="flex-1 flex flex-col custom-quill-container min-h-0">
         <style>{`
           .custom-quill-container .quill {
              height: 100%;
              display: flex;
              flex-direction: column;
           }
           .custom-quill-container .ql-toolbar {
              background: #f8fafc;
              border: none !important;
              border-bottom: 1px solid #e2e8f0 !important;
              padding: 12px 16px;
              flex-shrink: 0;
           }
           .custom-quill-container .ql-container {
              border: none !important;
              flex: 1;
              font-family: inherit;
              background-color: white;
              overflow-y: auto;
           }
           .custom-quill-container .ql-editor {
              background-color: white;
              width: 100%;
              min-height: 500px;
              padding: 2rem;
              line-height: 1.6;
              font-size: 16px;
           }
         `}</style>
         <ReactQuill 
           theme="snow" 
           value={value} 
           onChange={onChange} 
           modules={modules}
           placeholder="Pega tu texto plano aquí y formatéalo como necesites..."
         />
      </div>
    </div>
  );
}
