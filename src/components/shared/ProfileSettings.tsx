import { FormEvent, useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useAppStore } from '../../store/appStore';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Input } from '../common/Input';
import { Toggle } from '../common/Toggle';
import { StatusPill } from '../common/StatusPill';
import { FormationProgress } from '../member/FormationProgress';
import { SpiritualStatus, MeetingFormat } from '../../types/models';
import { useToastStore } from '../../store/toastStore';

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

export function ProfileSettings() {
  const { user } = useAuth();
  const users = useAppStore((state) => state.users);
  const groups = useAppStore((state) => state.groups);
  const updateUserProfile = useAppStore((state) => state.updateUserProfile);
  const updateGroupDetails = useAppStore((state) => state.updateGroupDetails);
  const notify = useToastStore((state) => state.notify);

  // Determine user role and tabs
  const isLeader = user?.role === 'leader';
  const isMember = user?.role === 'member';
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const [activeTab, setActiveTab] = useState<'info' | 'spiritual' | 'group' | 'privacy'>('info');

  const tabs = useMemo(() => {
    const list: { id: 'info' | 'spiritual' | 'group' | 'privacy'; label: string }[] = [
      { id: 'info', label: '👤 Info Personal' },
      { id: 'spiritual', label: isLeader ? '🌱 Camino Espiritual & Ministerios' : '🌱 Camino Espiritual' },
    ];
    if (isLeader) {
      list.push({ id: 'group', label: '🔑 Liderazgo & Mi Grupo' });
    }
    list.push({
      id: 'privacy',
      label: isMember ? '🔒 Privacidad y Progreso' : '🔒 Privacidad',
    });
    return list;
  }, [isLeader, isMember]);

  // Profile forms local state
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [favoriteVerse, setFavoriteVerse] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [baptismDate, setBaptismDate] = useState('');
  const [testimony, setTestimony] = useState('');
  const [spiritualStatus, setSpiritualStatus] = useState<SpiritualStatus | ''>('');
  const [photoURL, setPhotoURL] = useState('');
  const [leaderId, setLeaderId] = useState('');
  const [ministries, setMinistries] = useState<string[]>([]);
  const [newMinistryInput, setNewMinistryInput] = useState('');

  const [showPhone, setShowPhone] = useState(false);
  const [showEmail, setShowEmail] = useState(true);
  const [showCity, setShowCity] = useState(true);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  // Cell Group state
  const leaderGroup = useMemo(() => {
    return isLeader ? (groups.find((g) => g.leaderId === user?.uid) ?? groups[0]) : null;
  }, [isLeader, groups, user?.uid]);

  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [groupMeetingDay, setGroupMeetingDay] = useState('');
  const [groupMeetingTime, setGroupMeetingTime] = useState('');
  const [groupMeetingFormat, setGroupMeetingFormat] = useState<'in_person' | 'virtual' | 'hybrid'>('in_person');
  const [groupLocation, setGroupLocation] = useState('');
  const [groupLink, setGroupLink] = useState('');
  const [groupCapacity, setGroupCapacity] = useState(20);
  const [groupMessage, setGroupMessage] = useState<string | null>(null);

  // Mentors selection
  const mentors = useMemo(() => {
    return users.filter((u) => ['admin', 'super_admin', 'leader'].includes(u.role) && u.uid !== user?.uid);
  }, [users, user?.uid]);

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

  // Sync group details when leaderGroup changes
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

  if (!user) return null;

  async function handleAvatarSelect(url: string) {
    setPhotoURL(url);
    if (!user) return;
    try {
      await updateUserProfile(user.uid, {
        photoURL: url,
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

    if (!displayName.trim()) {
      notify({
        title: 'Error de validación',
        description: 'El nombre completo no puede estar vacío.',
        tone: 'error',
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email)) {
      notify({
        title: 'Error de validación',
        description: 'El correo electrónico no es válido.',
        tone: 'error',
      });
      return;
    }

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
        spiritualStatus: spiritualStatus ? (spiritualStatus as SpiritualStatus) : undefined,
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

    if (!groupName.trim()) {
      notify({
        title: 'Error de validación',
        description: 'El nombre del grupo no puede estar vacío.',
        tone: 'error',
      });
      return;
    }

    if (!Number.isInteger(groupCapacity) || groupCapacity <= 0) {
      notify({
        title: 'Error de validación',
        description: 'La capacidad del grupo debe ser un número entero positivo mayor a 0.',
        tone: 'error',
      });
      return;
    }

    if (!groupMeetingDay.trim()) {
      notify({
        title: 'Error de validación',
        description: 'El día de reunión no puede estar vacío.',
        tone: 'error',
      });
      return;
    }

    if (!groupMeetingTime.trim()) {
      notify({
        title: 'Error de validación',
        description: 'La hora de reunión no puede estar vacía.',
        tone: 'error',
      });
      return;
    }

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
    setMinistries(ministries.filter((m) => m !== item));
  }

  return (
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
            <h3 className="mt-4 text-xl font-bold text-ink">{displayName || 'Usuario'}</h3>
            <p className="text-sm font-semibold text-muted">{email}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <StatusPill tone="primary">{user.role}</StatusPill>
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
          <div className="flex flex-col gap-1 p-1" role="tablist" aria-label="Menú de ajustes de perfil">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                type="button"
                onClick={() => setActiveTab(tab.id)}
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
          <div id="panel-info" role="tabpanel" aria-labelledby="tab-info">
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
                      placeholder={isLeader ? "Comparte tu testimonio personal..." : "Comparte cómo ha sido tu experiencia con Dios..."}
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
          </div>
        )}

        {activeTab === 'spiritual' && (
          <div id="panel-spiritual" role="tabpanel" aria-labelledby="tab-spiritual">
            <Card title={isLeader ? "Mi Camino Espiritual & Ministerios" : "Mi Camino Espiritual"}>
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label="Versículo Favorito"
                    value={favoriteVerse}
                    onChange={(e) => setFavoriteVerse(e.currentTarget.value)}
                    placeholder={isLeader ? "Filipenses 4:13" : "Salmos 23:1"}
                  />
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-ink">Estado Espiritual</span>
                    <select
                      className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-panel"
                      value={spiritualStatus}
                      onChange={(e) => setSpiritualStatus(e.target.value as SpiritualStatus)}
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
                    <span className="mb-2 block text-sm font-semibold text-ink">
                      {isLeader ? "Pastor / Mentor de Cobertura" : "Mentor / Acompañante Espiritual"}
                    </span>
                    <select
                      className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-panel"
                      value={leaderId}
                      onChange={(e) => setLeaderId(e.target.value)}
                    >
                      <option value="">Ninguno</option>
                      {mentors.map((m) => (
                        <option key={m.uid} value={m.uid}>
                          {m.displayName} ({m.role === 'admin' || m.role === 'super_admin' ? 'Administrador' : 'Líder'})
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {/* Ministry Tags Management */}
                {isLeader ? (
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
                ) : (
                  user?.ministry && user.ministry.length > 0 && (
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
                  )
                )}

                {profileMessage && <p className="text-sm font-semibold text-green-600">{profileMessage}</p>}
                <div className="flex justify-end">
                  <Button type="submit">Guardar Datos Espirituales</Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {isLeader && activeTab === 'group' && (
          <div id="panel-group" role="tabpanel" aria-labelledby="tab-group">
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
                        onChange={(e) => setGroupMeetingFormat(e.target.value as MeetingFormat)}
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
          </div>
        )}

        {activeTab === 'privacy' && (
          <div id="panel-privacy" role="tabpanel" aria-labelledby="tab-privacy" className="space-y-6">
            <Card eyebrow="Privacidad" title="Visibilidad en Directorio">
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="space-y-3">
                  <Toggle checked={showPhone} label={isLeader ? "Mostrar mi número de teléfono en el directorio público" : "Mostrar mi número de teléfono en el directorio"} onChange={setShowPhone} />
                  <Toggle checked={showEmail} label={isLeader ? "Mostrar mi correo en el directorio público" : "Mostrar mi correo en el directorio"} onChange={setShowEmail} />
                  <Toggle checked={showCity} label={isLeader ? "Mostrar mi ciudad en el directorio público" : "Mostrar mi ciudad en el directorio"} onChange={setShowCity} />
                </div>
                {profileMessage && <p className="text-sm font-semibold text-green-600">{profileMessage}</p>}
                <div className="flex justify-end">
                  <Button type="submit">{isLeader ? "Guardar Ajustes de Privacidad" : "Guardar Privacidad"}</Button>
                </div>
              </form>
            </Card>

            {isMember && (
              <Card eyebrow="Cursos" title="Mi Progreso de Formación">
                <div className="p-1">
                  <FormationProgress />
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
