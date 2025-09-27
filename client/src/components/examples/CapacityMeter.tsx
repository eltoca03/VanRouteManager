import CapacityMeter from '../CapacityMeter';

export default function CapacityMeterExample() {
  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <h3 className="font-medium">Available Seats</h3>
        <CapacityMeter used={8} total={14} />
      </div>
      <div className="space-y-2">
        <h3 className="font-medium">Nearly Full</h3>
        <CapacityMeter used={12} total={14} />
      </div>
      <div className="space-y-2">
        <h3 className="font-medium">Fully Booked</h3>
        <CapacityMeter used={14} total={14} />
      </div>
    </div>
  );
}