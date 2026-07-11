import React from 'react';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

/**
 * Reusable date-range filter with quick presets (Today, Yesterday, 7/30 days,
 * this/last month) plus free "Custom" selection via the calendar. Emits both
 * the dayjs pair and formatted { from, to } YYYY-MM-DD strings.
 */
export const RANGE_PRESETS = [
  { label: 'Today', value: [dayjs().startOf('day'), dayjs().endOf('day')] },
  { label: 'Yesterday', value: [dayjs().subtract(1, 'day').startOf('day'), dayjs().subtract(1, 'day').endOf('day')] },
  { label: 'Last 7 Days', value: [dayjs().subtract(6, 'day').startOf('day'), dayjs().endOf('day')] },
  { label: 'Last 30 Days', value: [dayjs().subtract(29, 'day').startOf('day'), dayjs().endOf('day')] },
  { label: 'This Month', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
  { label: 'Last Month', value: [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')] },
];

export default function DateRangeFilter({ value, onChange, allowClear = true, style }) {
  return (
    <RangePicker
      presets={RANGE_PRESETS}
      value={value}
      allowClear={allowClear}
      maxDate={dayjs()}
      style={{ maxWidth: '100%', ...style }}
      onChange={(range) => {
        const formatted = range && range[0] && range[1]
          ? { from: range[0].format('YYYY-MM-DD'), to: range[1].format('YYYY-MM-DD') }
          : { from: undefined, to: undefined };
        onChange?.(range, formatted);
      }}
    />
  );
}
