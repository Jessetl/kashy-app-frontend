import { useThemeColors } from '@/shared/presentation/hooks/use-app-theme';
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AppPressable } from './app-pressable';

/* ─── tipos ─── */

interface AppCalendarInputProps {
  /** Fecha seleccionada en formato YYYY-MM-DD */
  value: string;
  /** Callback cuando se selecciona una fecha (YYYY-MM-DD) */
  onChange: (date: string) => void;
  /** Fecha mínima permitida (YYYY-MM-DD). Fechas anteriores quedan bloqueadas */
  minDate?: string;
  /** Fecha máxima permitida (YYYY-MM-DD). Fechas posteriores quedan bloqueadas */
  maxDate?: string;
  /** Texto del label encima del input */
  label?: string;
  /** Placeholder cuando no hay fecha seleccionada */
  placeholder?: string;
  /** Mostrar borde de error */
  hasError?: boolean;
  /** Mensaje de error debajo del input */
  errorMessage?: string;
  /** Deshabilitar el input */
  disabled?: boolean;
}

type PickerView = 'days' | 'months' | 'years';

/* ─── helpers ─── */

const DAYS_OF_WEEK = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];

const MONTHS_FULL = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const MONTHS_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

const YEAR_RANGE = 12;

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDisplay(dateStr: string): string {
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString('es-VE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function todayString(): string {
  return toDateString(new Date());
}

/* ─── componente ─── */

export const AppCalendarInput = React.memo(function AppCalendarInput({
  value,
  onChange,
  minDate,
  maxDate,
  label,
  placeholder = 'Seleccionar fecha',
  hasError = false,
  errorMessage,
  disabled = false,
}: AppCalendarInputProps) {
  const colors = useThemeColors();
  const [visible, setVisible] = useState(false);
  const [pickerView, setPickerView] = useState<PickerView>('days');

  const initialDate = value ? parseLocalDate(value) : new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());
  // Página base del grid de años (primera fila empieza aquí)
  const [yearPageStart, setYearPageStart] = useState(
    initialDate.getFullYear() - (initialDate.getFullYear() % YEAR_RANGE),
  );

  /* ─── acciones ─── */

  const open = useCallback(() => {
    if (disabled) return;
    const d = value ? parseLocalDate(value) : new Date();
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setYearPageStart(d.getFullYear() - (d.getFullYear() % YEAR_RANGE));
    setPickerView('days');
    setVisible(true);
  }, [disabled, value]);

  const close = useCallback(() => {
    setVisible(false);
    setPickerView('days');
  }, []);

  const goToPrevMonth = useCallback(() => {
    setViewMonth((prev) => {
      if (prev === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setViewMonth((prev) => {
      if (prev === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  }, []);

  const handleSelectDay = useCallback(
    (day: number) => {
      const selected = toDateString(new Date(viewYear, viewMonth, day));
      onChange(selected);
      setVisible(false);
      setPickerView('days');
    },
    [viewYear, viewMonth, onChange],
  );

  const handleSelectMonth = useCallback(
    (month: number) => {
      setViewMonth(month);
      setPickerView('days');
    },
    [],
  );

  const handleSelectYear = useCallback(
    (year: number) => {
      setViewYear(year);
      setPickerView('months');
    },
    [],
  );

  const handleClear = useCallback(() => {
    onChange('');
    setVisible(false);
    setPickerView('days');
  }, [onChange]);

  const togglePickerView = useCallback(() => {
    setPickerView((prev) => {
      if (prev === 'days') return 'months';
      if (prev === 'months') return 'years';
      return 'days';
    });
  }, []);

  /* ─── datos del grid ─── */

  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfWeek(viewYear, viewMonth);
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [viewYear, viewMonth]);

  const yearsList = useMemo(() => {
    const years: number[] = [];
    for (let i = 0; i < YEAR_RANGE; i++) {
      years.push(yearPageStart + i);
    }
    return years;
  }, [yearPageStart]);

  const isDayDisabled = useCallback(
    (day: number): boolean => {
      const dateStr = toDateString(new Date(viewYear, viewMonth, day));
      if (minDate && dateStr < minDate) return true;
      if (maxDate && dateStr > maxDate) return true;
      return false;
    },
    [viewYear, viewMonth, minDate, maxDate],
  );

  const isMonthDisabled = useCallback(
    (month: number): boolean => {
      // Un mes está disabled si todos sus días caen fuera del rango
      const lastDay = getDaysInMonth(viewYear, month);
      const firstStr = toDateString(new Date(viewYear, month, 1));
      const lastStr = toDateString(new Date(viewYear, month, lastDay));
      if (minDate && lastStr < minDate) return true;
      if (maxDate && firstStr > maxDate) return true;
      return false;
    },
    [viewYear, minDate, maxDate],
  );

  const isYearDisabled = useCallback(
    (year: number): boolean => {
      const firstStr = `${year}-01-01`;
      const lastStr = `${year}-12-31`;
      if (minDate && lastStr < minDate) return true;
      if (maxDate && firstStr > maxDate) return true;
      return false;
    },
    [minDate, maxDate],
  );

  const selectedDateStr = value;
  const today = todayString();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  /* ─── sub-renders ─── */

  const renderHeader = () => {
    if (pickerView === 'years') {
      const rangeEnd = yearPageStart + YEAR_RANGE - 1;
      return (
        <View style={styles.header}>
          <AppPressable
            onPress={() => setYearPageStart((p) => p - YEAR_RANGE)}
            style={[styles.navButton, { backgroundColor: colors.backgroundTertiary }]}
          >
            <ChevronLeft size={20} color={colors.textOnSurface} />
          </AppPressable>
          <Text style={[styles.headerTitle, { color: colors.textOnSurface }]}>
            {yearPageStart} — {rangeEnd}
          </Text>
          <AppPressable
            onPress={() => setYearPageStart((p) => p + YEAR_RANGE)}
            style={[styles.navButton, { backgroundColor: colors.backgroundTertiary }]}
          >
            <ChevronRight size={20} color={colors.textOnSurface} />
          </AppPressable>
        </View>
      );
    }

    if (pickerView === 'months') {
      return (
        <View style={styles.header}>
          <AppPressable
            onPress={() => setViewYear((y) => y - 1)}
            style={[styles.navButton, { backgroundColor: colors.backgroundTertiary }]}
          >
            <ChevronLeft size={20} color={colors.textOnSurface} />
          </AppPressable>
          <AppPressable onPress={() => setPickerView('years')} style={styles.headerTitleButton}>
            <Text style={[styles.headerTitle, { color: colors.textOnSurface }]}>
              {viewYear}
            </Text>
            <ChevronDown size={16} color={colors.textSecondary} />
          </AppPressable>
          <AppPressable
            onPress={() => setViewYear((y) => y + 1)}
            style={[styles.navButton, { backgroundColor: colors.backgroundTertiary }]}
          >
            <ChevronRight size={20} color={colors.textOnSurface} />
          </AppPressable>
        </View>
      );
    }

    // days view
    return (
      <View style={styles.header}>
        <AppPressable
          onPress={goToPrevMonth}
          style={[styles.navButton, { backgroundColor: colors.backgroundTertiary }]}
        >
          <ChevronLeft size={20} color={colors.textOnSurface} />
        </AppPressable>
        <AppPressable onPress={togglePickerView} style={styles.headerTitleButton}>
          <Text style={[styles.headerTitle, { color: colors.textOnSurface }]}>
            {MONTHS_FULL[viewMonth]} {viewYear}
          </Text>
          <ChevronDown size={16} color={colors.textSecondary} />
        </AppPressable>
        <AppPressable
          onPress={goToNextMonth}
          style={[styles.navButton, { backgroundColor: colors.backgroundTertiary }]}
        >
          <ChevronRight size={20} color={colors.textOnSurface} />
        </AppPressable>
      </View>
    );
  };

  const renderDaysView = () => (
    <>
      {/* Días de la semana */}
      <View style={styles.weekRow}>
        {DAYS_OF_WEEK.map((day) => (
          <View key={day} style={styles.weekDayCell}>
            <Text style={[styles.weekDayText, { color: colors.textSecondary }]}>
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* Grid de días */}
      <View style={styles.daysGrid}>
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <View key={`e-${index}`} style={styles.dayCell} />;
          }

          const dateStr = toDateString(new Date(viewYear, viewMonth, day));
          const isSelected = dateStr === selectedDateStr;
          const isToday = dateStr === today;
          const isDisabledDay = isDayDisabled(day);

          return (
            <AppPressable
              key={day}
              onPress={() => !isDisabledDay && handleSelectDay(day)}
              disabled={isDisabledDay}
              style={styles.dayCell}
            >
              <View
                style={[
                  styles.dayCircle,
                  isSelected && { backgroundColor: colors.primary },
                  isToday && !isSelected && {
                    borderWidth: 1.5,
                    borderColor: colors.primary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    { color: colors.textOnSurface },
                    isSelected && { color: colors.textInverse, fontWeight: '700' },
                    isDisabledDay && { color: colors.textTertiary, opacity: 0.35 },
                  ]}
                >
                  {day}
                </Text>
              </View>
            </AppPressable>
          );
        })}
      </View>
    </>
  );

  const renderMonthsView = () => (
    <View style={styles.pickerGrid}>
      {MONTHS_SHORT.map((name, index) => {
        const isActive = index === viewMonth && viewYear === viewYear;
        const isCurrent = index === currentMonth && viewYear === currentYear;
        const isDisabled = isMonthDisabled(index);

        return (
          <AppPressable
            key={name}
            onPress={() => !isDisabled && handleSelectMonth(index)}
            disabled={isDisabled}
            style={[
              styles.pickerCell,
              {
                backgroundColor: isActive
                  ? colors.primary
                  : colors.backgroundTertiary,
                borderColor: isCurrent && !isActive
                  ? colors.primary
                  : 'transparent',
                borderWidth: isCurrent && !isActive ? 1.5 : 0,
              },
            ]}
          >
            <Text
              style={[
                styles.pickerCellText,
                { color: isActive ? colors.textInverse : colors.textOnSurface },
                isDisabled && { color: colors.textTertiary, opacity: 0.35 },
              ]}
            >
              {name}
            </Text>
          </AppPressable>
        );
      })}
    </View>
  );

  const renderYearsView = () => (
    <View style={styles.pickerGrid}>
      {yearsList.map((year) => {
        const isActive = year === viewYear;
        const isCurrent = year === currentYear;
        const isDisabled = isYearDisabled(year);

        return (
          <AppPressable
            key={year}
            onPress={() => !isDisabled && handleSelectYear(year)}
            disabled={isDisabled}
            style={[
              styles.pickerCell,
              {
                backgroundColor: isActive
                  ? colors.primary
                  : colors.backgroundTertiary,
                borderColor: isCurrent && !isActive
                  ? colors.primary
                  : 'transparent',
                borderWidth: isCurrent && !isActive ? 1.5 : 0,
              },
            ]}
          >
            <Text
              style={[
                styles.pickerCellText,
                { color: isActive ? colors.textInverse : colors.textOnSurface },
                isDisabled && { color: colors.textTertiary, opacity: 0.35 },
              ]}
            >
              {year}
            </Text>
          </AppPressable>
        );
      })}
    </View>
  );

  /* ─── render principal ─── */

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {label}
        </Text>
      )}

      {/* Input trigger */}
      <AppPressable
        onPress={open}
        disabled={disabled}
        style={[
          styles.inputTrigger,
          {
            backgroundColor: colors.backgroundTertiary,
            borderColor: hasError ? colors.danger : colors.border,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        <Calendar size={18} color={colors.textSecondary} />
        <Text
          style={[
            styles.inputText,
            { color: value ? colors.textOnSurface : colors.textTertiary },
          ]}
          numberOfLines={1}
        >
          {value ? formatDisplay(value) : placeholder}
        </Text>
        {value !== '' && (
          <AppPressable
            onPress={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            style={styles.clearInline}
          >
            <X size={16} color={colors.textTertiary} />
          </AppPressable>
        )}
      </AppPressable>

      {errorMessage && (
        <Text style={[styles.errorText, { color: colors.danger }]}>
          {errorMessage}
        </Text>
      )}

      {/* Modal del calendario */}
      <Modal
        visible={visible}
        transparent
        animationType='fade'
        onRequestClose={close}
      >
        <Pressable style={styles.backdrop} onPress={close}>
          <Pressable
            style={[
              styles.calendarContainer,
              { backgroundColor: colors.backgroundSecondary },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {renderHeader()}

            <View
              style={[
                styles.divider,
                { backgroundColor: colors.borderLight },
              ]}
            />

            {/* Contenido según la vista activa */}
            <ScrollView
              style={styles.body}
              contentContainerStyle={styles.bodyContent}
              showsVerticalScrollIndicator={false}
            >
              {pickerView === 'days' && renderDaysView()}
              {pickerView === 'months' && renderMonthsView()}
              {pickerView === 'years' && renderYearsView()}
            </ScrollView>

            {/* Footer */}
            <View
              style={[
                styles.divider,
                { backgroundColor: colors.borderLight },
              ]}
            />
            <View style={styles.footer}>
              {value ? (
                <AppPressable
                  onPress={handleClear}
                  style={[
                    styles.footerButton,
                    { backgroundColor: colors.dangerLight },
                  ]}
                >
                  <Text
                    style={[styles.footerButtonText, { color: colors.danger }]}
                  >
                    Limpiar
                  </Text>
                </AppPressable>
              ) : (
                <View />
              )}
              <AppPressable
                onPress={close}
                style={[
                  styles.footerButton,
                  { backgroundColor: colors.primaryLight },
                ]}
              >
                <Text
                  style={[styles.footerButtonText, { color: colors.primary }]}
                >
                  Cerrar
                </Text>
              </AppPressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
});

/* ─── estilos ─── */

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  inputTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
    borderWidth: 1,
  },
  inputText: {
    fontSize: 16,
    flex: 1,
  },
  clearInline: {
    padding: 4,
    borderRadius: 12,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarContainer: {
    width: '100%',
    borderRadius: 20,
    maxWidth: 360,
    overflow: 'hidden',
  },

  /* ─── header ─── */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 12,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },

  /* ─── body ─── */
  body: {
    maxHeight: 320,
  },
  bodyContent: {
    padding: 12,
  },

  /* ─── week / days ─── */
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  weekDayText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  dayCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 15,
    fontWeight: '500',
  },

  /* ─── picker grid (meses / años) ─── */
  pickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerCell: {
    width: '30%',
    flexGrow: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerCellText: {
    fontSize: 15,
    fontWeight: '600',
  },

  /* ─── footer ─── */
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  footerButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  footerButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
