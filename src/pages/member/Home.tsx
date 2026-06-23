import { BookOpen, Gift, HandHeart, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { StatCard } from '../../components/common/StatCard';
import { StatusPill } from '../../components/common/StatusPill';
import { FormationProgress } from '../../components/member/FormationProgress';
import { PageHeader } from '../../components/layout/PageHeader';
import { useAppStore } from '../../store/appStore';
import { formatDateTime } from '../../utils/format';

export function MemberHome() {
  const { content, events, groups, liveStream, prayerRequests } = useAppStore();
  const devotional = content.find((item) => item.type === 'devotional');
  const primaryGroup = groups[0];
  const nextGroupEvent = primaryGroup
    ? events.find((event) => event.targetGroupIds.includes(primaryGroup.id))
    : undefined;

  return (
    <div>
      <PageHeader
        description="Contenido diario, comunidad, oracion, eventos de tus grupos y ruta espiritual."
        eyebrow="Area miembro"
        title="Inicio"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          detail={devotional?.bibleReference ?? 'Lectura diaria'}
          icon={<BookOpen className="h-5 w-5" />}
          label="Devocional"
          tone="indigo"
          value="Hoy"
        />
        <StatCard
          detail={`${prayerRequests[0]?.prayerCount ?? 0} personas orando`}
          icon={<HandHeart className="h-5 w-5" />}
          label="Oración"
          tone="amber"
          value={String(prayerRequests.length)}
        />
        <StatCard
          detail={liveStream.status === 'live' ? 'Ahora' : formatDateTime(liveStream.scheduledAt)}
          icon={<Radio className="h-5 w-5" />}
          label="Culto en vivo"
          tone="red"
          value={liveStream.status}
        />
        <StatCard
          detail="Stripe listo para activar"
          icon={<Gift className="h-5 w-5" />}
          label="Dar"
          tone="green"
          value="COP"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card
          action={<Link className="text-sm font-bold text-primary" to="/member/devocional">Abrir</Link>}
          eyebrow={devotional?.bibleReference}
          title={devotional?.title}
        >
          <p className="text-lg font-semibold leading-8 text-ink">{devotional?.body}</p>
          <p className="mt-4 text-sm leading-6 text-muted">{devotional?.excerpt}</p>
        </Card>

        <Card eyebrow="Formacion" title="Ruta espiritual">
          <FormationProgress />
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card eyebrow="Grupos" title={primaryGroup?.name ?? 'Mi Grupo'}>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="font-bold text-ink">{nextGroupEvent?.title ?? 'Sin reuniones programadas'}</p>
            <p className="mt-1 text-sm text-muted">
              {nextGroupEvent ? formatDateTime(nextGroupEvent.startDateTime) : 'Sin reuniones'}
            </p>
            {primaryGroup && <StatusPill tone="primary">{primaryGroup.meetingFormat}</StatusPill>}
          </div>
        </Card>
        <Card eyebrow="Testimonios" title="Comunidad">
          <div className="space-y-3">
            {['Dios abrio una puerta laboral', 'Familia reconciliada despues de orar'].map((item) => (
              <div className="rounded-lg border border-slate-200 px-4 py-3" key={item}>
                <p className="font-semibold text-ink">{item}</p>
                <p className="mt-1 text-sm text-muted">Reacciones y comentarios activos.</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
