import { useEffect, useState } from 'react';
import { api } from '../api';
import { Modal } from '../components/Modal';
import { FileBrowser } from '../components/FileBrowser';
import type { Script } from '../types';

function dirname(p: string): string {
  const i = Math.max(p.lastIndexOf('\\'), p.lastIndexOf('/'));
  return i > 0 ? p.substring(0, i) : '';
}

const btnBase = 'cursor-pointer ml-auto sm:ml-2 px-2.5 py-1 text-[11px] rounded bg-stone-900 border border-stone-800 text-stone-100 tracking-wider hover:bg-stone-800 hover:text-stone-100 transition-colors disabled:opacity-40';
const btnPrimary = 'inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary border border-primary text-black text-sm font-medium cursor-pointer transition-all hover:bg-primary-hover hover:border-primary-hover disabled:opacity-50 disabled:cursor-not-allowed';
const btnDanger = 'cursor-pointer ml-auto sm:ml-2 px-2.5 py-1 text-[11px] rounded bg-red-900 border border-stone-800 hover:border-red-400 text-stone-100 tracking-wider hover:bg-red-800 hover:text-stone-100 transition-colors disabled:opacity-40';
const inputClass = 'w-full px-3 py-2 rounded-md border border-border bg-bg text-text text-sm font-sans outline-none transition-colors focus:border-primary';

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
    <div className="h-full sm:h-[100dvh] sm:flex-1 sm:min-h-0 relative overflow-hidden flex flex-col p-4 pb-4">
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 -z-10">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-orange-800 opacity-25 rounded-full blur-[175px] -translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-orange-800 opacity-15 rounded-full blur-[200px] translate-y-1/3" />
      </div>

      <div className="relative flex-1 flex flex-col bg-black/50 border border-white/10 rounded-2xl p-4 sm:p-6 shadow-2xl min-h-0 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex items-center gap-2 mr-auto">
            <h2 className="ml-2 sm:ml-4 text-xl sm:text-2xl font-bold bg-gradient-to-r from-stone-600 via-stone-400 to-stone-600 bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]">
              SCRIPTS
            </h2>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-stone-400 ml-2 sm:ml-0">
            <button
              onClick={() => setShowAdd(true)}
              className="cursor-pointer ml-auto sm:ml-2 px-2.5 py-1 text-[11px] rounded bg-stone-900 border border-stone-800 text-stone-400 tracking-wider hover:bg-stone-800 hover:text-stone-300 transition-colors disabled:opacity-40"
            >
              + Add Script
            </button>
          </div>
        </div>

        <div className="mt-4 border-t border-white/10" />

        <div className="mt-6 border border-stone-800 rounded-lg backdrop-blur-md bg-stone-900/30 overflow-y-auto custom-scrollbar">
        {scripts.length === 0 ? (

          <div className="text-center py-12 text-dim">
            <p className="mb-4">No scripts registered yet.</p>
            <button
              className={btnPrimary}
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
                    <th key={h} className="text-left px-4 py-3 uppercase text-[11px] tracking-wide transition-colors bg-stone-400 text-stone-700">{h}</th>
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
        </div>
      </div>

    

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
  const [pathValue, setPathValue] = useState(initial?.path ?? '');
  const [showBrowser, setShowBrowser] = useState(false);

  return (
    <>
      <form onSubmit={onSubmit}>
        <div className="mb-4">
          <label className="block text-xs font-semibold text-dim mb-1">Name</label>
          <input name="name" required defaultValue={initial?.name} placeholder="Cleanup Temp Files" className={inputClass} />
        </div>
        <div className="mb-4">
          <label className="block text-xs font-semibold text-dim mb-1">Script Path</label>
          <div className="flex gap-2">
            <input
              name="path"
              required
              value={pathValue}
              onChange={(e) => setPathValue(e.target.value)}
              placeholder="C:\Scripts\cleanup.ps1"
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => setShowBrowser(true)}
              className="cursor-pointer shrink-0 px-2.5 py-1 text-[11px] rounded bg-stone-900 border border-stone-800 text-stone-400 tracking-wider hover:bg-stone-800 hover:text-stone-300 transition-colors"
            >
              Browse
            </button>
          </div>
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
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary border border-primary text-black text-sm font-medium cursor-pointer transition-all hover:bg-primary-hover hover:border-primary-hover"
        >
          {initial ? 'Save' : 'Add Script'}
        </button>
      </form>

      {showBrowser && (
        <Modal title="Browse for Script" onClose={() => setShowBrowser(false)}>
          <FileBrowser
            initialPath={pathValue ? dirname(pathValue) : undefined}
            onSelect={(filePath) => {
              setPathValue(filePath);
              setShowBrowser(false);
            }}
            onClose={() => setShowBrowser(false)}
          />
        </Modal>
      )}
    </>
  );
}
