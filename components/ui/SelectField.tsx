"use client";

import { useI18n } from "@/components/preferences/PreferencesProvider";
import { Autocomplete, FieldError, Label, ListBox, SearchField, Select } from "@heroui/react";
import { useCallback, useState, type ReactNode } from "react";
import { normalizeCatalogSearch } from "@/lib/catalog";

export type SelectOption = { value: string; label: string; disabled?: boolean; icon?: ReactNode; searchText?: string };
type Props = {
  label: string;
  value: string;
  options: SelectOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  name?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  hideLabel?: boolean;
  searchable?: boolean;
  allowCustomValue?: boolean;
};

/** Shared HeroUI form selection, with optional searchable options and custom model names. */
export function SelectField({ label, value, options, onValueChange, placeholder = "Selecionar", name, id, required, disabled, className = "", triggerClassName = "", hideLabel = false, searchable = false, allowCustomValue = false }: Props) {
 const { t } = useI18n();

  const [portalContainer, setPortalContainer] = useState<Element | undefined>();
  const [query, setQuery] = useState("");
  const attachRoot = useCallback((element: HTMLDivElement | null) => {
    if (element) setPortalContainer(element.closest('dialog, [role="dialog"], .preferences-popover') ?? undefined);
  }, []);
  const custom = query.trim();
  const items = allowCustomValue && custom && !options.some(option => normalizeCatalogSearch(option.value) === normalizeCatalogSearch(custom))
    ? [...options, { value: custom, label: `Usar “${custom}”`, searchText: custom }]
    : options;
  const list = <ListBox className="mind-select-list" renderEmptyState={() => <p className="mind-select-empty">{t("Nenhuma opção encontrada.")}</p>}>
    {items.map(option => <ListBox.Item key={option.value || "__empty__"} id={option.value} textValue={option.searchText || t(option.label)} isDisabled={option.disabled} className="mind-select-option">
      <span className="mind-select-option-content">{option.icon}<span>{t(option.label)}</span></span><ListBox.ItemIndicator />
    </ListBox.Item>)}
  </ListBox>;
  const props = {
    className: `mind-select ${className}`, fullWidth: true, variant: "secondary" as const,
    selectedKey: value || null, onSelectionChange: (key: string | number | null) => onValueChange(key == null ? "" : String(key)),
    isRequired: required, isDisabled: disabled, name, placeholder: t(placeholder), "aria-label": t(label),
  };
  const fieldLabel = <Label className={`mind-select-label ${hideLabel ? "sr-only" : ""}`}>{t(label)}</Label>;
  if (searchable) return <Autocomplete ref={attachRoot} {...props} onOpenChange={() => setQuery("")}>
    {fieldLabel}
    <Autocomplete.Trigger id={id} className={`mind-select-trigger ${triggerClassName}`}><Autocomplete.Value /><Autocomplete.Indicator /></Autocomplete.Trigger>
    <FieldError className="mind-select-error" />
    <Autocomplete.Popover className="mind-select-popover" UNSTABLE_portalContainer={portalContainer}>
      <Autocomplete.Filter filter={(text, term) => normalizeCatalogSearch(text).includes(normalizeCatalogSearch(term))}>
        <SearchField autoFocus aria-label={t("Buscar em {v0}", {v0: (label)})} value={query} onChange={setQuery} className="mind-select-search" variant="secondary">
          <SearchField.Group><SearchField.SearchIcon /><SearchField.Input maxLength={80} placeholder={t("Buscar {v0}…", {v0: (label.toLocaleLowerCase())})} /><SearchField.ClearButton /></SearchField.Group>
        </SearchField>
        {list}
      </Autocomplete.Filter>
    </Autocomplete.Popover>
  </Autocomplete>;
  return <Select ref={attachRoot} {...props}>
    {fieldLabel}
    <Select.Trigger id={id} className={`mind-select-trigger ${triggerClassName}`}><Select.Value /><Select.Indicator /></Select.Trigger>
    <FieldError className="mind-select-error" />
    <Select.Popover className="mind-select-popover" UNSTABLE_portalContainer={portalContainer}>{list}</Select.Popover>
  </Select>;
}
