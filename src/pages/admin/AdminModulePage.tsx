import { useMemo, useState, FormEvent, useEffect } from 'react';
import { Eye, Filter, Plus, Save, Search, Upload, Trash2 } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { ProfileSettings } from '../../components/shared/ProfileSettings';
import { Card } from '../../components/common/Card';
import { DataTable, type Column } from '../../components/common/DataTable';
import { Input } from '../../components/common/Input';
import { StatusPill } from '../../components/common/StatusPill';
import { Toggle } from '../../components/common/Toggle';
import { PageHeader } from '../../components/layout/PageHeader';
import { useAuth } from '../../hooks/useAuth';
import { useAppStore } from '../../store/appStore';
import { useToastStore } from '../../store/toastStore';
import { roleLabels } from '../../constants/roles';
import { hasFirebaseConfig } from '../../services/firebase';
import { hasStripeConfig } from '../../services/stripe';
import type { Content, Donation, Event, User, ContentType, StreamPlatform, Role } from '../../types/models';
import { formatCurrency, formatDateTime, statusTone } from '../../utils/format';

export type AdminModule =
  | 'usuarios'
  | 'contenido'
  | 'eventos'
  | 'analiticas'
  | 'finanzas'
  | 'en-vivo'
  | 'configuracion'
  | 'perfil';

const moduleTitles: Record<AdminModule, string> = {
  usuarios: 'Usuarios',
  contenido: 'Contenido',
  eventos: 'Eventos',
  analiticas: 'Analíticas',
  finanzas: 'Finanzas',
  'en-vivo': 'Transmision en vivo',
  configuracion: 'Configuracion',
  perfil: 'Mi Perfil',
};

const colorNames: Record<string, string> = {
  '#4F46E5': 'Índigo',
  '#7C3AED': 'Púrpura',
  '#10B981': 'Verde',
  '#F59E0B': 'Amarillo',
  '#EF4444': 'Rojo',
};

// userColumns removed from outer scope and moved inside the component body dynamically

const donationColumns: Column<Donation>[] = [
  { header: 'Fondo', accessor: 'fund' },
  { header: 'Metodo', accessor: 'method' },
  { header: 'Monto', accessor: (row) => formatCurrency(row.amount, row.currency) },
  {
    header: 'Estado',
    accessor: (row) => <StatusPill tone={row.status === 'completed' ? 'success' : 'warning'}>{row.status}</StatusPill>,
  },
  { header: 'Fecha', accessor: (row) => formatDateTime(row.createdAt) },
];

// eventColumns removed from outer scope and moved inside the component body dynamically

const integrationStatuses = [
  { label: 'Firebase Auth', status: hasFirebaseConfig ? 'listo' : 'demo', tone: hasFirebaseConfig ? 'success' : 'warning' },
  { label: 'Firestore', status: hasFirebaseConfig ? 'listo' : 'demo', tone: hasFirebaseConfig ? 'success' : 'warning' },
  { label: 'Storage', status: hasFirebaseConfig ? 'listo' : 'demo', tone: hasFirebaseConfig ? 'success' : 'warning' },
  { label: 'FCM', status: hasFirebaseConfig ? 'listo' : 'demo', tone: hasFirebaseConfig ? 'success' : 'warning' },
  { label: 'Stripe', status: hasStripeConfig ? 'clave cargada' : 'demo', tone: hasStripeConfig ? 'primary' : 'warning' },
  { label: 'Vercel', status: 'archivo listo', tone: 'primary' },
] as const;

