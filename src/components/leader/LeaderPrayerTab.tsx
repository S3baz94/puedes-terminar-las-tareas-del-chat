import { useState, useEffect, useMemo } from 'react';
import type { PrayerRequest } from '../../types/models';
import { useAppStore } from '../../store/appStore';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { StatusPill } from '../common/StatusPill';
import { DataTable, type Column } from '../common/DataTable';

export function LeaderPrayerTab() {
  const prayerRequests = useAppStore((state) => state.prayerRequests);
  const updatePrayerPastoralNote = useAppStore((state) => state.updatePrayerPastoralNote);
  const resolvePrayerRequest = useAppStore((state) => state.resolvePrayerRequest);

  // Forms local state
  const [selectedPrayerId, setSelectedPrayerId] = useState('');
  const [prayerNoteText, setPrayerNoteText] = useState('');
  const [prayerResponseMsg, setPrayerResponseMsg] = useState<string | null>(null);

  const selectedPrayer = prayerRequests.find((p) => p.id === selectedPrayerId) || prayerRequests[0];

  useEffect(() => {
    if (selectedPrayer) {
      setPrayerNoteText(selectedPrayer.pastoralNote || '');
    }
  }, [selectedPrayerId, selectedPrayer]);

  const prayerColumns = useMemo<Column<PrayerRequest>[]>(
    () => [
      { header: 'Peticion', accessor: 'title' },
      { header: 'Visibilidad', accessor: 'visibility' },
      { header: 'Oraciones', accessor: (row) => String(row.prayerCount) },
      {
        header: 'Estado',
        accessor: (row) => <StatusPill tone={row.status === 'active' ? 'warning' : 'success'}>{row.status}</StatusPill>,
      },
    ],
    []
  );

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

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
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
              className="min-h-32 w-full rounded-lg border border-slate-200 p-3 text-sm shadow-panel focus:border-primary focus:ring-1 focus:ring-primary"
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
  );
}
