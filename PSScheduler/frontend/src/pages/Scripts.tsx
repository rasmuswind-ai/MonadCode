import { useEffect, useState } from 'react';
import { api } from '../api';
import { Modal } from '../components/Modal';
import type { Script } from '../types';

const btnBase = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-surface2 text-text text-sm font-medium cursor-pointer transition-all hover:border-primary hover:text-primary';
const btnDanger = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-danger text-danger text-sm font-medium cursor-pointer transition-all hover:bg-danger hover:text-white';

export function Scripts() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editScript, setEditScript] = useState<Script | null>(null);
  const [viewContent, setViewContent] = useState<{ name: string; content: string } | null>(null);
  const [error, setError] = useState('');

  const load = () => { api.getScripts().then(setScripts); };
  useEffect(load, []);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const form = new FormData(e.currentTarget);
    try {
      await api.createScript({
        name: form.get('name') as string,
        path: form.get('path') as string,
        description: form.get('description') as string,
        timeoutSeconds: parseInt(form.get('timeoutSeconds') as string) || 300,
      });
      setShowAdd(false);
      load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editScript) return;
    setError('');
    const form = new FormData(e.currentTarget);
    try {
      await api.updateScript(editScript.id, {
        name: form.get('name') as string,
        path: form.get('path') as string,
        description: form.get('description') as string,
        timeoutSeconds: parseInt(form.get('timeoutSeconds') as string) || 300,
      });
      setEditScript(null);
      load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete script "${name}" and all its schedules?`)) return;
    await api.deleteScript(id);
    load();
  };

  const handleRun = async (id: string) => {
    await api.runScript(id);
    alert('Script execution started. Check History for results.');
  };

  const handleView = async (script: Script) => {
    try {
      const { content } = await api.getScriptContent(script.id);
      setViewContent({ name: script.name, content });
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <h2 className="text-xl font-semibold flex-1 mb-0">Scripts</h2>
        <button
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary border border-primary text-white text-sm font-medium cursor-pointer transition-all hover:bg-primary-hover hover:border-primary-hover"
          onClick={() => { setError(''); setShowAdd(true); }}
        >
          + Add Script
        </button>
      </div>

      <div className="bg-surface border border-border rounded-[10px] overflow-hidden">
        {scripts.length === 0 ? (
          <div className="text-center py-12 text-dim">
            <p className="mb-4">No scripts registered yet.</p>
            <button
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary border border-primary text-white text-sm font-medium cursor-pointer transition-all hover:bg-primary-hover"
              onClick={() => setShowAdd(true)}
            >
              Add your first script
            </button>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Name', 'Path', 'Timeout', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-dim bg-surface2 border-b border-border">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scripts.map(s => (
                <tr key={s.id} className="hover:bg-primary/[0.04]">
                  <td className="px-4 py-3 text-sm border-b border-border">
                    <strong>{s.name}</strong>
                    {s.description && <div className="text-dim text-xs mt-0.5">{s.description}</div>}
                  </td>
                  <td className="px-4 py-3 text-sm border-b border-border font-mono text-xs text-dim">{s.path}</td>
                  <td className="px-4 py-3 text-sm border-b border-border text-dim">{s.timeoutSeconds}s</td>
                  <td className="px-4 py-3 text-sm border-b border-border">
                    <div className="flex gap-1.5">
                      <button className={btnBase} onClick={() => handleRun(s.id)}>Run</button>
                      <button className={btnBase} onClick={() => handleView(s)}>View</button>
                      <button className={btnBase} onClick={() => { setError(''); setEditScript(s); }}>Edit</button>
                      <button className={btnDanger} onClick={() => handleDelete(s.id, s.name)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && (
        <Modal title="Add Script" onClose={() => setShowAdd(false)}>
          <ScriptForm onSubmit={handleAdd} error={error} />
        </Modal>
      )}

      {editScript && (
        <Modal title="Edit Script" onClose={() => setEditScript(null)}>
          <ScriptForm onSubmit={handleEdit} error={error} initial={editScript} />
        </Modal>
      )}

      {viewContent && (
        <Modal title={viewContent.name} onClose={() => setViewContent(null)}>
          <pre className="bg-bg border border-border rounded-md p-3 font-mono text-xs whitespace-pre-wrap break-all max-h-[400px] overflow-y-auto text-dim">
            {viewContent.content}
          </pre>
        </Modal>
      )}
    </>
  );
}

function ScriptForm({
  onSubmit,
  error,
  initial,
}: {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  error: string;
  initial?: Script;
}) {
  const inputClass = 'w-full px-3 py-2 rounded-md border border-border bg-bg text-text text-sm font-sans outline-none transition-colors focus:border-primary';

  return (
    <form onSubmit={onSubmit}>
      <div className="mb-4">
        <label className="block text-xs font-semibold text-dim mb-1">Name</label>
        <input name="name" required defaultValue={initial?.name} placeholder="Cleanup Temp Files" className={inputClass} />
      </div>
      <div className="mb-4">
        <label className="block text-xs font-semibold text-dim mb-1">Script Path</label>
        <input name="path" required defaultValue={initial?.path} placeholder="C:\Scripts\cleanup.ps1" className={inputClass} />
        <div className="text-xs text-dim mt-1">Full path to a .ps1 file on this machine</div>
      </div>
      <div className="mb-4">
        <label className="block text-xs font-semibold text-dim mb-1">Description</label>
        <input name="description" defaultValue={initial?.description} placeholder="Optional description" className={inputClass} />
      </div>
      <div className="mb-4">
        <label className="block text-xs font-semibold text-dim mb-1">Timeout (seconds)</label>
        <input name="timeoutSeconds" type="number" defaultValue={initial?.timeoutSeconds ?? 300} min={1} className={inputClass} />
      </div>
      {error && <div className="text-danger text-sm mb-3">{error}</div>}
      <button
        type="submit"
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary border border-primary text-white text-sm font-medium cursor-pointer transition-all hover:bg-primary-hover hover:border-primary-hover"
      >
        {initial ? 'Save' : 'Add Script'}
      </button>
    </form>
  );
}
