import { useState, useEffect } from 'react';
import { useToastStore } from '../../store/toastStore';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Search, Play } from 'lucide-react';
import { BIBLE_BOOKS } from '../../constants/bible';

export function MemberBibleTab() {
  const notify = useToastStore((state) => state.notify);

  const [bibleSearchQuery, setBibleSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<keyof typeof BIBLE_BOOKS>('Mateo');
  const [selectedChapter, setSelectedChapter] = useState<string>('6');
  const [highlightedVerses, setHighlightedVerses] = useState<Record<string, string>>({});
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [selectedColor, setSelectedColor] = useState('');

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isAudioPlaying) {
      interval = setInterval(() => {
        setAudioProgress((p) => {
          if (p >= 100) {
            setIsAudioPlaying(false);
            return 0;
          }
          return p + 4;
        });
      }, 300);
    } else {
      setAudioProgress(0);
    }
    return () => clearInterval(interval);
  }, [isAudioPlaying]);

  function handlePlayAudio() {
    setIsAudioPlaying((prev) => !prev);
  }

  function handleVerseClick(verseNum: number) {
    const key = `${selectedBook}-${selectedChapter}-${verseNum}`;
    if (selectedColor) {
      setHighlightedVerses((prev) => {
        if (prev[key] === selectedColor) {
          const next = { ...prev };
          delete next[key];
          return next;
        }
        return { ...prev, [key]: selectedColor };
      });
    } else {
      notify({
        title: 'Elige un color',
        description: 'Selecciona un resaltador antes de marcar el versículo.',
        tone: 'warning',
      });
    }
  }

  const booksData = BIBLE_BOOKS as unknown as Record<string, Record<string, { num: number; text: string }[]>>;
  const currentVerses = booksData[selectedBook]?.[selectedChapter] || [];
  const filteredVerses = currentVerses.filter((verse) =>
    verse.text.toLowerCase().includes(bibleSearchQuery.toLowerCase())
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <Card
        action={
          <Button
            icon={<Search className="h-4 w-4" />}
            variant="outline"
            onClick={() =>
              notify({
                title: 'Busqueda aplicada',
                description: bibleSearchQuery || 'Mostrando todos los versiculos.',
                tone: 'info',
              })
            }
          >
            Buscar
          </Button>
        }
        eyebrow="RVR60"
        title={`${selectedBook} ${selectedChapter}`}
      >
        <div className="space-y-4 text-base leading-8 text-ink">
          {filteredVerses.map((verse) => {
            const key = `${selectedBook}-${selectedChapter}-${verse.num}`;
            const color = highlightedVerses[key];
            return (
              <div
                className="rounded-lg border border-slate-200 p-4 animate-fade-in cursor-pointer transition hover:bg-slate-100/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                key={verse.text}
                style={{ backgroundColor: color || undefined }}
                role="button"
                tabIndex={0}
                aria-label={`Versículo ${verse.num}: ${verse.text}. Presione enter o espacio para resaltar.`}
                onClick={() => handleVerseClick(verse.num)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleVerseClick(verse.num);
                  }
                }}
              >
                <span className="mr-2 font-extrabold text-primary">{verse.num}</span>
                {verse.text}
              </div>
            );
          })}
          {bibleSearchQuery && filteredVerses.length === 0 ? (
            <p className="text-center text-sm text-muted py-4">No se encontraron versículos coincidentes.</p>
          ) : null}
        </div>
      </Card>

      <Card eyebrow="Notas y plan" title="Herramientas">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-ink">Libro</span>
              <select
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-panel"
                value={selectedBook}
                onChange={(e) => {
                  const book = e.currentTarget.value as keyof typeof BIBLE_BOOKS;
                  setSelectedBook(book);
                  const chapters = Object.keys(BIBLE_BOOKS[book]);
                  setSelectedChapter(chapters[0]);
                }}
              >
                {Object.keys(BIBLE_BOOKS).map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-ink">Capítulo</span>
              <select
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-panel"
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(e.currentTarget.value)}
              >
                {Object.keys(BIBLE_BOOKS[selectedBook]).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>
          <Input
            label="Buscar texto"
            placeholder="Reino de Dios"
            value={bibleSearchQuery}
            onChange={(e) => setBibleSearchQuery(e.currentTarget.value)}
          />
          <div>
            <span className="mb-2 block text-sm font-semibold text-ink">Resaltador (Selecciona color y haz clic en versículo)</span>
            <div className="grid grid-cols-4 gap-2">
              {['#FDE68A', '#BFDBFE', '#BBF7D0', '#FBCFE8'].map((color) => (
                <button
                  aria-label={`Color ${color}`}
                  className={`h-10 rounded-lg border-2 ${selectedColor === color ? 'border-indigo-600 scale-105' : 'border-slate-200'} transition-all`}
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  style={{ backgroundColor: color }}
                  title={`Color ${color}`}
                  type="button"
                />
              ))}
            </div>
          </div>
          <Button
            className="w-full"
            icon={<Play className="h-4 w-4" />}
            variant={isAudioPlaying ? 'primary' : 'secondary'}
            onClick={handlePlayAudio}
          >
            {isAudioPlaying ? 'Pausar Audio' : 'Escuchar Audio'}
          </Button>
          {isAudioPlaying && (
            <div className="mt-4 rounded-lg bg-indigo-50 p-3 border border-indigo-100 flex items-center justify-between gap-3 animate-fade-in">
              <span className="text-xs font-bold text-indigo-600 animate-pulse flex items-center gap-1.5">
                <Play className="h-3 w-3 fill-current" />
                Reproduciendo audio ({audioProgress}%)
              </span>
              <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${audioProgress}%` }} />
              </div>
              <Button size="sm" variant="ghost" onClick={() => setIsAudioPlaying(false)} className="text-xs text-danger font-bold">Detener</Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
