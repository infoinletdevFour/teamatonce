/**
 * Notes Page for Team@Once
 *
 * A Notion-like notes system for project documentation
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import {
  Plus,
  Search,
  MoreVertical,
  Pin,
  Star,
  Archive,
  Trash2,
  Copy,
  ChevronRight,
  ChevronDown,
  FileText,
  FolderOpen,
  Undo,
  Edit3,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Note,
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  archiveNote,
  unarchiveNote,
  restoreNote,
  duplicateNote,
  toggleNotePinned,
  toggleNoteFavorite,
  permanentDeleteNote,
} from '@/services/notesService'
import { formatDistanceToNow } from 'date-fns'

// Simple rich text editor content component
const NoteContent: React.FC<{
  content: string
  onChange: (content: string) => void
  readOnly?: boolean
}> = ({ content, onChange, readOnly = false }) => {
  return (
    <Textarea
      value={content}
      onChange={(e) => onChange(e.target.value)}
      readOnly={readOnly}
      placeholder="Start writing your note..."
      className="min-h-[400px] resize-none border-0 focus-visible:ring-0 text-base"
    />
  )
}

// Note item in sidebar
const NoteItem: React.FC<{
  note: Note
  isSelected: boolean
  onSelect: () => void
  onAction: (action: string) => void
  level?: number
  isExpanded?: boolean
  onToggleExpand?: () => void
}> = ({
  note,
  isSelected,
  onSelect,
  onAction,
  level = 0,
  isExpanded = false,
  onToggleExpand,
}) => {
  const hasChildren = note.childCount && note.childCount > 0

  return (
    <div
      className={cn(
        'group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-muted/50 transition-colors',
        isSelected && 'bg-muted'
      )}
      style={{ paddingLeft: `${level * 16 + 8}px` }}
      onClick={onSelect}
    >
      {hasChildren ? (
        <button
          className="p-0.5 hover:bg-muted rounded"
          onClick={(e) => {
            e.stopPropagation()
            onToggleExpand?.()
          }}
        >
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </button>
      ) : (
        <span className="w-4" />
      )}

      <span className="text-lg">{note.icon || '📄'}</span>

      <span className="flex-1 truncate text-sm">{note.title || 'Untitled'}</span>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {note.isPinned && <Pin className="w-3.5 h-3.5 text-amber-500" />}
        {note.isFavorite && <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />}

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <MoreVertical className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onAction('pin')}>
              <Pin className="w-4 h-4 mr-2" />
              {note.isPinned ? 'Unpin' : 'Pin'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction('favorite')}>
              <Star className="w-4 h-4 mr-2" />
              {note.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction('duplicate')}>
              <Copy className="w-4 h-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onAction('archive')}>
              <Archive className="w-4 h-4 mr-2" />
              Archive
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onAction('delete')}
              className="text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export default function NotesPage() {
  const { projectId } = useParams<{ projectId: string }>()

  // State
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'pinned' | 'favorites' | 'archived' | 'trash'>('all')
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set())
  const [editedTitle, setEditedTitle] = useState('')
  const [editedContent, setEditedContent] = useState('')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Dialogs
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newNoteTitle, setNewNoteTitle] = useState('')
  const [newNoteIcon, setNewNoteIcon] = useState('📄')

  // Load notes
  const loadNotes = useCallback(async () => {
    if (!projectId) return

    setIsLoading(true)
    try {
      const filters: any = {}

      if (activeTab === 'pinned') filters.isPinned = true
      if (activeTab === 'favorites') filters.isFavorite = true
      if (activeTab === 'archived') filters.isArchived = true
      if (activeTab === 'trash') filters.isDeleted = true
      if (activeTab === 'all') filters.isArchived = false

      if (searchQuery) filters.search = searchQuery

      const response = await getNotes(projectId, filters)
      setNotes(response.notes)
    } catch (error) {
      console.error('Error loading notes:', error)
      toast.error('Failed to load notes')
    } finally {
      setIsLoading(false)
    }
  }, [projectId, activeTab, searchQuery])

  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  // Update edited content when selected note changes
  useEffect(() => {
    if (selectedNote) {
      setEditedTitle(selectedNote.title)
      setEditedContent(selectedNote.content || '')
      setHasUnsavedChanges(false)
    }
  }, [selectedNote])

  // Handle title/content changes
  const handleTitleChange = (title: string) => {
    setEditedTitle(title)
    setHasUnsavedChanges(true)
  }

  const handleContentChange = (content: string) => {
    setEditedContent(content)
    setHasUnsavedChanges(true)
  }

  // Save note changes
  const saveNote = async () => {
    if (!projectId || !selectedNote) return

    try {
      const updated = await updateNote(projectId, selectedNote.id, {
        title: editedTitle,
        content: editedContent,
      })

      setSelectedNote(updated)
      setNotes((prev) =>
        prev.map((n) => (n.id === updated.id ? { ...n, title: updated.title } : n))
      )
      setHasUnsavedChanges(false)
      toast.success('Note saved')
    } catch (error) {
      console.error('Error saving note:', error)
      toast.error('Failed to save note')
    }
  }

  // Auto-save on blur (with debounce)
  useEffect(() => {
    if (!hasUnsavedChanges) return

    const timeoutId = setTimeout(() => {
      if (hasUnsavedChanges) {
        saveNote()
      }
    }, 2000)

    return () => clearTimeout(timeoutId)
  }, [editedTitle, editedContent, hasUnsavedChanges])

  // Create new note
  const handleCreateNote = async () => {
    if (!projectId || !newNoteTitle.trim()) return

    try {
      const note = await createNote(projectId, {
        title: newNoteTitle,
        icon: newNoteIcon,
      })

      setNotes((prev) => [note, ...prev])
      setSelectedNote(note)
      setIsCreateDialogOpen(false)
      setNewNoteTitle('')
      setNewNoteIcon('📄')
      toast.success('Note created')
    } catch (error) {
      console.error('Error creating note:', error)
      toast.error('Failed to create note')
    }
  }

  // Handle note actions
  const handleNoteAction = async (note: Note, action: string) => {
    if (!projectId) return

    try {
      switch (action) {
        case 'pin':
          await toggleNotePinned(projectId, note.id, !note.isPinned)
          toast.success(note.isPinned ? 'Note unpinned' : 'Note pinned')
          break
        case 'favorite':
          await toggleNoteFavorite(projectId, note.id, !note.isFavorite)
          toast.success(note.isFavorite ? 'Removed from favorites' : 'Added to favorites')
          break
        case 'duplicate':
          const duplicated = await duplicateNote(projectId, note.id)
          setNotes((prev) => [duplicated, ...prev])
          toast.success('Note duplicated')
          break
        case 'archive':
          await archiveNote(projectId, note.id)
          if (selectedNote?.id === note.id) setSelectedNote(null)
          toast.success('Note archived')
          break
        case 'unarchive':
          await unarchiveNote(projectId, note.id)
          toast.success('Note unarchived')
          break
        case 'delete':
          await deleteNote(projectId, note.id)
          if (selectedNote?.id === note.id) setSelectedNote(null)
          toast.success('Note moved to trash')
          break
        case 'restore':
          await restoreNote(projectId, note.id)
          toast.success('Note restored')
          break
        case 'permanent-delete':
          await permanentDeleteNote(projectId, note.id)
          if (selectedNote?.id === note.id) setSelectedNote(null)
          toast.success('Note permanently deleted')
          break
      }
      loadNotes()
    } catch (error) {
      console.error(`Error performing action ${action}:`, error)
      toast.error(`Failed to ${action} note`)
    }
  }

  // Toggle note expansion
  const toggleExpand = (noteId: string) => {
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

  // Render notes recursively
  const renderNotes = (notes: Note[], level = 0) => {
    return notes.map((note) => (
      <React.Fragment key={note.id}>
        <NoteItem
          note={note}
          isSelected={selectedNote?.id === note.id}
          onSelect={() => setSelectedNote(note)}
          onAction={(action) => handleNoteAction(note, action)}
          level={level}
          isExpanded={expandedNotes.has(note.id)}
          onToggleExpand={() => toggleExpand(note.id)}
        />
        {note.children &&
          expandedNotes.has(note.id) &&
          renderNotes(note.children, level + 1)}
      </React.Fragment>
    ))
  }

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-72 border-r flex flex-col bg-card">
        {/* Header */}
        <div className="p-3 border-b">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Notes
            </h2>
            <Button
              size="sm"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              New
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as any)}
          className="flex-1 flex flex-col"
        >
          <TabsList className="grid grid-cols-5 mx-3 mt-2">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="pinned" className="text-xs">Pinned</TabsTrigger>
            <TabsTrigger value="favorites" className="text-xs">⭐</TabsTrigger>
            <TabsTrigger value="archived" className="text-xs">📦</TabsTrigger>
            <TabsTrigger value="trash" className="text-xs">🗑️</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="flex-1 mt-0 p-2 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
              </div>
            ) : notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <FolderOpen className="w-10 h-10 mb-2" />
                <p className="text-sm">No notes found</p>
              </div>
            ) : (
              <div className="space-y-0.5">{renderNotes(notes)}</div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-background">
        {selectedNote ? (
          <>
            {/* Note Header */}
            <div className="border-b p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedNote.icon || '📄'}</span>
                <Input
                  value={editedTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Untitled"
                  className="text-xl font-semibold border-0 focus-visible:ring-0 p-0 h-auto"
                />
                {hasUnsavedChanges && (
                  <Badge variant="secondary" className="text-xs">
                    Unsaved
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span>
                  Created{' '}
                  {formatDistanceToNow(new Date(selectedNote.createdAt), {
                    addSuffix: true,
                  })}
                </span>
                {selectedNote.updatedAt !== selectedNote.createdAt && (
                  <span>
                    Updated{' '}
                    {formatDistanceToNow(new Date(selectedNote.updatedAt), {
                      addSuffix: true,
                    })}
                  </span>
                )}
                <span>{selectedNote.viewCount} views</span>
              </div>

              {selectedNote.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedNote.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Note Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'trash' ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Trash2 className="w-12 h-12 mx-auto mb-4" />
                  <p className="mb-4">This note is in the trash</p>
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleNoteAction(selectedNote, 'restore')}
                    >
                      <Undo className="w-4 h-4 mr-2" />
                      Restore
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleNoteAction(selectedNote, 'permanent-delete')}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Forever
                    </Button>
                  </div>
                </div>
              ) : activeTab === 'archived' ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Archive className="w-12 h-12 mx-auto mb-4" />
                  <p className="mb-4">This note is archived</p>
                  <Button
                    variant="outline"
                    onClick={() => handleNoteAction(selectedNote, 'unarchive')}
                  >
                    <Undo className="w-4 h-4 mr-2" />
                    Unarchive
                  </Button>
                </div>
              ) : (
                <NoteContent
                  content={editedContent}
                  onChange={handleContentChange}
                />
              )}
            </div>

            {/* Footer */}
            {hasUnsavedChanges && activeTab !== 'trash' && activeTab !== 'archived' && (
              <div className="border-t p-3 flex justify-end">
                <Button onClick={saveNote}>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <FileText className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-1">No note selected</h3>
              <p className="text-sm">Select a note from the sidebar or create a new one</p>
              <Button
                className="mt-4"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Note
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Note Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Note</DialogTitle>
            <DialogDescription>
              Add a new note to your project documentation
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div>
                <Label>Icon</Label>
                <Input
                  value={newNoteIcon}
                  onChange={(e) => setNewNoteIcon(e.target.value)}
                  className="w-16 text-center text-xl"
                  maxLength={2}
                />
              </div>
              <div className="flex-1">
                <Label>Title</Label>
                <Input
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  placeholder="Enter note title..."
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateNote()}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateNote} disabled={!newNoteTitle.trim()}>
              Create Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
