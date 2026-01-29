import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

interface LegislatureClient {
  getLegislators(): Promise<Legislator[]>;
  getBills(params: BillParams): Promise<Bill[]>;
  getBillDetails(billId: string): Promise<BillDetails | null>;
  getVotes(billId: string): Promise<Vote[]>;
}

interface Legislator {
  id: string;
  name: string;
  chamber: 'house' | 'senate';
  district: number;
  party: string;
  email?: string;
}

interface BillParams {
  session: string;
}

interface Bill {
  id: string;
  bill_number: string;
  title: string;
  short_description?: string;
  long_description?: string;
  status: string;
  introduced_date?: string;
  last_action_date?: string;
  last_action?: string;
  subjects: string[];
  source_url: string;
  sponsors?: Array<{
    name: string;
    type: 'primary' | 'co-sponsor' | 'alternate';
  }>;
}

interface BillDetails extends Bill {
  history: Array<{
    date: string;
    action: string;
  }>;
}

interface Vote {
  legislator_id: string;
  vote_type: 'yea' | 'nay' | 'abstain' | 'excused' | 'absent';
  vote_date: string;
}

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '_text',
});

let legislatureClient: LegislatureClient | null = null;

export function getLegislatureClient(): LegislatureClient {
  if (!legislatureClient) {
    const baseUrl = 'https://wslwebservices.leg.wa.gov';

    const http = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
      },
      timeout: 30000,
    });

    legislatureClient = {
      async getLegislators(): Promise<Legislator[]> {
        // Use the LegislativeService SOAP endpoint
        const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <GetSponsors xmlns="http://WSLWebServices.leg.wa.gov/">
      <biennium>${getCurrentBiennium()}</biennium>
    </GetSponsors>
  </soap:Body>
</soap:Envelope>`;

        const response = await http.post('/SponsorService.asmx', soapEnvelope, {
          headers: {
            'SOAPAction': 'http://WSLWebServices.leg.wa.gov/GetSponsors',
          },
        });

        const parsed = xmlParser.parse(response.data);
        const members = extractFromSoapResponse(parsed, 'GetSponsorsResult', 'Member') || [];
        const memberArray = Array.isArray(members) ? members : [members];

        return memberArray.map((member: Record<string, unknown>) => ({
          id: String(member.Id || member['@_Id'] || ''),
          name: formatName(member),
          chamber: determineChamber(member),
          district: parseInt(String(member.District || 0), 10),
          party: String(member.Party || ''),
          email: member.Email ? String(member.Email) : undefined,
        }));
      },

      async getBills(params: BillParams): Promise<Bill[]> {
        const biennium = params.session || getCurrentBiennium();

        // Calculate since date - start of the biennium year
        const bienniumStartYear = parseInt(biennium.split('-')[0], 10);
        const sinceDate = `${bienniumStartYear}-01-01`;

        const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <GetLegislationIntroducedSince xmlns="http://WSLWebServices.leg.wa.gov/">
      <sinceDate>${sinceDate}</sinceDate>
    </GetLegislationIntroducedSince>
  </soap:Body>
</soap:Envelope>`;

        const response = await http.post('/LegislationService.asmx', soapEnvelope, {
          headers: {
            'SOAPAction': 'http://WSLWebServices.leg.wa.gov/GetLegislationIntroducedSince',
          },
          timeout: 120000, // 2 minutes for large response
        });

        const parsed = xmlParser.parse(response.data);
        const bills = extractFromSoapResponse(parsed, 'GetLegislationIntroducedSinceResult', 'Legislation') || [];
        const billArray = Array.isArray(bills) ? bills : [bills];

        return billArray.map((bill: Record<string, unknown>) => {
          const currentStatus = bill.CurrentStatus as Record<string, unknown> | undefined;
          return {
            id: String(bill.BillId || bill['@_BillId'] || ''),
            bill_number: String(bill.BillNumber || ''),
            title: String(bill.LongDescription || bill.ShortDescription || ''),
            short_description: bill.ShortDescription ? String(bill.ShortDescription) : undefined,
            long_description: bill.LongDescription ? String(bill.LongDescription) : undefined,
            status: currentStatus ? String(currentStatus.Status || 'Unknown') : 'Unknown',
            introduced_date: bill.IntroducedDate ? String(bill.IntroducedDate) : undefined,
            last_action_date: currentStatus?.ActionDate ? String(currentStatus.ActionDate) : undefined,
            last_action: currentStatus?.HistoryLine ? String(currentStatus.HistoryLine) : undefined,
            subjects: [],
            source_url: `https://app.leg.wa.gov/billsummary?BillNumber=${bill.BillNumber}&Year=${biennium}`,
            sponsors: [],
          };
        });
      },

      async getBillDetails(billId: string): Promise<BillDetails | null> {
        // Parse the bill ID to extract biennium and bill number
        const [biennium, billNumber] = parseBillId(billId);
        if (!biennium || !billNumber) return null;

        const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <GetLegislation xmlns="http://WSLWebServices.leg.wa.gov/">
      <biennium>${biennium}</biennium>
      <billNumber>${billNumber}</billNumber>
    </GetLegislation>
  </soap:Body>
</soap:Envelope>`;

        try {
          const response = await http.post('/LegislationService.asmx', soapEnvelope, {
            headers: {
              'SOAPAction': 'http://WSLWebServices.leg.wa.gov/GetLegislation',
            },
          });

          const parsed = xmlParser.parse(response.data);
          const bill = extractFromSoapResponse(parsed, 'GetLegislationResult', 'Legislation');

          if (!bill) return null;

          // Get bill history
          const history = await getBillHistory(http, biennium, billNumber);

          return {
            id: String(bill.BillId || billId),
            bill_number: String(bill.BillNumber || billNumber),
            title: String(bill.LongDescription || bill.ShortDescription || ''),
            short_description: bill.ShortDescription ? String(bill.ShortDescription) : undefined,
            long_description: bill.LongDescription ? String(bill.LongDescription) : undefined,
            status: String(bill.CurrentStatus || 'Unknown'),
            introduced_date: bill.IntroducedDate ? String(bill.IntroducedDate) : undefined,
            last_action_date: bill.ActionDate ? String(bill.ActionDate) : undefined,
            last_action: bill.HistoryLine ? String(bill.HistoryLine) : undefined,
            subjects: [],
            source_url: `https://app.leg.wa.gov/billsummary?BillNumber=${billNumber}&Year=${biennium}`,
            sponsors: [],
            history,
          };
        } catch (error) {
          console.error('Error fetching bill details:', error);
          return null;
        }
      },

      async getVotes(billId: string): Promise<Vote[]> {
        const [biennium, billNumber] = parseBillId(billId);
        if (!biennium || !billNumber) return [];

        const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <GetRollCalls xmlns="http://WSLWebServices.leg.wa.gov/">
      <biennium>${biennium}</biennium>
      <billNumber>${billNumber}</billNumber>
    </GetRollCalls>
  </soap:Body>
</soap:Envelope>`;

        try {
          const response = await http.post('/LegislationService.asmx', soapEnvelope, {
            headers: {
              'SOAPAction': 'http://WSLWebServices.leg.wa.gov/GetRollCalls',
            },
          });

          const parsed = xmlParser.parse(response.data);
          const rollCalls = extractFromSoapResponse(parsed, 'GetRollCallsResult', 'RollCall') || [];
          const rollCallArray = Array.isArray(rollCalls) ? rollCalls : [rollCalls];

          const votes: Vote[] = [];
          for (const rollCall of rollCallArray) {
            const voteDate = String(rollCall.VoteDate || '');
            const votesList = rollCall.Votes?.Vote || [];
            const votesArray = Array.isArray(votesList) ? votesList : [votesList];

            for (const vote of votesArray) {
              votes.push({
                legislator_id: String(vote.MemberId || ''),
                vote_type: mapVoteType(vote.VOte || vote.Vote),
                vote_date: voteDate,
              });
            }
          }

          return votes;
        } catch (error) {
          console.error('Error fetching votes:', error);
          return [];
        }
      },
    };
  }

  return legislatureClient;
}

function getCurrentBiennium(): string {
  const year = new Date().getFullYear();
  // Bienniums are odd-numbered years (e.g., "2023-24" starts in 2023)
  const startYear = year % 2 === 0 ? year - 1 : year;
  return `${startYear}-${String(startYear + 1).slice(-2)}`;
}

function formatName(member: Record<string, unknown>): string {
  const first = member.FirstName || member.Name?.toString().split(' ')[0] || '';
  const last = member.LastName || member.Name?.toString().split(' ').slice(1).join(' ') || '';
  if (first && last) return `${first} ${last}`;
  return String(member.Name || member.LongName || '');
}

function determineChamber(member: Record<string, unknown>): 'house' | 'senate' {
  const agency = String(member.Agency || member.Chamber || '').toLowerCase();
  return agency.includes('senate') ? 'senate' : 'house';
}

function extractFromSoapResponse(
  parsed: Record<string, unknown>,
  resultName: string,
  itemName: string
): unknown {
  try {
    const envelope = parsed['soap:Envelope'] as Record<string, unknown>;
    const body = envelope['soap:Body'] as Record<string, unknown>;
    const responseKey = Object.keys(body).find(k => k.includes('Response'));
    if (!responseKey) return null;

    const response = body[responseKey] as Record<string, unknown>;
    const result = response[resultName] as Record<string, unknown>;
    if (!result) return null;

    return result[itemName];
  } catch {
    return null;
  }
}

function parseBillId(billId: string): [string | null, string | null] {
  // Bill ID format could be "2023-24/HB1234" or just "HB1234"
  const parts = billId.split('/');
  if (parts.length === 2) {
    return [parts[0], parts[1]];
  }
  // If no biennium, use current
  return [getCurrentBiennium(), billId];
}

async function getBillHistory(
  http: ReturnType<typeof axios.create>,
  biennium: string,
  billNumber: string
): Promise<Array<{ date: string; action: string }>> {
  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <GetLegislativeStatusChangesByBillNumber xmlns="http://WSLWebServices.leg.wa.gov/">
      <biennium>${biennium}</biennium>
      <billNumber>${billNumber}</billNumber>
    </GetLegislativeStatusChangesByBillNumber>
  </soap:Body>
</soap:Envelope>`;

  try {
    const response = await http.post('/LegislationService.asmx', soapEnvelope, {
      headers: {
        'SOAPAction': 'http://WSLWebServices.leg.wa.gov/GetLegislativeStatusChangesByBillNumber',
      },
    });

    const parsed = xmlParser.parse(response.data);
    const changes = extractFromSoapResponse(
      parsed,
      'GetLegislativeStatusChangesByBillNumberResult',
      'LegislativeStatusChange'
    ) || [];
    const changesArray = Array.isArray(changes) ? changes : [changes];

    return changesArray.map((change: Record<string, unknown>) => ({
      date: String(change.ActionDate || ''),
      action: String(change.HistoryLine || change.Status || ''),
    }));
  } catch {
    return [];
  }
}

function mapVoteType(vote: unknown): 'yea' | 'nay' | 'abstain' | 'excused' | 'absent' {
  const voteStr = String(vote || '').toLowerCase();
  if (voteStr.includes('yea') || voteStr === 'y') return 'yea';
  if (voteStr.includes('nay') || voteStr === 'n') return 'nay';
  if (voteStr.includes('excused')) return 'excused';
  if (voteStr.includes('absent')) return 'absent';
  return 'abstain';
}
