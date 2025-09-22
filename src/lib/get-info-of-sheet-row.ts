import { google } from 'googleapis';
import path from 'path';

// Interface for the dynamic task data from the sheet row
export interface DynamicTaskRowData {
  [key: string]: string | object; // Dynamic fields based on header row, extra field is an object
}

/**
 * Get task data from a specific row in a Google Sheet with dynamic fields based on header row
 * @param rowUrl - Full Google Sheets URL with row information (e.g., https://docs.google.com/spreadsheets/d/ID/edit?gid=0#gid=0&range=3:3)
 * @returns Promise<DynamicTaskRowData | null> - Task data or null if not found
 */
export async function getSheetRowData(rowUrl: string): Promise<DynamicTaskRowData | null> {
  try {
    // Extract spreadsheet ID from URL
    const spreadsheetId = extractSpreadsheetId(rowUrl);

    // Extract row number from the row URL
    const targetRowNumber = extractRowNumberFromRowUrl(rowUrl);

    // Load service account credentials
    const credentialsPath = path.join(process.cwd(), 'momo-472913-70f48a1ee510.json');

    // Create JWT client for service account authentication
    const auth = new google.auth.GoogleAuth({
      keyFile: credentialsPath,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });

    // Create the sheets API client
    const sheets = google.sheets({ version: 'v4', auth });

    // Get the first sheet name
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    if (!spreadsheet.data.sheets || spreadsheet.data.sheets.length === 0) {
      throw new Error('No sheets found in the spreadsheet');
    }

    const sheetName = spreadsheet.data.sheets[0].properties?.title || 'Sheet1';

    // First, get the header row (row 1) to determine field names
    const headerRange = `${sheetName}!1:1`;
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: headerRange,
      valueRenderOption: 'FORMATTED_VALUE',
      dateTimeRenderOption: 'FORMATTED_STRING',
    });

    if (!headerResponse.data.values || headerResponse.data.values.length === 0) {
      throw new Error('No header row found in the spreadsheet');
    }

    const headerFields = headerResponse.data.values[0] as string[];
    console.log('Header fields found:', headerFields);

    // Get the data row
    const dataRange = `${sheetName}!${targetRowNumber}:${targetRowNumber}`;
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: dataRange,
      valueRenderOption: 'FORMATTED_VALUE',
      dateTimeRenderOption: 'FORMATTED_STRING',
    });

    // Return the data if found
    if (dataResponse.data.values && dataResponse.data.values.length > 0) {
      const rowValues = dataResponse.data.values[0] as string[];

      // Create dynamic object based on header fields
      const dynamicTaskData: DynamicTaskRowData = {};

      // Process first 7 columns as individual fields
      const maxMainFields = 8;
      for (let i = 0; i < Math.min(maxMainFields, headerFields.length); i++) {
        const fieldName = headerFields[i].trim().toLowerCase();
        dynamicTaskData[fieldName] = rowValues[i] || '';
      }

      // Process remaining columns as extra object
      if (headerFields.length > maxMainFields) {
        const extraFields: { [key: string]: string } = {};

        for (let i = maxMainFields; i < headerFields.length; i++) {
          const fieldName = headerFields[i].trim().toLowerCase();
          extraFields[fieldName] = rowValues[i] || '';
        }

        dynamicTaskData.extra = extraFields;
      }

      console.log('Dynamic task data created:', dynamicTaskData);
      return dynamicTaskData;
    }

    // Return null if no data found
    return null;

  } catch (error) {
    console.error('Error fetching sheet row data:', error);

    // Handle specific Google Sheets API errors
    if (error instanceof Error) {
      if (error.message.includes('Unable to parse range')) {
        throw new Error(`Invalid range format. Check sheet name and row number.`);
      }
      if (error.message.includes('Requested entity was not found')) {
        throw new Error(`Spreadsheet not found. Check the spreadsheet ID.`);
      }
      if (error.message.includes('The caller does not have permission')) {
        throw new Error(`Permission denied. Make sure the service account has access to the spreadsheet.`);
      }
    }

    throw error;
  }
}

/**
 * Get task data from multiple rows in Google Sheets with dynamic fields
 * @param rowUrls - Array of Google Sheets row URLs
 * @returns Promise<DynamicTaskRowData[]> - Array of task data
 */
export async function getMultipleSheetRowsData(rowUrls: string[]): Promise<DynamicTaskRowData[]> {
  const results: DynamicTaskRowData[] = [];

  for (const rowUrl of rowUrls) {
    try {
      const taskData = await getSheetRowData(rowUrl);
      if (taskData) {
        results.push(taskData);
      }
    } catch (error) {
      console.error(`Error fetching data for row URL: ${rowUrl}`, error);
      // Continue with other URLs even if one fails
    }
  }

  return results;
}

/**
 * Helper function to extract spreadsheet ID from Google Sheets URL
 * @param url - Google Sheets URL
 * @returns string - Spreadsheet ID
 */
export function extractSpreadsheetId(url: string): string {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) {
    throw new Error('Invalid Google Sheets URL');
  }
  return match[1];
}

/**
 * Helper function to extract row number from Google Sheets row URL
 * @param rowUrl - Google Sheets row URL (e.g., https://docs.google.com/spreadsheets/d/ID/edit?gid=0#gid=0&range=3:3)
 * @returns number - Row number
 */
export function extractRowNumberFromRowUrl(rowUrl: string): number {
  // Try to extract row number from URL fragment like #gid=0&range=3:3
  const rangeMatch = rowUrl.match(/range=(\d+):(\d+)/);
  if (rangeMatch) {
    return parseInt(rangeMatch[1], 10);
  }

  // Try to extract from range like #gid=0&range=A3:F3
  const cellRangeMatch = rowUrl.match(/range=[A-Z]+(\d+):[A-Z]+(\d+)/);
  if (cellRangeMatch) {
    return parseInt(cellRangeMatch[1], 10);
  }

  // Try to extract from simple range like #gid=0&range=3
  const simpleRangeMatch = rowUrl.match(/range=(\d+)$/);
  if (simpleRangeMatch) {
    return parseInt(simpleRangeMatch[1], 10);
  }

  throw new Error('Could not extract row number from URL. Please provide a valid row URL.');
}

/**
 * Helper function to extract row number from Google Sheets URL (legacy function for backward compatibility)
 * @param url - Google Sheets URL
 * @returns number - Row number (defaults to 2 if not found in URL)
 */
export function extractRowNumber(url: string): number {
  // Try to extract row number from URL fragment like #gid=0&range=A2:F2
  const rangeMatch = url.match(/range=([A-Z]+)(\d+)/);
  if (rangeMatch) {
    return parseInt(rangeMatch[2], 10);
  }

  // Default to row 2 if not specified
  return 2;
}