export function AdminModulePage({ module }: { module: AdminModule }) {
  const { user } = useAuth();
  const notify = useToastStore((state) => state.notify);

  // Zustand values
  const users = useAppStore((state) => state.users);
  const donations = useAppStore((state) => state.donations);
  const events = useAppStore((state) => state.events);
  const content = useAppStore((state) => state.content);
  const liveStream = useAppStore((state) => state.liveStream);
  const organizationName = useAppStore((state) => state.organizationName);
  const themeColor = useAppStore((state) => state.themeColor);

  // Zustand actions
  const addContent = useAppStore((state) => state.addContent);
  const addEvent = useAppStore((state) => state.addEvent);
  const updateLiveStreamSettings = useAppStore((state) => state.updateLiveStreamSettings);
  const updateOrganizationName = useAppStore((state) => state.updateOrganizationName);
  const updateThemeColor = useAppStore((state) => state.updateThemeColor);
  const suspendUser = useAppStore((state) => state.suspendUser);
  const activateUser = useAppStore((state) => state.activateUser);
  const changeUserRole = useAppStore((state) => state.changeUserRole);
  const deleteContent = useAppStore((state) => state.deleteContent);
  const deleteEvent = useAppStore((state) => state.deleteEvent);

  // Dynamic / Action-enabled columns
  const userColumns = useMemo<Column<User>[]>(() => [
    { header: 'Nombre', accessor: 'displayName' },
    {
      header: 'Rol',
      accessor: (row) => (
        <select
          value={row.role}
          onChange={(e) => changeUserRole(row.uid, e.target.value as Role)}
          className="rounded border border-slate-200 bg-white p-1 text-xs text-ink"
        >
          {Object.entries(roleLabels).map(([role, label]) => (
            <option key={role} value={role}>{label}</option>
          ))}
        </select>
      ),
    },
    {
      header: 'Estado',
      accessor: (row) => <StatusPill tone={statusTone(row.status)}>{row.status}</StatusPill>,
    },
    { header: 'Ciudad', accessor: 'city' },
    {
      header: 'Ultima actividad',
      accessor: (row) => formatDateTime(row.lastActiveAt),
    },
    {
      header: 'Acciones',
      accessor: (row) => (
        <div className="flex gap-2">
          {row.status === 'active' ? (
            <Button size="sm" variant="danger" onClick={() => suspendUser(row.uid)}>
              Suspender
            </Button>
          ) : (
            <Button size="sm" variant="success" onClick={() => activateUser(row.uid)}>
              Activar
            </Button>
          )}
        </div>
      ),
    },
  ], [suspendUser, activateUser, changeUserRole]);

  const eventColumns = useMemo<Column<Event>[]>(() => [
    { header: 'Evento', accessor: 'title' },
    { header: 'Tipo', accessor: 'type' },
    { header: 'Formato', accessor: 'format' },
    { header: 'Fecha', accessor: (row) => formatDateTime(row.startDateTime) },
    { header: 'Inscritos', accessor: (row) => String(row.attendeeIds.length) },
    {
      header: 'Acciones',
      accessor: (row) => (
        <Button size="sm" variant="danger" onClick={() => deleteEvent(row.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ], [deleteEvent]);

  // Livestream form state
  const [liveTitle, setLiveTitle] = useState(liveStream?.title || '');
  const [livePlatform, setLivePlatform] = useState<StreamPlatform>(liveStream?.platform || 'youtube');
  const [liveUrl, setLiveUrl] = useState(liveStream?.streamUrl || '');
  const [liveDate, setLiveDate] = useState(liveStream?.scheduledAt || '');

  useEffect(() => {
    if (liveStream) {
      setLiveTitle(liveStream.title);
      setLivePlatform(liveStream.platform);
      setLiveUrl(liveStream.streamUrl);
      setLiveDate(liveStream.scheduledAt);
    }
  }, [liveStream]);

  function handleSaveLiveStream(event: FormEvent) {
    event.preventDefault();
    updateLiveStreamSettings({
      title: liveTitle,
      platform: livePlatform,
      streamUrl: liveUrl,
      scheduledAt: liveDate,
    });
    notify({ title: 'Transmision guardada', description: 'La programacion del culto se actualizo correctamente.', tone: 'success' });
  }

  // Analytics helper data
  const cityMap = users.reduce((acc, u) => {
    const city = u.city || 'Desconocido';
    acc[city] = (acc[city] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topCities = Object.entries(cityMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const [query, setQuery] = useState('');
  const title = moduleTitles[module];

  const filteredUsers = useMemo(
    () =>
      users.filter((u) =>
        [u.displayName, u.email, u.city].join(' ').toLowerCase().includes(query.toLowerCase()),
      ),
    [users, query],
  );

  // Content form state
  const [contentTitle, setContentTitle] = useState('');
  const [contentRef, setContentRef] = useState('');
  const [contentBody, setContentBody] = useState('');
  const [contentType, setContentType] = useState<ContentType>('announcement');
  const [contentMessage, setContentMessage] = useState<string | null>(null);

  // Event form state
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventMessage, setEventMessage] = useState<string | null>(null);

  // Org form state
  const [orgNameInput, setOrgNameInput] = useState(organizationName);
  const [orgMessage, setOrgMessage] = useState<string | null>(null);

  useEffect(() => {
    setOrgNameInput(organizationName);
  }, [organizationName]);

  function handleSaveContent(event: FormEvent) {
    event.preventDefault();
    if (!contentTitle.trim() || !contentBody.trim()) {
      setContentMessage('Por favor completa los campos obligatorios.');
      return;
    }
    addContent({
      title: contentTitle,
      body: contentBody,
      excerpt: contentBody.slice(0, 100) + '...',
      type: contentType,
      authorId: user?.uid ?? 'admin',
      bibleReference: contentRef || undefined,
      tags: [contentType],
      visibility: 'members',
      isDraft: false,
    });
    setContentTitle('');
    setContentRef('');
    setContentBody('');
    setContentMessage('¡Contenido publicado con éxito!');
    notify({ title: 'Contenido publicado', description: contentTitle, tone: 'success' });
    setTimeout(() => setContentMessage(null), 3000);
  }

  function handleSaveEvent(event: FormEvent) {
    event.preventDefault();
    if (!eventTitle.trim() || !eventDate) {
      setEventMessage('Por favor ingresa título y fecha.');
      return;
    }
    addEvent({
      title: eventTitle,
      description: eventDesc,
      type: 'service',
      format: 'hybrid',
      startDateTime: new Date(eventDate).toISOString(),
      endDateTime: new Date(new Date(eventDate).getTime() + 7200000).toISOString(),
      organizerId: user?.uid ?? 'admin',
      targetGroupIds: [],
      requiresRSVP: false,
    });
    setEventTitle('');
    setEventDate('');
    setEventDesc('');
    setEventMessage('¡Evento creado con éxito!');
    notify({ title: 'Evento creado', description: eventTitle, tone: 'success' });
    setTimeout(() => setEventMessage(null), 3000);
  }

  function handleSaveOrgName(event: FormEvent) {
    event.preventDefault();
    if (!orgNameInput.trim()) return;
    updateOrganizationName(orgNameInput);
    setOrgMessage('¡Configuración guardada!');
    notify({ title: 'Configuracion guardada', description: 'El nombre publico se actualizo.', tone: 'success' });
    setTimeout(() => setOrgMessage(null), 3000);
  }

  const setChatEnabled = (checked: boolean) => updateLiveStreamSettings({ chatEnabled: checked });
  const setOfferingEnabled = (checked: boolean) => updateLiveStreamSettings({ offeringEnabled: checked });

  // Navigation / Filter / Action triggers
  function handleFilters() {
    notify({ title: 'Filtros disponibles', description: 'Usa la busqueda visible para encontrar personas por nombre, correo o ciudad.', tone: 'info' });
  }

  function handleCreateClick() {
    if (module === 'contenido') {
      const el = document.querySelector('input[placeholder="Nuevo anuncio"]') as HTMLInputElement;
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (module === 'eventos') {
      const el = document.querySelector('input[placeholder="Culto especial"]') as HTMLInputElement;
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      notify({ title: 'Crear desde la seccion', description: 'Abre Contenido o Eventos para usar el formulario rapido.', tone: 'info' });
    }
  }



  function handlePreview() {
    if (content.length > 0) {
      notify({
        title: content[0].title,
        description: content[0].excerpt || content[0].body.slice(0, 120),
        tone: 'info',
      });
    } else {
      notify({ title: 'Sin contenido', description: 'Publica un contenido antes de abrir la vista previa.', tone: 'warning' });
    }
  }

  return (
    <div>
      <PageHeader
        action={
          module !== 'perfil' ? (
            <div className="flex flex-wrap gap-2">
              <Button icon={<Filter className="h-4 w-4" />} variant="outline" onClick={handleFilters}>
                Filtros
              </Button>
              <Button icon={<Plus className="h-4 w-4" />} onClick={handleCreateClick}>Crear</Button>
            </div>
          ) : undefined
        }
        eyebrow="Administracion"
        title={title}
      />

      {module === 'usuarios' ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
          <Card
            action={<Button icon={<Upload className="h-4 w-4" />} variant="outline" disabled={true}>CSV (Próximamente)</Button>}
            title="Directorio interno"
          >
            <div className="mb-4 max-w-md">
              <Input
                icon={<Search className="h-4 w-4" />}
                label="Buscar usuario"
                onChange={(event) => setQuery(event.currentTarget.value)}
                placeholder="Nombre, correo o ciudad"
                value={query}
              />
            </div>
            <DataTable columns={userColumns} data={filteredUsers} getRowKey={(row) => row.uid} />
          </Card>
          <Card eyebrow="Perfil" title="Panel lateral">
            <div className="space-y-4">
              {users.slice(0, 3).map((u) => (
                <div className="rounded-lg border border-slate-200 p-4" key={u.uid}>
                  <p className="font-bold text-ink">{u.displayName}</p>
                  <p className="mt-1 text-sm text-muted">{u.email}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusPill tone={statusTone(u.status)}>{u.status}</StatusPill>
                    <StatusPill tone="primary">{roleLabels[u.role]}</StatusPill>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : null}

      {module === 'contenido' ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
          <Card
            action={<Button icon={<Eye className="h-4 w-4" />} variant="outline" onClick={handlePreview}>Vista previa</Button>}
            title="Editor y publicaciones"
          >
            <div className="grid gap-4 md:grid-cols-2">
              {content.map((item: Content) => (
                <article className="rounded-lg border border-slate-200 bg-slate-50 p-4" key={item.id}>
                  <div className="flex items-center justify-between gap-3">
                    <StatusPill tone={item.isDraft ? 'warning' : 'success'}>
                      {item.isDraft ? 'borrador' : 'publicado'}
                    </StatusPill>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted">{item.visibility}</span>
                      <Button size="sm" variant="ghost" onClick={() => deleteContent(item.id)} className="text-danger hover:bg-red-50 p-1 h-7 w-7">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <h2 className="mt-4 text-lg font-extrabold text-ink">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted">{item.excerpt}</p>
                  <p className="mt-4 text-sm font-bold text-primary">{item.viewCount} vistas</p>
                </article>
              ))}
            </div>
          </Card>
          <Card eyebrow="Programacion" title="Publicar contenido">
            <form className="space-y-4" onSubmit={handleSaveContent}>
              <Input
                label="Titulo"
                placeholder="Nuevo anuncio"
                value={contentTitle}
                onChange={(e) => setContentTitle(e.currentTarget.value)}
              />
              <Input
                label="Referencia biblica"
                placeholder="Lucas 14:13"
                value={contentRef}
                onChange={(e) => setContentRef(e.currentTarget.value)}
              />
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-ink">Tipo de contenido</span>
                <select
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-panel"
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value as ContentType)}
                >
                  <option value="announcement">Anuncio</option>
                  <option value="devotional">Devocional</option>
                  <option value="sermon">Sermón</option>
                  <option value="post">Post</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-ink">Cuerpo</span>
                <textarea
                  className="min-h-36 w-full rounded-lg border border-slate-200 p-3 text-sm shadow-panel"
                  value={contentBody}
                  onChange={(e) => setContentBody(e.currentTarget.value)}
                />
              </label>
              {contentMessage ? <p className="text-sm font-semibold text-indigo-600">{contentMessage}</p> : null}
              <Button icon={<Save className="h-4 w-4" />} className="w-full" type="submit">
                Publicar contenido
              </Button>
            </form>
          </Card>
        </div>
      ) : null}

      {module === 'eventos' ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
          <Card title="Calendario y lista">
            <DataTable columns={eventColumns} data={events} getRowKey={(row) => row.id} />
          </Card>
          <Card eyebrow="Programación" title="Crear Evento">
            <form className="space-y-4" onSubmit={handleSaveEvent}>
              <Input
                label="Título del evento"
                placeholder="Culto especial"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.currentTarget.value)}
              />
              <Input
                label="Fecha y hora"
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.currentTarget.value)}
              />
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-ink">Descripción</span>
                <textarea
                  className="min-h-20 w-full rounded-lg border border-slate-200 p-3 text-sm shadow-panel"
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.currentTarget.value)}
                />
              </label>
              {eventMessage ? <p className="text-sm font-semibold text-indigo-600">{eventMessage}</p> : null}
              <Button icon={<Save className="h-4 w-4" />} className="w-full" type="submit">
                Crear Evento
              </Button>
            </form>
          </Card>
        </div>
      ) : null}

      {module === 'analiticas' ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card eyebrow="Asistencia" title="Crecimiento">
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
                    <div className="w-full rounded-md bg-success" style={{ height: `${(item.value / 240) * 100}%` }} />
                  </div>
                  <span className="text-xs font-bold text-muted">{item.label}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card eyebrow="Ubicaciones" title="Mapa de miembros">
            <div className="grid gap-3 sm:grid-cols-2">
              {topCities.map(([city, count]) => (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4" key={city}>
                  <p className="text-2xl font-extrabold text-ink">{count}</p>
                  <p className="text-sm font-semibold text-muted">{city}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : null}

      {module === 'finanzas' ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
          <Card title="Transacciones">
            <DataTable columns={donationColumns} data={donations} getRowKey={(row) => row.id} />
          </Card>
          <Card eyebrow="Fondos" title="Resumen">
            <div className="space-y-3">
              {['tithe', 'offering', 'missions', 'building', 'social'].map((fund) => {
                const total = donations.filter((item) => item.fund === fund).reduce((sum, item) => sum + item.amount, 0);
                return (
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3" key={fund}>
                    <span className="font-semibold text-ink">{fund}</span>
                    <span className="font-extrabold text-primary">{formatCurrency(total)}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      ) : null}

      {module === 'en-vivo' ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
          <Card eyebrow={liveStream.status} title={liveStream.title}>
            <div className="aspect-video rounded-lg bg-ink p-5 text-white">
              <div className="flex h-full flex-col justify-between">
                <StatusPill tone="warning">{liveStream.status}</StatusPill>
                <div>
                  <p className="text-sm font-semibold text-white/60">{formatDateTime(liveStream.scheduledAt)}</p>
                  <h2 className="mt-2 text-2xl font-extrabold">{liveStream.platform}</h2>
                </div>
              </div>
            </div>
          </Card>
          <Card title="Controles y Programación">
            <form className="space-y-4" onSubmit={handleSaveLiveStream}>
              <Toggle checked={liveStream.chatEnabled} label="Chat activo" onChange={setChatEnabled} />
              <Toggle checked={liveStream.offeringEnabled} label="Ofrenda activa" onChange={setOfferingEnabled} />
              <hr className="border-slate-200" />
              <Input
                label="Título del Culto"
                value={liveTitle}
                onChange={(e) => setLiveTitle(e.currentTarget.value)}
                placeholder="Culto dominical"
              />
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-ink">Plataforma</span>
                <select
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-panel"
                  value={livePlatform}
                  onChange={(e) => setLivePlatform(e.target.value as StreamPlatform)}
                >
                  <option value="youtube">YouTube</option>
                  <option value="facebook">Facebook</option>
                  <option value="internal">Interno</option>
                </select>
              </label>
              <Input
                label="URL de Transmisión"
                value={liveUrl}
                onChange={(e) => setLiveUrl(e.currentTarget.value)}
                placeholder="https://youtube.com/live/..."
              />
              <Input
                label="Fecha y hora programada"
                type="datetime-local"
                value={liveDate ? liveDate.substring(0, 16) : ''}
                onChange={(e) => setLiveDate(e.currentTarget.value ? new Date(e.currentTarget.value).toISOString() : '')}
              />
              <Button className="w-full" variant="success" type="submit">
                Programar culto
              </Button>
            </form>
          </Card>
        </div>
      ) : null}

      {module === 'configuracion' ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card eyebrow="Marca" title="Identidad visual">
            <form className="grid gap-4" onSubmit={handleSaveOrgName}>
              <Input label="Nombre publico" value={orgNameInput} onChange={(e) => setOrgNameInput(e.currentTarget.value)} />
              <label className="block text-sm font-semibold text-ink">Color de tema primario</label>
              <div className="grid grid-cols-5 gap-2">
                {['#4F46E5', '#7C3AED', '#10B981', '#F59E0B', '#EF4444'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    style={{ background: color }}
                    aria-label={`Tema color ${colorNames[color] || color}`}
                    aria-pressed={themeColor === color}
                    className={`h-12 rounded-lg border-2 transition-all ${
                      themeColor === color ? 'border-ink scale-105 shadow-md ring-2 ring-primary/20' : 'border-slate-200 hover:scale-102'
                    }`}
                    onClick={() => {
                      updateThemeColor(color);
                      setOrgMessage('¡Color de tema primario actualizado!');
                      setTimeout(() => setOrgMessage(null), 3000);
                    }}
                  />
                ))}
              </div>
              {orgMessage ? <p className="text-sm font-semibold text-green-600">{orgMessage}</p> : null}
              <Button icon={<Save className="h-4 w-4" />} type="submit">Guardar ajustes</Button>
            </form>
          </Card>
          <Card eyebrow="Integraciones" title="Servicios">
            <div className="space-y-3">
              {integrationStatuses.map((item) => (
                <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3" key={item.label}>
                  <span className="font-semibold text-ink">{item.label}</span>
                  <StatusPill tone={item.tone}>{item.status}</StatusPill>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : null}

      {module === 'perfil' ? (
        <ProfileSettings />
      ) : null}
    </div>
  );
}
