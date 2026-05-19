import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { PageShell } from "@/app/components/security/page-shell";
import { DialogField } from "@/app/components/security/dialog-field";
import { useIncident } from "@/hooks/business";
import type { IncidentStatus } from "@/core/domain/entities/business";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STATUS_OPTIONS: IncidentStatus[] = ["reported", "in_review", "closed"];

export default function IncidentDetailPage() {
  const { incidentId = "" } = useParams();
  const navigate = useNavigate();
  const { comments, loading, error, loadComments, addComment, changeStatus } = useIncident();
  const [commentText, setCommentText] = useState("");
  const [status, setStatus] = useState<IncidentStatus>("reported");

  useEffect(() => {
    if (!incidentId) return;
    void loadComments(incidentId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidentId]);

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    await addComment(incidentId, { text: commentText.trim() });
    setCommentText("");
  };

  const handleStatusChange = async () => {
    await changeStatus(incidentId, status);
  };

  return (
    <PageShell
      title="Gestión de incidente"
      description={`ID: ${incidentId}`}
    >
      <div className="mb-4">
        <Button type="button" variant="outline" onClick={() => { void navigate("/app/business/incidents"); }}>
          Volver
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cambiar estado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={status} onValueChange={(v) => { setStatus(v as IncidentStatus); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" onClick={() => void handleStatusChange()} disabled={loading}>
              Actualizar estado
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comentarios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin comentarios.</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="rounded-md border p-3 text-sm">
                    <p className="font-medium">{c.authorName ?? "Usuario"}</p>
                    <p>{c.text}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(c.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
            <DialogField label="Nuevo comentario" htmlFor="comment">
              <Textarea
                id="comment"
                value={commentText}
                onChange={(e) => { setCommentText(e.target.value); }}
                rows={3}
              />
            </DialogField>
            <Button type="button" onClick={() => void handleAddComment()} disabled={loading}>
              Agregar comentario
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
