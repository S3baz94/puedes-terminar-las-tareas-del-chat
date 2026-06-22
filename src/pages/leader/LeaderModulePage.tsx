import { FormEvent, useState, useEffect } from 'react';
import { FileText, Plus, Send } from 'lucide-react';
import { AttendanceToggle } from '../../components/leader/AttendanceToggle';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { DataTable, type Column } from '../../components/common/DataTable';
import { Input } from '../../components/common/Input';
import { StatusPill } from '../../components/common/StatusPill';
import { UserAvatar } from '../../components/common/UserAvatar';
import { PageHeader } from '../../components/layout/PageHeader';
import { useAuth } from '../../hooks/useAuth';
import { useAppStore } from '../../store/appStore';
import type { PastoralNote, PrayerRequest, User } from '../../types/models';
import { formatDateTime, formatShortDate, statusTone } from '../../utils/format';

export type LeaderModule = 'mi-grupo' | 'pastoral' | 'reuniones' | 'oracion' | 'recursos' | 'reportes';

const moduleTitles: Record<LeaderModule, string> = {
  'mi-grupo': 'Mi grupo',
  pastoral: 'Seguimiento pastoral',
  reuniones: 'Reuniones',
  oracion: 'Oracion del grupo',
  recursos: 'Recursos',
  reportes: 'Reportes',
};

