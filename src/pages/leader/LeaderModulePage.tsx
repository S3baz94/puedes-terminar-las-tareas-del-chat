import { Plus } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { PageHeader } from '../../components/layout/PageHeader';
import { useAuth } from '../../hooks/useAuth';
import { useAppStore } from '../../store/appStore';
import { useToastStore } from '../../store/toastStore';

import { LeaderGroupTab } from '../../components/leader/LeaderGroupTab';
import { LeaderPastoralTab } from '../../components/leader/LeaderPastoralTab';
import { LeaderMeetingsTab } from '../../components/leader/LeaderMeetingsTab';
import { LeaderPrayerTab } from '../../components/leader/LeaderPrayerTab';
import { LeaderResourcesTab } from '../../components/leader/LeaderResourcesTab';
import { LeaderReportsTab } from '../../components/leader/LeaderReportsTab';
import { ProfileSettings } from '../../components/shared/ProfileSettings';

export type LeaderModule = 'mi-grupo' | 'pastoral' | 'reuniones' | 'oracion' | 'recursos' | 'reportes' | 'perfil';

const moduleTitles: Record<LeaderModule, string> = {
  'mi-grupo': 'Mi grupo',
  pastoral: 'Seguimiento pastoral',
  reuniones: 'Reuniones',
  oracion: 'Oración del grupo',
  recursos: 'Recursos',
  reportes: 'Reportes',
  perfil: 'Mi Perfil de Liderazgo',
};

export function LeaderModulePage({ module }: { module: LeaderModule }) {
  const { user } = useAuth();
  const notify = useToastStore((state) => state.notify);
  const groups = useAppStore((state) => state.groups);
  const users = useAppStore((state) => state.users);

  const title = moduleTitles[module];

  // Find leader's group
  const leaderGroup = groups.find((g) => g.leaderId === user?.uid) ?? groups[0];
  const groupMembers = users.filter((u) => leaderGroup?.memberIds.includes(u.uid) ?? false);

  function handleNewAction() {
    if (module === 'pastoral' || module === 'oracion') {
      const el = document.querySelector('select') as HTMLSelectElement;
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    notify({
      title: 'Acción disponible',
      description: 'Registra contacto, asistencia u oraciones desde los paneles de esta sección.',
      tone: 'info',
    });
  }

  return (
    <div>
      <PageHeader
        action={module !== 'perfil' ? <Button icon={<Plus className="h-4 w-4" />} onClick={handleNewAction}>Nuevo</Button> : undefined}
        eyebrow="Liderazgo"
        title={title}
      />

      {module === 'mi-grupo' && (
        <LeaderGroupTab leaderGroup={leaderGroup} groupMembers={groupMembers} />
      )}

      {module === 'pastoral' && (
        <LeaderPastoralTab groupMembers={groupMembers} />
      )}

      {module === 'reuniones' && (
        <LeaderMeetingsTab leaderGroup={leaderGroup} groupMembers={groupMembers} />
      )}

      {module === 'oracion' && (
        <LeaderPrayerTab />
      )}

      {module === 'recursos' && (
        <LeaderResourcesTab />
      )}

      {module === 'reportes' && (
        <LeaderReportsTab />
      )}

      {module === 'perfil' && (
        <ProfileSettings />
      )}
    </div>
  );
}
