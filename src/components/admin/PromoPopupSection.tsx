import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Trash2, EyeOff, Eye, Loader2, ExternalLink } from "lucide-react";

export function PromoPopupSection() {
  const [popups, setPopups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [edit, setEdit] = useState<any | null>(null);
  const { user } = useAuth();

  const fetch = async () => {
    const { data } = await supabase.from("promotional_popups" as any).select("*").order("created_at", { ascending: false });
    if (data) setPopups(data);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const form = e.currentTarget as HTMLFormElement;
    const fd = new FormData(form);
    const payload: Record<string, any> = {
      title: fd.get("title") || "",
      description: fd.get("description") || "",
      link_url: fd.get("link_url") || null,
      link_label: fd.get("link_label") || "Learn More",
    };

    const urlInput = (fd.get("image_url") as string)?.trim();
    const file = fd.get("image") as File;

    if (file?.size) {
      const ext = file.name.split(".").pop();
      const path = `${user?.id ?? "admin"}/popups/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("payment-screenshots").upload(path, file);
      if (uploadError) { toast.error("Image upload failed: " + uploadError.message); setSaving(false); return; }
      const { data: { publicUrl } } = supabase.storage.from("payment-screenshots").getPublicUrl(path);
      payload.image_url = publicUrl;
    } else if (urlInput) {
      payload.image_url = urlInput;
    } else if (edit?.image_url) {
      payload.image_url = edit.image_url;
    } else {
      toast.error("Please provide a popup image"); setSaving(false); return;
    }

    if (edit) {
      const { error } = await supabase.from("promotional_popups" as any).update(payload).eq("id", edit.id);
      if (error) { toast.error("Update failed: " + error.message); setSaving(false); return; }
      toast.success("Popup updated");
    } else {
      payload.is_active = false;
      const { error } = await supabase.from("promotional_popups" as any).insert(payload);
      if (error) { toast.error("Create failed: " + error.message); setSaving(false); return; }
      toast.success("Popup created");
    }

    setSaving(false);
    setEdit(null);
    fetch();
  };

  const toggleActive = async (popup: any) => {
    if (popup.is_active) {
      await supabase.from("promotional_popups" as any).update({ is_active: false }).eq("id", popup.id);
    } else {
      await supabase.from("promotional_popups" as any).update({ is_active: false }).neq("id", "none"); // deactivate all
      await supabase.from("promotional_popups" as any).update({ is_active: true }).eq("id", popup.id);
    }
    toast.success(popup.is_active ? "Popup deactivated" : "Popup activated");
    fetch();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this popup?")) return;
    await supabase.from("promotional_popups" as any).delete().eq("id", id);
    toast.success("Popup deleted");
    fetch();
  };

  if (loading) return <div className="flex items-center justify-center p-12"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{edit ? "Edit Popup" : "New Popup"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="space-y-4">
            <div>
              <Label>Upload Image</Label>
              <Input name="image" type="file" accept="image/*" className="mt-1" />
            </div>
            <div>
              <Label>Or Image URL</Label>
              <Input name="image_url" defaultValue={edit?.image_url ?? ""} placeholder="https://..." className="mt-1" />
              {edit?.image_url && <p className="mt-1 text-xs text-muted-foreground">Leave both blank to keep current image</p>}
            </div>
            <div>
              <Label>Title</Label>
              <Input name="title" defaultValue={edit?.title ?? ""} placeholder="Summer Sale!" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea name="description" defaultValue={edit?.description ?? ""} placeholder="Limited time offer…" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Link URL</Label>
                <Input name="link_url" defaultValue={edit?.link_url ?? ""} placeholder="https://…" />
              </div>
              <div>
                <Label>Link Label</Label>
                <Input name="link_label" defaultValue={edit?.link_label ?? "Learn More"} />
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={saving} className="brand-gradient text-white border-0 rounded-xl">
                {saving ? <Loader2 className="size-4 animate-spin" /> : edit ? "Update" : "Create"} Popup
              </Button>
              {edit && <Button type="button" variant="outline" className="rounded-xl" onClick={() => setEdit(null)}>Cancel</Button>}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {popups.map((p) => (
          <Card key={p.id} className={`border ${p.is_active ? "border-emerald-400/50 ring-1 ring-emerald-400/20" : "border-border/50"} overflow-hidden`}>
            {p.image_url && (
              <div className="relative aspect-[16/6] bg-muted">
                <img src={p.image_url} alt="" className="size-full object-cover" />
              </div>
            )}
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-semibold text-sm truncate">{p.title || "Untitled"}</h4>
                <Badge variant={p.is_active ? "default" : "secondary"} className="shrink-0 text-[10px] px-2">
                  {p.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              {p.description && <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>}
              {p.link_url && (
                <a href={p.link_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-[#07284a] dark:text-blue-400 hover:underline">
                  <ExternalLink className="size-3" />{p.link_label || "Learn More"}
                </a>
              )}
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg" onClick={() => setEdit(p)}>
                  Edit
                </Button>
                <Button size="sm" variant={p.is_active ? "secondary" : "default"} className="h-8 text-xs rounded-lg" onClick={() => toggleActive(p)}>
                  {p.is_active ? <><EyeOff className="size-3 mr-1" />Deactivate</> : <><Eye className="size-3 mr-1" />Activate</>}
                </Button>
                <Button size="sm" variant="destructive" className="h-8 text-xs rounded-lg" onClick={() => remove(p.id)}>
                  <Trash2 className="size-3 mr-1" />Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {popups.length === 0 && <p className="col-span-2 text-center text-sm text-muted-foreground py-8">No popups yet.</p>}
      </div>
    </div>
  );
}
