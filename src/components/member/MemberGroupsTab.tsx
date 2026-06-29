import { useAuth } from '../../hooks/useAuth';
import { useAppStore } from '../../store/appStore';
import { useToastStore } from '../../store/toastStore';
import { Card } from '../common/Card';
import { Button } from '../common/Button';

export function MemberGroupsTab() {
  const { user } = useAuth();
  const groups = useAppStore((state) => state.groups);
  const events = useAppStore((state) => state.events);
  const toggleRSVP = useAppStore((state) => state.toggleRSVP);
  const notify = useToastStore((state) => state.notify);

  return (
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
                  notify({
                    title: isRSVP ? 'Inscripcion cancelada' : 'Inscripcion registrada',
                    description: myEvent.title,
                    tone: isRSVP ? 'info' : 'success',
                  });
                }}
              >
                {isRSVP ? 'Inscrito (Cancelar)' : 'RSVP'}
              </Button>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
