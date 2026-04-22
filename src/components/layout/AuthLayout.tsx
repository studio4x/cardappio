import { Outlet, Link } from 'react-router-dom'
import { Utensils, Calendar, ShoppingBasket, Sparkles } from 'lucide-react'
import { config } from '@/config'

export function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-off-white">
      {/* Visual Section (Desktop Only) */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden bg-emerald-600 items-center justify-center p-12">
        <div className="absolute inset-0 opacity-20 transform scale-110">
          <img 
            alt="Fresh ingredients" 
            className="w-full h-full object-cover" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZPpdjbFKnwEDYfvtbdNpIRJfE_66vMBu0uFku-rVV8WDfzmm7RRT_bg_cqjrrZQWXg_muqrmZni9QLYOTl90j_J3eTuIqbkYSeIR42p_fFtvxLALDp0diX1FQWPUodk4sbib2I9OsfEtZlFWxA9KxP0NpOH6loAlwsVrA5Yk3URxVRdXcLKId4jBqF-Mnvkf-VUuiyXlBQTAgxjJvVb4_RyFkFj0rlDL0cdrpBMsHTcLfON7eK4cgK-jnJsXbdzlHbPXRJvzu4xFK"
          />
        </div>
        
        <div className="relative z-10 text-center space-y-8 max-w-md">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-[2rem] shadow-2xl mb-4 rotate-3">
            <Utensils className="h-10 w-10 text-primary" style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <h1 className="text-5xl font-extrabold text-white tracking-tighter mb-4">Cardappio</h1>
            <p className="text-xl text-white/90 leading-relaxed">Sua rotina organizada, sua alimentação saudável e seu dia a dia com menos estresse.</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-12">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl text-left">
              <Calendar className="h-6 w-6 text-white mb-3" />
              <p className="font-bold text-sm text-white">Planejamento Semanal</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl text-left">
              <ShoppingBasket className="h-6 w-6 text-white mb-3" />
              <p className="font-bold text-sm text-white">Lista Inteligente</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-24 bg-surface relative">
        {/* Mobile Header */}
        <div className="md:hidden absolute top-10 left-10 flex items-center gap-2">
          <Utensils className="h-6 w-6 text-primary" />
          <span className="text-xl font-extrabold text-primary tracking-tighter">Cardappio</span>
        </div>

        <div className="max-w-md w-full mx-auto">
          <Outlet />

          {/* Tips Widget (Desktop Floating) */}
          <div className="hidden lg:block fixed top-10 right-10 z-50">
            <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-primary/10 flex items-center gap-4 max-w-xs animate-in slide-in-from-right duration-500">
              <div className="w-10 h-10 bg-success-green/10 rounded-full flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-success-green" />
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface leading-tight">Dica da Estação</p>
                <p className="text-xs text-text-secondary">Abóbora e Brócolis em alta agora.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
