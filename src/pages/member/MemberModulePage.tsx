import { FormEvent, useState, useEffect } from 'react';
import { BookOpen, CheckCircle2, Download, Gift, Heart, Play, Search, Send, PlayCircle } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { StatusPill } from '../../components/common/StatusPill';
import { Toggle } from '../../components/common/Toggle';
import { FormationProgress } from '../../components/member/FormationProgress';
import { PageHeader } from '../../components/layout/PageHeader';
import { useAuth } from '../../hooks/useAuth';
import { useAppStore } from '../../store/appStore';
import { formatCurrency, formatDateTime } from '../../utils/format';

export type MemberModule = 'biblia' | 'devocional' | 'oracion' | 'grupos' | 'en-vivo' | 'dar' | 'perfil';

const moduleTitles: Record<MemberModule, string> = {
  biblia: 'Biblia',
  devocional: 'Devocional',
  oracion: 'Oracion',
  grupos: 'Mis grupos',
  'en-vivo': 'En vivo y sermones',
  dar: 'Dar',
  perfil: 'Perfil',
};

export function MemberModulePage({ module }: { module: MemberModule }) {
  const { user } = useAuth();

  // Zustand values
  const prayerRequests = useAppStore((state) => state.prayerRequests);
  const donations = useAppStore((state) => state.donations);
  const events = useAppStore((state) => state.events);
  const content = useAppStore((state) => state.content);
  const groups = useAppStore((state) => state.groups);
  const liveStream = useAppStore((state) => state.liveStream);

  // Zustand actions
  const addDonation = useAppStore((state) => state.addDonation);
  const addPrayerRequest = useAppStore((state) => state.addPrayerRequest);
  const incrementPrayerCount = useAppStore((state) => state.incrementPrayerCount);
  const toggleRSVP = useAppStore((state) => state.toggleRSVP);
  const updateUserProfile = useAppStore((state) => state.updateUserProfile);

  // Component state
  const [amount, setAmount] = useState('80000');
  const [fund, setFund] = useState('offering');
  const [donationMessage, setDonationMessage] = useState<string | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);

  // Bible state
  const [bibleSearchQuery, setBibleSearchQuery] = useState('');

  // Prayer state
  const [prayerTitle, setPrayerTitle] = useState('');
  const [prayerDesc, setPrayerDesc] = useState('');
  const [prayerVisibility, setPrayerVisibility] = useState<'public' | 'group' | 'private'>('public');
  const [prayerMessage, setPrayerMessage] = useState<string | null>(null);

  // Profile state
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [favoriteVerse, setFavoriteVerse] = useState('');
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  const [showPhone, setShowPhone] = useState(false);
  const [showEmail, setShowEmail] = useState(true);
  const [showCity, setShowCity] = useState(true);

  // Color highlight
  const [selectedColor, setSelectedColor] = useState('');

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
    }
  }, [user]);

  async function submitDonation(event: FormEvent) {
    event.preventDefault();
    const parsed = Number(amount);

    if (!parsed || parsed < 5000) {
      setDonationMessage('El monto minimo es 5.000 COP.');
      return;
    }

    addDonation({
      userId: user?.uid ?? 'guest',
      amount: parsed,
      currency: 'COP',
      fund: fund as any,
      method: 'card',
      isRecurring: isRecurring,
    });

    setDonationMessage('¡Donación registrada con éxito en el historial demo!');
    setTimeout(() => setDonationMessage(null), 3000);
  }

  function submitPrayerRequest(event: FormEvent) {
    event.preventDefault();
    if (!prayerTitle.trim() || !prayerDesc.trim()) {
      setPrayerMessage('Por favor completa todos los campos.');
      return;
    }

    addPrayerRequest({
      userId: user?.uid ?? 'guest',
      title: prayerTitle,
      description: prayerDesc,
      visibility: prayerVisibility,
      groupId: user?.groupIds?.[0] ?? undefined,
    });

    setPrayerTitle('');
    setPrayerDesc('');
    setPrayerMessage('¡Petición de oración creada con éxito!');
    setTimeout(() => setPrayerMessage(null), 3000);
  }

  function handleSaveProfile(event: FormEvent) {
    event.preventDefault();
    if (!user) return;

    updateUserProfile(user.uid, {
      displayName,
      email,
      phone,
      favoriteVerse,
      privacySettings: {
        showPhone,
        showEmail,
        showCity,
      },
    });

    setProfileMessage('¡Perfil y configuración de privacidad actualizados!');
    setTimeout(() => setProfileMessage(null), 3000);
  }

  // Interactive buttons handlers
  function handleFavorite() {
    alert('¡Agregado a tus favoritos! (Simulado)');
  }

  function handleShare() {
    alert('¡Enlace de compartir copiado al portapapeles! (Simulado)');
  }

  function handlePlayAudio() {
    alert('Reproduciendo audio del capítulo Mateo 6 en versión RVR60 (simulado)... 🔊');
  }

  function handleDownloadReceipt(fundName: string, donationAmount: number) {
    alert(`Descargando comprobante:\n\nFondo: ${fundName}\nMonto: ${formatCurrency(donationAmount)} COP\n\n¡Archivo PDF simulado generado con éxito!`);
  }

  return (
    <div>
      <PageHeader eyebrow="Miembro" title={moduleTitles[module]} />

      {module === 'biblia' ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
          <Card
            action={<Button icon={<Search className="h-4 w-4" />} variant="outline" onClick={() => alert(`Búsqueda para "${bibleSearchQuery}" completada (simulado).`)}>Buscar</Button>}
            eyebrow="RVR60"
            title="Mateo 6"
          >
            <div className="space-y-4 text-base leading-8 text-ink">
              {[
                { num: 33, text: 'Mas buscad primeramente el reino de Dios y su justicia.' },
                { num: 34, text: 'Asi que, no os afaneis por el dia de manana.' },
                { num: 35, text: 'Porque el dia de manana traera su afan.' },
              ]
                .filter((v) => v.text.toLowerCase().includes(bibleSearchQuery.toLowerCase()))
                .map((verse) => (
                  <p className="rounded-lg border border-slate-200 bg-slate-50 p-4" key={verse.text}>
                    <span className="mr-2 font-extrabold text-primary">{verse.num}</span>
                    {verse.text}
                  </p>
                ))}
              {bibleSearchQuery && [
                { num: 33, text: 'Mas buscad primeramente el reino de Dios y su justicia.' },
                { num: 34, text: 'Asi que, no os afaneis por el dia de manana.' },
                { num: 35, text: 'Porque el dia de manana traera su afan.' },
              ].filter((v) => v.text.toLowerCase().includes(bibleSearchQuery.toLowerCase())).length === 0 ? (
                <p className="text-center text-sm text-muted py-4">No se encontraron versículos coincidentes.</p>
              ) : null}
            </div>
          </Card>
          <Card eyebrow="Herramientas" title="Notas y plan">
            <div className="space-y-4">
              <Input
                label="Buscar texto"
                placeholder="Reino de Dios"
                value={bibleSearchQuery}
                onChange={(e) => setBibleSearchQuery(e.currentTarget.value)}
              />
              <div className="grid grid-cols-4 gap-2">
                {['#FDE68A', '#BFDBFE', '#BBF7D0', '#FBCFE8'].map((color) => (
                  <button
                    aria-label={`Color ${color}`}
                    className={`h-10 rounded-lg border-2 ${selectedColor === color ? 'border-indigo-600 scale-105' : 'border-slate-200'} transition-all`}
                    key={color}
                    onClick={() => {
                      setSelectedColor(color);
                      alert(`Versículo seleccionado resaltado con el color ${color} (simulación).`);
                    }}
                    style={{ backgroundColor: color }}
                    title={`Color ${color}`}
                    type="button"
                  />
                ))}
              </div>
              <Button className="w-full" icon={<Play className="h-4 w-4" />} variant="secondary" onClick={handlePlayAudio}>
                Audio
              </Button>
            </div>
          </Card>
        </div>
      ) : null}

      {module === 'devocional' ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
          <Card eyebrow={content[0]?.bibleReference} title={content[0]?.title}>
            <p className="text-xl font-semibold leading-9 text-ink">{content[0]?.body}</p>
            <p className="mt-4 text-sm leading-6 text-muted">{content[0]?.excerpt}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button icon={<Heart className="h-4 w-4" />} variant="outline" onClick={handleFavorite}>
                Favorito
              </Button>
              <Button icon={<Send className="h-4 w-4" />} variant="secondary" onClick={handleShare}>
                Compartir
              </Button>
            </div>
          </Card>
          <Card eyebrow="Archivo" title="Historial">
            <div className="space-y-3">
              {content.map((item) => (
                <div className="rounded-lg border border-slate-200 p-4" key={item.id}>
                  <p className="font-bold text-ink">{item.title}</p>
                  <p className="mt-1 text-sm text-muted">{item.excerpt}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : null}

      {module === 'oracion' ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
          <Card title="Peticiones publicas y de grupo">
            <div className="space-y-4">
              {prayerRequests.map((request) => {
                const hasPrayed = user ? request.prayedByIds.includes(user.uid) : false;
                return (
                  <article className="rounded-lg border border-slate-200 p-4" key={request.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-extrabold text-ink">{request.title}</h2>
                        <p className="mt-2 text-sm leading-6 text-muted">{request.description}</p>
                      </div>
                      <StatusPill tone={request.status === 'active' ? 'warning' : 'success'}>{request.status}</StatusPill>
                    </div>
                    <Button
                      className="mt-4"
                      icon={<CheckCircle2 className={`h-4 w-4 ${hasPrayed ? 'fill-current' : ''}`} />}
                      size="sm"
                      variant={hasPrayed ? 'primary' : 'outline'}
                      onClick={() => user && incrementPrayerCount(request.id, user.uid)}
                    >
                      Orar {request.prayerCount}
                    </Button>
                  </article>
                );
              })}
            </div>
          </Card>
          <Card eyebrow="Nueva peticion" title="Compartir">
            <form className="space-y-4" onSubmit={submitPrayerRequest}>
              <Input
                label="Titulo"
                placeholder="Motivo de oracion"
                value={prayerTitle}
                onChange={(e) => setPrayerTitle(e.currentTarget.value)}
              />
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-ink">Descripcion</span>
                <textarea
                  className="min-h-32 w-full rounded-lg border border-slate-200 p-3 text-sm shadow-panel"
                  value={prayerDesc}
                  onChange={(e) => setPrayerDesc(e.currentTarget.value)}
                />
              </label>
              <select
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-panel"
                value={prayerVisibility}
                onChange={(e) => setPrayerVisibility(e.currentTarget.value as any)}
              >
                <option value="public">public</option>
                <option value="group">group</option>
                <option value="private">private</option>
              </select>
              {prayerMessage ? <p className="text-sm font-semibold text-indigo-600">{prayerMessage}</p> : null}
              <Button className="w-full" type="submit">Crear peticion</Button>
            </form>
          </Card>
        </div>
      ) : null}

      {module === 'grupos' ? (
        <div className="grid gap-4 md:grid-cols-2">
          {groups.map((group) => {
            const myEvent = events.find((e) => e.targetGroupIds.includes(group.id)) ?? events[0];
            const isRSVP = user && myEvent?.attendeeIds.includes(user.uid);
            return (
              <Card key={group.id} eyebrow={group.type} title={group.name}>
                <p className="text-sm leading-6 text-muted">{group.description}</p>
                <div className="mt-4 rounded-lg bg-slate-50 p-4">
                  <p className="font-bold text-ink">
                    {group.meetingDay} · {group.meetingTime}
                  </p>
                  <p className="mt-1 text-sm text-muted">{group.meetingLocation ?? group.meetingLink}</p>
                </div>
                {myEvent ? (
                  <Button
                    className="mt-4"
                    variant={isRSVP ? 'primary' : 'outline'}
                    onClick={() => {
                      user && toggleRSVP(myEvent.id, user.uid);
                      alert(isRSVP ? 'Inscripción cancelada.' : '¡Inscripción registrada con éxito para la reunión!');
                    }}
                  >
                    {isRSVP ? 'Inscrito (Cancelar)' : 'RSVP'}
                  </Button>
                ) : null}
              </Card>
            );
          })}
        </div>
      ) : null}

      {module === 'en-vivo' ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
          <Card eyebrow={liveStream.status} title={liveStream.title}>
            <div className="aspect-video rounded-lg bg-ink p-5 text-white">
              <div className="flex h-full flex-col justify-between">
                <StatusPill tone="warning">{liveStream.status}</StatusPill>
                <div className="flex items-center justify-center py-10">
                  <Button
                    icon={<PlayCircle className="h-6 w-6" />}
                    variant="success"
                    onClick={() => window.open(liveStream.streamUrl, '_blank')}
                  >
                    Ver transmisión
                  </Button>
                </div>
                <div className="text-xs text-white/50">Plataforma: {liveStream.platform}</div>
              </div>
            </div>
          </Card>
          <Card eyebrow="Biblioteca" title="Sermones">
            <div className="space-y-3">
              {content
                .filter((item) => item.type === 'sermon')
                .map((item) => (
                  <div className="rounded-lg border border-slate-200 p-4" key={item.id}>
                    <p className="font-bold text-ink">{item.title}</p>
                    <p className="mt-1 text-sm text-muted">{item.series}</p>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      ) : null}

      {module === 'dar' ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
          <Card eyebrow="Stripe" title="Nueva donacion">
            <form className="space-y-4" onSubmit={submitDonation}>
              <Input
                label="Monto COP"
                min={5000}
                onChange={(event) => setAmount(event.currentTarget.value)}
                type="number"
                value={amount}
              />
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-ink">Fondo</span>
                <select
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-panel"
                  onChange={(event) => setFund(event.currentTarget.value)}
                  value={fund}
                >
                  <option value="tithe">Diezmo</option>
                  <option value="offering">Ofrenda</option>
                  <option value="missions">Misiones</option>
                  <option value="building">Construccion</option>
                  <option value="social">Obra social</option>
                </select>
              </label>
              <Toggle checked={isRecurring} label="Donacion recurrente" onChange={setIsRecurring} />
              {donationMessage ? <p className="rounded-lg bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700">{donationMessage}</p> : null}
              <Button className="w-full" icon={<Gift className="h-4 w-4" />} type="submit">
                Continuar pago
              </Button>
            </form>
          </Card>
          <Card eyebrow="Historial" title="Comprobantes">
            <div className="space-y-3">
              {donations.filter((d) => d.userId === user?.uid).map((donation) => (
                <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3" key={donation.id}>
                  <div>
                    <p className="font-bold text-ink">{formatCurrency(donation.amount)}</p>
                    <p className="text-sm text-muted">{donation.fund}</p>
                  </div>
                  <Button icon={<Download className="h-4 w-4" />} size="icon" variant="ghost" onClick={() => handleDownloadReceipt(donation.fund, donation.amount)}>
                    Descargar
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : null}

      {module === 'perfil' ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
          <Card title="Datos personales">
            <form className="space-y-4" onSubmit={handleSaveProfile}>
              <div className="grid gap-4 md:grid-cols-2">
                <Input value={displayName} onChange={(e) => setDisplayName(e.currentTarget.value)} label="Nombre" />
                <Input value={email} onChange={(e) => setEmail(e.currentTarget.value)} label="Correo" />
                <Input value={phone} onChange={(e) => setPhone(e.currentTarget.value)} label="Telefono" />
                <Input value={favoriteVerse} onChange={(e) => setFavoriteVerse(e.currentTarget.value)} label="Versiculo favorito" />
              </div>
              {profileMessage ? <p className="text-sm font-semibold text-green-600 mt-2">{profileMessage}</p> : null}
              <Button type="submit" className="mt-4">Guardar perfil</Button>
            </form>
            <div className="mt-6">
              <FormationProgress />
            </div>
          </Card>
          <Card eyebrow="Privacidad" title="Visibilidad">
            <form onSubmit={handleSaveProfile} className="space-y-3">
              <Toggle checked={showPhone} label="Mostrar telefono" onChange={setShowPhone} />
              <Toggle checked={showEmail} label="Mostrar correo" onChange={setShowEmail} />
              <Toggle checked={showCity} label="Mostrar ciudad" onChange={setShowCity} />
              {profileMessage ? <p className="text-sm font-semibold text-green-600 mt-2">{profileMessage}</p> : null}
              <Button className="w-full mt-4" type="submit">Guardar cambios de privacidad</Button>
            </form>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
