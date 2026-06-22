import { FormEvent, useState, useEffect, useMemo } from 'react';
import { FileText, Plus, Send, Globe, Lock, Shield, User, Users, Check, Sparkles } from 'lucide-react';
import { AttendanceToggle } from '../../components/leader/AttendanceToggle';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { DataTable, type Column } from '../../components/common/DataTable';
import { Input } from '../../components/common/Input';
import { StatusPill } from '../../components/common/StatusPill';
import { Toggle } from '../../components/common/Toggle';
import { UserAvatar } from '../../components/common/UserAvatar';
import { PageHeader } from '../../components/layout/PageHeader';
import { useAuth } from '../../hooks/useAuth';
import { useAppStore } from '../../store/appStore';
import type { PastoralNote, PrayerRequest, User as ModelUser } from '../../types/models';
import { formatDateTime, formatShortDate, statusTone } from '../../utils/format';

export type LeaderModule = 'mi-grupo' | 'pastoral' | 'reuniones' | 'oracion' | 'recursos' | 'reportes' | 'perfil';

const moduleTitles: Record<LeaderModule, string> = {
  'mi-grupo': 'Mi grupo',
  pastoral: 'Seguimiento pastoral',
  reuniones: 'Reuniones',
  oracion: 'Oracion del grupo',
  recursos: 'Recursos',
  reportes: 'Reportes',
  perfil: 'Mi Perfil de Liderazgo',
};

const spiritualStatusLabels: Record<string, string> = {
  new_believer: 'Nuevo Creyente',
  growing: 'En Crecimiento',
  established: 'Maduro / Establecido',
  leader_in_training: 'Líder en Formación',
};

