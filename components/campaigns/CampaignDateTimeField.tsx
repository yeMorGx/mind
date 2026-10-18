"use client";

import {
  Calendar,
  DateField,
  DatePicker,
  Label,
  TimeField,
  I18nProvider,
  FieldError,
  type TimeValue,
} from "@heroui/react";
import { parseAbsolute } from "@internationalized/date";
import { useLocalTimeZone } from "@/lib/use-local-time-zone";

export function CampaignDateTimeField({
  label,
  value,
  onChange,
  disabled,
  name,
  required = true,
}: {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  name: string;
  required?: boolean;
}) {
  const timeZone = useLocalTimeZone();
  const localValue = value ? parseAbsolute(value, timeZone) : null;
  return (
    <I18nProvider locale="pt-BR"><DatePicker
      className="mind-date-picker"
      granularity="minute"
      hourCycle={24}
      hideTimeZone
      isDisabled={disabled}
      isRequired={required}
      name={name}
      value={localValue}
      onChange={(next) =>
        onChange(next ? next.toDate().toISOString() : null)
      }
    >
      {({ state }) => (
        <>
          <Label className="mind-select-label">{label}</Label>
          <DateField.Group fullWidth variant="secondary">
            <DateField.Input aria-label={label}>
              {(segment) => <DateField.Segment segment={segment} />}
            </DateField.Input>
            <DateField.Suffix>
              <DatePicker.Trigger aria-label={`Abrir calendário de ${label.toLocaleLowerCase()}`}>
                <DatePicker.TriggerIndicator />
              </DatePicker.Trigger>
            </DateField.Suffix>
          </DateField.Group>
          <FieldError />
          <DatePicker.Popover className="mind-date-popover">
            <Calendar aria-label={`Calendário: ${label.toLocaleLowerCase()}`}>
              <Calendar.Header>
                <Calendar.NavButton slot="previous" />
                <Calendar.Heading />
                <Calendar.NavButton slot="next" />
              </Calendar.Header>
              <Calendar.Grid>
                <Calendar.GridHeader>
                  {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
                </Calendar.GridHeader>
                <Calendar.GridBody>
                  {(date) => <Calendar.Cell date={date} />}
                </Calendar.GridBody>
              </Calendar.Grid>
            </Calendar>
            {state.timeValue && (
              <TimeField
                aria-label={`Horário: ${label.toLocaleLowerCase()}`}
                granularity="minute"
                hourCycle={24}
                hideTimeZone
                value={state.timeValue}
                onChange={(next) => state.setTimeValue(next as TimeValue)}
              >
                <Label className="mind-date-time-label">Horário</Label>
                <TimeField.Group variant="secondary">
                  <TimeField.Input>
                    {(segment) => <TimeField.Segment segment={segment} />}
                  </TimeField.Input>
                </TimeField.Group>
              </TimeField>
            )}
          </DatePicker.Popover>
        </>
      )}
    </DatePicker>{!required && value && <button type="button" className="campaign-date-clear" disabled={disabled} onClick={() => onChange(null)}>Remover data final</button>}</I18nProvider>
  );
}
