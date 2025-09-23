interface Ticket {
  id: string;
  title: string;
  status: string;
  assignee: string;
  priority: string;
  startdate: string;
  duedate: string;
  type: string;
  url: string;
}

interface TicketCardProps {
  ticket: Ticket;
}

export default function TicketCard({ ticket }: TicketCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-pink-100 text-pink-800';
      case 'To Do':
        return 'bg-gray-100 text-gray-800';
      case 'Blocked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'text-red-600';
      case 'Medium':
        return 'text-yellow-600';
      case 'Low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleTicketClick = () => {
    window.open(ticket.url, '_blank');
  };

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleTicketClick}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <h3 className="font-medium text-gray-900">{ticket.title}</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
            {ticket.status}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {ticket.type === 'jira' ? (
            <span className="px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: '#f0f9ff', color: '#0369a1' }}>
              TICKET
            </span>
          ) : (
            <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium">
              ROW
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
        <div>
          <span className="font-medium">ID:</span> {ticket.id}
        </div>
        <div>
          <span className="font-medium">Assignee:</span> {ticket.assignee}
        </div>
        <div>
          <span className="font-medium">Priority:</span>
          <span className={`ml-1 font-medium ${getPriorityColor(ticket.priority)}`}>
            {ticket.priority}
          </span>
        </div>
        <div>
          <span className="font-medium">Due:</span> {ticket.duedate}
        </div>
      </div>

      <div className="mt-3 text-xs hover:underline" style={{ color: '#eb2f96' }}>
        Click to open in {ticket.type === 'jira' ? 'Jira' : 'Google Sheets'} →
      </div>
    </div>
  );
}
