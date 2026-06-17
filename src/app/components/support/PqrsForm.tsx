import { useRef, useState } from "react";
import { PlusCircle, X } from "lucide-react";

import type { CreatePqrsImageRequest, CreatePqrsRequest } from "@/core/types/pqrs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PqrsFormProps {
  creating: boolean;
  userId: string;
  userEmail: string;
  onSubmit: (payload: CreatePqrsRequest) => Promise<unknown>;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function PqrsForm({ creating, userId, userEmail, onSubmit }: PqrsFormProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"petition" | "complaint" | "claim" | "suggestion">("complaint");
  const [category, setCategory] = useState<"driver" | "bus" | "route" | "card" | "other">("other");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<CreatePqrsImageRequest[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (images.length + files.length > 3) {
      return;
    }
    const newImages: CreatePqrsImageRequest[] = [];
    const newFiles: File[] = [];
    for (const file of files) {
      const content_base64 = await readFileAsBase64(file);
      newImages.push({ filename: file.name, mime_type: file.type, content_base64 });
      newFiles.push(file);
    }
    setImages((prev) => [...prev, ...newImages]);
    setImageFiles((prev) => [...prev, ...newFiles]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setImageFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await onSubmit({
      type,
      category,
      description,
      user_id: userId,
      user_email: userEmail,
      images: images.length > 0 ? images : undefined,
    });
    if (result) {
      setOpen(false);
      setDescription("");
      setImages([]);
      setImageFiles([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm">
          <PlusCircle className="mr-2 size-4" />
          Nueva PQRS
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Crear PQRS</DialogTitle>
          <DialogDescription>
            Registra tu petición, queja, reclamo o sugerencia.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v) => { setType(v as typeof type); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="petition">Petición</SelectItem>
                <SelectItem value="complaint">Queja</SelectItem>
                <SelectItem value="claim">Reclamo</SelectItem>
                <SelectItem value="suggestion">Sugerencia</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Categoría</Label>
            <Select value={category} onValueChange={(v) => { setCategory(v as typeof category); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="driver">Conductor</SelectItem>
                <SelectItem value="bus">Bus</SelectItem>
                <SelectItem value="route">Ruta</SelectItem>
                <SelectItem value="card">Tarjeta</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea
              value={description}
              onChange={(e) => { setDescription(e.target.value); }}
              placeholder="Describe tu situación..."
              maxLength={500}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Imágenes adjuntas (máx. 3)</Label>
            {imageFiles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {imageFiles.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1 rounded-md border bg-muted px-2 py-1 text-xs"
                  >
                    <span className="max-w-[120px] truncate">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => { removeImage(i); }}
                      className="ml-1 text-muted-foreground hover:text-destructive"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {images.length < 3 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => { fileRef.current?.click(); }}
              >
                Adjuntar imagen
              </Button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => { void handleFileChange(e); }}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setOpen(false); }}>
              Cancelar
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? "Enviando..." : "Crear PQRS"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
