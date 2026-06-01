import { useState, useEffect, useRef } from 'react'
import { Play, Pause, Square, SkipForward, SkipBack, Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AudioPlayerRecipeProps {
  title: string
  steps: { step_number: number; content: string }[]
}

export function AudioPlayerRecipe({ title, steps }: AudioPlayerRecipeProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(-1) // -1 means intro/title
  const [rate, setRate] = useState(1.0) // Speach speed
  const [isMuted, setIsMuted] = useState(false)
  
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
      setIsPlaying(false)
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

  const playCurrentSegment = () => {
    if (currentStepIndex === -1) {
      // Speak title and intro
      speakText(`Iniciando receita: ${title}. Vamos aos passos de preparo.`, () => {
        if (steps.length > 0) {
          setCurrentStepIndex(0)
        }
      })
    } else {
      // Speak current step
      const step = steps[currentStepIndex]
      if (step) {
        speakText(`Passo ${step.step_number}. ${step.content}`, () => {
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

  if (!steps || steps.length === 0) return null

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
              {steps[currentStepIndex]?.content}
            </span>
          )}
        </p>
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
