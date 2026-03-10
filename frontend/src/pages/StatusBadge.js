import '../styles/StatusBadge.css';

const labels = {
  reported: 'Reported',
  assigned: 'Volunteer Assigned',
  volunteer_accepted: 'Volunteer Accepted',
  volunteer_declined: 'Volunteer Declined',
  in_transit: 'In Transit',
  at_vet: 'At Veterinarian',
  at_shelter: 'At Shelter',
  adopted: 'Adopted 🎉',
  returned_to_owner: 'Returned to Owner',
  closed: 'Closed',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`status-badge badge-${status}`}>
      {labels[status] || status}
    </span>
  );
}