export function LeaderModulePage({ module }: { module: LeaderModule }) {
  const { user } = useAuth();

  // Zustand stores
  const users = useAppStore((state) => state.users);
  const groups = useAppStore((state) => state.groups);
  const events = useAppStore((state) => state.events);
  const pastoralNotes = useAppStore((state) => state.pastoralNotes);
  const prayerRequests = useAppStore((state) => state.prayerRequests);

  // Zustand actions
  const addPastoralNote = useAppStore((state) => state.addPastoralNote);
  const updatePrayerPastoralNote = useAppStore((state) => state.updatePrayerPastoralNote);
  const resolvePrayerRequest = useAppStore((state) => state.resolvePrayerRequest);
  const toggleAttendance = useAppStore((state) => state.toggleAttendance);

  const title = moduleTitles[module];

  // Find leader's group
  const leaderGroup = groups.find((g) => g.leaderId === user?.uid) ?? groups[0];
  const groupMembers = users.filter((u) => leaderGroup.memberIds.includes(u.uid));

  // Columns definitions
  const memberColumns: Column<User>[] = [
    { header: 'Nombre', accessor: 'displayName' },
    {
      header: 'Estado',
      accessor: (row) => <StatusPill tone={statusTone(row.status)}>{row.status}</StatusPill>,
    },
    { header: 'Ciudad', accessor: 'city' },
    { header: 'Ultima actividad', accessor: (row) => formatDateTime(row.lastActiveAt) },
  ];

  const noteColumns: Column<PastoralNote>[] = [
    {
      header: 'Miembro',
      accessor: (row) => users.find((u) => u.uid === row.memberId)?.displayName ?? 'Miembro',
    },
    { header: 'Tipo', accessor: 'type' },
    { header: 'Estado', accessor: 'memberStatus' },
    { header: 'Seguimiento', accessor: (row) => (row.followUpDate ? formatShortDate(row.followUpDate) : 'Sin fecha') },
  ];

  const prayerColumns: Column<PrayerRequest>[] = [
    { header: 'Peticion', accessor: 'title' },
    { header: 'Visibilidad', accessor: 'visibility' },
    { header: 'Oraciones', accessor: (row) => String(row.prayerCount) },
    {
      header: 'Estado',
      accessor: (row) => <StatusPill tone={row.status === 'active' ? 'warning' : 'success'}>{row.status}</StatusPill>,
    },
  ];

  // Forms local state
  const [noteMemberId, setNoteMemberId] = useState('');
  const [noteDate, setNoteDate] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [pastoralMessage, setPastoralMessage] = useState<string | null>(null);

  // Group prayer pastoral follow-up
  const [selectedPrayerId, setSelectedPrayerId] = useState('');
  const [prayerNoteText, setPrayerNoteText] = useState('');
  const [prayerResponseMsg, setPrayerResponseMsg] = useState<string | null>(null);

  const selectedPrayer = prayerRequests.find((p) => p.id === selectedPrayerId) || prayerRequests[0];

  useEffect(() => {
    if (selectedPrayer) {
      setPrayerNoteText(selectedPrayer.pastoralNote || '');
    }
  }, [selectedPrayerId, selectedPrayer]);

  function handleSavePastoralNote(event: FormEvent) {
    event.preventDefault();
    if (!noteMemberId || !noteContent.trim()) {
      setPastoralMessage('Por favor completa todos los campos.');
      return;
    }
    addPastoralNote({
      memberId: noteMemberId,
      leaderId: user?.uid ?? 'guest',
      type: 'meeting',
      content: noteContent,
      followUpDate: noteDate || undefined,
      memberStatus: 'active',
      isPrivate: true,
    });
    setNoteContent('');
    setNoteDate('');
    setNoteMemberId('');
    setPastoralMessage('¡Nota pastoral registrada con éxito!');
    setTimeout(() => setPastoralMessage(null), 3000);
  }

  function handleSavePrayerNote() {
    if (!selectedPrayer) return;
    updatePrayerPastoralNote(selectedPrayer.id, prayerNoteText);
    setPrayerResponseMsg('¡Nota guardada en la petición!');
    setTimeout(() => setPrayerResponseMsg(null), 3000);
  }

  function handleMarkPrayerAnswered() {
    if (!selectedPrayer) return;
    resolvePrayerRequest(selectedPrayer.id);
    setPrayerResponseMsg('¡Petición marcada como respondida!');
    setTimeout(() => setPrayerResponseMsg(null), 3000);
  }

  function handleGenerateReport() {
    alert('Reporte generado:\nAsistencia del grupo: 72%\nPeticiones activas: ' + prayerRequests.length + '\nMiembros inactivos: 1');
  }

  // Interactive buttons handlers
  function handleNewAction() {
    if (module === 'pastoral') {
      const el = document.querySelector('select') as HTMLSelectElement;
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (module === 'oracion') {
      const el = document.querySelector('select') as HTMLSelectElement;
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      alert('Registra contacto, asistencia u oraciones en los paneles interactivos.');
    }
  }

  return (
    <div>
      <PageHeader
        action={<Button icon={<Plus className="h-4 w-4" />} onClick={handleNewAction}>Nuevo</Button>}
        eyebrow="Liderazgo"
        title={title}
      />

      {module === 'mi-grupo' ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
          <Card title="Miembros">
            <DataTable columns={memberColumns} data={groupMembers} getRowKey={(row) => row.uid} />
          </Card>
          <Card eyebrow="Ficha completa" title={leaderGroup.name}>
            <div className="space-y-4">
              {groupMembers.map((member) => (
                <div className="rounded-lg border border-slate-200 p-4" key={member.uid}>
                  <div className="flex items-center gap-3">
                    <UserAvatar name={member.displayName} size="sm" />
                    <div>
                      <p className="font-bold text-ink">{member.displayName}</p>
                      <p className="text-sm text-muted">{member.favoriteVerse ?? 'Sin versiculo'}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted">{member.testimony ?? 'Sin testimonio registrado.'}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : null}

      {module === 'pastoral' ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
          <Card title="Historial cronologico">
            <DataTable columns={noteColumns} data={pastoralNotes} getRowKey={(row) => row.id} />
          </Card>
          <Card eyebrow="Nueva nota" title="Registrar contacto">
            <form className="space-y-4" onSubmit={handleSavePastoralNote}>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-ink">Miembro</span>
                <select
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-panel"
                  value={noteMemberId}
                  onChange={(e) => setNoteMemberId(e.currentTarget.value)}
                >
                  <option value="">Selecciona un miembro</option>
                  {groupMembers.map((m) => (
                    <option key={m.uid} value={m.uid}>{m.displayName}</option>
                  ))}
                </select>
              </label>
              <Input
                label="Fecha de seguimiento"
                type="date"
                value={noteDate}
                onChange={(e) => setNoteDate(e.currentTarget.value)}
              />
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-ink">Nota pastoral privada</span>
                <textarea
                  className="min-h-32 w-full rounded-lg border border-slate-200 p-3 text-sm shadow-panel"
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.currentTarget.value)}
                />
              </label>
              {pastoralMessage ? <p className="text-sm font-semibold text-indigo-600">{pastoralMessage}</p> : null}
              <Button className="w-full" icon={<Send className="h-4 w-4" />} type="submit">
                Guardar nota
              </Button>
            </form>
          </Card>
        </div>
      ) : null}

      {module === 'reuniones' ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
          <Card title="Asistencia">
            <div className="space-y-3">
              {groupMembers.map((member) => {
                const groupEvent = events.find((e) => e.targetGroupIds.includes(leaderGroup.id)) || events[0];
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
          <Card eyebrow="Historial" title="Reuniones recientes">
            <div className="space-y-3">
              {events
                .filter((event) => event.targetGroupIds.includes(leaderGroup.id))
                .map((event) => (
                  <div className="rounded-lg border border-slate-200 p-4" key={event.id}>
                    <p className="font-bold text-ink">{event.title}</p>
                    <p className="mt-1 text-sm text-muted">{formatDateTime(event.startDateTime)}</p>
                    <StatusPill tone="success">{`${event.attendeeIds.length} asistentes`}</StatusPill>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      ) : null}

      {module === 'oracion' ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
          <Card title="Peticiones">
            <DataTable columns={prayerColumns} data={prayerRequests} getRowKey={(row) => row.id} />
          </Card>
          <Card eyebrow="Nota privada" title="Pastorear peticion">
            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-ink">Seleccionar petición</span>
                <select
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-panel"
                  value={selectedPrayerId}
                  onChange={(e) => setSelectedPrayerId(e.currentTarget.value)}
                >
                  <option value="">Selecciona una opción</option>
                  {prayerRequests.map((p) => (
                    <option key={p.id} value={p.id}>{p.title} ({p.status})</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-ink">Nota</span>
                <textarea
                  className="min-h-32 w-full rounded-lg border border-slate-200 p-3 text-sm shadow-panel"
                  value={prayerNoteText}
                  onChange={(e) => setPrayerNoteText(e.currentTarget.value)}
                />
              </label>
              {prayerResponseMsg ? <p className="text-sm font-semibold text-indigo-600">{prayerResponseMsg}</p> : null}
              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleSavePrayerNote}>
                  Guardar nota
                </Button>
                {selectedPrayer?.status === 'active' ? (
                  <Button className="flex-1" variant="success" onClick={handleMarkPrayerAnswered}>
                    Marcar respondida
                  </Button>
                ) : null}
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      {module === 'recursos' ? (
        <div className="grid gap-4 md:grid-cols-3">
          {['Guia de discipulado', 'Estudio Lucas', 'Plantilla reunion'].map((resource) => (
            <Card key={resource} title={resource}>
              <div className="flex items-center justify-between">
                <FileText className="h-8 w-8 text-primary" />
                <Button size="sm" variant="outline" onClick={() => alert('Abriendo el recurso: ' + resource)}>
                  Abrir
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : null}

      {module === 'reportes' ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card eyebrow="Semanal" title="Resumen automatico">
            <div className="space-y-3 text-sm text-muted">
              <p>
                Asistencia del grupo: <strong className="text-ink">72%</strong>
              </p>
              <p>
                Peticiones activas: <strong className="text-ink">{prayerRequests.filter(p => p.status === 'active').length}</strong>
              </p>
              <p>
                Miembros inactivos: <strong className="text-ink">1</strong>
              </p>
            </div>
          </Card>
          <Card eyebrow="Exportar" title="Reporte">
            <Button icon={<FileText className="h-4 w-4" />} variant="secondary" onClick={handleGenerateReport}>
              Generar reporte semanal
            </Button>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
