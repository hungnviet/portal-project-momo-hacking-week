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
  ticketDescription: string;
}

interface TicketCardProps {
  ticket: Ticket;
}

export default function TicketCard({ ticket }: TicketCardProps) {
  // Helper function to check if task is done
  const isDone = (status: string): boolean => {
    return status.toLowerCase() === 'done' ||
           status.toLowerCase() === 'completed' ||
           status.toLowerCase() === 'closed';
  };

  // Helper function to check if task is overdue
  const isOverdue = (duedate: string): boolean => {
    if (!duedate) return false;
    const today = new Date();
    const due = new Date(duedate);
    return due < today && !isDone(ticket.status);
  };

  const getStatusColor = (status: string) => {
    if (isDone(status)) {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    
    switch (status.toLowerCase()) {
      case 'in progress':
      case 'developing':
      case 'in review':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'to do':
      case 'open':
      case 'new':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'blocked':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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

  // Determine card styling based on status
  const getCardStyling = () => {
    if (isDone(ticket.status)) {
      return 'bg-green-50 border-green-200 hover:bg-green-100';
    } else if (isOverdue(ticket.duedate)) {
      return 'bg-red-50 border-red-300 hover:bg-red-100';
    } else {
      return 'bg-white border-gray-200 hover:bg-gray-50';
    }
  };

  return (
    <div
      className={`border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${getCardStyling()}`}
      onClick={handleTicketClick}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {isDone(ticket.status) && (
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {isOverdue(ticket.duedate) && (
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            )}
            <h3 className={`font-medium ${
              isDone(ticket.status) ? 'text-green-900 line-through' : 
              isOverdue(ticket.duedate) ? 'text-red-900' : 'text-gray-900'
            }`}>
              {ticket.title}
            </h3>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
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
      <div>
        <p className="mt-1 text-sm text-gray-500">{ticket.ticketDescription}</p>
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
          <span className="font-medium">Due:</span> 
          <span className={`ml-1 ${
            isOverdue(ticket.duedate) ? 'text-red-600 font-bold' : 'text-gray-600'
          }`}>
            {ticket.duedate || 'No due date'}
            {isOverdue(ticket.duedate) && (
              <span className="ml-1 text-red-600 text-xs">⚠ OVERDUE</span>
            )}
          </span>
        </div>
      </div>

      <div className="mt-3 text-xs hover:underline" style={{ color: '#eb2f96' }}>
        Click to open in {ticket.type === 'jira' ? 'Jira' : 'Google Sheets'} →
      </div>
    </div>
  );
}
