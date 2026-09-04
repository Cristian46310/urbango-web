import { useMemo, useState } from "react";
import { DialogField } from "@/app/components/security/dialog-field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function TextField({
  id,
  label,
  value,
  onChange,
  disabled,
  type = "text",
  className,
  error,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  type?: string;
  className?: string;
  error?: string | null;
  placeholder?: string;
}) {
  return (
    <DialogField label={label} htmlFor={id}>
      <div className="space-y-1.5">
        <Input
          id={id}
          type={type}
          value={value}
          onChange={(e) => { onChange(e.target.value); }}
          disabled={disabled}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          className={cn("h-11 rounded-md border-input px-3", className)}
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </DialogField>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  disabled,
  placeholder,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <DialogField label={label}>
      <Select
        value={value || undefined}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger className="h-11 w-full">
          <SelectValue placeholder={placeholder ?? "Seleccionar"} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </DialogField>
  );
}

export function SearchableSelectField({
  label,
  value,
  onChange,
  disabled,
  placeholder = "Seleccionar",
  searchPlaceholder = "Buscar...",
  options,
  forceSearchable = false,
  allowClear = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  options: { value: string; label: string }[];
  forceSearchable?: boolean;
  allowClear?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? "";
  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es");
    if (!normalized) return options;
    return options.filter((option) =>
      option.label.toLocaleLowerCase("es").includes(normalized),
    );
  }, [options, query]);

  if (!forceSearchable && options.length <= 10) {
    return (
      <SelectField
        label={label}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        options={options}
      />
    );
  }

  return (
    <DialogField label={label}>
      <div
        className="relative"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setOpen(false);
            setQuery("");
          }
        }}
      >
        <Input
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          value={open ? query : selectedLabel}
          placeholder={open ? searchPlaceholder : placeholder}
          disabled={disabled}
          className={cn("h-11", allowClear && value && !open ? "pr-16" : undefined)}
          onFocus={() => {
            setQuery("");
            setOpen(true);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
        />
        {allowClear && value && !open ? (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            onMouseDown={(event) => { event.preventDefault(); }}
            onClick={() => { onChange(""); }}
          >
            Limpiar
          </button>
        ) : null}
        {open ? (
          <div
            role="listbox"
            className="absolute z-60 mt-1 max-h-52 w-full overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  className={cn(
                    "flex w-full rounded-sm px-2 py-2 text-left text-sm hover:bg-accent",
                    option.value === value && "bg-teal-50 text-teal-800",
                  )}
                  onClick={() => {
                    onChange(option.value);
                    setQuery("");
                    setOpen(false);
                  }}
                >
                  {option.label}
                </button>
              ))
            ) : (
              <p className="px-2 py-3 text-center text-sm text-muted-foreground">
                Sin resultados
              </p>
            )}
          </div>
        ) : null}
      </div>
    </DialogField>
  );
}
