import { useState } from 'react'
import { Link, Check } from 'lucide-react'
import { toast } from 'sonner'

interface RecipeShareProps {
  title: string
  recipeSlug: string
}

// Custom brand SVGs for WhatsApp, Facebook, X/Twitter
const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-11.985c.144.242.24.415.396.676.156.261.24.437.36.677.12.24.06.45-.03.63-.09.18-.396.63-.586.855-.19.225-.39.465-.165.855.225.39.99 1.635 2.13 2.64 1.462 1.282 2.685 1.68 3.075 1.875.39.195.615.165.84-.09.225-.255.975-1.14 1.245-1.53.27-.39.54-.33.9-.195.36.135 2.28 1.08 2.67 1.275.39.195.645.285.735.45.09.165.09.945-.255 1.935-.345.99-1.725 1.935-2.775 2.055-1.05.12-2.43.075-4.23-.675-1.8-.75-3.84-2.85-4.995-4.425-1.155-1.575-2-3.465-2.01-5.415-.01-1.95.99-2.91 1.35-3.3.36-.39.75-.48.99-.48.24 0 .48 0 .69.015.225.015.525-.09.81.6.3.735.99 2.43 1.08 2.61.09.18.15.39.03.63-.12.24-.27.39-.45.6-.18.21-.39.465-.18.825z" />
  </svg>
)

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
)

const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

export function RecipeShare({ title, recipeSlug }: RecipeShareProps) {
  const [copied, setCopied] = useState(false)
  const shareUrl = `${window.location.origin}/app/receitas/${recipeSlug}`
  const shareText = `Olha só essa receita de *${title}* que encontrei no Cardappio! 🍳😋\n\nConfira os ingredientes e o passo a passo completo no link:`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
      setCopied(true)
      toast.success('Link copiado com sucesso!')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error('Erro ao copiar link')
    }
  }

  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`

  return (
    <div className="bg-white rounded-2xl p-4 border shadow-sm" style={{ borderColor: 'var(--color-outline-variant)' }}>
      <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-3">
        Compartilhar Receita
      </h3>
      <div className="grid grid-cols-4 gap-2">
        <a 
          href={whatsappShareUrl}
          target="_blank" 
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-100 text-emerald-600 transition-all active:scale-95 cursor-pointer text-center group"
          title="Compartilhar no WhatsApp"
        >
          <WhatsAppIcon className="h-5 w-5 mb-1.5 transition-transform group-hover:scale-110" />
          <span className="text-[9px] font-bold tracking-tight">WhatsApp</span>
        </a>
        
        <a 
          href={facebookShareUrl}
          target="_blank" 
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-50 hover:bg-blue-100/70 border border-blue-100 text-blue-600 transition-all active:scale-95 cursor-pointer text-center group"
          title="Compartilhar no Facebook"
        >
          <FacebookIcon className="h-5 w-5 mb-1.5 transition-transform group-hover:scale-110" />
          <span className="text-[9px] font-bold tracking-tight">Facebook</span>
        </a>

        <a 
          href={twitterShareUrl}
          target="_blank" 
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 transition-all active:scale-95 cursor-pointer text-center group"
          title="Compartilhar no Twitter / X"
        >
          <XIcon className="h-5 w-5 mb-1.5 transition-transform group-hover:scale-110" />
          <span className="text-[9px] font-bold tracking-tight">Twitter / X</span>
        </a>

        <button 
          onClick={handleCopyLink}
          className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all active:scale-95 cursor-pointer text-center group ${
            copied 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
          }`}
          title="Copiar link da receita"
        >
          {copied ? (
            <Check className="h-5 w-5 mb-1.5 text-emerald-600 animate-in zoom-in-50 duration-200" />
          ) : (
            <Link className="h-5 w-5 mb-1.5 transition-transform group-hover:scale-110" />
          )}
          <span className="text-[9px] font-bold tracking-tight">{copied ? 'Copiado!' : 'Copiar'}</span>
        </button>
      </div>
    </div>
  )
}
