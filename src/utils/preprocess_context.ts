import { TaskData } from "@/service";

export async function convertTicketsToMarkdown(tickets: TaskData[]): Promise<String> {
  // Markdown table header
  let markdown = `| Task | Assignee | Due Date | Priority | Status | Notes |\n`;
  markdown += `|------|----------|----------|----------|--------|-------|\n`;

  // Build table rows
  for (const t of tickets) {
    markdown += `| ${t.ticketName} | ${t.assignee} | ${t.duedate || "-"} | ${t.ticketPriority} | ${t.ticketStatus} | |\n`;
  }

  return markdown;
}

// // Example usage:
// const tickets: Ticket[] = [
//   {
//     id: "10003",
//     title: "(Sample) Initiate Fund Transfer",
//     description: "Enable users to transfer funds between accounts.",
//     assignee: "Hùng Nguyễn",
//     ticketStatus: "Done",
//     ticketPriority: "Medium",
//     startdate: "",
//     duedate: "2025-09-25",
//     url: "https://nvk01052004.atlassian.net/browse/MBA-6",
//     type: "jira",
//   },
//   {
//     id: "10002",
//     title: "hehehehehehe",
//     description: "Allow users to view their transaction history in the app.",
//     assignee: "Hùng Nguyễn",
//     ticketStatus: "Done",
//     ticketPriority: "Medium",
//     startdate: "",
//     duedate: "2025-09-25",
//     url: "https://nvk01052004.atlassian.net/browse/MBA-3",
//     type: "jira",
//   },
// ];

// console.log(convertTicketsToMarkdown(tickets));
