import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../../store/appStore';
import { useToastStore } from '../../store/toastStore';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Heart, Send } from 'lucide-react';

export function MemberDevotionalTab() {
  const content = useAppStore((state) => state.content);
  const devotionalNotes = useAppStore((state) => state.devotionalNotes);
  const fetchDevotionalNote = useAppStore((state) => state.fetchDevotionalNote);
  const saveDevotionalNote = useAppStore((state) => state.saveDevotionalNote);
  const notify = useToastStore((state) => state.notify);

  const devotionals = useMemo(() => content.filter((item) => item.type === 'devotional'), [content]);
  const [selectedDevoId, setSelectedDevoId] = useState(devotionals[0]?.id || '');
  const selectedDevotional = devotionals.find((d) => d.id === selectedDevoId) || devotionals[0];

  const [devoNoteText, setDevoNoteText] = useState('');
  const [saveNoteStatus, setSaveNoteStatus] = useState<string | null>(null);
  const [favoriteDevotionals, setFavoriteDevotionals] = useState<Record<string, boolean>>({});

  // Sync devotional note when selection or notes store updates
  useEffect(() => {
    if (selectedDevotional) {
      fetchDevotionalNote(selectedDevotional.id);
    }
  }, [selectedDevotional?.id, fetchDevotionalNote]);

  useEffect(() => {
    if (selectedDevotional) {
      setDevoNoteText(devotionalNotes[selectedDevotional.id] || '');
    }
  }, [selectedDevotional?.id, devotionalNotes]);

  function handleFavorite() {
    if (!selectedDevotional) return;
    setFavoriteDevotionals((prev) => {
      const next = !prev[selectedDevotional.id];
      notify({
        title: next ? 'Guardado en favoritos' : 'Quitado de favoritos',
        description: selectedDevotional.title,
        tone: next ? 'success' : 'info',
      });
      return { ...prev, [selectedDevotional.id]: next };
    });
  }

  async function handleShare() {
    if (!selectedDevotional) return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      notify({ title: 'Enlace copiado', description: 'Ya puedes compartir este devocional.', tone: 'success' });
    } catch (err) {
      notify({ title: 'No se pudo copiar', description: 'Copia el enlace desde la barra del navegador.', tone: 'warning' });
    }
  }

  async function handleSaveDevoNote() {
    if (!selectedDevotional) return;
    setSaveNoteStatus('Guardando...');
    try {
      await saveDevotionalNote(selectedDevotional.id, devoNoteText);
      setSaveNoteStatus('¡Reflexión guardada con éxito!');
      setTimeout(() => setSaveNoteStatus(null), 3000);
    } catch (err) {
      setSaveNoteStatus('Error al guardar.');
      setTimeout(() => setSaveNoteStatus(null), 3000);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
      <Card eyebrow={selectedDevotional?.bibleReference} title={selectedDevotional?.title}>
        <p className="text-xl font-semibold leading-9 text-ink">{selectedDevotional?.body}</p>
        <p className="mt-4 text-sm leading-6 text-muted">{selectedDevotional?.excerpt}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button
            icon={<Heart className={`h-4 w-4 ${selectedDevotional && favoriteDevotionals[selectedDevotional.id] ? 'fill-current text-red-500' : ''}`} />}
            variant={selectedDevotional && favoriteDevotionals[selectedDevotional.id] ? 'primary' : 'outline'}
            onClick={handleFavorite}
          >
            {selectedDevotional && favoriteDevotionals[selectedDevotional.id] ? 'Favorito' : 'Marcar Favorito'}
          </Button>
          <Button icon={<Send className="h-4 w-4" />} variant="secondary" onClick={handleShare}>
            Compartir
          </Button>
        </div>
      </Card>

      <div className="space-y-6">
        <Card eyebrow="Mi Crecimiento" title="Diario de Reflexión">
          <div className="space-y-4">
            <p className="text-xs text-muted">Anota tus reflexiones y lo que Dios te ha hablado hoy a través de este devocional.</p>
            <textarea
              className="min-h-36 w-full rounded-lg border border-slate-200 p-3 text-sm shadow-panel focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Escribe tus notas aquí..."
              value={devoNoteText}
              onChange={(e) => setDevoNoteText(e.target.value)}
            />
            {saveNoteStatus && <p className="text-sm font-semibold text-green-600 animate-fade-in">{saveNoteStatus}</p>}
            <Button className="w-full" onClick={handleSaveDevoNote}>Guardar en mi Diario</Button>
          </div>
        </Card>

        <Card eyebrow="Archivo" title="Otros Devocionales">
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {devotionals.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedDevoId(item.id)}
                type="button"
                className={`w-full text-left rounded-lg border p-4 transition ${
                  selectedDevotional?.id === item.id ? 'border-primary bg-indigo-50/40' : 'border-slate-200 hover:border-primary'
                }`}
              >
                <p className="font-bold text-ink">{item.title}</p>
                <p className="mt-1 text-xs text-muted">{item.bibleReference}</p>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
