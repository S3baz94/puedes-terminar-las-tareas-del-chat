import { useMemo } from 'react';
import type { User as ModelUser, Group } from '../../types/models';
import { Card } from '../common/Card';
import { DataTable, type Column } from '../common/DataTable';
import { StatusPill } from '../common/StatusPill';
import { UserAvatar } from '../common/UserAvatar';
import { formatDateTime, statusTone } from '../../utils/format';

interface LeaderGroupTabProps {
  leaderGroup: Group | null;
  groupMembers: ModelUser[];
}

export function LeaderGroupTab({ leaderGroup, groupMembers }: LeaderGroupTabProps) {
  const memberColumns = useMemo<Column<ModelUser>[]>(
    () => [
      { header: 'Nombre', accessor: 'displayName' },
      {
        header: 'Estado',
        accessor: (row) => <StatusPill tone={statusTone(row.status)}>{row.status}</StatusPill>,
      },
      { header: 'Ciudad', accessor: 'city' },
      { header: 'Ultima actividad', accessor: (row) => formatDateTime(row.lastActiveAt) },
    ],
    []
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
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
  );
}
