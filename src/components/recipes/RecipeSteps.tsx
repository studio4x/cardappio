import type { RecipeStep } from '@/types/recipes'

interface RecipeStepsProps {
  steps: RecipeStep[]
}

export function RecipeSteps({ steps }: RecipeStepsProps) {
  const sortedSteps = [...steps].sort((a, b) => a.step_number - b.step_number)

  return (
    <section className="mb-10">
      <h2
        className="mb-6 text-xl font-bold"
        style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-surface)' }}
      >
        Modo de preparo
      </h2>
      {sortedSteps.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Nenhum passo cadastrado.
        </p>
      ) : (
        <div className="space-y-8">
          {sortedSteps.map((step) => (
            <div key={step.id} className="flex gap-6">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {step.step_number}
              </div>
              <div
                className="prose prose-sm max-w-none text-base leading-relaxed pt-0.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-semibold [&_em]:italic [&_u]:underline"
                style={{ color: 'var(--color-on-surface)' }}
                dangerouslySetInnerHTML={{ __html: step.content }}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
