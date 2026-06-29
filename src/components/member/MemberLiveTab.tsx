import { useAppStore } from '../../store/appStore';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { StatusPill } from '../common/StatusPill';
import { PlayCircle } from 'lucide-react';

export function MemberLiveTab() {
  const liveStream = useAppStore((state) => state.liveStream);
  const content = useAppStore((state) => state.content);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
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
  );
}
