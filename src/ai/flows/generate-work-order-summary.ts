'use server';
/**
 * @fileOverview A GenAI tool to generate concise summaries of work orders.
 *
 * - generateWorkOrderSummary - A function that handles the work order summary generation process.
 * - GenerateWorkOrderSummaryInput - The input type for the generateWorkOrderSummary function.
 * - GenerateWorkOrderSummaryOutput - The return type for the generateWorkOrderSummary function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateWorkOrderSummaryInputSchema = z.object({
  workOrder: z.object({
    id: z.string().describe('The unique identifier of the work order.'),
    description: z.string().describe('Detailed description of the work order.'),
    status: z.enum(['creada', 'asignada', 'ejecutada', 'en revision', 'aprobada', 'rechazada']).describe('Current status of the work order.'),
    assignedTo: z.string().optional().describe('ID of the user assigned to the work order.'),
    createdAt: z.string().describe('Timestamp when the work order was created (ISO string).'),
    updatedAt: z.string().optional().describe('Timestamp when the work order was last updated (ISO string).'),
    executedAt: z.string().optional().describe('Timestamp when the work order was executed (ISO string).'),
    reviewedAt: z.string().optional().describe('Timestamp when the work order was reviewed (ISO string).'),
    approvedBy: z.string().optional().describe('ID of the user who approved the work order.'),
    rejectedReason: z.string().optional().describe('Reason if the work order was rejected.'),
    companyId: z.string().describe('ID of the company associated with this work order.'),
  }).describe('Detailed information about the work order.'),
  digitalLogbookEntries: z.array(z.object({
    id: z.string().describe('Unique identifier for the logbook entry.'),
    timestamp: z.string().describe('Timestamp of the logbook event (ISO string).'),
    eventType: z.string().describe('Type of event recorded in the logbook (e.g., "status_change", "action_taken").'),
    eventDetails: z.string().describe('Detailed description of the logbook event.'),
    actor: z.string().describe('ID of the user who performed the action.'),
    workOrderId: z.string().describe('ID of the work order this entry belongs to.'),
  })).describe('An array of entries from the digital logbook for the work order.'),
});
export type GenerateWorkOrderSummaryInput = z.infer<typeof GenerateWorkOrderSummaryInputSchema>;

const GenerateWorkOrderSummaryOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the work order, including maintenance actions, identified issues, and resolutions.'),
});
export type GenerateWorkOrderSummaryOutput = z.infer<typeof GenerateWorkOrderSummaryOutputSchema>;

export async function generateWorkOrderSummary(input: GenerateWorkOrderSummaryInput): Promise<GenerateWorkOrderSummaryOutput> {
  return generateWorkOrderSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateWorkOrderSummaryPrompt',
  input: { schema: GenerateWorkOrderSummaryInputSchema },
  output: { schema: GenerateWorkOrderSummaryOutputSchema },
  prompt: `You are an AI assistant tasked with generating concise summaries of work orders based on their details and associated digital logbook entries.
The summary should highlight maintenance actions performed, identified issues, and resolutions.
Keep the summary professional and to the point.

Work Order Details:
ID: {{{workOrder.id}}}
Description: {{{workOrder.description}}}
Status: {{{workOrder.status}}}
Assigned To User ID: {{{workOrder.assignedTo}}}
Created At: {{{workOrder.createdAt}}}
Executed At: {{{workOrder.executedAt}}}
Reviewed At: {{{workOrder.reviewedAt}}}
Approved By User ID: {{{workOrder.approvedBy}}}
Rejected Reason: {{{workOrder.rejectedReason}}}

Digital Logbook Entries:
{{#each digitalLogbookEntries}}
  - Timestamp: {{{this.timestamp}}}
    Event Type: {{{this.eventType}}}
    Actor User ID: {{{this.actor}}}
    Details: {{{this.eventDetails}}}
{{/each}}

Based on the information above, please generate a concise summary of this work order, focusing on maintenance actions, issues, and resolutions.`,
});

const generateWorkOrderSummaryFlow = ai.defineFlow(
  {
    name: 'generateWorkOrderSummaryFlow',
    inputSchema: GenerateWorkOrderSummaryInputSchema,
    outputSchema: GenerateWorkOrderSummaryOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
