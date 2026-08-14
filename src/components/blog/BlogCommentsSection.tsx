import { useState, useEffect, type FormEvent } from 'react'
import { MessageSquare, Send, CheckCircle2, AlertCircle } from 'lucide-react'
import { useAuth } from '@/app/providers/AuthProvider'
import { useBlogComments, useSubmitBlogComment } from '@/hooks/blog/useBlog'
import { Button } from '@/components/ui/button'

interface BlogCommentsSectionProps {
  postSlug: string
  postId?: string
}

function createCaptchaChallenge() {
  const left = Math.floor(Math.random() * 8) + 1
  const right = Math.floor(Math.random() * 8) + 1
  return { prompt: `${left} + ${right}`, answer: String(left + right) }
}

export function BlogCommentsSection({ postSlug, postId }: BlogCommentsSectionProps) {
  const { user } = useAuth()
  const { data: comments, isLoading } = useBlogComments(postSlug)
  const submitComment = useSubmitBlogComment()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [content, setContent] = useState('')
  const [captcha, setCaptcha] = useState(() => createCaptchaChallenge())
  const [captchaInput, setCaptchaInput] = useState('')
  const [commentError, setCommentError] = useState<string | null>(null)
  const [commentSuccess, setCommentSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      const fullName = (user.full_name || '').trim()
      const parts = fullName ? fullName.split(/\s+/).filter(Boolean) : []
      setFirstName(parts[0] || '')
      setLastName(parts.slice(1).join(' ') || '')
      setEmail(user.email || '')
    }
  }, [user])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setCommentError(null)
    setCommentSuccess(null)

    if (!content.trim()) {
      setCommentError('Por favor, escreva seu comentário.')
      return
    }

    if (!user && (!firstName.trim() || !email.trim())) {
      setCommentError('Por favor, informe seu nome e e-mail.')
      return
    }

    if (captchaInput.trim() !== captcha.answer) {
      setCommentError('Resultado do desafio anti-spam incorreto. Tente novamente.')
      return
    }

    try {
      await submitComment.mutateAsync({
        postSlug,
        postId,
        firstName: firstName || 'Visitante',
        lastName: lastName || '',
        email: email || 'usuario@cardappio.app',
        content: content.trim()
      })

      setContent('')
      setCaptchaInput('')
      setCaptcha(createCaptchaChallenge())
      setCommentSuccess('Seu comentário foi enviado com sucesso e está aguardando aprovação!')
      setIsFormOpen(false)
    } catch (err: any) {
      setCommentError(err.message || 'Erro ao enviar comentário. Tente novamente.')
    }
  }

  return (
    <section className="mt-12 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
          <MessageSquare className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Comentários</h2>
          <p className="text-xs text-slate-500 font-medium">
            Participe da conversa! Os comentários passam por aprovação da nossa equipe.
          </p>
        </div>
      </div>

      {/* Alert Messages */}
      {commentError && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{commentError}</span>
        </div>
      )}

      {commentSuccess && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{commentSuccess}</span>
        </div>
      )}

      {/* List of Approved Comments */}
      <div className="mt-6 space-y-4">
        {isLoading ? (
          <p className="text-xs font-semibold text-neutral-400">Carregando comentários...</p>
        ) : !comments || comments.length === 0 ? (
          <p className="text-xs font-medium text-neutral-400">Nenhum comentário publicado ainda neste artigo. Seja o primeiro a comentar!</p>
        ) : (
          comments.map((item) => {
            const initials = `${(item.first_name?.[0] || 'V').toUpperCase()}${(item.last_name?.[0] || '').toUpperCase()}`
            const formattedDate = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(item.created_at))

            return (
              <article key={item.id} className="rounded-2xl border border-neutral-100 bg-slate-50/60 p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-xs font-extrabold uppercase text-white shadow-sm">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="text-xs font-bold text-slate-900">{item.first_name} {item.last_name}</p>
                      <span className="text-[11px] font-semibold text-slate-400">{formattedDate}</span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-slate-700 whitespace-pre-line">{item.content}</p>

                    {/* Admin Response Block */}
                    {item.admin_response && (
                      <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs text-emerald-950">
                        <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Resposta da Equipe Cardappio</p>
                        <p className="mt-1 leading-relaxed">{item.admin_response}</p>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            )
          })
        )}
      </div>

      {/* Toggle & Comment Form */}
      <div className="mt-8 border-t border-neutral-100 pt-6">
        <Button
          type="button"
          onClick={() => setIsFormOpen((prev) => !prev)}
          className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-2.5"
        >
          {isFormOpen ? 'Fechar Formulário' : 'Enviar Comentário'}
        </Button>

        {isFormOpen && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Nome</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Seu nome"
                  disabled={!!user}
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-900 outline-none focus:border-emerald-500 disabled:bg-slate-100"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Sobrenome</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Sobrenome"
                  disabled={!!user}
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-900 outline-none focus:border-emerald-500 disabled:bg-slate-100"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  disabled={!!user}
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-900 outline-none focus:border-emerald-500 disabled:bg-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Comentário</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Escreva seu comentário..."
                rows={4}
                className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-900 outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-xl text-xs font-semibold text-slate-700">
                <span>Desafio anti-spam: Resolva <strong>{captcha.prompt}</strong> =</span>
                <input
                  type="text"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  placeholder="?"
                  className="w-16 h-8 rounded-lg border border-slate-300 px-2 text-center text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                />
              </div>

              <Button
                type="submit"
                disabled={submitComment.isPending}
                className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider px-6 h-10 gap-2 shrink-0"
              >
                <Send className="h-3.5 w-3.5" />
                {submitComment.isPending ? 'Enviando...' : 'Publicar Comentário'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}
