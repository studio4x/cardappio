import { useState } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Heart, Search, Star, MessageCircle, MapPin, Award, Check, ChefHat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/shared/EmptyState'

interface Cozinheira {
  id: string
  name: string
  avatar: string
  rating: number
  reviewsCount: number
  region: string
  specialties: string[]
  description: string
  whatsapp: string
}

export function CozinheiraShowcasePage() {
  const [search, setSearch] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('')

  // Mock cozinheiras representing professionals from Diamantes na Cozinha
  const cozinheiras: Cozinheira[] = [
    {
      id: '1',
      name: 'Maria das Graças',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=60',
      rating: 4.9,
      reviewsCount: 24,
      region: 'Zona Sul - Rio de Janeiro',
      specialties: ['Comida Caseira', 'Massas', 'Congelados'],
      description: 'Formada pela turma de 2025 do Diamantes na Cozinha. Especialista em preparar cardápios semanais saudáveis e organizar sua despensa.',
      whatsapp: '5521999999999'
    },
    {
      id: '2',
      name: 'Janaína Souza',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=60',
      rating: 4.8,
      reviewsCount: 18,
      region: 'Zona Norte - Rio de Janeiro',
      specialties: ['Feijoada', 'Comida Fit', 'Sem Glúten'],
      description: 'Cozinheira profissional apaixonada por nutrição prática. Crio cardápios customizados e cozinho na sua casa com autonomia e segurança.',
      whatsapp: '5521988888888'
    },
    {
      id: '3',
      name: 'Clara Mendes',
      avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150&auto=format&fit=crop&q=60',
      rating: 5.0,
      reviewsCount: 32,
      region: 'Centro - Rio de Janeiro',
      specialties: ['Vegana', 'Doces Saudáveis', 'Saladas'],
      description: 'Especialista em culinária funcional e vegetariana. Formada na ONG com foco em aproveitamento integral dos alimentos.',
      whatsapp: '5521977777777'
    }
  ]

  const filteredCozinheiras = cozinheiras.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                          c.specialties.some(s => s.toLowerCase().includes(search.toLowerCase()))
    const matchesRegion = !selectedRegion || c.region.includes(selectedRegion)
    return matchesSearch && matchesRegion
  })

  return (
    <div className="max-w-2xl mx-auto px-5 py-8 pb-32 space-y-6">
      <div className="bg-emerald-600 text-white rounded-[2.5rem] p-8 relative overflow-hidden shadow-lg shadow-emerald-700/10">
        <div className="relative z-10 space-y-3">
          <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white border-none py-1 px-3 rounded-full text-[10px] font-bold uppercase tracking-wider">
            Projeto Social
          </Badge>
          <h2 className="text-2xl font-black">Diamantes na Cozinha</h2>
          <p className="text-xs text-emerald-100 leading-relaxed max-w-md">
            Conectamos você a cozinheiras formadas pelo projeto social liderado pelo chef João Diamante. 
            Contrate profissionais autônomas para preparar seu cardápio com segurança jurídica e liberdade.
          </p>
        </div>
        <Award className="absolute right-6 bottom-6 h-28 w-28 text-white/5 rotate-12" />
      </div>

      <PageHeader 
        title="Vitrine de Talentos" 
        subtitle="Encontre cozinheiras para preparar suas receitas planejadas." 
      />

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Buscar por nome ou especialidade (ex: Vegana)..." 
            className="pl-10 rounded-2xl border-slate-200 py-6"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {['', 'Zona Sul', 'Zona Norte', 'Centro'].map(reg => (
            <button
              key={reg}
              onClick={() => setSelectedRegion(reg)}
              className={cn(
                'px-4 py-2 rounded-full border text-xs font-bold transition-all cursor-pointer shrink-0',
                (selectedRegion === reg) ? 'bg-primary text-white border-primary' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              )}
            >
              {reg === '' ? 'Todas as Regiões' : reg}
            </button>
          ))}
        </div>
      </div>

      {/* Cozinheiras Grid */}
      <div className="space-y-4">
        {filteredCozinheiras.length === 0 ? (
          <EmptyState icon={<ChefHat className="h-10 w-10 text-slate-300" />} title="Nenhuma profissional encontrada" description="Tente ajustar os filtros de busca ou região." />
        ) : (
          filteredCozinheiras.map(c => (
            <div key={c.id} className="bg-white rounded-[2rem] border border-slate-200 p-6 flex flex-col sm:flex-row gap-5 shadow-sm hover:shadow-md transition-all">
              <img src={c.avatar} alt={c.name} className="h-20 w-20 rounded-2xl object-cover border border-slate-100 shrink-0 mx-auto sm:mx-0" />
              
              <div className="flex-1 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <h4 className="text-base font-bold text-slate-900 text-center sm:text-left">{c.name}</h4>
                    <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-slate-400" /> {c.region}
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 px-2.5 py-1 rounded-full self-center">
                    <Star className="h-3.5 w-3.5 fill-amber-500" /> {c.rating} ({c.reviewsCount})
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed text-center sm:text-left">{c.description}</p>

                <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                  {c.specialties.map(spec => (
                    <Badge key={spec} variant="secondary" className="bg-slate-50 border border-slate-200 text-slate-500 rounded-lg text-[10px] font-bold">
                      {spec}
                    </Badge>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                    <Check className="h-3.5 w-3.5 stroke-[3]" /> Autonomia de Contratação
                  </div>
                  
                  <a 
                    href={`https://wa.me/${c.whatsapp}?text=Olá%20${c.name},%20vi%20seu%20perfil%20no%20app%20Cardappio%20e%20gostaria%20de%20solicitar%20um%20orçamento!`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto"
                  >
                    <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center gap-2 font-bold px-6">
                      <MessageCircle className="h-4 w-4 fill-white" /> WhatsApp
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
