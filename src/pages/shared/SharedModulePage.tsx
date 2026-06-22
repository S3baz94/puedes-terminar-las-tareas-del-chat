import { useState } from 'react';
import { Bell, CalendarDays, Heart, Send } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { StatusPill } from '../../components/common/StatusPill';
import { UserAvatar } from '../../components/common/UserAvatar';
import { PageHeader } from '../../components/layout/PageHeader';
import { useAuth } from '../../hooks/useAuth';
import { useAppStore } from '../../store/appStore';
import { formatDateTime } from '../../utils/format';

export type SharedModule = 'mensajes' | 'calendario' | 'directorio' | 'testimonios' | 'notificaciones';

const titles: Record<SharedModule, string> = {
  mensajes: 'Mensajeria',
  calendario: 'Calendario',
  directorio: 'Directorio',
  testimonios: 'Testimonios',
  notificaciones: 'Notificaciones',
};

export function SharedModulePage({ module }: { module: SharedModule }) {
  const { user } = useAuth();

  // Zustand values
  const messages = useAppStore((state) => state.messages);
  const users = useAppStore((state) => state.users);
  const events = useAppStore((state) => state.events);
  const content = useAppStore((state) => state.content);
  const notificationsList = useAppStore((state) => state.notifications);

  // Zustand actions
  const addMessage = useAppStore((state) => state.addMessage);

  const notifications = notificationsList.filter(
    (item) => item.userId === user?.uid || user?.role === 'admin'
  );

  const [chatText, setChatText] = useState('');
  const [reactions, setReactions] = useState<Record<string, number>>({});
  const [activeConversationId, setActiveConversationId] = useState('g-central');
  const [directoryQuery, setDirectoryQuery] = useState('');

  const conversationNames: Record<string, string> = {
    'g-central': 'Casa Central',
    'g-alabanza': 'Equipo de alabanza',
    'g-admin': 'Administracion',
  };

  function handleSendMessage() {
    if (!chatText.trim() || !user) return;
    addMessage(activeConversationId, user.uid, chatText);
    setChatText('');
  }

  function handleReaction(uid: string) {
    setReactions((prev) => ({
      ...prev,
      [uid]: (prev[uid] || 0) + 1,
    }));
  }

  return (
    <div>
      <PageHeader eyebrow="Compartido" title={titles[module]} />

      {module === 'mensajes' ? (
        <div className="grid gap-6 xl:grid-cols-[20rem_1fr]">
          <Card title="Conversaciones">
            <div className="space-y-3">
              {Object.entries(conversationNames).map(([id, name]) => (
                <button
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition ${
                    activeConversationId === id ? 'border-primary bg-indigo-50/40' : 'border-slate-200 hover:border-primary'
                  }`}
                  key={id}
                  onClick={() => setActiveConversationId(id)}
                  type="button"
                >
                  <UserAvatar name={name} size="sm" />
                  <span>
                    <span className="block font-bold text-ink">{name}</span>
                    <span className="text-sm text-muted">
                      {messages.filter((m) => m.conversationId === id).length} mensajes
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </Card>
          <Card title={conversationNames[activeConversationId]}>
            <div className="space-y-4">
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {messages
                  .filter((m) => m.conversationId === activeConversationId)
                  .map((message) => {
                    const sender = users.find((item) => item.uid === message.senderId);
                    return (
                      <div className="flex gap-3 animate-fade-in" key={message.id}>
                        <UserAvatar name={sender?.displayName ?? 'Usuario'} size="sm" />
                        <div className="rounded-lg bg-slate-50 px-4 py-3">
                          <p className="font-bold text-ink">{sender?.displayName}</p>
                          <p className="mt-1 text-sm text-muted">{message.content}</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Input
                    className="h-10"
                    label="Mensaje"
                    placeholder="Escribe un mensaje"
                    value={chatText}
                    onChange={(e) => setChatText(e.currentTarget.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendMessage();
                    }}
                  />
                </div>
                <Button icon={<Send className="h-4 w-4" />} size="icon" onClick={handleSendMessage}>
                  Enviar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      {module === 'calendario' ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
          <Card title="Vista mensual">
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }, (_, index) => (
                <div
                  className={`min-h-20 rounded-lg border p-2 text-sm ${
                    [4, 7, 14, 20].includes(index)
                      ? 'border-primary bg-indigo-50 text-primary'
                      : 'border-slate-200 bg-white text-muted'
                  }`}
                  key={index}
                >
                  <span className="font-bold">{index + 1}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card eyebrow="Eventos" title="Proximos">
            <div className="space-y-3">
              {events.map((event) => (
                <div className="rounded-lg border border-slate-200 p-4" key={event.id}>
                  <CalendarDays className="h-5 w-5 text-primary" />
                  <p className="mt-2 font-bold text-ink">{event.title}</p>
                  <p className="mt-1 text-sm text-muted">{formatDateTime(event.startDateTime)}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : null}

      {module === 'directorio' ? (
        <Card title="Buscar personas">
          <div className="mb-4 max-w-md">
            <Input
              label="Buscar"
              placeholder="Nombre, ministerio o ciudad"
              value={directoryQuery}
              onChange={(e) => setDirectoryQuery(e.currentTarget.value)}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {users
              .filter((item) => item.privacySettings.showEmail || item.privacySettings.showCity)
              .filter((item) => {
                const searchString = [
                  item.displayName,
                  item.city,
                  item.country,
                  ...item.ministry
                ].join(' ').toLowerCase();
                return searchString.includes(directoryQuery.toLowerCase());
              })
              .map((person) => (
                <div className="rounded-lg border border-slate-200 p-4" key={person.uid}>
                  <div className="flex items-center gap-3">
                    <UserAvatar name={person.displayName} />
                    <div>
                      <p className="font-bold text-ink">{person.displayName}</p>
                      <p className="text-sm text-muted">{person.city}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {person.ministry.map((ministry) => (
                      <StatusPill key={ministry} tone="primary">{ministry}</StatusPill>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </Card>
      ) : null}

      {module === 'testimonios' ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
          <Card title="Feed">
            <div className="space-y-4">
              {users
                .filter((person) => person.testimony)
                .map((person) => {
                  const reacts = reactions[person.uid] || 0;
                  return (
                    <article className="rounded-lg border border-slate-200 p-4" key={person.uid}>
                      <div className="flex items-center gap-3">
                        <UserAvatar name={person.displayName} size="sm" />
                        <p className="font-bold text-ink">{person.displayName}</p>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-muted">{person.testimony}</p>
                      <Button
                        className="mt-4 animate-scale-up"
                        icon={<Heart className="h-4 w-4" />}
                        size="sm"
                        variant={reacts > 0 ? 'primary' : 'outline'}
                        onClick={() => handleReaction(person.uid)}
                      >
                        Reaccionar ({reacts})
                      </Button>
                    </article>
                  );
                })}
            </div>
          </Card>
          <Card eyebrow="Moderacion" title="Destacados">
            <div className="space-y-3">
              {content.slice(0, 2).map((item) => (
                <div className="rounded-lg border border-slate-200 p-4" key={item.id}>
                  <p className="font-bold text-ink">{item.title}</p>
                  <p className="mt-1 text-sm text-muted">{item.excerpt}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : null}

      {module === 'notificaciones' ? (
        <Card title="Centro de alertas">
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4"
                key={notification.id}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-primary">
                  <Bell className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-ink">{notification.title}</p>
                    <StatusPill tone={notification.type === 'urgent' ? 'danger' : 'primary'}>
                      {notification.type}
                    </StatusPill>
                  </div>
                  <p className="mt-1 text-sm text-muted">{notification.body}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
