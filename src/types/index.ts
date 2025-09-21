// Project related types
export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'Planning' | 'In Progress' | 'Completed' | 'On Hold';
  startDate: string;
  endDate: string;
  progress: number;
  owner: string;
  teams: Team[];
}

export interface Team {
  id: string;
  name: string;
  progress: number;
  ticketCount: number;
  completedTickets: number;
  status: 'On Track' | 'Behind Schedule' | 'Ahead of Schedule';
}

export interface Ticket {
  id: string;
  title: string;
  status: 'To Do' | 'In Progress' | 'Completed' | 'Blocked';
  assignee: string;
  priority: 'Low' | 'Medium' | 'High';
  dueDate: string;
  type: 'jira' | 'sheet';
  jiraUrl?: string;
  sheetUrl?: string;
  rowNumber?: number;
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  projectId: string;
}
