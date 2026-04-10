/**
 * Notes List Component
 *
 * Displays a list of project notes with hierarchical structure.
 * Supports pinning, favorites, search, and drag-drop reordering.
 */

import React, { useState } from 'react'
import { FileText, Plus, Pin, Star, Folder, MoreHorizontal, Search, Archive, Trash2 } from 'lucide-react'
import { Note } from '@/services/notesService'
import { cn } from '@/lib/utils'

interface NotesListProps {
  notes: Note[]
  selectedNoteId?: string
  onSelectNote: (note: Note) => void
  onCreateNote: (parentId?: string) => void
  onPinNote: (noteId: string, isPinned: boolean) => void
  onFavoriteNote: (noteId: string, isFavorite: boolean) => void
  onArchiveNote: (noteId: string) => void
  onDeleteNote: (noteId: string) => void
  isLoading?: boolean
}

export const NotesList: React.FC<NotesListProps> = ({
  notes,
  selectedNoteId,
  onSelectNote,
  onCreateNote,
  onPinNote,
  onFavoriteNote,
  onArchiveNote,
  onDeleteNote,
  isLoading,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set())

  // Filter notes based on search
  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.contentText?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Separate pinned and regular notes
  const pinnedNotes = filteredNotes.filter((n) => n.isPinned && !n.parentId)
  const regularNotes = filteredNotes.filter((n) => !n.isPinned && !n.parentId)

  const toggleExpanded = (noteId: string) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev)
      if (next.has(noteId)) {
        next.delete(noteId)
      } else {
        next.add(noteId)
      }
      return next
    })
  }

  const renderNote = (note: Note, level: number = 0) => {
    const isSelected = selectedNoteId === note.id
    const isExpanded = expandedNotes.has(note.id)
    const children = filteredNotes.filter((n) => n.parentId === note.id)
    const hasChildren = children.length > 0

    return (
      <div key={note.id}>
        <div
          className={cn(
            'group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors',
            'hover:bg-gray-100 dark:hover:bg-gray-800',
            isSelected && 'bg-blue-50 dark:bg-blue-900/30 border-l-2 border-blue-500'
          )}
          style={{ paddingLeft: `${12 + level * 16}px` }}
          onClick={() => onSelectNote(note)}
        >
          {/* Expand/Collapse Icon */}
          {hasChildren ? (
            <button
              className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600"
              onClick={(e) => {
                e.stopPropagation()
                toggleExpanded(note.id)
              }}
            >
              <Folder
                className={cn(
                  'w-4 h-4 transition-transform',
                  isExpanded && 'rotate-90'
                )}
              />
            </button>
          ) : (
            <FileText className="w-4 h-4 text-gray-400" />
          )}

          {/* Icon */}
          {note.icon && <span className="text-lg">{note.icon}</span>}

          {/* Title */}
          <span className="flex-1 truncate text-sm font-medium text-gray-700 dark:text-gray-200">
            {note.title}
          </span>

          {/* Quick Actions (visible on hover) */}
          <div className="hidden group-hover:flex items-center gap-1">
            <button
              className={cn(
                'p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700',
                note.isPinned && 'text-blue-500'
              )}
              onClick={(e) => {
                e.stopPropagation()
                onPinNote(note.id, !note.isPinned)
              }}
              title={note.isPinned ? 'Unpin' : 'Pin'}
            >
              <Pin className="w-3.5 h-3.5" />
            </button>
            <button
              className={cn(
                'p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700',
                note.isFavorite && 'text-yellow-500'
              )}
              onClick={(e) => {
                e.stopPropagation()
                onFavoriteNote(note.id, !note.isFavorite)
              }}
              title={note.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star className="w-3.5 h-3.5" />
            </button>
            <button
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500"
              onClick={(e) => {
                e.stopPropagation()
                onCreateNote(note.id)
              }}
              title="Add sub-page"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <MoreActionsMenu
              onArchive={() => onArchiveNote(note.id)}
              onDelete={() => onDeleteNote(note.id)}
            />
          </div>
        </div>

        {/* Children */}
        {isExpanded && children.length > 0 && (
          <div>
            {children.map((child) => renderNote(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
        <div className="p-4 animate-pulse">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notes</h2>
          <button
            className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            onClick={() => onCreateNote()}
            title="Create new note"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-2">
        {/* Pinned Notes */}
        {pinnedNotes.length > 0 && (
          <div className="mb-4">
            <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase">Pinned</div>
            {pinnedNotes.map((note) => renderNote(note))}
          </div>
        )}

        {/* Regular Notes */}
        {regularNotes.length > 0 && (
          <div>
            {pinnedNotes.length > 0 && (
              <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase">All Notes</div>
            )}
            {regularNotes.map((note) => renderNote(note))}
          </div>
        )}

        {/* Empty State */}
        {filteredNotes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {searchQuery ? 'No notes found' : 'No notes yet'}
            </p>
            {!searchQuery && (
              <button
                className="mt-3 text-sm text-blue-500 hover:text-blue-600"
                onClick={() => onCreateNote()}
              >
                Create your first note
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// More Actions Dropdown
const MoreActionsMenu: React.FC<{
  onArchive: () => void
  onDelete: () => void
}> = ({ onArchive, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500"
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
      >
        <MoreHorizontal className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
            <button
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={(e) => {
                e.stopPropagation()
                onArchive()
                setIsOpen(false)
              }}
            >
              <Archive className="w-4 h-4" />
              Archive
            </button>
            <button
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
                setIsOpen(false)
              }}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default NotesList
