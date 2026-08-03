import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import {
  Bold,
  Italic,
  UnderlineIcon,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo2,
  Redo2,
  Link2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { RecipeLinkModal } from './RecipeLinkModal'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: string
  className?: string
  /**
   * When true, adds a 🔗 button to the toolbar that lets admins
   * insert a link to another recipe into the content.
   */
  enableRecipeLinks?: boolean
}

function ToolbarButton({
  onClick,
  active,
  title,
  disabled,
  children,
}: {
  onClick: () => void
  active?: boolean
  title: string
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      className={cn(
        'rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:opacity-30 cursor-pointer',
        active && 'bg-primary/10 text-primary'
      )}
    >
      {children}
    </button>
  )
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeight = '120px',
  className,
  enableRecipeLinks = false,
}: RichTextEditorProps) {
  const [recipeLinkModalOpen, setRecipeLinkModalOpen] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        code: false,
        blockquote: false,
        horizontalRule: false,
        strike: false,
      }),
      Underline,
      Placeholder.configure({
        placeholder: placeholder ?? 'Digite o conteúdo aqui...',
        emptyEditorClass:
          'before:content-[attr(data-placeholder)] before:text-slate-400 before:pointer-events-none before:absolute before:top-[10px] before:left-[12px] before:text-sm',
      }),
      TextAlign.configure({ types: ['paragraph'] }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      const html = editor.isEmpty ? '' : editor.getHTML()
      onChange(html)
    },
    editorProps: {
      attributes: {
        class: cn(
          'px-3 py-2.5 text-sm text-slate-800 outline-none focus:outline-none relative leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-semibold [&_em]:italic [&_u]:underline [&_a]:text-primary [&_a]:underline [&_a]:font-medium [&_a]:cursor-pointer',
          `min-h-[${minHeight}]`
        ),
        style: `min-height: ${minHeight};`,
      },
    },
  })

  useEffect(() => {
    if (!editor) return
    const currentHTML = editor.isEmpty ? '' : editor.getHTML()
    if (value !== currentHTML) {
      editor.commands.setContent(value || '', { emitUpdate: false })
    }
  }, [value, editor])

  if (!editor) return null

  const iconSize = 'h-3.5 w-3.5'

  const handleInsertRecipeLink = (recipe: { id: string; slug: string; title: string }) => {
    if (!editor) return
    // Insert an anchor tag with the recipe slug
    const linkHtml = `<a href="/app/receitas/${recipe.slug}">${recipe.title}</a>`
    editor.chain().focus().insertContent(linkHtml).run()
    setRecipeLinkModalOpen(false)
  }

  return (
    <>
      <div
        className={cn(
          'rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary transition-all',
          className
        )}
      >
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-100 bg-slate-50/80 px-2 py-1.5">
          {/* Undo / Redo */}
          <ToolbarButton
            title="Desfazer"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo2 className={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            title="Refazer"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo2 className={iconSize} />
          </ToolbarButton>

          <div className="mx-1 h-4 w-px bg-slate-200" />

          {/* Bold / Italic / Underline */}
          <ToolbarButton
            title="Negrito (Ctrl+B)"
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
          >
            <Bold className={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            title="Itálico (Ctrl+I)"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
          >
            <Italic className={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            title="Sublinhado (Ctrl+U)"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive('underline')}
          >
            <UnderlineIcon className={iconSize} />
          </ToolbarButton>

          <div className="mx-1 h-4 w-px bg-slate-200" />

          {/* Lists */}
          <ToolbarButton
            title="Lista com marcadores"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
          >
            <List className={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            title="Lista numerada"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
          >
            <ListOrdered className={iconSize} />
          </ToolbarButton>

          <div className="mx-1 h-4 w-px bg-slate-200" />

          {/* Alignment */}
          <ToolbarButton
            title="Alinhar à esquerda"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            active={editor.isActive({ textAlign: 'left' })}
          >
            <AlignLeft className={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            title="Centralizar"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            active={editor.isActive({ textAlign: 'center' })}
          >
            <AlignCenter className={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            title="Alinhar à direita"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            active={editor.isActive({ textAlign: 'right' })}
          >
            <AlignRight className={iconSize} />
          </ToolbarButton>

          {/* Recipe link button — only shown when enableRecipeLinks is true */}
          {enableRecipeLinks && (
            <>
              <div className="mx-1 h-4 w-px bg-slate-200" />
              <ToolbarButton
                title="Inserir link para outra receita"
                onClick={() => setRecipeLinkModalOpen(true)}
              >
                <Link2 className={iconSize} />
              </ToolbarButton>
            </>
          )}
        </div>

        {/* Editor body */}
        <EditorContent editor={editor} />
      </div>

      {/* Recipe link insertion modal */}
      {enableRecipeLinks && (
        <RecipeLinkModal
          open={recipeLinkModalOpen}
          title="Inserir Link de Receita"
          onClose={() => setRecipeLinkModalOpen(false)}
          onSelect={handleInsertRecipeLink}
        />
      )}
    </>
  )
}
