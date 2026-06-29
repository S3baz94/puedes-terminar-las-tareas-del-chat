import { PageHeader } from '../../components/layout/PageHeader';
import { MemberBibleTab } from '../../components/member/MemberBibleTab';
import { MemberDevotionalTab } from '../../components/member/MemberDevotionalTab';
import { MemberPrayerTab } from '../../components/member/MemberPrayerTab';
import { MemberGroupsTab } from '../../components/member/MemberGroupsTab';
import { MemberLiveTab } from '../../components/member/MemberLiveTab';
import { MemberDonationTab } from '../../components/member/MemberDonationTab';
import { ProfileSettings } from '../../components/shared/ProfileSettings';

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
  return (
    <div>
      <PageHeader eyebrow="Miembro" title={moduleTitles[module]} />

      {module === 'biblia' && <MemberBibleTab />}

      {module === 'devocional' && <MemberDevotionalTab />}

      {module === 'oracion' && <MemberPrayerTab />}

      {module === 'grupos' && <MemberGroupsTab />}

      {module === 'en-vivo' && <MemberLiveTab />}

      {module === 'dar' && <MemberDonationTab />}

      {module === 'perfil' && <ProfileSettings />}
    </div>
  );
}
