import { FormEvent, useState, useEffect, useMemo } from 'react';
import { BookOpen, CheckCircle2, Download, Gift, Heart, Play, Search, Send, PlayCircle } from 'lucide-react';
import type { User } from '../../types/models';
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

const BIBLE_BOOKS = {
  Mateo: {
    '6': [
      { num: 33, text: 'Mas buscad primeramente el reino de Dios y su justicia, y todas estas cosas os serán añadidas.' },
      { num: 34, text: 'Así que, no os afanéis por el día de mañana, porque el día de mañana traerá su afán; basta a cada día su propio mal.' },
      { num: 35, text: 'Ninguno puede servir a dos señores; porque o aborrecerá al uno y amará al otro, o estimará al uno y menospreciará al otro.' }
    ]
  },
  Salmos: {
    '23': [
      { num: 1, text: 'Jehová es mi pastor; nada me faltará.' },
      { num: 2, text: 'En lugares de delicados pastos me hará descansar; Junto a aguas de reposo me pastoreará.' },
      { num: 3, text: 'Confortará mi alma; Me guiará por sendas de justicia por amor de su nombre.' },
      { num: 4, text: 'Aunque ande en valle de sombra de muerte, no temeré mal alguno, porque tú estarás conmigo.' }
    ]
  },
  Juan: {
    '3': [
      { num: 16, text: 'Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.' },
      { num: 17, text: 'Porque no envió Dios a su Hijo al mundo para condenar al mundo, sino para que el mundo sea salvo por él.' },
      { num: 18, text: 'El que en él cree, no es condenado; pero el que no cree, ya ha sido condenado, porque no ha creído en el nombre del unigénito.' }
    ]
  },
  Génesis: {
    '1': [
      { num: 1, text: 'En el principio creó Dios los cielos y la tierra.' },
      { num: 2, text: 'Y la tierra estaba desordenada y vacía, y las tinieblas estaban sobre la faz del abismo, y el Espíritu de Dios se movía.' },
      { num: 3, text: 'Y dijo Dios: Sea la luz; y fue la luz.' }
    ]
  }
} as const;

export type MemberModule = 'biblia' | 'devocional' | 'oracion' | 'grupos' | 'en-vivo' | 'dar' | 'perfil';

