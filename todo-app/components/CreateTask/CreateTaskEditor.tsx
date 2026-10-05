// components/CreateTask/CreateTaskEditor.tsx
'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Placeholder } from '@tiptap/extensions'
import { TaskList, TaskItem } from '@tiptap/extension-list'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Bold, Italic, Strikethrough, List, ListOrdered, SquareCheck  } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Skeleton } from '../ui/skeleton'
interface CreateTaskEditorProps {
  content?: string
  onChange?: (html: string) => void
  /** Keeps the selection toolbar inside the main content column. */
  boundaryRef?: React.RefObject<HTMLElement | null>
  placeholder?: string
  editorClassName?: string
}

export function CreateTaskEditor({
  content = '',
  onChange,
  boundaryRef,
  placeholder = 'Legg til en beskrivelse...',
  editorClassName,
}: CreateTaskEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const toolbarRef   = useRef<HTMLDivElement>(null)
  const [toolbarPos, setToolbarPos] = useState<{ top: number; left: number } | null>(null)
  const [isVisible,  setIsVisible]  = useState(false)

  const updateToolbarPosition = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    const boundary = boundaryRef?.current ?? containerRef.current
    if (!boundary || rect.width === 0) return

    const boundaryRect = boundary.getBoundingClientRect()
    const toolbarWidth = toolbarRef.current?.offsetWidth ?? 320
    const toolbarHeight = toolbarRef.current?.offsetHeight ?? 44
    const padding = 8

    let left = rect.left + rect.width / 2
    const half = toolbarWidth / 2
    left = Math.max(
      boundaryRect.left + half + padding,
      Math.min(boundaryRect.right - half - padding, left),
    )

    let top = rect.top - toolbarHeight - padding
    if (top < boundaryRect.top + padding) {
      top = rect.bottom + padding
    }

    setToolbarPos({ top, left })
    setIsVisible(true)
  }, [boundaryRef])

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content,
    editorProps: {
      attributes: {
        class: cn(
          'min-h-32 focus:outline-none prose prose-headings:font-normal prose-headings:font-heading max-w-none dark:prose-invert',
          editorClassName,
        ),
      },
    },
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
    onSelectionUpdate: ({ editor: ed }) => {
      const { from, to } = ed.state.selection
      if (from === to) {
        setIsVisible(false)
        return
      }
      requestAnimationFrame(() => {
        updateToolbarPosition()
        requestAnimationFrame(updateToolbarPosition)
      })
    },
    immediatelyRender: false,
  })

  useEffect(() => {
    if (!isVisible) return

    const handleReposition = () => updateToolbarPosition()
    window.addEventListener('scroll', handleReposition, true)
    window.addEventListener('resize', handleReposition)
    return () => {
      window.removeEventListener('scroll', handleReposition, true)
      window.removeEventListener('resize', handleReposition)
    }
  }, [isVisible, updateToolbarPosition])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        const { from, to } = editor?.state.selection ?? { from: 0, to: 0 }
        if (from === to) setIsVisible(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [editor])

  if (!editor) return (
    <div className="animate-pulse">
      <Skeleton className="h-8 w-40 rounded-md" />
    </div>
  )

  const formattingValue = [
    editor.isActive('bold')   ? 'bold'   : '',
    editor.isActive('italic') ? 'italic' : '',
    editor.isActive('strike') ? 'strike' : '',
  ].filter(Boolean)

  const listValue = editor.isActive('taskList')
    ? 'task'
    : editor.isActive('bulletList')
    ? 'bullet'
    : editor.isActive('orderedList')
    ? 'ordered'
    : ''

  const handleListChange = (value: string) => {
    // Slå av aktiv liste først
    if (editor.isActive('bulletList'))  editor.chain().focus().toggleBulletList().run()
    if (editor.isActive('orderedList')) editor.chain().focus().toggleOrderedList().run()
    if (editor.isActive('taskList'))    editor.chain().focus().toggleTaskList().run()

    // Slå på ny hvis den er forskjellig fra aktiv
    if (value === 'bullet')  editor.chain().focus().toggleBulletList().run()
    if (value === 'ordered') editor.chain().focus().toggleOrderedList().run()
    if (value === 'task')    editor.chain().focus().toggleTaskList().run()
  }

  return (
    <div ref={containerRef} className="relative">
      {isVisible && toolbarPos && (
        <div
          ref={toolbarRef}
          style={{
            position:  'fixed',
            top:       toolbarPos.top,
            left:      toolbarPos.left,
            transform: 'translateX(-50%)',
            zIndex:    60,
          }}
          className="flex items-center gap-0.5 rounded-xl border border-border bg-popover px-1 py-1 shadow-lg"
          onMouseDown={(e) => e.preventDefault()}
        >
          <Select
            value={
              editor.isActive('heading', { level: 2 }) ? 'h2' :
              editor.isActive('heading', { level: 3 }) ? 'h3' : 'paragraph'
            }
            onValueChange={(value) => {
              if (value === 'paragraph') editor.chain().focus().setParagraph().run()
              else {
                const level = parseInt(value.replace('h', '')) as 2 | 3
                editor.chain().focus().toggleHeading({ level }).run()
              }
            }}
          >
            <SelectTrigger className="w-32 text-xs shadow-none focus:ring-0 border-none h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="p-1" position="popper">
              <SelectItem value="paragraph">Avsnitt</SelectItem>
              <SelectItem value="h2">Overskrift 2</SelectItem>
              <SelectItem value="h3">Overskrift 3</SelectItem>
            </SelectContent>
          </Select>

          <div className="w-px h-5 bg-border mx-1" />

          <ToggleGroup
            type="multiple"
            variant="outlineBrand"
            value={formattingValue}
            onValueChange={(values) => {
              const toggle = (key: string, cmd: () => void) => {
                if (formattingValue.includes(key) !== values.includes(key)) cmd()
              }
              toggle('bold',   () => editor.chain().focus().toggleBold().run())
              toggle('italic', () => editor.chain().focus().toggleItalic().run())
              toggle('strike', () => editor.chain().focus().toggleStrike().run())
            }}
          >
            <ToggleGroupItem value="bold"   aria-label="Fet"              size="sm"><Bold          className="h-4 w-4" /></ToggleGroupItem>
            <ToggleGroupItem value="italic" aria-label="Kursiv"           size="sm"><Italic        className="h-4 w-4" /></ToggleGroupItem>
            <ToggleGroupItem value="strike" aria-label="Gjennomstreking"  size="sm"><Strikethrough className="h-4 w-4" /></ToggleGroupItem>
          </ToggleGroup>

          <div className="w-px h-5 bg-border mx-1" />

          <ToggleGroup
            type="single"
            variant="outlineBrand"
            value={listValue}
            onValueChange={handleListChange}
          >
            <ToggleGroupItem value="bullet"  aria-label="Punktliste"      size="sm"><List        className="h-4 w-4" /></ToggleGroupItem>
            <ToggleGroupItem value="ordered" aria-label="Nummerert liste" size="sm"><ListOrdered className="h-4 w-4" /></ToggleGroupItem>
            <ToggleGroupItem value="task"    aria-label="Oppgaveliste"    size="sm"><SquareCheck  className="h-4 w-4" /></ToggleGroupItem>
          </ToggleGroup>
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  )
}