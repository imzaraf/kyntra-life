"use client";

import { ResponsiveDialog, SheetFooter } from "@/components/shared/responsive-dialog";
import { useState } from "react";
import { FormField } from "@/components/shared/form-field";
import { TagInput } from "@/components/shared/tag-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

export type FieldValue = string | string[];
export type Values = Record<string, FieldValue>;

export type FieldDef =
  | {
      name: string;
      label: string;
      type: "text" | "url" | "date" | "number" | "textarea";
      required?: boolean;
      placeholder?: string;
      hint?: string;
    }
  | {
      name: string;
      label: string;
      type: "select";
      options: { value: string; label: string }[];
      required?: boolean;
    }
  | { name: string; label: string; type: "tags" }
  | { name: string; label: string; type: "weekdays" };

function validate(fields: FieldDef[], v: Values): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const f of fields) {
    const val = v[f.name];
    if (
      "required" in f &&
      f.required &&
      (!val || (typeof val === "string" && !val.trim()))
    )
      errors[f.name] = "This field is required.";
    if (f.type === "url" && typeof val === "string" && val.trim()) {
      try {
        const u = new URL(val.trim());
        if (!["http:", "https:"].includes(u.protocol)) throw new Error();
      } catch {
        errors[f.name] = "Enter a full link starting with http:// or https://";
      }
    }
    if (f.type === "number" && typeof val === "string" && val && !/^\d+$/.test(val))
      errors[f.name] = "Enter a whole number.";
  }
  return errors;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** One dialog for the simple Library record types — fields come from a small config. */
export function RecordDialog({
  open,
  onOpenChange,
  title,
  fields,
  initial,
  submitLabel = "Save",
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  fields: FieldDef[];
  initial: Values;
  submitLabel?: string;
  onSubmit: (values: Values) => void;
}) {
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title={title} size="md">
      <RecordForm
        fields={fields}
        initial={initial}
        submitLabel={submitLabel}
        onSubmit={onSubmit}
        onClose={() => onOpenChange(false)}
      />
    </ResponsiveDialog>
  );
}

function RecordForm({
  fields,
  initial,
  submitLabel,
  onSubmit,
  onClose,
}: {
  fields: FieldDef[];
  initial: Values;
  submitLabel: string;
  onSubmit: (values: Values) => void;
  onClose: () => void;
}) {
  const [values, setValues] = useState<Values>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (name: string, v: FieldValue) =>
    setValues((prev) => ({ ...prev, [name]: v }));

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const errs = validate(fields, values);
        setErrors(errs);
        if (Object.keys(errs).length) return;
        onSubmit(values);
        onClose();
      }}
    >
      {fields.map((f, i) => {
        const id = `rec-${f.name}`;
        const val = values[f.name];
        return (
          <FormField
            key={f.name}
            label={f.label}
            htmlFor={id}
            error={errors[f.name]}
            hint={"hint" in f ? f.hint : undefined}
          >
            {f.type === "textarea" ? (
              <Textarea
                id={id}
                rows={4}
                value={(val as string) ?? ""}
                onChange={(e) => set(f.name, e.target.value)}
                placeholder={f.placeholder}
              />
            ) : f.type === "select" ? (
              <NativeSelect
                id={id}
                value={(val as string) ?? ""}
                onChange={(e) => set(f.name, e.target.value)}
              >
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </NativeSelect>
            ) : f.type === "tags" ? (
              <TagInput
                id={id}
                value={(val as string[]) ?? []}
                onChange={(t) => set(f.name, t)}
              />
            ) : f.type === "weekdays" ? (
              <div className="flex flex-wrap gap-1.5" role="group" aria-label={f.label}>
                {DAYS.map((d, n) => {
                  const on = ((val as string[]) ?? []).includes(String(n));
                  return (
                    <Button
                      key={d}
                      type="button"
                      size="sm"
                      variant={on ? "default" : "outline"}
                      aria-pressed={on}
                      onClick={() =>
                        set(
                          f.name,
                          on
                            ? (val as string[]).filter((x) => x !== String(n))
                            : [...((val as string[]) ?? []), String(n)],
                        )
                      }
                    >
                      {d}
                    </Button>
                  );
                })}
              </div>
            ) : (
              <Input
                id={id}
                type={f.type === "number" ? "text" : f.type}
                inputMode={f.type === "number" ? "numeric" : undefined}
                autoFocus={i === 0}
                placeholder={f.placeholder}
                value={(val as string) ?? ""}
                onChange={(e) => set(f.name, e.target.value)}
                aria-invalid={!!errors[f.name]}
              />
            )}
          </FormField>
        );
      })}
      <SheetFooter>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">{submitLabel}</Button>
      </SheetFooter>
    </form>
  );
}