const moduleTitles: Record<MemberModule, string> = {
  biblia: 'Biblia',
  devocional: 'Devocional',
  oracion: 'Oración',
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
  const users = useAppStore((state) => state.users);
  const devotionalNotes = useAppStore((state) => state.devotionalNotes);

  // Zustand actions
  const addDonation = useAppStore((state) => state.addDonation);
  const addPrayerRequest = useAppStore((state) => state.addPrayerRequest);
  const incrementPrayerCount = useAppStore((state) => state.incrementPrayerCount);
  const toggleRSVP = useAppStore((state) => state.toggleRSVP);
  const updateUserProfile = useAppStore((state) => state.updateUserProfile);
  const fetchDevotionalNote = useAppStore((state) => state.fetchDevotionalNote);
  const saveDevotionalNote = useAppStore((state) => state.saveDevotionalNote);

  // Component state
  const [amount, setAmount] = useState('80000');
  const [fund, setFund] = useState('offering');
  const [donationMessage, setDonationMessage] = useState<string | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [downloadingReceiptId, setDownloadingReceiptId] = useState<string | null>(null);

  // Bible state
  const [bibleSearchQuery, setBibleSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<'Mateo' | 'Salmos' | 'Juan' | 'Génesis'>('Mateo');
  const [selectedChapter, setSelectedChapter] = useState<'6' | '23' | '3' | '1'>('6');
  const [highlightedVerses, setHighlightedVerses] = useState<Record<string, string>>({});
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);

  // Devotional Note state
  const devotionals = useMemo(() => content.filter((item) => item.type === 'devotional'), [content]);
  const [selectedDevoId, setSelectedDevoId] = useState(devotionals[0]?.id || '');
  const selectedDevotional = devotionals.find((d) => d.id === selectedDevoId) || devotionals[0];
  const [devoNoteText, setDevoNoteText] = useState('');
  const [saveNoteStatus, setSaveNoteStatus] = useState<string | null>(null);
  const [favoriteDevotionals, setFavoriteDevotionals] = useState<Record<string, boolean>>({});

  // Prayer state
  const [prayerTitle, setPrayerTitle] = useState('');
  const [prayerDesc, setPrayerDesc] = useState('');
  const [prayerVisibility, setPrayerVisibility] = useState<'public' | 'group' | 'private'>('public');
  const [prayerMessage, setPrayerMessage] = useState<string | null>(null);

  // Tab navigation
  const [activeTab, setActiveTab] = useState<'info' | 'spiritual' | 'privacy'>('info');

  // Profile fields state
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

  const [showPhone, setShowPhone] = useState(false);
  const [showEmail, setShowEmail] = useState(true);
  const [showCity, setShowCity] = useState(true);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  // Mentors selection
  const mentors = useMemo(() => users.filter((u) => ['admin', 'super_admin', 'leader'].includes(u.role)), [users]);

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
      setCity(user.city || '');
      setCountry(user.country || 'Colombia');
      setBirthDate(user.birthDate || '');
      setBaptismDate(user.baptismDate || '');
      setTestimony(user.testimony || '');
      setSpiritualStatus(user.spiritualStatus || 'new_believer');
      setPhotoURL(user.photoURL || '');
      setLeaderId(user.leaderId || '');
    }
  }, [user]);

  // Sync devotional note when selection or notes store updates
  useEffect(() => {
    if (selectedDevotional) {
      fetchDevotionalNote(selectedDevotional.id);
    }
  }, [selectedDevotional?.id, fetchDevotionalNote]);

  useEffect(() => {
    if (selectedDevotional) {
      setDevoNoteText(devotionalNotes[selectedDevotional.id] || '');
    }
  }, [selectedDevotional?.id, devotionalNotes]);

  // Audio player progress effect
  useEffect(() => {
    let interval: any;
    if (isAudioPlaying) {
      interval = setInterval(() => {
        setAudioProgress((p) => {
          if (p >= 100) {
            setIsAudioPlaying(false);
            return 0;
          }
          return p + 4;
        });
      }, 300);
    } else {
      setAudioProgress(0);
    }
    return () => clearInterval(interval);
  }, [isAudioPlaying]);

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

  // Interactive buttons handlers
  function handleFavorite() {
    if (!selectedDevotional) return;
    setFavoriteDevotionals((prev) => {
      const next = !prev[selectedDevotional.id];
      alert(next ? '¡Guardado en tus favoritos!' : 'Quitado de tus favoritos.');
      return { ...prev, [selectedDevotional.id]: next };
    });
  }

  function handleShare() {
    if (!selectedDevotional) return;
    navigator.clipboard.writeText(window.location.href);
    alert('¡Enlace de compartir copiado al portapapeles! 🔗');
  }

  function handlePlayAudio() {
    setIsAudioPlaying((prev) => !prev);
  }

  async function handleSaveDevoNote() {
    if (!selectedDevotional) return;
    setSaveNoteStatus('Guardando...');
    try {
      await saveDevotionalNote(selectedDevotional.id, devoNoteText);
      setSaveNoteStatus('¡Reflexión guardada con éxito!');
      setTimeout(() => setSaveNoteStatus(null), 3000);
    } catch (err) {
      setSaveNoteStatus('Error al guardar.');
      setTimeout(() => setSaveNoteStatus(null), 3000);
    }
  }

  function handleDownloadReceipt(fundName: string, donationAmount: number, donationId: string) {
    setDownloadingReceiptId(donationId);
    setTimeout(() => {
      setDownloadingReceiptId(null);
      alert(`Comprobante generado:\n\nTransacción: ${donationId}\nFondo: ${fundName}\nMonto: ${formatCurrency(donationAmount)} COP\n\n¡Archivo PDF simulado generado y guardado con éxito!`);
    }, 1500);
  }

  return (
    <div>
      <PageHeader eyebrow="Miembro" title={moduleTitles[module]} />

      {module === 'biblia' ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
          <Card
            action={<Button icon={<Search className="h-4 w-4" />} variant="outline" onClick={() => alert(`Búsqueda para "${bibleSearchQuery}" completada (simulado).`)}>Buscar</Button>}
            eyebrow="RVR60"
            title={`${selectedBook} ${selectedChapter}`}
          >
            <div className="space-y-4 text-base leading-8 text-ink">
              {(((BIBLE_BOOKS as any)[selectedBook] as any)[selectedChapter] || [])
                .filter((verse: any) => verse.text.toLowerCase().includes(bibleSearchQuery.toLowerCase()))
                .map((verse: any) => {
                  const key = `${selectedBook}-${selectedChapter}-${verse.num}`;
                  const color = highlightedVerses[key];
                  return (
                    <p
                      className="rounded-lg border border-slate-200 p-4 animate-fade-in cursor-pointer transition hover:bg-slate-100/50"
                      key={verse.text}
                      style={{ backgroundColor: color || undefined }}
                      onClick={() => {
                        if (selectedColor) {
                          setHighlightedVerses((prev) => {
                            if (prev[key] === selectedColor) {
                              const next = { ...prev };
                              delete next[key];
                              return next;
                            }
                            return { ...prev, [key]: selectedColor };
                          });
                        } else {
                          alert("Por favor selecciona un color de resaltador en el panel de herramientas a la derecha y luego haz clic en el versículo para colorear.");
                        }
                      }}
                    >
                      <span className="mr-2 font-extrabold text-primary">{verse.num}</span>
                      {verse.text}
                    </p>
                  );
                })}
              {bibleSearchQuery && (((BIBLE_BOOKS as any)[selectedBook] as any)[selectedChapter] || []).filter((verse: any) => verse.text.toLowerCase().includes(bibleSearchQuery.toLowerCase())).length === 0 ? (
                <p className="text-center text-sm text-muted py-4">No se encontraron versículos coincidentes.</p>
              ) : null}
            </div>
          </Card>
          <Card eyebrow="Herramientas" title="Notas y plan">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-ink">Libro</span>
                  <select
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-panel"
                    value={selectedBook}
                    onChange={(e) => {
                      const book = e.currentTarget.value as any;
                      setSelectedBook(book);
                      const chapters = Object.keys((BIBLE_BOOKS as any)[book]);
                      setSelectedChapter(chapters[0] as any);
                    }}
                  >
                    {Object.keys(BIBLE_BOOKS).map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-ink">Capítulo</span>
                  <select
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-panel"
                    value={selectedChapter}
                    onChange={(e) => setSelectedChapter(e.currentTarget.value as any)}
                  >
                    {Object.keys((BIBLE_BOOKS as any)[selectedBook]).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>
              </div>
              <Input
                label="Buscar texto"
                placeholder="Reino de Dios"
                value={bibleSearchQuery}
                onChange={(e) => setBibleSearchQuery(e.currentTarget.value)}
              />
              <div>
                <span className="mb-2 block text-sm font-semibold text-ink">Resaltador (Selecciona color y haz clic en versículo)</span>
                <div className="grid grid-cols-4 gap-2">
                  {['#FDE68A', '#BFDBFE', '#BBF7D0', '#FBCFE8'].map((color) => (
                    <button
                      aria-label={`Color ${color}`}
                      className={`h-10 rounded-lg border-2 ${selectedColor === color ? 'border-indigo-600 scale-105' : 'border-slate-200'} transition-all`}
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      style={{ backgroundColor: color }}
                      title={`Color ${color}`}
                      type="button"
                    />
                  ))}
                </div>
              </div>
              <Button
                className="w-full"
                icon={<Play className="h-4 w-4" />}
                variant={isAudioPlaying ? 'primary' : 'secondary'}
                onClick={handlePlayAudio}
              >
                {isAudioPlaying ? 'Pausar Audio' : 'Escuchar Audio'}
              </Button>
              {isAudioPlaying && (
                <div className="mt-4 rounded-lg bg-indigo-50 p-3 border border-indigo-100 flex items-center justify-between gap-3 animate-fade-in">
                  <span className="text-xs font-bold text-indigo-600 animate-pulse flex items-center gap-1.5">
                    <Play className="h-3 w-3 fill-current" />
                    Reproduciendo audio ({audioProgress}%)
                  </span>
                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-300" style={{ width: `${audioProgress}%` }} />
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setIsAudioPlaying(false)} className="text-xs text-danger font-bold">Detener</Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      ) : null}

      {module === 'devocional' ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
          <Card eyebrow={selectedDevotional?.bibleReference} title={selectedDevotional?.title}>
            <p className="text-xl font-semibold leading-9 text-ink">{selectedDevotional?.body}</p>
            <p className="mt-4 text-sm leading-6 text-muted">{selectedDevotional?.excerpt}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button
                icon={<Heart className={`h-4 w-4 ${selectedDevotional && favoriteDevotionals[selectedDevotional.id] ? 'fill-current text-red-500' : ''}`} />}
                variant={selectedDevotional && favoriteDevotionals[selectedDevotional.id] ? 'primary' : 'outline'}
                onClick={handleFavorite}
              >
                {selectedDevotional && favoriteDevotionals[selectedDevotional.id] ? 'Favorito' : 'Marcar Favorito'}
              </Button>
              <Button icon={<Send className="h-4 w-4" />} variant="secondary" onClick={handleShare}>
                Compartir
              </Button>
            </div>
          </Card>

          <div className="space-y-6">
            <Card eyebrow="Mi Crecimiento" title="Diario de Reflexión">
              <div className="space-y-4">
                <p className="text-xs text-muted">Anota tus reflexiones y lo que Dios te ha hablado hoy a través de este devocional.</p>
                <textarea
                  className="min-h-36 w-full rounded-lg border border-slate-200 p-3 text-sm shadow-panel focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="Escribe tus notas aquí..."
                  value={devoNoteText}
                  onChange={(e) => setDevoNoteText(e.target.value)}
                />
                {saveNoteStatus && <p className="text-sm font-semibold text-green-600 animate-fade-in">{saveNoteStatus}</p>}
                <Button className="w-full" onClick={handleSaveDevoNote}>Guardar en mi Diario</Button>
              </div>
            </Card>

            <Card eyebrow="Archivo" title="Otros Devocionales">
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {devotionals.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedDevoId(item.id)}
                    className={`w-full text-left rounded-lg border p-4 transition ${
                      selectedDevotional?.id === item.id ? 'border-primary bg-indigo-50/40' : 'border-slate-200 hover:border-primary'
                    }`}
                  >
                    <p className="font-bold text-ink">{item.title}</p>
                    <p className="mt-1 text-xs text-muted">{item.bibleReference}</p>
                  </button>
                ))}
              </div>
            </Card>
          </div>
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
                  <Button
                    icon={downloadingReceiptId === donation.id ? undefined : <Download className="h-4 w-4" />}
                    size={downloadingReceiptId === donation.id ? 'sm' : 'icon'}
                    variant={downloadingReceiptId === donation.id ? 'secondary' : 'ghost'}
                    onClick={() => handleDownloadReceipt(donation.fund, donation.amount, donation.id)}
                    disabled={downloadingReceiptId !== null}
                  >
                    {downloadingReceiptId === donation.id ? 'Generando...' : 'Descargar'}
                  </Button>
                </div>
              ))}
            </div>
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
                <h3 className="mt-4 text-xl font-bold text-ink">{displayName || 'Miembro'}</h3>
                <p className="text-sm font-semibold text-muted">{email}</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <StatusPill tone="primary">{user ? user.role : 'Miembro'}</StatusPill>
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
                  { id: 'spiritual', label: '🌱 Camino Espiritual' },
                  { id: 'privacy', label: '🔒 Privacidad y Progreso' }
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
                        placeholder="Comparte cómo ha sido tu experiencia con Dios..."
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
              <Card title="Mi Camino Espiritual">
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      label="Versículo Favorito"
                      value={favoriteVerse}
                      onChange={(e) => setFavoriteVerse(e.currentTarget.value)}
                      placeholder="Salmos 23:1"
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
                      <span className="mb-2 block text-sm font-semibold text-ink">Mentor / Acompañante Espiritual</span>
                      <select
                        className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-panel"
                        value={leaderId}
                        onChange={(e) => setLeaderId(e.target.value)}
                      >
                        <option value="">Ninguno</option>
                        {mentors.map((m: User) => (
                          <option key={m.uid} value={m.uid}>
                            {m.displayName} ({m.role === 'leader' ? 'Líder' : 'Admin'})
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {/* Read-only Ministries */}
                  {user?.ministry && user.ministry.length > 0 && (
                    <div className="border-t border-slate-100 pt-4 mt-4">
                      <span className="mb-2 block text-sm font-semibold text-ink">Mis Ministerios Asignados</span>
                      <div className="flex flex-wrap gap-2">
                        {user.ministry.map((min) => (
                          <span key={min} className="inline-flex items-center bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-bold">
                            {min}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {profileMessage && <p className="text-sm font-semibold text-green-600">{profileMessage}</p>}
                  <div className="flex justify-end">
                    <Button type="submit">Guardar Datos Espirituales</Button>
                  </div>
                </form>
              </Card>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <Card eyebrow="Privacidad" title="Visibilidad en Directorio">
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="space-y-3">
                      <Toggle checked={showPhone} label="Mostrar mi número de teléfono en el directorio" onChange={setShowPhone} />
                      <Toggle checked={showEmail} label="Mostrar mi correo en el directorio" onChange={setShowEmail} />
                      <Toggle checked={showCity} label="Mostrar mi ciudad en el directorio" onChange={setShowCity} />
                    </div>
                    {profileMessage && <p className="text-sm font-semibold text-green-600">{profileMessage}</p>}
                    <div className="flex justify-end">
                      <Button type="submit">Guardar Privacidad</Button>
                    </div>
                  </form>
                </Card>

                <Card eyebrow="Cursos" title="Mi Progreso de Formación">
                  <div className="p-1">
                    <FormationProgress />
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
