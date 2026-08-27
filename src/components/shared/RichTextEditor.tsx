import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import {
  Bold,
  Italic,
  UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Link2,
  Image as ImageIcon,
  Video,
  Eraser,
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { RecipeLinkModal } from './RecipeLinkModal'
import { MediaLibraryModal } from './MediaLibraryModal'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: string
  className?: string
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
        'rounded-xl p-2 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 border border-slate-200 bg-white shadow-xs cursor-pointer select-none',
        active && 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold'
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
  const [mediaModalOpen, setMediaModalOpen] = useState(false)
  const [editorSelectionTime, setEditorSelectionTime] = useState(0)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        codeBlock: false,
        code: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Underline,
      Placeholder.configure({
        placeholder: placeholder ?? 'Digite o conteúdo aqui...',
        emptyEditorClass:
          'before:content-[attr(data-placeholder)] before:text-slate-400 before:pointer-events-none before:absolute before:top-[10px] before:left-[12px] before:text-sm',
      }),
      TextAlign.configure({
        types: ['paragraph', 'heading'],
        alignments: ['left', 'center', 'right', 'justify']
      }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      const html = editor.isEmpty ? '' : editor.getHTML()
      onChange(html)
    },
    onSelectionUpdate: () => {
      setEditorSelectionTime(Date.now())
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-slate max-w-none focus:outline-none px-4 py-3 text-sm text-slate-800 relative leading-relaxed prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl prose-h4:text-lg prose-p:leading-relaxed prose-a:text-emerald-600 prose-img:rounded-2xl',
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

  const iconSize = 'h-4 w-4'

  const handleInsertRecipeLink = (recipe: { id: string; slug: string; title: string }) => {
    if (!editor) return
    const linkHtml = `<a href="/app/receitas/${recipe.slug}">${recipe.title}</a>`
    editor.chain().focus().insertContent(linkHtml).run()
    setRecipeLinkModalOpen(false)
  }

  const handleInsertCustomLink = () => {
    if (!editor) return
    const url = window.prompt('Digite a URL do link:')
    if (!url) return
    const text = window.prompt('Digite o texto do link:')
    if (!text) return
    const linkHtml = `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`
    editor.chain().focus().insertContent(linkHtml).run()
  }

  const handleInsertVideo = () => {
    if (!editor) return
    const embedUrl = window.prompt('Digite a URL do vídeo do YouTube / Vimeo:')
    if (!embedUrl) return
    
    // Convert watch URL to embed URL if needed
    let finalUrl = embedUrl
    if (embedUrl.includes('youtube.com/watch?v=')) {
      const videoId = embedUrl.split('v=')[1]?.split('&')[0]
      finalUrl = `https://www.youtube.com/embed/${videoId}`
    } else if (embedUrl.includes('youtu.be/')) {
      const videoId = embedUrl.split('youtu.be/')[1]?.split('?')[0]
      finalUrl = `https://www.youtube.com/embed/${videoId}`
    }

    const videoHtml = `
      <div class="aspect-video my-4 w-full max-w-2xl mx-auto overflow-hidden rounded-2xl border bg-slate-100">
        <iframe src="${finalUrl}" class="w-full h-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
      </div>
    `
    editor.chain().focus().insertContent(videoHtml).run()
  }

  return (
    <>
      <div
        className={cn(
          'rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-emerald-500 transition-all',
          className
        )}
      >
        {/* GenFlix-Style Rich Editor Toolbar */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 bg-slate-50/50 px-3 py-2.5">
          
          {/* 1. ESTRUTURA DROPDOWN */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                data-selection={editorSelectionTime}
                className="flex items-center gap-1 px-3.5 h-9 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-xs cursor-pointer outline-none select-none"
              >
                {editor.isActive('heading', { level: 2 }) ? 'Título 2' :
                 editor.isActive('heading', { level: 3 }) ? 'Título 3' :
                 editor.isActive('heading', { level: 4 }) ? 'Título 4' :
                 editor.isActive('paragraph') ? 'Parágrafo' : 'Estrutura'}
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              onCloseAutoFocus={(e) => e.preventDefault()} 
              className="bg-white border p-1 rounded-xl shadow-md min-w-32"
            >
              <DropdownMenuItem onSelect={() => editor.chain().focus().setParagraph().run()} className="text-xs font-bold text-slate-700 py-1.5 px-3.5 hover:bg-slate-50 cursor-pointer rounded-lg">
                Parágrafo
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className="text-xs font-black text-slate-900 py-1.5 px-3.5 hover:bg-slate-50 cursor-pointer rounded-lg">
                Título 2
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className="text-xs font-extrabold text-slate-800 py-1.5 px-3.5 hover:bg-slate-50 cursor-pointer rounded-lg">
                Título 3
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} className="text-xs font-bold text-slate-700 py-1.5 px-3.5 hover:bg-slate-50 cursor-pointer rounded-lg">
                Título 4
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 2. ALINHAR DROPDOWN */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1 px-3.5 h-9 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-xs cursor-pointer outline-none select-none"
              >
                Alinhar
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              onCloseAutoFocus={(e) => e.preventDefault()} 
              className="bg-white border p-1 rounded-xl shadow-md min-w-32"
            >
              <DropdownMenuItem onSelect={() => editor.chain().focus().setTextAlign('left').run()} className="text-xs font-bold text-slate-700 py-1.5 px-3.5 hover:bg-slate-50 cursor-pointer rounded-lg">
                ⬅️ Alinhar à Esquerda
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => editor.chain().focus().setTextAlign('center').run()} className="text-xs font-bold text-slate-700 py-1.5 px-3.5 hover:bg-slate-50 cursor-pointer rounded-lg">
                ↔️ Centralizar
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => editor.chain().focus().setTextAlign('right').run()} className="text-xs font-bold text-slate-700 py-1.5 px-3.5 hover:bg-slate-50 cursor-pointer rounded-lg">
                ➡️ Alinhar à Direita
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => editor.chain().focus().setTextAlign('justify').run()} className="text-xs font-bold text-slate-700 py-1.5 px-3.5 hover:bg-slate-50 cursor-pointer rounded-lg">
                🟰 Justificar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="h-5 w-px bg-slate-200 mx-1.5" />

          {/* 3. FORMATTING BUTTONS: B, I, U, S */}
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
          <ToolbarButton
            title="Tachado"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive('strike')}
          >
            <Strikethrough className={iconSize} />
          </ToolbarButton>

          <div className="h-5 w-px bg-slate-200 mx-1.5" />

          {/* 4. LISTS */}
          <ToolbarButton
            title="Lista de marcadores"
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

          <div className="h-5 w-px bg-slate-200 mx-1.5" />

          {/* 5. ACTIONS: LINK, IMAGE, VIDEO, CLEAN */}
          {enableRecipeLinks ? (
            <ToolbarButton
              title="Inserir link de receita"
              onClick={() => setRecipeLinkModalOpen(true)}
            >
              <Link2 className={iconSize} />
            </ToolbarButton>
          ) : (
            <ToolbarButton
              title="Inserir Link externo"
              onClick={handleInsertCustomLink}
            >
              <Link2 className={iconSize} />
            </ToolbarButton>
          )}

          <ToolbarButton
            title="Inserir Imagem (Biblioteca de Mídia)"
            onClick={() => setMediaModalOpen(true)}
          >
            <ImageIcon className={iconSize} />
          </ToolbarButton>

          <ToolbarButton
            title="Inserir Vídeo (Youtube/Vimeo)"
            onClick={handleInsertVideo}
          >
            <Video className={iconSize} />
          </ToolbarButton>

          <ToolbarButton
            title="Limpar formatação"
            onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          >
            <Eraser className={iconSize} />
          </ToolbarButton>

        </div>

        {/* Editor body */}
        <div className="relative">
          <EditorContent editor={editor} />
        </div>
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

      {/* Media Library Modal for Image insertion */}
      <MediaLibraryModal
        open={mediaModalOpen}
        onClose={() => setMediaModalOpen(false)}
        title="Selecionar Imagem para o Artigo"
        onSelect={(url) => {
          if (!editor) return
          const imgHtml = `<img src="${url}" alt="Imagem do Artigo" style="max-width: 100%; height: auto; border-radius: 16px; margin: 16px 0;" />`
          editor.chain().focus().insertContent(imgHtml).run()
          setMediaModalOpen(false)
        }}
      />
    </>
  )
}
