import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { useAdminAuditLogs } from '@/hooks/admin/useAdminLogs'
import { useAdminCronLogs } from '@/hooks/admin/useAdminNotifications'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { RefreshCw, Shield, Clock, Database, Terminal } from 'lucide-react'

export function AdminLogsPage() {
  const { data: auditLogs, isLoading: isAuditLoading, error: auditError, refetch: refetchAudit } = useAdminAuditLogs()
  const { data: cronLogs, isLoading: isCronLoading, error: cronError, refetch: refetchCron } = useAdminCronLogs()

  if (isAuditLoading || isCronLoading) {
    return <LoadingState message="Carregando logs do sistema..." />
  }

  if (auditError || cronError) {
    return (
      <ErrorState 
        onRetry={() => {
          refetchAudit()
          refetchCron()
        }} 
      />
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader 
          title="Logs do Sistema" 
          subtitle="Auditoria de segurança, trilha de auditoria administrativa e execuções de rotinas automáticas."
        />
        <Button 
          onClick={() => {
            refetchAudit()
            refetchCron()
          }} 
          variant="outline" 
          className="gap-2 self-start sm:self-auto"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar Logs
        </Button>
      </div>

      <Tabs defaultValue="audit" className="w-full">
        <TabsList variant="pill" className="mb-6">
          <TabsTrigger value="audit">
            <Shield className="h-4 w-4" />
            Trilha de Auditoria (Ações)
          </TabsTrigger>
          <TabsTrigger value="cron">
            <Terminal className="h-4 w-4" />
            Execuções Cron
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Audit Logs */}
        <TabsContent value="audit" className="outline-none">
          <div className="rounded-2xl border bg-white overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Database className="h-4 w-4 text-indigo-500" />
                Logs de Auditoria
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b text-xs font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Autor</th>
                    <th className="px-6 py-4">Ação</th>
                    <th className="px-6 py-4">Entidade</th>
                    <th className="px-6 py-4">ID Entidade</th>
                    <th className="px-6 py-4">Metadados (JSON)</th>
                    <th className="px-6 py-4">Data/Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {auditLogs && auditLogs.length > 0 ? (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4">
                          {log.profile ? (
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900">{log.profile.full_name || 'Sem nome'}</span>
                              <span className="text-xs text-slate-500">{log.profile.email}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-mono text-xs">system_role</span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-700">
                          {log.action}
                        </td>
                        <td className="px-6 py-4 capitalize text-slate-500">
                          {log.entity_type}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-400">
                          {log.entity_id || '-'}
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-slate-500 max-w-xs truncate" title={JSON.stringify(log.metadata_json, null, 2)}>
                          {JSON.stringify(log.metadata_json)}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        Nenhum log de auditoria gravado no sistema.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Cron Logs */}
        <TabsContent value="cron" className="outline-none">
          <div className="rounded-2xl border bg-white overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-500" />
                Histórico de Execuções Automáticas
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b text-xs font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Job / Cron</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Processados</th>
                    <th className="px-6 py-4">Resultados (JSON)</th>
                    <th className="px-6 py-4">Data/Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {cronLogs && cronLogs.length > 0 ? (
                    cronLogs.map((cLog) => (
                      <tr key={cLog.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-slate-700">
                          {cLog.job_name}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            cLog.status === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {cLog.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-900">
                          {cLog.processed_count}
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-slate-500 max-w-sm truncate" title={JSON.stringify(cLog.metadata_json, null, 2)}>
                          {JSON.stringify(cLog.metadata_json)}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {new Date(cLog.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        Nenhum registro de cron job encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
