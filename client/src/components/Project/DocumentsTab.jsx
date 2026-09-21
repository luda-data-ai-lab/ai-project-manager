import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api, mutate } from '../../utils/api';
import { Badge, Button, Card, EmptyState, Field } from '../common';
import { inputClass } from '../../utils/styles';

const docTypeLabels = {
  spec: '기획서',
  requirement: '요구사항',
  design: '설계',
  devlog: '개발일지',
  readme: 'README',
  note: '노트',
};
const emptyDocument = {
  title: '',
  doc_type: 'note',
  source_location: '',
  content: '',
};

export default function DocumentsTab({ id }) {
  const [documents, setDocuments] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(emptyDocument);

  const load = async (nextId = selectedId) => {
    try {
      const list = await api(`/projects/${id}/documents`);
      setDocuments(list);
      const idToLoad = nextId || list[0]?.id;
      setSelectedId(idToLoad || null);
      if (idToLoad) setSelected(await api(`/documents/${idToLoad}`));
      else setSelected(null);
    } catch (error) {
      toast.error(error.message);
    }
  };
  useEffect(() => {
    load(null);
  }, [id]);

  const select = async (documentId) => {
    try {
      setSelectedId(documentId);
      setSelected(await api(`/documents/${documentId}`));
      setEditing(false);
    } catch (error) {
      toast.error(error.message);
    }
  };
  const startNew = () => {
    setSelectedId(null);
    setSelected(null);
    setDraft(emptyDocument);
    setEditing(true);
  };
  const startEdit = () => {
    setDraft({
      title: selected.title,
      doc_type: selected.doc_type,
      source_location: selected.source_location || '',
      content: selected.content || '',
    });
    setEditing(true);
  };
  const save = async (event) => {
    event.preventDefault();
    const result = await mutate(
      selectedId ? `/documents/${selectedId}` : `/projects/${id}/documents`,
      {
        method: selectedId ? 'PUT' : 'POST',
        body: JSON.stringify(draft),
      },
      selectedId ? '문서를 저장했습니다.' : '문서를 추가했습니다.',
    );
    if (result) {
      setEditing(false);
      await load(result.id);
    }
  };
  const remove = async () => {
    if (!selected || !confirm('문서를 삭제하시겠습니까?')) return;
    await mutate(`/documents/${selected.id}`, { method: 'DELETE' }, '삭제했습니다.');
    setEditing(false);
    load(null);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[18rem_1fr]">
      <Card className="h-fit p-3">
        <div className="mb-2 flex items-center justify-between px-2">
          <h2 className="font-semibold">문서</h2>
          <Button className="px-3 py-1.5 text-xs" onClick={startNew}>
            문서 추가
          </Button>
        </div>
        {documents.length ? (
          <div className="space-y-1">
            {documents.map((document) => (
              <button
                type="button"
                key={document.id}
                className={`w-full rounded-lg p-2 text-left ${selectedId === document.id ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
                onClick={() => select(document.id)}
              >
                <div className="truncate text-sm font-medium">{document.title}</div>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                  <span>{docTypeLabels[document.doc_type]}</span>
                  <span>v{document.version}</span>
                  <span>{format(new Date(document.updated_at), 'yyyy-MM-dd')}</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState>문서가 없습니다.</EmptyState>
        )}
      </Card>
      <Card className="min-h-[60vh]">
        {editing ? (
          <form className="space-y-3" onSubmit={save}>
            <Field label="제목">
              <input
                className={inputClass}
                required
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="문서 유형">
                <select
                  className={inputClass}
                  value={draft.doc_type}
                  onChange={(event) => setDraft({ ...draft, doc_type: event.target.value })}
                >
                  {Object.entries(docTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="출처 위치">
                <input
                  className={inputClass}
                  value={draft.source_location}
                  onChange={(event) => setDraft({ ...draft, source_location: event.target.value })}
                />
              </Field>
            </div>
            <Field label="내용">
              <textarea
                className={`${inputClass} min-h-[60vh] font-mono`}
                value={draft.content}
                onChange={(event) => setDraft({ ...draft, content: event.target.value })}
              />
            </Field>
            <div className="flex gap-2">
              <Button type="submit">저장</Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditing(false);
                  if (!selectedId) load(null);
                }}
              >
                취소
              </Button>
            </div>
          </form>
        ) : selected ? (
          <>
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">{selected.title}</h2>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                  <Badge label={docTypeLabels[selected.doc_type]} />
                  <span>v{selected.version}</span>
                  {selected.source_location && <span>{selected.source_location}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={startEdit}>
                  편집
                </Button>
                <button
                  type="button"
                  className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  onClick={remove}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
            <article className="prose prose-slate max-w-none">
              <Markdown remarkPlugins={[remarkGfm]}>{selected.content || ''}</Markdown>
            </article>
          </>
        ) : (
          <EmptyState>문서를 선택하거나 새로 추가하세요.</EmptyState>
        )}
      </Card>
    </div>
  );
}
