import { Card } from '@/components/ui/card';

export const metadata = {
  title: 'About',
  description: 'Learn about the WA Transparency project, our methodology, and data sources.',
};

export default function AboutPage() {
  return (
    <div className="container py-8">
      <h1 className="mb-8 text-3xl font-bold">About WA Transparency</h1>

      <div className="prose prose-lg max-w-none">
        <Card className="mb-8 p-6">
          <h2 className="mb-4 text-xl font-semibold">Our Mission</h2>
          <p className="text-gray-700">
            WA Transparency aims to make political influence in Washington State
            more visible and understandable. By connecting campaign contributions,
            lobbying activities, and government contracts, we help citizens follow
            the money and understand who shapes policy in our state.
          </p>
        </Card>

        <Card className="mb-8 p-6">
          <h2 className="mb-4 text-xl font-semibold">Data Sources</h2>
          <ul className="space-y-4 text-gray-700">
            <li>
              <strong>Washington Public Disclosure Commission (PDC)</strong>
              <br />
              Campaign contributions, expenditures, and lobbying registrations.
              Updated daily.
            </li>
            <li>
              <strong>USASpending.gov</strong>
              <br />
              Federal contracts and grants awarded to Washington businesses.
              Updated weekly.
            </li>
            <li>
              <strong>Washington State Legislature</strong>
              <br />
              Bills, votes, and legislator information. Updated during sessions.
            </li>
            <li>
              <strong>Washington Secretary of State</strong>
              <br />
              Business registration data for entity verification.
            </li>
          </ul>
        </Card>

        <Card className="mb-8 p-6">
          <h2 className="mb-4 text-xl font-semibold">Methodology</h2>
          <p className="text-gray-700 mb-4">
            We use a combination of automated and manual processes to connect
            records across different data sources:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>
              <strong>Deterministic Matching:</strong> Exact name, EIN, and address
              matching for high-confidence connections.
            </li>
            <li>
              <strong>Fuzzy Matching:</strong> Similarity algorithms to catch
              variations in names and addresses.
            </li>
            <li>
              <strong>AI-Assisted Disambiguation:</strong> For uncertain matches,
              we use AI to help determine likely connections.
            </li>
            <li>
              <strong>Manual Review:</strong> Edge cases are flagged for human
              review to ensure accuracy.
            </li>
          </ul>
        </Card>

        <Card className="mb-8 p-6">
          <h2 className="mb-4 text-xl font-semibold">Limitations</h2>
          <p className="text-gray-700">
            While we strive for accuracy, please note:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mt-4">
            <li>
              Data is only as accurate as the original source filings.
            </li>
            <li>
              Entity matching is probabilistic and may occasionally connect
              unrelated entities with similar names.
            </li>
            <li>
              Some connections may be missed due to name variations or incomplete
              data.
            </li>
            <li>
              We do not verify the accuracy of self-reported information in
              filings.
            </li>
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">Contact</h2>
          <p className="text-gray-700">
            Have questions, corrections, or feedback? We&apos;d love to hear from
            you. Please reach out via our GitHub repository or email.
          </p>
        </Card>
      </div>
    </div>
  );
}
