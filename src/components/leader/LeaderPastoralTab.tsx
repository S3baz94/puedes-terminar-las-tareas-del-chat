import { useState, useMemo, FormEvent } from 'react';
import type { User as ModelUser, PastoralNote } from '../../types/models';
import { useAuth } from '../../hooks/useAuth';
import { useAppStore } from '../../store/appStore';
import { Card } from '../common/Card';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { DataTable, type Column } from '../common/DataTable';
import { Send } from 'lucide-react';
import { formatShortDate } from '../../utils/format';

interface LeaderPastoralTabProps {
  groupMembers: ModelUser[];
}

export function LeaderPastoralTab({ groupMembers }: LeaderPastoralTabProps) {
  const { user } = useAuth();
  const users = useAppStore((state) => state.users);
  const pastoralNotes = useAppStore((state) => state.pastoralNotes);
  const addPastoralNote = useAppStore((state) => state.addPastoralNote);

  // Forms local state
  const [noteMemberId, setNoteMemberId] = useState('');
  const [noteDate, setNoteDate] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [pastoralMessage, setPastoralMessage] = useState<string | null>(null);

  const noteColumns = useMemo<Column<PastoralNote>[]>(
    () => [
      {
        header: 'Miembro',
        accessor: (row) => users.find((u) => u.uid === row.memberId)?.displayName ?? 'Miembro',
      },
      { header: 'Tipo', accessor: 'type' },
      { header: 'Estado', accessor: 'memberStatus' },
      { header: 'Seguimiento', accessor: (row) => (row.followUpDate ? formatShortDate(row.followUpDate) : 'Sin fecha') },
    ],
    [users]
  );

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

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
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
  );
}
