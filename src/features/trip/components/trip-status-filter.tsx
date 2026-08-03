import { useNavigate } from '@tanstack/react-router';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select';
import { tripStatusFilterSchema } from '#/features/trip/types/trip-status-filter';

import type { TripStatusFilter as TripStatusFilterType } from '#/features/trip/types/trip-status-filter';

interface TripStatusFilterProps {
  status: TripStatusFilterType;
}

const filterOptions = [
  { label: 'All', value: 'all' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Draft', value: 'draft' },
] as const;

function TripStatusFilter({ status }: TripStatusFilterProps) {
  const navigate = useNavigate({ from: '/t/' });

  return (
    <Select
      aria-label="Filter trips by status"
      value={status}
      onChange={(key) => {
        const nextFilter = tripStatusFilterSchema.parse(key);
        navigate({
          search: (previous) => ({ ...previous, status: nextFilter }),
        });
      }}
    >
      <SelectTrigger size="sm" className="w-fit">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup items={filterOptions}>
          {(option) => (
            <SelectItem
              key={option.value}
              id={option.value}
              style={{ viewTransitionName: `trip-item-${option.value}` }}
            >
              {option.label}
            </SelectItem>
          )}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export { TripStatusFilter };
