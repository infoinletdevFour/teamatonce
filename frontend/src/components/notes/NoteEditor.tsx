/**
 * Note Editor Component
 *
 * Rich text editor for creating and editing notes.
 * Uses Jodit React for rich text editing (already installed).
 */

import React, { useState, useEffect, useRef } from 'react'
import JoditEditor from 'jodit-react'
import {
  Save,
  Pin,
  Star,
  MoreHorizontal,
  Archive,
  Trash2,
  Copy,
  Clock,
  User,
  ChevronLeft,
} from 'lucide-react'
import { Note, UpdateNoteData } from '@/services/notesService'
import { cn } from '@/lib/utils'

interface NoteEditorProps {
  note: Note | null
  onSave: (noteId: string, data: UpdateNoteData) => Promise<void>
  onPinNote: (noteId: string, isPinned: boolean) => void
  onFavoriteNote: (noteId: string, isFavorite: boolean) => void
  onArchiveNote: (noteId: string) => void
  onDeleteNote: (noteId: string) => void
  onDuplicateNote: (noteId: string) => void
  onBack?: () => void
  isSaving?: boolean
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  onSave,
  onPinNote,
  onFavoriteNote,
  onArchiveNote,
  onDeleteNote,
  onDuplicateNote,
  onBack,
  isSaving,
}) => {
  const editor = useRef(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [hasChanges, setHasChanges] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Jodit configuration
  const config = {
    readonly: false,
    placeholder: 'Start writing...',
    height: 'calc(100vh - 200px)',
    toolbarButtonSize: 'small',
    buttons: [
      'bold',
      'italic',
      'underline',
      'strikethrough',
      '|',
      'ul',
      'ol',
      'indent',
      'outdent',
      '|',
      'font',
      'fontsize',
      'brush',
      'paragraph',
      '|',
      'image',
      'table',
      'link',
      '|',
      'align',
      'undo',
      'redo',
      '|',
      'hr',
      'eraser',
      'copyformat',
      '|',
      'fullsize',
      'source',
    ],
    removeButtons: ['about'],
    showCharsCounter: false,
    showWordsCounter: false,
    showXPathInStatusbar: false,
    askBeforePasteHTML: false,
    askBeforePasteFromWord: false,
    defaultActionOnPaste: 'insert_clear_html',
    theme: 'default',
  } as any

  // Load note content when note changes
  useEffect(() => {
    if (note) {
      setTitle(note.title)
      setContent(note.content || '')
      setHasChanges(false)
    } else {
      setTitle('')
      setContent('')
      setHasChanges(false)
    }
  }, [note?.id])

  // Auto-save with debounce
  useEffect(() => {
    if (!note || !hasChanges) return

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      handleSave()
    }, 2000) // Auto-save after 2 seconds of inactivity

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [title, content, hasChanges])

  const handleSave = async () => {
    if (!note || !hasChanges) return

    try {
      await onSave(note.id, {
        title,
        content,
      })
      setHasChanges(false)
    } catch (error) {
      console.error('Failed to save note:', error)
    }
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
    setHasChanges(true)
  }

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    setHasChanges(true)
  }

  if (!note) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
        <p className="text-lg">Select a note to view</p>
        <p className="text-sm mt-2">or create a new one</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
              onClick={onBack}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Save Status */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {isSaving ? (
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                Saving...
              </span>
            ) : hasChanges ? (
              <span className="text-amber-500">Unsaved changes</span>
            ) : (
              <span className="text-green-500">Saved</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Save Button */}
          <button
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors',
              hasChanges
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800'
            )}
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            <Save className="w-4 h-4" />
            Save
          </button>

          {/* Pin */}
          <button
            className={cn(
              'p-2 rounded-lg transition-colors',
              note.isPinned
                ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/30'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
            onClick={() => onPinNote(note.id, !note.isPinned)}
            title={note.isPinned ? 'Unpin' : 'Pin'}
          >
            <Pin className="w-4 h-4" />
          </button>

          {/* Favorite */}
          <button
            className={cn(
              'p-2 rounded-lg transition-colors',
              note.isFavorite
                ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/30'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
            onClick={() => onFavoriteNote(note.id, !note.isFavorite)}
            title={note.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star className="w-4 h-4" />
          </button>

          {/* More Actions */}
          <div className="relative">
            <button
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setShowMoreMenu(!showMoreMenu)}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMoreMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMoreMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => {
                      onDuplicateNote(note.id)
                      setShowMoreMenu(false)
                    }}
                  >
                    <Copy className="w-4 h-4" />
                    Duplicate
                  </button>
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => {
                      onArchiveNote(note.id)
                      setShowMoreMenu(false)
                    }}
                  >
                    <Archive className="w-4 h-4" />
                    Archive
                  </button>
                  <div className="border-t border-gray-200 dark:border-gray-700" />
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                    onClick={() => {
                      onDeleteNote(note.id)
                      setShowMoreMenu(false)
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Title Input */}
      <div className="px-6 py-4">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Untitled"
          className="w-full text-3xl font-bold text-gray-900 dark:text-white bg-transparent border-none outline-none placeholder-gray-300 dark:placeholder-gray-600"
        />

        {/* Meta Info */}
        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            Created by {note.createdBy}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Updated {new Date(note.updatedAt).toLocaleDateString()}
          </span>
          {note.viewCount > 0 && <span>{note.viewCount} views</span>}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 px-6 pb-6 overflow-y-auto">
        <JoditEditor
          ref={editor}
          value={content}
          config={config}
          onBlur={handleContentChange}
        />
      </div>
    </div>
  )
}

export default NoteEditor
