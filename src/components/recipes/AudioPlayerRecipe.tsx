import { useState, useEffect, useRef } from 'react'
import { Play, Pause, Square, SkipForward, SkipBack, Volume2, VolumeX, Crown, Lock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { useAuth } from '@/app/providers/AuthProvider'
import { useNavigate } from 'react-router-dom'

interface AudioPlayerRecipeProps {
  title: string
  steps: { step_number: number; content: string }[]
}

export function AudioPlayerRecipe({ title, steps }: AudioPlayerRecipeProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const hasVoiceAccess = user?.subscription_tier === 'plano-pro-14-dias'

  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(-1) // -1 means intro/title
  const [rate, setRate] = useState(1.0) // Speach speed
  const [isMuted, setIsMuted] = useState(false)
  const [autoPlayNext, setAutoPlayNext] = useState(true)
  
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel()
      }
    }
  }, [])

  if (!steps || steps.length === 0) return null

  if (!hasVoiceAccess) {
    return (
      <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 space-y-4 shadow-xl relative overflow-hidden">
        {/* Background decoration or subtle gradient */}
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Crown className="h-20 w-20 text-amber-400 rotate-12" />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-slate-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Modo Cozinha Falada</h3>
          </div>
          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <Lock className="h-2.5 w-2.5" />
            PRO 14 Dias
          </span>
        </div>

        <div className="py-2 space-y-2">
          <p className="text-xs font-bold text-slate-200">Ouça o passo a passo da receita enquanto cozinha</p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            A narração por voz guia você em cada etapa da receita para que você possa cozinhar com as mãos livres, sem precisar tocar no celular.
          </p>
        </div>

        <div className="pt-2">
          <Button 
            onClick={() => navigate('/app/assinatura')}
            className="w-full rounded-2xl py-4 font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-950/20 flex items-center justify-center gap-2 border-none active:scale-95 transition-all text-xs"
          >
            Quero o Plano PRO 14 Dias
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  const speakText = (text: string, onEndCallback: () => void) => {
    if (!synthRef.current) return

    synthRef.current.cancel() // Stop any current speech

    if (isMuted) {
      onEndCallback()
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'pt-BR'
    utterance.rate = rate
    
    utterance.onend = () => {
      onEndCallback()
    }

    utterance.onerror = (e) => {
      console.error('SpeechSynthesis error:', e)
      setIsPlaying(false)
    }

    utteranceRef.current = utterance
    setIsPlaying(true)
    setIsPaused(false)
    synthRef.current.speak(utterance)
  }

  const handlePlayPause = () => {
    if (!synthRef.current) return

    if (isPaused) {
      synthRef.current.resume()
      setIsPaused(false)
      setIsPlaying(true)
      return
    }

    if (isPlaying) {
      synthRef.current.pause()
      setIsPaused(true)
      setIsPlaying(false)
      return
    }

    // Start playing
    playCurrentSegment()
  }

  const stripHtml = (html: string) => {
    if (typeof document === 'undefined') return html.replace(/<[^>]*>/g, '')
    const tmp = document.createElement('DIV')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  const playCurrentSegment = () => {
    if (currentStepIndex === -1) {
      // Speak title and intro
      speakText(`Iniciando receita: ${title}. Vamos aos passos de preparo.`, () => {
        if (steps.length > 0) {
          if (autoPlayNext) {
            setCurrentStepIndex(0)
          } else {
            setIsPlaying(false)
            setCurrentStepIndex(0)
          }
        }
      })
    } else {
      // Speak current step
      const step = steps[currentStepIndex]
      if (step) {
        const cleanContent = stripHtml(step.content)
        speakText(`Passo ${step.step_number}. ${cleanContent}`, () => {
          if (autoPlayNext) {
            if (currentStepIndex < steps.length - 1) {
              setCurrentStepIndex(prev => prev + 1)
            } else {
              // End of recipe
              speakText("Receita finalizada! Bom apetite.", () => {
                setCurrentStepIndex(-1)
                setIsPlaying(false)
                setIsPaused(false)
              })
            }
          } else {
            setIsPlaying(false)
            if (currentStepIndex < steps.length - 1) {
              setCurrentStepIndex(prev => prev + 1)
            } else {
              // End of recipe
              speakText("Receita finalizada! Bom apetite.", () => {
                setCurrentStepIndex(-1)
                setIsPlaying(false)
                setIsPaused(false)
              })
            }
          }
        })
      }
    }
  }

  // Trigger speak when step index changes while playing
  useEffect(() => {
    if (isPlaying && !isPaused) {
      playCurrentSegment()
    }
  }, [currentStepIndex])

  const handleStop = () => {
    if (synthRef.current) {
      synthRef.current.cancel()
    }
    setIsPlaying(false)
    setIsPaused(false)
    setCurrentStepIndex(-1)
  }

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentStepIndex > -1) {
      setCurrentStepIndex(prev => prev - 1)
    }
  }

  return (
    <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 space-y-4 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider">Modo Cozinha Falada</h3>
        </div>
        <div className="flex items-center gap-3">
          {/* Rate adjuster */}
          <span className="text-[10px] text-slate-400 font-bold uppercase">Velocidade: {rate.toFixed(1)}x</span>
          <input 
            type="range" 
            min="0.5" 
            max="2.0" 
            step="0.1" 
            value={rate}
            onChange={e => {
              setRate(Number(e.target.value))
              if (isPlaying) {
                // Restart current segment with new speed
                playCurrentSegment()
              }
            }}
            className="w-16 accent-emerald-500 cursor-pointer h-1 bg-slate-700 rounded-lg appearance-none"
          />
        </div>
      </div>

      <div className="bg-slate-950/60 p-4 rounded-2xl min-h-[60px] flex items-center justify-center border border-slate-800/50">
        <p className="text-xs text-center font-medium leading-relaxed text-slate-300">
          {currentStepIndex === -1 ? (
            <span className="text-slate-400">Clique no Play para ouvir o passo a passo enquanto cozinha.</span>
          ) : (
            <span>
              <strong className="text-emerald-400 block mb-1">Passo #{steps[currentStepIndex]?.step_number}</strong>
              {stripHtml(steps[currentStepIndex]?.content)}
            </span>
          )}
        </p>
      </div>

      <div className="flex items-center justify-between px-1 text-xs text-slate-400 border-t border-slate-800/30 pt-3">
        <span className="font-medium text-slate-300">Reprodução contínua (sem pausar)</span>
        <Switch 
          checked={autoPlayNext} 
          onCheckedChange={setAutoPlayNext}
          className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-slate-800"
        />
      </div>

      <div className="flex items-center justify-center gap-2">
        <Button 
          type="button" 
          variant="ghost" 
          size="icon" 
          onClick={handlePrev} 
          disabled={currentStepIndex <= -1} 
          className="rounded-full text-slate-400 hover:text-white"
        >
          <SkipBack className="h-4 w-4" />
        </Button>

        <Button 
          type="button" 
          onClick={handlePlayPause}
          className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg shadow-emerald-950/20"
        >
          {isPlaying && !isPaused ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-white ml-0.5" />}
        </Button>

        <Button 
          type="button" 
          variant="ghost" 
          size="icon" 
          onClick={handleStop} 
          disabled={!isPlaying && !isPaused && currentStepIndex === -1}
          className="rounded-full text-slate-400 hover:text-white"
        >
          <Square className="h-4 w-4 fill-current" />
        </Button>

        <Button 
          type="button" 
          variant="ghost" 
          size="icon" 
          onClick={handleNext} 
          disabled={currentStepIndex >= steps.length - 1}
          className="rounded-full text-slate-400 hover:text-white"
        >
          <SkipForward className="h-4 w-4" />
        </Button>

        <Button 
          type="button" 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsMuted(m => !m)} 
          className={cn("rounded-full ml-auto text-slate-400 hover:text-white", isMuted && "text-red-400")}
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}
