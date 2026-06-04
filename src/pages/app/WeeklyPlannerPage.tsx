import { useState, useMemo } from 'react'
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom'
import { Plus, ShoppingCart, Loader2, Save, SlidersVertical as Tune, ChevronRight, ChevronDown, Pencil, X } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { useActiveWeek, useCreateWeek, useWeek, useWeeks, useRepeatWeek, useUpdateWeek, useDeleteWeek } from '@/hooks/planning/usePlanning'
import { useProfile } from '@/hooks/auth'
import { DayPlannerCard } from '@/components/planning/DayPlannerCard'
import { DAY_LABELS, DAY_ORDER as ALL_DAYS, type DayOfWeek } from '@/lib/constants/calendar'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'


export function WeeklyPlannerPage() {
  const navigate = useNavigate()
  const { weekId: routeWeekId } = useParams()
  const { pathname } = useLocation()
  const { preferences } = useProfile()
  
  const createWeek = useCreateWeek()
  const repeatWeek = useRepeatWeek()
  const updateWeek = useUpdateWeek()
  const { data: weeks } = useWeeks()
  
  const [newWeekTitle, setNewWeekTitle] = useState('')
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [renameTitle, setRenameTitle] = useState('')
  
  const deleteWeek = useDeleteWeek()
  const [weekToDelete, setWeekToDelete] = useState<any | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleDeleteClick = (week: any) => {
    setWeekToDelete(week)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteWeek = async () => {
    if (!weekToDelete) return
    try {
      await deleteWeek.mutateAsync(weekToDelete.id)
      toast.success('Semana excluída com sucesso!')
      
      if (activeWeek && activeWeek.id === weekToDelete.id) {
        const remainingWeeks = weeks?.filter(w => w.id !== weekToDelete.id) || []
        if (remainingWeeks.length > 0) {
          navigate(`/app/semana/${remainingWeeks[0].id}`)
        } else {
          navigate('/app/semana/nova')
        }
      }
      setIsDeleteDialogOpen(false)
      setWeekToDelete(null)
    } catch (err) {
      toast.error('Erro ao excluir semana')
    }
  }

  const handleRenameWeek = async () => {
    if (!activeWeek) return
    try {
      await updateWeek.mutateAsync({
        weekId: activeWeek.id,
        updates: { title: renameTitle.trim() || null }
      })
      toast.success('Semana renomeada com sucesso!')
      setIsRenameDialogOpen(false)
    } catch (err) {
      toast.error('Erro ao renomear semana')
    }
  }

  const openRenameDialog = () => {
    setRenameTitle(activeWeek?.title || '')
    setIsRenameDialogOpen(true)
  }

  
  const { data: activeWeekData, isLoading: isActiveLoading, error: activeError, refetch: refetchActive } = useActiveWeek()
  
  const isCreatingNew = pathname === '/app/semana/nova'
  const shouldQuerySpecificWeek = !!routeWeekId && !isCreatingNew && routeWeekId !== activeWeekData?.id
  
  const { data: specificWeekData, isLoading: isSpecificLoading, error: specificError, refetch: refetchSpecific } = useWeek(
    shouldQuerySpecificWeek ? routeWeekId : undefined
  )
  
  const activeWeek = isCreatingNew ? null : (shouldQuerySpecificWeek ? specificWeekData : activeWeekData)
  const isLoading = isActiveLoading || (shouldQuerySpecificWeek && isSpecificLoading)
  const error = shouldQuerySpecificWeek ? specificError : activeError
  const refetch = shouldQuerySpecificWeek ? refetchSpecific : refetchActive

  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(
    ALL_DAYS.slice(0, preferences?.default_plan_days ?? 5)
  )

  const defaultMondayStr = useMemo(() => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
    const monday = new Date(today.setDate(diff))
    return monday.toISOString().split('T')[0]
  }, [])

  const [customStartDate, setCustomStartDate] = useState(defaultMondayStr)
  
  const customEndDate = useMemo(() => {
    if (!customStartDate) return ''
    const start = new Date(customStartDate + 'T12:00:00')
    const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000)
    return end.toISOString().split('T')[0]
  }, [customStartDate])

  const mealModes = useMemo(() => {
    if (!preferences?.default_meal_modes) return ['lunch', 'dinner']
    const modes = preferences.default_meal_modes
    return Array.isArray(modes) ? modes : ['lunch', 'dinner']
  }, [preferences])

  const todayFormatted = useMemo(() => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' }
    const dateStr = new Date().toLocaleDateString('pt-BR', options)
    return dateStr.charAt(0).toUpperCase() + dateStr.slice(1)
  }, [])

  const formatDateToShort = (dateStr: string) => {
    if (!dateStr) return ''
    const d = new Date(dateStr + 'T12:00:00')
    return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
  }

  const handleCreateNextWeek = async () => {
    let baseDate = new Date()
    
    if (activeWeek) {
      const currentEnd = new Date(activeWeek.week_end_date + 'T12:00:00')
      const today = new Date()
      if (currentEnd >= today) {
        baseDate = currentEnd
      }
    }
    
    const dayOfWeek = baseDate.getDay()
    const daysToNextMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek
    
    const nextStart = new Date(baseDate)
    nextStart.setDate(baseDate.getDate() + daysToNextMonday)
    
    const nextEnd = new Date(nextStart)
    nextEnd.setDate(nextStart.getDate() + 6)
    
    const startDateStr = nextStart.toISOString().split('T')[0]
    const endDateStr = nextEnd.toISOString().split('T')[0]
    
    try {
      const week = await createWeek.mutateAsync({ 
        startDate: startDateStr, 
        endDate: endDateStr, 
        selectedDays, 
        mealModes 
      })
      if (week) {
        navigate(`/app/semana/${week.id}`)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleRepeatWeek = async (weekId: string) => {
    try {
      const week = await repeatWeek.mutateAsync(weekId)
      if (week) {
        navigate(`/app/semana/${week.id}`)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const getDayOfMonth = (startDateStr: string, sortOrder: number) => {
    try {
      const baseDate = new Date(startDateStr + 'T12:00:00')
      const dayOfWeek = baseDate.getDay()
      const diff = baseDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
      const monday = new Date(baseDate.setDate(diff))
      monday.setDate(monday.getDate() + sortOrder)
      return monday.getDate()
    } catch {
      return 12 + sortOrder
    }
  }

  if (isLoading) return <LoadingState message="Carregando planejador..." />
  if (error) return <ErrorState onRetry={() => refetch()} />

  if (!activeWeek) {
     return (
        <div className="max-w-2xl mx-auto px-5 pt-8 pb-32">
          <PageHeader title="Montar Semana" subtitle="Selecione os dias e a data de início que deseja planejar." />
          <div className="bg-white rounded-3xl border p-6 space-y-6">
            
            {/* Título da Semana */}
            <div className="space-y-2">
              <label htmlFor="weekTitleInput" className="text-xs font-bold uppercase tracking-wider text-warm-gray-medium block">
                Nome / Título da Semana (Opcional)
              </label>
              <Input
                id="weekTitleInput"
                type="text"
                placeholder="Ex: Minha Semana Fit, Foco Dieta, Férias..."
                value={newWeekTitle}
                onChange={(e) => setNewWeekTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-neutral-50 text-sm text-on-surface font-semibold h-auto"
              />
            </div>

            {/* Data de Início */}
             <div className="space-y-2">
               <label htmlFor="startDateInput" className="text-xs font-bold uppercase tracking-wider text-warm-gray-medium block">
                 Data de Início
               </label>
               <input
                 id="startDateInput"
                 type="date"
                 value={customStartDate}
                 onChange={(e) => setCustomStartDate(e.target.value)}
                 className="w-full px-4 py-3 rounded-2xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-neutral-50 text-sm text-on-surface font-semibold"
               />
               {customEndDate && (
                 <p className="text-xs text-[#6d759c] font-semibold">
                   Seu planejamento cobrirá de {formatDateToShort(customStartDate)} a {formatDateToShort(customEndDate)} (7 dias).
                 </p>
               )}
             </div>

             {/* Seleção de Dias */}
             <div className="space-y-2">
               <label className="text-xs font-bold uppercase tracking-wider text-warm-gray-medium block">
                 Dias para Planejar
               </label>
               <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {ALL_DAYS.map((day) => (
                    <button
                      key={day}
                      onClick={() => setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])}
                      className={cn(
                        "rounded-2xl border px-4 py-4 text-xs font-bold transition-all uppercase tracking-widest cursor-pointer",
                        selectedDays.includes(day) ? "bg-emerald-50 border-primary text-primary" : "bg-neutral-50 border-transparent text-neutral-400"
                      )}
                    >
                      {DAY_LABELS[day].substring(0, 3)}
                    </button>
                  ))}
               </div>
             </div>

             <Button 
                onClick={async () => {
                  if (!customStartDate || !customEndDate) return
                  const week = await createWeek.mutateAsync({ 
                    startDate: customStartDate, 
                    endDate: customEndDate, 
                    selectedDays, 
                    mealModes,
                    title: newWeekTitle.trim() || undefined
                  })
                  if(week) navigate(`/app/semana/${week.id}`)
                }} 
                disabled={selectedDays.length === 0 || !customStartDate}
                className="w-full py-6 rounded-2xl text-lg font-bold"
             >
                Começar Planejamento
             </Button>
          </div>
        </div>
     )
  }

  const sortedDays = [...(activeWeek.days ?? [])].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="bg-surface min-h-screen pb-32">
      <main className="max-w-2xl mx-auto px-5 pt-8 space-y-10">
        
        {/* Today's orientation banner */}
        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-primary">Hoje é</p>
              <p className="text-sm font-extrabold text-on-surface">{todayFormatted}</p>
            </div>
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest text-secondary bg-secondary/10 px-2.5 py-1 rounded-lg">
            Guia do Dia
          </span>
        </div>
        
        {/* Week Header */}
        <section className="flex flex-col gap-6">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-warm-gray-medium mb-1 block">
                {activeWeek.status === 'active' ? 'SEMANA ATIVA' : 'SEMANA ARQUIVADA'}
                {` • ${formatDateToShort(activeWeek.week_start_date)} a ${formatDateToShort(activeWeek.week_end_date)}`}
              </span>
              
              {/* Week Selector Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 text-3xl font-extrabold text-on-surface tracking-tight hover:opacity-80 transition-opacity text-left cursor-pointer">
                    <span>{activeWeek.title || 'Meu Planejamento'}</span>
                    <ChevronDown className="h-6 w-6 text-primary shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64 rounded-2xl border border-neutral-100 shadow-lg bg-white p-2 z-50">
                  <div className="px-2 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Selecionar Semana
                  </div>
                  {weeks?.map((w) => {
                    const isCurrent = w.id === activeWeek.id
                    return (
                      <DropdownMenuItem
                        key={w.id}
                        onClick={() => navigate(`/app/semana/${w.id}`)}
                        className={cn(
                          "rounded-xl px-3 py-2 text-sm cursor-pointer transition-colors focus:bg-neutral-50 flex items-center justify-between group/item gap-4",
                          isCurrent 
                            ? "bg-primary/10 text-primary font-bold focus:bg-primary/15" 
                            : "hover:bg-neutral-50 text-on-surface"
                        )}
                      >
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="font-semibold text-sm truncate">
                            {w.title || `${formatDateToShort(w.week_start_date)} a ${formatDateToShort(w.week_end_date)}`}
                          </span>
                          {w.title && (
                            <span className="text-[10px] text-neutral-400 mt-0.5 truncate">
                              {formatDateToShort(w.week_start_date)} a {formatDateToShort(w.week_end_date)}
                            </span>
                          )}
                          {w.status === 'active' && (
                            <span className="text-[9px] uppercase tracking-wider text-primary font-bold mt-0.5">
                              Ativa
                            </span>
                          )}
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleDeleteClick(w);
                          }}
                          className="p-1.5 rounded-md text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer opacity-100 sm:opacity-0 sm:group-hover/item:opacity-100 focus:opacity-100 shrink-0"
                          title="Excluir semana"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </DropdownMenuItem>
                    )
                  })}
                  {(!weeks || weeks.length === 0) && (
                    <div className="px-3 py-2 text-xs text-neutral-400">
                      Nenhuma semana encontrada
                    </div>
                  )}
                  <DropdownMenuSeparator className="my-1 bg-neutral-100" />
                  <DropdownMenuItem
                    onClick={() => navigate('/app/semana/nova')}
                    className="rounded-xl px-3 py-2 text-sm text-primary font-bold cursor-pointer hover:bg-neutral-50 focus:bg-neutral-50"
                  >
                    + Nova Semana
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Options Dropdown Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-3 bg-neutral-100 hover:bg-neutral-200 rounded-2xl transition-colors cursor-pointer">
                  <Tune className="h-5 w-5 text-on-surface-variant" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl border border-neutral-100 shadow-lg bg-white p-2 z-50">
                <div className="px-2 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Opções do Plano
                </div>
                
                <DropdownMenuItem
                  onClick={handleCreateNextWeek}
                  className="rounded-xl px-3 py-2 text-sm cursor-pointer hover:bg-neutral-50 focus:bg-neutral-50 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4 text-primary" />
                  <span>Planejar Próxima Semana</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => handleRepeatWeek(activeWeek.id)}
                  className="rounded-xl px-3 py-2 text-sm cursor-pointer hover:bg-neutral-50 focus:bg-neutral-50 flex items-center gap-2"
                >
                  <Save className="h-4 w-4 text-secondary" />
                  <span>Repetir Esta Semana</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={openRenameDialog}
                  className="rounded-xl px-3 py-2 text-sm cursor-pointer hover:bg-neutral-50 focus:bg-neutral-50 flex items-center gap-2"
                >
                  <Pencil className="h-4 w-4 text-primary" />
                  <span>Renomear Semana</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1 bg-neutral-100" />

                <DropdownMenuItem
                  onClick={() => navigate('/app/historico')}
                  className="rounded-xl px-3 py-2 text-sm cursor-pointer hover:bg-neutral-50 focus:bg-neutral-50 flex items-center gap-2"
                >
                  <span>Ver Histórico</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Horizontal Day Scroller */}
          <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
            {sortedDays.map((day, idx) => (
              <div 
                key={day.id}
                className={cn(
                  "flex-shrink-0 flex flex-col items-center justify-center w-16 h-24 rounded-3xl transition-all duration-300 border-2",
                  idx === 0 
                    ? "bg-primary border-primary text-white shadow-xl shadow-primary/20 ring-4 ring-primary/10" 
                    : "bg-white border-neutral-100 text-on-surface"
                )}
              >
                <span className={cn("text-[10px] font-bold uppercase tracking-widest", idx === 0 ? "opacity-80" : "text-warm-gray-medium")}>
                  {DAY_LABELS[day.day_of_week as DayOfWeek].substring(0, 3)}
                </span>
                <span className="text-xl font-black mt-1">
                  {getDayOfMonth(activeWeek.week_start_date, day.sort_order)}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Daily Slots */}
        <div className="space-y-12">
          {sortedDays.map((day) => (
            <DayPlannerCard key={day.id} day={day} weekId={activeWeek.id} />
          ))}
        </div>

        {/* FAB */}
        <button className="fixed bottom-24 right-6 w-16 h-16 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform duration-150 z-40">
           <Save className="h-8 w-8" />
        </button>

        {/* CTA to Shopping List */}
        <div className="pt-10">
           <Link 
            to={`/app/semana/${activeWeek.id}/compras`}
            className="flex items-center justify-between bg-neutral-900 text-white p-6 rounded-3xl group"
           >
              <div className="flex items-center gap-4">
                 <div className="bg-white/10 p-3 rounded-2xl">
                    <ShoppingCart className="h-6 w-6" />
                 </div>
                 <div>
                    <p className="font-bold">Gerar Lista de Compras</p>
                    <p className="text-xs text-white/60">Baseado nas receitas planejadas acima.</p>
                 </div>
              </div>
              <ChevronRight className="h-5 w-5 text-white/40 group-hover:translate-x-1 transition-transform" />
           </Link>
        </div>
      </main>

      {/* Dialog para renomear a semana */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-white max-w-[90vw]">
          <DialogHeader className="space-y-3 text-left">
            <DialogTitle className="text-xl font-extrabold text-on-surface">Renomear Semana</DialogTitle>
            <DialogDescription className="text-sm text-neutral-500">
              Escolha um nome personalizado para esta semana de planejamento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="renameWeekInput" className="text-xs font-bold uppercase tracking-wider text-warm-gray-medium block">
                Nome da Semana
              </Label>
              <Input
                id="renameWeekInput"
                type="text"
                placeholder="Ex: Minha Semana Fit, Foco Dieta, Férias..."
                value={renameTitle}
                onChange={(e) => setRenameTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-neutral-50 text-sm text-on-surface font-semibold h-auto"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRenameDialogOpen(false)}
              className="rounded-2xl py-3 px-5 border border-neutral-200 text-sm font-semibold hover:bg-neutral-50 transition-colors"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleRenameWeek}
              disabled={updateWeek.isPending}
              className="rounded-2xl py-3 px-5 text-sm font-bold bg-primary text-white"
            >
              {updateWeek.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para confirmar a exclusão da semana */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-white max-w-[90vw]">
          <DialogHeader className="space-y-3 text-left">
            <DialogTitle className="text-xl font-extrabold text-on-surface">Excluir Semana</DialogTitle>
            <DialogDescription className="text-sm text-neutral-500">
              Tem certeza que deseja excluir a semana{" "}
              <span className="font-semibold text-on-surface">
                {weekToDelete?.title || (weekToDelete ? `${formatDateToShort(weekToDelete.week_start_date)} a ${formatDateToShort(weekToDelete.week_end_date)}` : '')}
              </span>
              ? Esta ação é irreversível e excluirá todos os planos de refeições e listas de compras associados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setWeekToDelete(null)
              }}
              className="rounded-2xl py-3 px-5 border border-neutral-200 text-sm font-semibold hover:bg-neutral-50 transition-colors"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleDeleteWeek}
              disabled={deleteWeek.isPending}
              className="rounded-2xl py-3 px-5 text-sm font-bold bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              {deleteWeek.isPending ? 'Excluindo...' : 'Confirmar Exclusão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
