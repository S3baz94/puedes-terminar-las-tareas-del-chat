import { useRef } from 'react';
import { CalendarDays, HandHeart, TrendingUp, Users, Wallet } from 'lucide-react';
import { AdminQuickActions } from '../../components/admin/AdminQuickActions';
import { Card } from '../../components/common/Card';
import { DataTable, type Column } from '../../components/common/DataTable';
import { StatCard } from '../../components/common/StatCard';
import { StatusPill } from '../../components/common/StatusPill';
import { Button } from '../../components/common/Button';
import { PageHeader } from '../../components/layout/PageHeader';
import { useAppStore } from '../../store/appStore';
import type { User } from '../../types/models';
import { formatCurrency, formatDateTime, statusTone } from '../../utils/format';

export function AdminDashboard() {
  const pendingRegistrationsRef = useRef<HTMLDivElement>(null);
  // Zustand store values and actions
  const users = useAppStore((state) => state.users);
  const donations = useAppStore((state) => state.donations);
  const prayerRequests = useAppStore((state) => state.prayerRequests);
  const events = useAppStore((state) => state.events);
  const content = useAppStore((state) => state.content);
  const approveUser = useAppStore((state) => state.approveUser);

  const publishedCount = content.filter((c) => !c.isDraft).length;
  const draftCount = content.filter((c) => c.isDraft).length;
  const totalCount = content.length;

  const activeMembers = users.filter((user) => user.status === 'active').length;
  const pendingUsers = users.filter((user) => user.status === 'pending');
  const inactiveUsers = users.filter((user) => user.status === 'inactive');
  const weeklyDonations = donations.reduce((sum, donation) => sum + donation.amount, 0);
  const unattendedPrayer = prayerRequests.filter((item) => item.status === 'active').length;
  const nextEvent = events[0] || { title: 'Sin eventos', startDateTime: new Date().toISOString() };

  const pendingColumns: Column<User>[] = [
    { header: 'Nombre', accessor: 'displayName' },
    { header: 'Correo', accessor: 'email' },
    { header: 'Ciudad', accessor: 'city' },
    {
      header: 'Estado',
      accessor: (row) => <StatusPill tone={statusTone(row.status)}>{row.status}</StatusPill>,
    },
    {
      header: 'Acción',
      accessor: (row) => (
        <Button size="sm" onClick={() => approveUser(row.uid)}>
          Aprobar
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        description="Vista operativa con actividad congregacional, finanzas, contenido y alertas pastorales."
        eyebrow="Panel admin"
        title="Centro de control"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          detail="+8% frente al mes anterior"
          icon={<Users className="h-5 w-5" />}
          label="Miembros activos"
          tone="indigo"
          value={String(activeMembers)}
        />
        <StatCard
          detail="Semana actual"
          icon={<Wallet className="h-5 w-5" />}
          label="Ofrendas"
          tone="green"
          value={formatCurrency(weeklyDonations)}
        />
        <StatCard
          detail="Requieren seguimiento"
          icon={<HandHeart className="h-5 w-5" />}
          label="Peticiones activas"
          tone="amber"
          value={String(unattendedPrayer)}
        />
        <StatCard
          detail={formatDateTime(nextEvent.startDateTime)}
          icon={<CalendarDays className="h-5 w-5" />}
          label="Proximo evento"
          tone="ink"
          value={nextEvent.title}
        />
      </div>

      <div className="mt-6">
        <AdminQuickActions
          onScrollToPending={() => {
            pendingRegistrationsRef.current?.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card title="Crecimiento semanal" eyebrow="Asistencia">
          <div className="flex h-64 items-end gap-3">
            {[
              { label: 'Sem 1', value: 176 },
              { label: 'Sem 2', value: 188 },
              { label: 'Sem 3', value: 203 },
              { label: 'Sem 4', value: 219 },
              { label: 'Sem 5', value: 226 },
            ].map((item) => (
              <div className="flex flex-1 flex-col items-center gap-2" key={item.label}>
                <div className="flex h-48 w-full items-end rounded-lg bg-slate-100 p-1">
                  <div
                    className="w-full rounded-md bg-primary"
                    style={{ height: `${(item.value / 240) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-muted">{item.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <div ref={pendingRegistrationsRef}>
          <Card
            action={<TrendingUp className="h-5 w-5 text-success" />}
            eyebrow="Aprobaciones"
            title="Registros pendientes"
          >
            <DataTable columns={pendingColumns} data={pendingUsers} getRowKey={(row) => row.uid} />
          </Card>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card eyebrow="Cuidado pastoral" title="Miembros inactivos">
          <div className="space-y-3">
            {inactiveUsers.map((u) => (
              <div
                className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"
                key={u.uid}
              >
                <div>
                  <p className="font-bold text-ink">{u.displayName}</p>
                  <p className="text-sm font-medium text-muted">Ultima actividad: {formatDateTime(u.lastActiveAt)}</p>
                </div>
                <StatusPill tone="warning">contactar</StatusPill>
              </div>
            ))}
          </div>
        </Card>
        <Card eyebrow="Contenido" title="Resumen editorial">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ['Publicados', publishedCount],
              ['Borradores', draftCount],
              ['Total', totalCount],
            ].map(([label, value]) => (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4" key={label}>
                <p className="text-2xl font-extrabold text-ink">{value}</p>
                <p className="text-sm font-semibold text-muted">{label}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
