import { useState, FormEvent } from 'react';
import type { User as ModelUser, Group, MeetingFormat } from '../../types/models';
import { useAuth } from '../../hooks/useAuth';
import { useAppStore } from '../../store/appStore';
import { Card } from '../common/Card';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { StatusPill } from '../common/StatusPill';
import { AttendanceToggle } from './AttendanceToggle';
import { formatDateTime } from '../../utils/format';

interface LeaderMeetingsTabProps {
  leaderGroup: Group | null;
  groupMembers: ModelUser[];
}

export function LeaderMeetingsTab({ leaderGroup, groupMembers }: LeaderMeetingsTabProps) {
  const { user } = useAuth();
  const events = useAppStore((state) => state.events);
  const addEvent = useAppStore((state) => state.addEvent);
  const toggleAttendance = useAppStore((state) => state.toggleAttendance);

  // Forms local state
  const [meetingTitle, setMeetingTitle] = useState('Reunión de Célula');
  const [meetingDesc, setMeetingDesc] = useState('Nuestra reunión semanal de estudio y compañerismo.');
  const [meetingDateTime, setMeetingDateTime] = useState('');
  const [meetingFormat, setMeetingFormat] = useState<MeetingFormat>('in_person');
  const [meetingLocation, setMeetingLocation] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [meetingCapacity, setMeetingCapacity] = useState('20');
  const [schedulerMsg, setSchedulerMsg] = useState<string | null>(null);

  const groupEvent = events.find((e) => e.targetGroupIds.includes(leaderGroup?.id ?? '')) || events[0];

  async function handleScheduleMeeting(event: FormEvent) {
    event.preventDefault();
    if (!meetingTitle.trim() || !meetingDateTime) {
      setSchedulerMsg('El título y la fecha son obligatorios.');
      return;
    }
    if (!leaderGroup) {
      setSchedulerMsg('No tienes un grupo asignado.');
      return;
    }

    setSchedulerMsg('Programando...');
    try {
      const startDT = new Date(meetingDateTime).toISOString();
      const endDT = new Date(new Date(meetingDateTime).getTime() + 90 * 60 * 1000).toISOString(); // +1.5 hours

      await addEvent({
        title: meetingTitle,
        description: meetingDesc,
        type: 'cell',
        format: meetingFormat,
        location: meetingFormat !== 'virtual' ? meetingLocation : undefined,
        virtualLink: meetingFormat !== 'in_person' ? meetingLink : undefined,
        startDateTime: startDT,
        endDateTime: endDT,
        organizerId: user?.uid || '',
        capacity: Number(meetingCapacity),
        requiresRSVP: true,
        rsvpDeadline: startDT,
        targetGroupIds: [leaderGroup.id],
      });

      setSchedulerMsg('¡Reunión programada con éxito!');
      setMeetingTitle('Reunión de Célula');
      setMeetingDateTime('');
      setTimeout(() => setSchedulerMsg(null), 3000);
    } catch (err) {
      setSchedulerMsg('Error al programar la reunión.');
      setTimeout(() => setSchedulerMsg(null), 3000);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
      <Card title="Control de Asistencia (Última Reunión)">
        <div className="space-y-3">
          {groupMembers.map((member) => {
            const isPresent = groupEvent ? groupEvent.attendeeIds.includes(member.uid) : false;
            return (
              <AttendanceToggle
                key={member.uid}
                name={member.displayName}
                isPresent={isPresent}
                onToggle={() => groupEvent && toggleAttendance(groupEvent.id, member.uid)}
              />
            );
          })}
        </div>
      </Card>

      <div className="space-y-6">
        <Card eyebrow="Programar" title="Programar Reunión">
          <form onSubmit={handleScheduleMeeting} className="space-y-4">
            <Input
              label="Título de la Reunión"
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.currentTarget.value)}
            />
            <Input
              label="Fecha y Hora"
              type="datetime-local"
              value={meetingDateTime}
              onChange={(e) => setMeetingDateTime(e.currentTarget.value)}
            />
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-ink">Formato</span>
              <select
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-panel"
                value={meetingFormat}
                onChange={(e) => setMeetingFormat(e.currentTarget.value as MeetingFormat)}
              >
                <option value="in_person">Presencial</option>
                <option value="virtual">Virtual</option>
                <option value="hybrid">Híbrido</option>
              </select>
            </label>
            {meetingFormat !== 'virtual' && (
              <Input
                label="Ubicación / Dirección"
                placeholder="Casa de Juan, Calle 10 #2-3"
                value={meetingLocation}
                onChange={(e) => setMeetingLocation(e.currentTarget.value)}
              />
            )}
            {meetingFormat !== 'in_person' && (
              <Input
                label="Enlace de Reunión (Zoom/Meet)"
                placeholder="https://zoom.us/j/..."
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.currentTarget.value)}
              />
            )}
            <Input
              label="Capacidad Máxima"
              type="number"
              value={meetingCapacity}
              onChange={(e) => setMeetingCapacity(e.currentTarget.value)}
            />
            {schedulerMsg && <p className="text-sm font-semibold text-indigo-600 animate-fade-in">{schedulerMsg}</p>}
            <Button className="w-full" type="submit">Programar Reunión</Button>
          </form>
        </Card>

        <Card eyebrow="Historial" title="Reuniones recientes">
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {events
              .filter((event) => leaderGroup && event.targetGroupIds.includes(leaderGroup.id))
              .map((event) => (
                <div className="rounded-lg border border-slate-200 p-4" key={event.id}>
                  <p className="font-bold text-ink">{event.title}</p>
                  <p className="mt-1 text-sm text-muted">{formatDateTime(event.startDateTime)}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <StatusPill tone="success">{`${event.attendeeIds.length} asistentes`}</StatusPill>
                    <span className="text-xs text-muted uppercase font-bold">{event.format}</span>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