const predefinedAvatars = [
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
  "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80",
];

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
  const updateUserProfile = useAppStore((state) => state.updateUserProfile);
  const updateGroupDetails = useAppStore((state) => state.updateGroupDetails);
  const addEvent = useAppStore((state) => state.addEvent);

  const title = moduleTitles[module];

  // Find leader's group
  const leaderGroup = groups.find((g) => g.leaderId === user?.uid) ?? groups[0];
  const groupMembers = users.filter((u) => leaderGroup?.memberIds.includes(u.uid) ?? false);

  // Columns definitions
  const memberColumns: Column<ModelUser>[] = [
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

  // Profile forms local state
  const [activeTab, setActiveTab] = useState<'info' | 'spiritual' | 'group' | 'privacy'>('info');

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [favoriteVerse, setFavoriteVerse] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [baptismDate, setBaptismDate] = useState('');
  const [testimony, setTestimony] = useState('');
  const [spiritualStatus, setSpiritualStatus] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [leaderId, setLeaderId] = useState('');
  const [ministries, setMinistries] = useState<string[]>([]);
  const [newMinistryInput, setNewMinistryInput] = useState('');

  const [showPhone, setShowPhone] = useState(false);
  const [showEmail, setShowEmail] = useState(true);
  const [showCity, setShowCity] = useState(true);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  // Group edit local state
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [groupMeetingDay, setGroupMeetingDay] = useState('');
  const [groupMeetingTime, setGroupMeetingTime] = useState('');
  const [groupMeetingFormat, setGroupMeetingFormat] = useState<'in_person' | 'virtual' | 'hybrid'>('in_person');
  const [groupLocation, setGroupLocation] = useState('');
  const [groupLink, setGroupLink] = useState('');
  const [groupCapacity, setGroupCapacity] = useState(20);
  const [groupMessage, setGroupMessage] = useState<string | null>(null);

  // Meeting scheduling state
  const [meetingTitle, setMeetingTitle] = useState('Reunión de Célula');
  const [meetingDesc, setMeetingDesc] = useState('Nuestra reunión semanal de estudio y compañerismo.');
  const [meetingDateTime, setMeetingDateTime] = useState('');
  const [meetingFormat, setMeetingFormat] = useState<'in_person' | 'virtual' | 'hybrid'>('in_person');
  const [meetingLocation, setMeetingLocation] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [meetingCapacity, setMeetingCapacity] = useState('20');
  const [schedulerMsg, setSchedulerMsg] = useState<string | null>(null);

  // Mentors selection (filtering admins/leaders/super_admins)
  const mentors = useMemo(() => users.filter((u) => ['admin', 'super_admin', 'leader'].includes(u.role) && u.uid !== user?.uid), [users, user]);

  useEffect(() => {
    if (selectedPrayer) {
      setPrayerNoteText(selectedPrayer.pastoralNote || '');
    }
  }, [selectedPrayerId, selectedPrayer]);

  // Sync profile details when user changes
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      setEmail(user.email);
      setPhone(user.phone || '');
      setFavoriteVerse(user.favoriteVerse || '');
      setShowPhone(user.privacySettings?.showPhone ?? false);
      setShowEmail(user.privacySettings?.showEmail ?? true);
      setShowCity(user.privacySettings?.showCity ?? true);
      setCity(user.city || '');
      setCountry(user.country || 'Colombia');
      setBirthDate(user.birthDate || '');
      setBaptismDate(user.baptismDate || '');
      setTestimony(user.testimony || '');
      setSpiritualStatus(user.spiritualStatus || 'new_believer');
      setPhotoURL(user.photoURL || '');
      setLeaderId(user.leaderId || '');
      setMinistries(user.ministry || []);
    }
  }, [user]);

  // Sync group details when group changes
  useEffect(() => {
    if (leaderGroup) {
      setGroupName(leaderGroup.name);
      setGroupDesc(leaderGroup.description);
      setGroupMeetingDay(leaderGroup.meetingDay);
      setGroupMeetingTime(leaderGroup.meetingTime);
      setGroupMeetingFormat(leaderGroup.meetingFormat);
      setGroupLocation(leaderGroup.meetingLocation || '');
      setGroupLink(leaderGroup.meetingLink || '');
      setGroupCapacity(leaderGroup.maxCapacity || 20);
    }
  }, [leaderGroup]);

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

  async function handleAvatarSelect(url: string) {
    setPhotoURL(url);
    if (!user) return;
    try {
      await updateUserProfile(user.uid, {
        photoURL: url
      });
      setProfileMessage('¡Avatar actualizado con éxito!');
      setTimeout(() => setProfileMessage(null), 3000);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSaveProfile(event: FormEvent) {
    event.preventDefault();
    if (!user) return;

    try {
      await updateUserProfile(user.uid, {
        displayName,
        phone,
        city,
        country,
        birthDate: birthDate || undefined,
        baptismDate: baptismDate || undefined,
        favoriteVerse: favoriteVerse || undefined,
        testimony: testimony || undefined,
        spiritualStatus: spiritualStatus as any,
        photoURL: photoURL || undefined,
        leaderId: leaderId || undefined,
        ministry: ministries,
        privacySettings: {
          showPhone,
          showEmail,
          showCity,
        },
      });
      setProfileMessage('¡Perfil y configuración de privacidad actualizados!');
      setTimeout(() => setProfileMessage(null), 3000);
    } catch (err) {
      setProfileMessage('Error al actualizar el perfil.');
      setTimeout(() => setProfileMessage(null), 3000);
    }
  }

  async function handleSaveGroupDetails(event: FormEvent) {
    event.preventDefault();
    if (!leaderGroup) return;

    try {
      await updateGroupDetails(leaderGroup.id, {
        name: groupName,
        description: groupDesc,
        meetingDay: groupMeetingDay,
        meetingTime: groupMeetingTime,
        meetingFormat: groupMeetingFormat,
        meetingLocation: groupLocation || undefined,
        meetingLink: groupLink || undefined,
        maxCapacity: Number(groupCapacity),
      });
      setGroupMessage('¡Detalles del grupo actualizados con éxito!');
      setTimeout(() => setGroupMessage(null), 3000);
    } catch (err) {
      setGroupMessage('Error al actualizar los detalles del grupo.');
      setTimeout(() => setGroupMessage(null), 3000);
    }
  }

  function handleAddMinistry() {
    if (newMinistryInput.trim() && !ministries.includes(newMinistryInput.trim())) {
      setMinistries([...ministries, newMinistryInput.trim()]);
      setNewMinistryInput('');
    }
  }

  function handleRemoveMinistry(item: string) {
    setMinistries(ministries.filter(m => m !== item));
  }

  return (
    <div>
      <PageHeader
        action={module !== 'perfil' ? <Button icon={<Plus className="h-4 w-4" />} onClick={handleNewAction}>Nuevo</Button> : undefined}
        eyebrow="Liderazgo"
        title={title}
      />

      {module === 'mi-grupo' ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
          <Card title="Miembros">
            <DataTable columns={memberColumns} data={groupMembers} getRowKey={(row) => row.uid} />
          </Card>
          <Card eyebrow="Ficha completa" title={leaderGroup?.name ?? 'Mi Célula'}>
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
          <Card title="Control de Asistencia (Última Reunión)">
            <div className="space-y-3">
              {groupMembers.map((member) => {
                const groupEvent = events.find((e) => e.targetGroupIds.includes(leaderGroup?.id ?? '')) || events[0];
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
                    onChange={(e) => setMeetingFormat(e.currentTarget.value as any)}
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

      {module === 'perfil' ? (
        <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
          {/* Left Column: Profile Card Header & Avatar Picker */}
          <div className="space-y-6">
            <Card title="">
              <div className="flex flex-col items-center text-center p-4">
                <div className="relative group">
                  <img
                    src={photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80"}
                    alt="Avatar"
                    className="h-28 w-28 rounded-full border-4 border-primary/20 object-cover shadow-md transition-all group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-ink/40 opacity-0 transition-all group-hover:opacity-100">
                    <span className="text-xs font-bold text-white">Cambiar</span>
                  </div>
                </div>
                <h3 className="mt-4 text-xl font-bold text-ink">{displayName || 'Líder'}</h3>
                <p className="text-sm font-semibold text-muted">{email}</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <StatusPill tone="primary">Líder</StatusPill>
                  <StatusPill tone="success">{spiritualStatusLabels[spiritualStatus] || 'Miembro'}</StatusPill>
                </div>
              </div>

              {/* Avatar Grid Selection */}
              <div className="border-t border-slate-100 p-4">
                <p className="text-xs font-bold text-muted mb-3 text-center uppercase tracking-wider">Elegir un Avatar Demo</p>
                <div className="grid grid-cols-3 gap-2">
                  {predefinedAvatars.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleAvatarSelect(url)}
                      className={`h-12 w-12 rounded-full overflow-hidden border-2 transition-all ${
                        photoURL === url ? 'border-primary scale-105 shadow-md ring-2 ring-primary/20' : 'border-transparent opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt={`Avatar option ${i}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Sidebar Navigation Tabs */}
            <Card title="Menú de Ajustes">
              <div className="flex flex-col gap-1 p-1">
                {[
                  { id: 'info', label: '👤 Info Personal' },
                  { id: 'spiritual', label: '🌱 Camino Espiritual & Ministerios' },
                  { id: 'group', label: '🔑 Liderazgo & Mi Grupo' },
                  { id: 'privacy', label: '🔒 Privacidad' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
                      activeTab === tab.id
                        ? 'bg-primary/10 text-primary shadow-sm'
                        : 'text-muted hover:bg-slate-50 hover:text-ink'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Column: Tab Content */}
          <div className="space-y-6">
            {activeTab === 'info' && (
              <Card title="Información Personal">
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      label="Nombre Completo"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.currentTarget.value)}
                    />
                    <Input
                      label="Teléfono"
                      value={phone}
                      onChange={(e) => setPhone(e.currentTarget.value)}
                    />
                    <Input
                      label="Ciudad"
                      value={city}
                      onChange={(e) => setCity(e.currentTarget.value)}
                    />
                    <Input
                      label="País"
                      value={country}
                      onChange={(e) => setCountry(e.currentTarget.value)}
                    />
                    <Input
                      label="Fecha de Nacimiento"
                      type="date"
                      value={birthDate ? birthDate.substring(0, 10) : ''}
                      onChange={(e) => setBirthDate(e.currentTarget.value)}
                    />
                  </div>
                  <div>
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-ink">Mi Testimonio</span>
                      <textarea
                        className="min-h-36 w-full rounded-lg border border-slate-200 p-3 text-sm shadow-panel focus:border-primary focus:ring-1 focus:ring-primary"
                        placeholder="Comparte tu testimonio personal..."
                        value={testimony}
                        onChange={(e) => setTestimony(e.currentTarget.value)}
                      />
                    </label>
                  </div>
                  {profileMessage && <p className="text-sm font-semibold text-green-600">{profileMessage}</p>}
                  <div className="flex justify-end">
                    <Button type="submit">Guardar Datos Personales</Button>
                  </div>
                </form>
              </Card>
            )}

            {activeTab === 'spiritual' && (
              <Card title="Mi Camino Espiritual & Ministerios">
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      label="Versículo Favorito"
                      value={favoriteVerse}
                      onChange={(e) => setFavoriteVerse(e.currentTarget.value)}
                      placeholder="Filipenses 4:13"
                    />
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-ink">Estado Espiritual</span>
                      <select
                        className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-panel"
                        value={spiritualStatus}
                        onChange={(e) => setSpiritualStatus(e.target.value)}
                      >
                        {Object.entries(spiritualStatusLabels).map(([val, lbl]) => (
                          <option key={val} value={val}>{lbl}</option>
                        ))}
                      </select>
                    </label>
                    <Input
                      label="Fecha de Bautismo"
                      type="date"
                      value={baptismDate ? baptismDate.substring(0, 10) : ''}
                      onChange={(e) => setBaptismDate(e.currentTarget.value)}
                    />
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-ink">Pastor / Mentor de Cobertura</span>
                      <select
                        className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-panel"
                        value={leaderId}
                        onChange={(e) => setLeaderId(e.target.value)}
                      >
                        <option value="">Ninguno</option>
                        {mentors.map((m: ModelUser) => (
                          <option key={m.uid} value={m.uid}>
                            {m.displayName} ({m.role === 'admin' || m.role === 'super_admin' ? 'Administrador' : 'Líder'})
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {/* Ministry Tags Management */}
                  <div className="border-t border-slate-100 pt-6">
                    <span className="mb-2 block text-sm font-semibold text-ink">Mis Ministerios</span>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {ministries.map((min) => (
                        <span key={min} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-bold">
                          {min}
                          <button
                            type="button"
                            onClick={() => handleRemoveMinistry(min)}
                            className="hover:text-red-500 font-extrabold focus:outline-none"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      {ministries.length === 0 && (
                        <p className="text-sm text-muted">No tienes ministerios registrados.</p>
                      )}
                    </div>
                     <div className="flex items-end gap-2 max-w-sm">
                      <div className="flex-1">
                        <Input
                          label="Agregar Ministerio"
                          placeholder="Ej. Alabanza, Jóvenes"
                          value={newMinistryInput}
                          onChange={(e) => setNewMinistryInput(e.currentTarget.value)}
                        />
                      </div>
                      <Button type="button" variant="secondary" onClick={handleAddMinistry} className="mb-0.5">Agregar</Button>
                    </div>
                  </div>

                  {profileMessage && <p className="text-sm font-semibold text-green-600">{profileMessage}</p>}
                  <div className="flex justify-end">
                    <Button type="submit">Guardar Datos Espirituales</Button>
                  </div>
                </form>
              </Card>
            )}

            {activeTab === 'group' && (
              <Card title="Gestión de Mi Célula / Grupo">
                {leaderGroup ? (
                  <form onSubmit={handleSaveGroupDetails} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Input
                        label="Nombre del Grupo"
                        value={groupName}
                        onChange={(e) => setGroupName(e.currentTarget.value)}
                      />
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-ink">Formato de Reunión</span>
                        <select
                          className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-panel"
                          value={groupMeetingFormat}
                          onChange={(e) => setGroupMeetingFormat(e.target.value as any)}
                        >
                          <option value="in_person">Presencial</option>
                          <option value="virtual">Virtual</option>
                          <option value="hybrid">Híbrido</option>
                        </select>
                      </label>
                      <Input
                        label="Día de Reunión"
                        value={groupMeetingDay}
                        onChange={(e) => setGroupMeetingDay(e.currentTarget.value)}
                        placeholder="Ej. Sábado"
                      />
                      <Input
                        label="Hora de Reunión"
                        value={groupMeetingTime}
                        onChange={(e) => setGroupMeetingTime(e.currentTarget.value)}
                        placeholder="Ej. 18:00"
                      />
                      <Input
                        label="Capacidad Máxima (Miembros)"
                        type="number"
                        value={String(groupCapacity)}
                        onChange={(e) => setGroupCapacity(Number(e.currentTarget.value))}
                      />
                      {groupMeetingFormat !== 'virtual' && (
                        <Input
                          label="Ubicación Física"
                          value={groupLocation}
                          onChange={(e) => setGroupLocation(e.currentTarget.value)}
                          placeholder="Dirección o punto de encuentro"
                        />
                      )}
                      {groupMeetingFormat !== 'in_person' && (
                        <Input
                          label="Enlace Virtual de Reunión"
                          value={groupLink}
                          onChange={(e) => setGroupLink(e.currentTarget.value)}
                          placeholder="Zoom, Google Meet, Teams link"
                        />
                      )}
                    </div>
                    <div>
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-ink">Descripción del Grupo</span>
                        <textarea
                          className="min-h-32 w-full rounded-lg border border-slate-200 p-3 text-sm shadow-panel focus:border-primary focus:ring-1 focus:ring-primary"
                          value={groupDesc}
                          onChange={(e) => setGroupDesc(e.currentTarget.value)}
                        />
                      </label>
                    </div>
                    {groupMessage && <p className="text-sm font-semibold text-green-600">{groupMessage}</p>}
                    <div className="flex justify-end">
                      <Button type="submit">Guardar Detalles del Grupo</Button>
                    </div>
                  </form>
                ) : (
                  <p className="text-sm text-muted">No tienes un grupo de células asignado bajo tu liderazgo.</p>
                )}
              </Card>
            )}

            {activeTab === 'privacy' && (
              <Card eyebrow="Privacidad" title="Visibilidad en Directorio">
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="space-y-3">
                    <Toggle checked={showPhone} label="Mostrar mi número de teléfono en el directorio público" onChange={setShowPhone} />
                    <Toggle checked={showEmail} label="Mostrar mi correo en el directorio público" onChange={setShowEmail} />
                    <Toggle checked={showCity} label="Mostrar mi ciudad en el directorio público" onChange={setShowCity} />
                  </div>
                  {profileMessage && <p className="text-sm font-semibold text-green-600">{profileMessage}</p>}
                  <div className="flex justify-end">
                    <Button type="submit">Guardar Ajustes de Privacidad</Button>
                  </div>
                </form>
              </Card>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
