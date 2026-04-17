'use client'
import { useEditor, EditorContent, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Toggle } from '@/components/ui/toggle'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Bold, Italic, Strikethrough, List, ListOrdered, Minus } from 'lucide-react'
import { Kbd } from '@/components/ui/kbd'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Placeholder } from '@tiptap/extensions'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '../ui/button'
import { Skeleton } from '../ui/skeleton'
import { cn } from '@/lib/utils'

interface EditorProps {
  content?: string
  onChange?: (html: string) => void
  placeholder?: string
  variant?: 'default' | 'ghost'
  minHeight?: string
}

const isMac = typeof window !== 'undefined' && navigator.platform.includes('Mac')
const mod = isMac ? '⌘' : 'Ctrl'

type ToolbarTooltipProps = {
  label: string
  shortcut?: string
  children: React.ReactNode
}

function ToolbarTooltip({ label, shortcut, children }: ToolbarTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="top" className="flex items-center gap-2">
        <span>{label}</span>
        {shortcut && (
          <span className="flex items-center gap-1">
            {shortcut.split('+').map((key) => (
              <Kbd key={key}>{key}</Kbd>
            ))}
          </span>
        )}
      </TooltipContent>
    </Tooltip>
  )
}

export default function Editor({
  content = '',
  onChange,
  placeholder = 'Type something...',
  variant = 'default',
  minHeight = 'h-40',
}: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
    ],
    content,
    editorProps: {
      attributes: {
        class: cn(
          'p-4 focus:outline-none prose prose-sm prose-headings:font-normal prose-headings:font-heading max-w-none dark:prose-invert',
          minHeight
        ),
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
    immediatelyRender: false,
  })

  const editorState = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) return {
        isBold: false, isItalic: false, isStrike: false,
        isBullet: false, isOrdered: false, isCode: false,
        headingLevel: 'paragraph' as const,
      }
      return {
        isBold:    ctx.editor.isActive('bold'),
        isItalic:  ctx.editor.isActive('italic'),
        isStrike:  ctx.editor.isActive('strike'),
        isBullet:  ctx.editor.isActive('bulletList'),
        isOrdered: ctx.editor.isActive('orderedList'),
        isCode:    ctx.editor.isActive('code'),
        headingLevel: ctx.editor.isActive('heading', { level: 2 })
          ? 'h2'
          : ctx.editor.isActive('heading', { level: 3 })
          ? 'h3'
          : 'paragraph',
      } as const
    },
  })

  if (!editor) return (
    <div className="flex flex-col w-full animate-pulse">
      <div className="flex items-center gap-2 p-2 border-b border-input">
        <Skeleton className="h-8 w-40 rounded-md" />
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-16 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <div className={cn('p-4 flex flex-col gap-2', minHeight)}>
        <Skeleton className="h-3 w-3/4 rounded" />
        <Skeleton className="h-3 w-1/2 rounded" />
        <Skeleton className="h-3 w-2/3 rounded" />
      </div>
    </div>
  )

  const formattingValue = [
    editorState?.isBold   ? 'bold'   : null,
    editorState?.isItalic ? 'italic' : null,
    editorState?.isStrike ? 'strike' : null,
  ].filter((v): v is string => v !== null)

  const listValue = editorState?.isBullet ? 'bullet' : editorState?.isOrdered ? 'ordered' : ''

  const isGhost = variant === 'ghost'

  return (
    <TooltipProvider delayDuration={600}>
      <div className="flex flex-col w-full">
        {/* Toolbar */}
        <div className={cn(
          'flex items-center gap-1 p-2 overflow-x-auto scrollbar-none',
          isGhost
            ? 'border-b border-transparent group-focus-within:border-input transition-colors'
            : 'border-b border-input'
        )}>
          <Select
            value={editorState?.headingLevel}
            onValueChange={(value) => {
              if (value === 'paragraph') {
                editor.chain().focus().setParagraph().run()
              } else {
                const level = parseInt(value.replace('h', '')) as 2 | 3
                editor.chain().focus().toggleHeading({ level }).run()
              }
            }}
          >
            <SelectTrigger className={cn(
              'w-40 text-xs shadow-none focus:ring-0',
              isGhost && 'border-transparent bg-transparent hover:bg-accent'
            )}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className='p-1'>
              <SelectItem value="paragraph">Avsnitt</SelectItem>
              <SelectItem value="h2">Overskrift 2</SelectItem>
              <SelectItem value="h3">Overskrift 3</SelectItem>
            </SelectContent>
          </Select>

          <ToggleGroup
            className={cn('border rounded-full', isGhost && 'border-transparent')}
            type="multiple"
            variant={'outlineBrand'}
            value={formattingValue}
            onValueChange={(values) => {
              const toggleIfChanged = (key: string, command: () => void) => {
                if (formattingValue.includes(key) !== values.includes(key)) command()
              }
              toggleIfChanged('bold',   () => editor.chain().focus().toggleBold().run())
              toggleIfChanged('italic', () => editor.chain().focus().toggleItalic().run())
              toggleIfChanged('strike', () => editor.chain().focus().toggleStrike().run())
            }}
          >
            <ToolbarTooltip label="Bold" shortcut={`${mod}+B`}>
              <ToggleGroupItem value="bold" aria-label="Bold" size="sm">
                <Bold className="h-4 w-4" />
              </ToggleGroupItem>
            </ToolbarTooltip>
            <ToolbarTooltip label="Italic" shortcut={`${mod}+I`}>
              <ToggleGroupItem value="italic" aria-label="Italic" size="sm">
                <Italic className="h-4 w-4" />
              </ToggleGroupItem>
            </ToolbarTooltip>
            <ToolbarTooltip label="Strikethrough" shortcut={`${mod}+Shift+S`}>
              <ToggleGroupItem value="strike" aria-label="Strikethrough" size="sm">
                <Strikethrough className="h-4 w-4" />
              </ToggleGroupItem>
            </ToolbarTooltip>
          </ToggleGroup>

          <ToggleGroup
            className={cn('border rounded-full', isGhost && 'border-transparent')}
            type="single"
            variant={'outlineBrand'}
            value={listValue}
            onValueChange={(value) => {
              if (value === 'bullet') {
                if (editor.isActive('orderedList')) editor.chain().focus().toggleOrderedList().run()
                editor.chain().focus().toggleBulletList().run()
              } else if (value === 'ordered') {
                if (editor.isActive('bulletList')) editor.chain().focus().toggleBulletList().run()
                editor.chain().focus().toggleOrderedList().run()
              } else {
                if (editor.isActive('bulletList'))  editor.chain().focus().toggleBulletList().run()
                if (editor.isActive('orderedList')) editor.chain().focus().toggleOrderedList().run()
              }
            }}
          >
            <ToolbarTooltip label="Bullet list" shortcut={`${mod}+Shift+8`}>
              <ToggleGroupItem value="bullet" aria-label="Bullet list" size="sm">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
            </ToolbarTooltip>
            <ToolbarTooltip label="Ordered list" shortcut={`${mod}+Shift+7`}>
              <ToggleGroupItem value="ordered" aria-label="Ordered list" size="sm">
                <ListOrdered className="h-4 w-4" />
              </ToggleGroupItem>
            </ToolbarTooltip>
          </ToggleGroup>
        </div>

        {/* Editor content */}
        <ScrollArea className={minHeight}>
          <EditorContent editor={editor} />
        </ScrollArea>
      </div>
    </TooltipProvider>
  )
}