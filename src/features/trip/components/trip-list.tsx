import { ItemGroup } from '#/components/ui/item';
import { useTrips } from '#/features/trip/api/get-trips';
import { TripCard } from '#/features/trip/components/trip-card';

function TripList() {
  const { data: trips } = useTrips();

  if (trips.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-card/55 px-6 py-12 text-center sm:px-10">
        <p className="text-lg font-medium tracking-[-0.01em] text-foreground">
          Your next journey starts here
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          Share a few details in the prompt above and we’ll turn them into a
          trip you can shape together.
        </p>
      </div>
    );
  }

  return (
    <ItemGroup className="gap-2">
      {trips.map((trip) => (
        <TripCard key={trip.id} trip={trip} />
      ))}
    </ItemGroup>
  );
}

export { TripList };
