import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Pencil, Power, PowerOff, BookOpen, RefreshCw } from "lucide-react";
import { api } from "../../../utils/axios.js";
import { formatLastFetched, listenDashboardRefresh } from "../../../utils/refreshEvents.js";
import { getSocket } from "../../../utils/useSocket.js";
import {
  Badge,
  Card,
  EmptyState,
  Input,
  Modal,
  Select,
  Spinner,
  Textarea,
} from "../../../components/common/index.jsx";
import { emptyProgram, defaultTasks } from "./taskDefaults.js";
import toast from "react-hot-toast";

const POLL_INTERVAL = 5000;

const submissionTypes = [
  { value: "link", label: "Live URL" },
  { value: "github", label: "GitHub repo" },
  { value: "text", label: "Text answer" },
  { value: "file", label: "File URL" },
];

function ProgramForm({ form, setForm, onChangeTask }) {
  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid sm:grid-cols-2 gap-4">
        <Input
          label="Program title *"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Full Stack Development (MERN)"
        />
        <Input
          label="Domain / track *"
          value={form.domain}
          onChange={(e) => setForm((f) => ({ ...f, domain: e.target.value }))}
          placeholder="MERN Stack"
        />
        <Input
          label="Duration"
          value={form.duration}
          onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
          placeholder="2 Months"
        />
        <Input
          label="Stipend"
          value={form.stipend}
          onChange={(e) => setForm((f) => ({ ...f, stipend: e.target.value }))}
        />
      </div>
      <Textarea
        label="Description"
        value={form.description}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        rows={3}
      />
      <Input
        label="Skills (comma-separated)"
        value={form.skills}
        onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value }))}
        placeholder="React, Node.js, MongoDB"
      />
      <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
          className="rounded border-border text-primary focus:ring-primary"
        />
        Program is active (visible to students)
      </label>

      <div className="border-t border-border pt-4">
        <h3 className="font-semibold text-ink mb-1">5 program tasks</h3>
        <p className="text-xs text-text-secondary mb-4">
          Each internship must have exactly 5 tasks. Students submit one project per task.
        </p>
        <div className="space-y-4">
          {form.tasks.map((task, idx) => (
            <div key={task.taskNumber} className="rounded-xl border border-border p-4 bg-surface/50">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-lg bg-primary text-white text-xs font-bold flex items-center justify-center">
                  {task.taskNumber}
                </span>
                <span className="font-semibold text-ink">Task {task.taskNumber}</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Input
                  label="Title"
                  value={task.title}
                  onChange={(e) => onChangeTask(idx, "title", e.target.value)}
                />
                <Select
                  label="Submission type"
                  value={task.submissionType}
                  onChange={(e) => onChangeTask(idx, "submissionType", e.target.value)}
                  options={submissionTypes}
                />
                <Input
                  label="Due in (days)"
                  type="number"
                  min={1}
                  value={task.dueInDays}
                  onChange={(e) => onChangeTask(idx, "dueInDays", Number(e.target.value))}
                />
                <Input
                  label="Points"
                  type="number"
                  min={1}
                  max={100}
                  value={task.points}
                  onChange={(e) => onChangeTask(idx, "points", Number(e.target.value))}
                />
              </div>
              <Textarea
                className="mt-3"
                label="Short description"
                value={task.description}
                onChange={(e) => onChangeTask(idx, "description", e.target.value)}
                rows={2}
              />
              <Textarea
                className="mt-3"
                label="Instructions for students"
                value={task.instructions}
                onChange={(e) => onChangeTask(idx, "instructions", e.target.value)}
                rows={3}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminPrograms() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyProgram());
  const [saving, setSaving] = useState(false);
  const [lastFetched, setLastFetched] = useState(null);
  const intervalRef = useRef(null);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get("/internships/admin/all")
      .then((res) => {
        setItems(res.data.items || []);
        setLastFetched(new Date().toISOString());
      })
      .catch(() => toast.error("Could not load programs"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, POLL_INTERVAL);
    const socket = getSocket();
    const handlers = {};
    for (const evt of ["internship_assigned", "internship_completed", "user_registered"]) {
      const handler = (p) => { console.log("[AdminPrograms] Socket:", evt, p); load(); };
      socket.on(evt, handler);
      handlers[evt] = handler;
    }
    const unlisten = listenDashboardRefresh(() => load());
    return () => {
      clearInterval(intervalRef.current);
      for (const [evt, h] of Object.entries(handlers)) socket.off(evt, h);
      unlisten();
    };
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyProgram());
    setModalOpen(true);
  };

  const openEdit = async (id) => {
    try {
      const res = await api.get(`/internships/admin/${id}`);
      const item = res.data.item;
      setEditingId(id);
      setForm({
        title: item.title || "",
        domain: item.domain || "",
        duration: item.duration || "2 Months",
        stipend: item.stipend || "Unpaid",
        description: item.description || "",
        skills: (item.skills || []).join(", "),
        isActive: item.isActive !== false,
        tasks:
          item.tasks?.length === 5
            ? item.tasks.map((t) => ({
                taskNumber: t.taskNumber,
                title: t.title,
                description: t.description || "",
                instructions: t.instructions || "",
                submissionType: t.submissionType || "link",
                dueInDays: t.dueInDays ?? 7,
                points: t.points ?? 20,
              }))
            : defaultTasks(),
      });
      setModalOpen(true);
    } catch {
      toast.error("Could not load program details");
    }
  };

  const onChangeTask = (idx, field, value) => {
    setForm((f) => {
      const tasks = [...f.tasks];
      tasks[idx] = { ...tasks[idx], [field]: value };
      return { ...f, tasks };
    });
  };

  const buildPayload = () => ({
    title: form.title.trim(),
    domain: form.domain.trim(),
    duration: form.duration.trim(),
    stipend: form.stipend.trim(),
    description: form.description.trim(),
    skills: form.skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    isActive: form.isActive,
    tasks: form.tasks,
  });

  const handleSave = async () => {
    if (!form.title.trim() || !form.domain.trim()) {
      toast.error("Title and domain are required");
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      if (editingId) {
        await api.put(`/internships/${editingId}`, payload);
        toast.success("Program and tasks updated");
      } else {
        await api.post("/internships", payload);
        toast.success("Program created with 5 tasks");
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save program");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item) => {
    try {
      if (item.isActive) {
        await api.delete(`/internships/${item._id}`);
        toast.success("Program deactivated");
      } else {
        await api.put(`/internships/${item._id}`, { isActive: true });
        toast.success("Program reactivated");
      }
      load();
    } catch {
      toast.error("Could not update program status");
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-text-secondary flex items-center gap-1.5">
        <RefreshCw size={12} />
        Updated: <span className="font-mono font-medium text-ink">{formatLastFetched(lastFetched)}</span>
      </p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-secondary">
          {items.length} program{items.length !== 1 ? "s" : ""} · each needs 5 tasks
        </p>
        <button type="button" className="btn-primary" onClick={openCreate}>
          <Plus size={16} /> Add program
        </button>
      </div>

      {loading ? (
        <Card className="flex justify-center py-16">
          <Spinner />
        </Card>
      ) : items.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No programs yet"
          description="Create your first internship program with five tasks."
          action={
            <button type="button" className="btn-primary" onClick={openCreate}>
              Add program
            </button>
          }
        />
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <Card key={item._id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-ink">{item.title}</h3>
                    <Badge tone={item.isActive ? "success" : "default"}>
                      {item.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-sm text-text-secondary mt-1">
                    {item.domain} · {item.duration} · {item.stipend}
                  </p>
                  <p className="text-xs text-muted mt-2">
                    {item.taskCount ?? 0}/5 tasks · {item.applicationCount ?? 0} applications
                  </p>
                  {item.description && (
                    <p className="text-sm text-text-secondary mt-2 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  {item.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {item.skills.slice(0, 6).map((s) => (
                        <span key={s} className="chip bg-primary-light text-primary text-[10px]">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <button type="button" className="btn-secondary text-sm" onClick={() => openEdit(item._id)}>
                    <Pencil size={14} /> Edit & tasks
                  </button>
                  <button
                    type="button"
                    className="btn-ghost text-sm"
                    onClick={() => toggleActive(item)}
                  >
                    {item.isActive ? (
                      <>
                        <PowerOff size={14} /> Deactivate
                      </>
                    ) : (
                      <>
                        <Power size={14} /> Activate
                      </>
                    )}
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        size="2xl"
      >
        <div className="p-6 pt-8 max-h-[90vh] overflow-y-auto">
          <h2 className="text-lg font-display font-bold text-ink pr-8 mb-4">
            {editingId ? "Edit program & tasks" : "New internship program"}
          </h2>
          <ProgramForm form={form} setForm={setForm} onChangeTask={onChangeTask} />
          <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-border">
            <button type="button" className="btn-primary" disabled={saving} onClick={handleSave}>
              {saving ? "Saving…" : editingId ? "Save changes" : "Create program"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={saving}
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
