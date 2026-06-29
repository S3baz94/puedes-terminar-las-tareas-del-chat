import { useState, FormEvent } from 'react';
import type { PrayerVisibility } from '../../types/models';
import { useAuth } from '../../hooks/useAuth';
import { useAppStore } from '../../store/appStore';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { StatusPill } from '../common/StatusPill';
import { CheckCircle2 } from 'lucide-react';

export function MemberPrayerTab() {
  const { user } = useAuth();
  const prayerRequests = useAppStore((state) => state.prayerRequests);
  const addPrayerRequest = useAppStore((state) => state.addPrayerRequest);
  const incrementPrayerCount = useAppStore((state) => state.incrementPrayerCount);

  // Forms local state
  const [prayerTitle, setPrayerTitle] = useState('');
  const [prayerDesc, setPrayerDesc] = useState('');
  const [prayerVisibility, setPrayerVisibility] = useState<PrayerVisibility>('public');
  const [prayerMessage, setPrayerMessage] = useState<string | null>(null);

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

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
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
              className="min-h-32 w-full rounded-lg border border-slate-200 p-3 text-sm shadow-panel focus:border-primary focus:ring-1 focus:ring-primary"
              value={prayerDesc}
              onChange={(e) => setPrayerDesc(e.currentTarget.value)}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-ink">Visibilidad</span>
            <select
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-panel"
              value={prayerVisibility}
              onChange={(e) => setPrayerVisibility(e.currentTarget.value as PrayerVisibility)}
            >
              <option value="public">public</option>
              <option value="group">group</option>
              <option value="private">private</option>
            </select>
          </label>
          {prayerMessage ? <p className="text-sm font-semibold text-indigo-600">{prayerMessage}</p> : null}
          <Button className="w-full" type="submit">Crear peticion</Button>
        </form>
      </Card>
    </div>
  );
}
