import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';

const region = process.env.AWS_REGION || 'ap-south-2';
const eventBusName = process.env.EVENT_BUS_NAME || 'reprojects-events';
const ebClient = new EventBridgeClient({ region });

export type PdfDispatchResult =
  | { mode: 'local-http'; result: unknown }
  | { mode: 'eventbridge'; eventId?: string };

export async function requestPdfGeneration(payload: Record<string, unknown>): Promise<PdfDispatchResult> {
  if (process.env.USE_EVENTBRIDGE !== 'true') {
    const localUrl = process.env.PDF_SERVICE_URL || 'http://pdf-renderer:3004';
    const res = await fetch(`${localUrl}/api/v2/pdf/${payload.endpoint || 'invoice'}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': process.env.PDF_INTERNAL_SECRET || '',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Local pdf-renderer failed (${res.status}): ${await res.text()}`);
    return { mode: 'local-http', result: { bytes: (await res.arrayBuffer()).byteLength } };
  }

  const response = await ebClient.send(
    new PutEventsCommand({
      Entries: [
        {
          EventBusName: eventBusName,
          Source: 'reprojects.core',
          DetailType: 'GeneratePdfRequested',
          Detail: JSON.stringify(payload),
        },
      ],
    })
  );

  if (response.FailedEntryCount && response.FailedEntryCount > 0) {
    const err = response.Entries?.[0];
    throw new Error(`EventBridge PutEvents failed: ${err?.ErrorCode} - ${err?.ErrorMessage}`);
  }

  return { mode: 'eventbridge', eventId: response.Entries?.[0]?.EventId };
}
