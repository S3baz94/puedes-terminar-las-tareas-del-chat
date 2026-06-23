import { CalendarDays, HandHeart, MessageCircle, Users } from 'lucide-react';
import { AttendanceToggle } from '../../components/leader/AttendanceToggle';
import { Card } from '../../components/common/Card';
import { StatCard } from '../../components/common/StatCard';
import { StatusPill } from '../../components/common/StatusPill';
import { UserAvatar } from '../../components/common/UserAvatar';
import { PageHeader } from '../../components/layout/PageHeader';
import { useAppStore } from '../../store/appStore';
import { formatDateTime, formatShortDate } from '../../utils/format';

export function LeaderDashboard() {
  const { groups, users, events, prayerRequests, pastoralNotes, toggleAttendance } = useAppStore();
  const group = groups[0];
  const members = users.filter((user) => group.memberIds.includes(user.uid));
  const inactiveMembers = members.filter((member) => member.status === 'inactive');
  const nextMeeting = events.find((event) => event.targetGroupIds.includes(group.id));
  const activePrayers = prayerRequests.filter((item) => item.groupId === group.id && item.status === 'active');

  return (
    <div>
      <PageHeader
        description="Seguimiento del grupo, asistencia, alertas pastorales y peticiones activas."
        eyebrow="Panel lider"
        title={group.name}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          detail={`${group.memberIds.length}/${group.maxCapacity} cupos ocupados`}
          icon={<Users className="h-5 w-5" />}
          label="Miembros"
          tone="green"
          value={String(members.length)}
        />
        <StatCard
          detail={nextMeeting ? formatDateTime(nextMeeting.startDateTime) : 'Sin fecha'}
          icon={<CalendarDays className="h-5 w-5" />}
          label="Proxima reunion"
          tone="ink"
          value={group.meetingDay}
        />
        <StatCard
          detail="Oración del grupo"
          icon={<HandHeart className="h-5 w-5" />}
          label="Peticiones activas"
          tone="amber"
          value={String(activePrayers.length)}
        />
        <StatCard
          detail="Contacto directo recomendado"
          icon={<MessageCircle className="h-5 w-5" />}
          label="Alertas"
          tone="red"
          value={String(inactiveMembers.length)}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card eyebrow="Asistencia" title="Reunion de esta semana">
          <div className="space-y-3">
            {nextMeeting ? (
              members.map((member) => (
                <AttendanceToggle
                  key={member.uid}
                  name={member.displayName}
                  isPresent={nextMeeting.attendeeIds.includes(member.uid)}
                  onToggle={() => toggleAttendance(nextMeeting.id, member.uid)}
                />
              ))
            ) : (
              <p className="text-sm text-muted">No hay reuniones programadas</p>
            )}
          </div>
        </Card>
        <Card eyebrow="Pastoral" title="Seguimientos proximos">
          <div className="space-y-3">
            {pastoralNotes.map((note) => {
              const member = users.find((user) => user.uid === note.memberId);
              return (
                <div className="rounded-lg border border-slate-200 bg-white p-4" key={note.id}>
                  <div className="flex items-center gap-3">
                    <UserAvatar name={member?.displayName ?? 'Miembro'} size="sm" />
                    <div>
                      <p className="font-bold text-ink">{member?.displayName}</p>
                      <p className="text-xs font-semibold text-muted">{note.type}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted">{note.content}</p>
                  {note.followUpDate ? (
                    <p className="mt-3 text-sm font-bold text-primary">{formatShortDate(note.followUpDate)}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <Card eyebrow="Alertas" title="Miembros que necesitan contacto">
          <div className="grid gap-3 md:grid-cols-2">
            {inactiveMembers.map((member) => (
              <div
                className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"
                key={member.uid}
              >
                <div className="flex items-center gap-3">
                  <UserAvatar name={member.displayName} size="sm" />
                  <div>
                    <p className="font-bold text-ink">{member.displayName}</p>
                    <p className="text-sm text-muted">{member.phone}</p>
                  </div>
                </div>
                <StatusPill tone="warning">hoy</StatusPill>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
