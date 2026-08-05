import { useState, useEffect } from 'react'
import { useAppSettings } from '@/hooks/useAppSettings'
import { Utensils } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RecipeImageProps {
  src?: string | null
  alt: string
  className?: string
}

export function RecipeImage({ src, alt, className }: RecipeImageProps) {
  const { visualIdentity } = useAppSettings() as any
  const [processedSrc, setProcessedSrc] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (!src) {
      setLoading(false)
      return
    }

    const watermarkUrl = visualIdentity?.watermark_url

    // Se não houver marca d'água configurada, exibe a imagem original
    if (!watermarkUrl) {
      setProcessedSrc(src)
      setLoading(false)
      return
    }

    let isMounted = true
    setLoading(true)

    const applyWatermark = async () => {
      try {
        const [img, watermark] = await Promise.all([
          loadImage(src, true), // Tenta carregar a imagem original da receita com CORS habilitado
          loadImage(watermarkUrl, true) // Tenta carregar a marca d'água com CORS habilitado
        ])

        if (!isMounted) return

        // Cria canvas em memória
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Não foi possível obter o contexto 2D do canvas')

        // Define a resolução nativa do canvas como sendo a da imagem original
        canvas.width = img.naturalWidth || img.width
        canvas.height = img.naturalHeight || img.height

        // Desenha a imagem de capa original da receita
        ctx.drawImage(img, 0, 0)

        // Tamanho da marca d'água (porcentagem da largura da imagem original, vinda do banco ou padrão de 24%)
        const sizePercent = visualIdentity?.watermark_size || 24
        const watermarkWidth = canvas.width * (sizePercent / 100)
        const scale = watermarkWidth / watermark.naturalWidth
        const watermarkHeight = watermark.naturalHeight * scale

        // Adiciona margem de 4% da largura/altura da imagem de capa (mínimo de 16px)
        const marginX = Math.max(canvas.width * 0.04, 16)
        const marginY = Math.max(canvas.height * 0.04, 16)

        // Calcula a posição do logotipo com base no watermark_position
        const position = visualIdentity?.watermark_position || 'top_left'
        let x = marginX
        let y = marginY

        if (position === 'top_right') {
          x = canvas.width - watermarkWidth - marginX
        } else if (position === 'bottom_left') {
          y = canvas.height - watermarkHeight - marginY
        } else if (position === 'bottom_right') {
          x = canvas.width - watermarkWidth - marginX
          y = canvas.height - watermarkHeight - marginY
        } else if (position === 'center') {
          x = (canvas.width - watermarkWidth) / 2
          y = (canvas.height - watermarkHeight) / 2
        }

        // Desenha o logotipo da marca d'água no canvas
        ctx.drawImage(watermark, x, y, watermarkWidth, watermarkHeight)

        // Exporta a imagem combinada com qualidade de 92%
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
        
        if (isMounted) {
          setProcessedSrc(dataUrl)
          setLoading(false)
        }
      } catch (err) {
        console.warn('Erro CORS ou falha ao desenhar marca d\'água no canvas. Ativando fallback visual HTML:', err)
        if (isMounted) {
          // Se falhar (ex: bloqueio CORS de domínios externos), exibe a imagem original e ativa o overlay CSS
          setProcessedSrc(src)
          setHasError(true)
          setLoading(false)
        }
      }
    }

    applyWatermark()

    return () => {
      isMounted = false
    }
  }, [src, visualIdentity?.watermark_url, visualIdentity?.watermark_size, visualIdentity?.watermark_position])

  // Helper em Promise para carregar uma imagem
  const loadImage = (url: string, useCors = false): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      if (useCors) {
        img.crossOrigin = 'anonymous'
      }
      img.onload = () => resolve(img)
      img.onerror = (e) => reject(e)
      img.src = url
    })
  }

  if (!src) {
    return (
      <div className={cn("flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-400", className)}>
        <Utensils className="h-10 w-10 opacity-30" />
      </div>
    )
  }

  // Enquanto processa o canvas, exibe a imagem original como um placeholder imediato
  const displaySrc = processedSrc || src

  // Estilo inline para o fallback de HTML (caso ocorra erro CORS)
  const sizePercent = visualIdentity?.watermark_size || 24
  const position = visualIdentity?.watermark_position || 'top_left'
  
  let overlayStyle: React.CSSProperties = {
    width: `${sizePercent}%`,
    position: 'absolute',
    pointerEvents: 'none',
    userSelect: 'none',
    zIndex: 10
  }

  if (position === 'top_left') {
    overlayStyle.top = '4%'
    overlayStyle.left = '4%'
  } else if (position === 'top_right') {
    overlayStyle.top = '4%'
    overlayStyle.right = '4%'
  } else if (position === 'bottom_left') {
    overlayStyle.bottom = '4%'
    overlayStyle.left = '4%'
  } else if (position === 'bottom_right') {
    overlayStyle.bottom = '4%'
    overlayStyle.right = '4%'
  } else if (position === 'center') {
    overlayStyle.top = '50%'
    overlayStyle.left = '50%'
    overlayStyle.transform = 'translate(-50%, -50%)'
  }

  return (
    <div className={cn("relative w-full h-full overflow-hidden", className)}>
      <img
        src={displaySrc}
        alt={alt}
        className="w-full h-full object-cover"
      />
      
      {/* Fallback visual: Se houve falha de CORS ao desenhar no canvas,
          desenhamos a marca d'água como um elemento HTML absolute por cima da imagem.
          Assim o logotipo é exibido na posição e tamanho configurados perfeitamente. */}
      {hasError && visualIdentity?.watermark_url && (
        <div style={overlayStyle} className="animate-fade-in">
          <img
            src={visualIdentity.watermark_url}
            alt=""
            className="w-full h-auto object-contain"
          />
        </div>
      )}
    </div>
  )
}
