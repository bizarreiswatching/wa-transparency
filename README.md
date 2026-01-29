# Washington State Political Transparency

A comprehensive platform for tracking money in Washington State politics, connecting campaign contributions, lobbying activities, and government contracts.

## Project Structure

```
wa-transparency/
├── apps/
│   ├── web/          # Next.js 14 static site
│   └── workers/      # BullMQ background jobs
├── packages/
│   └── db/           # Shared database package
├── scripts/          # Deployment and maintenance scripts
└── docs/             # Project documentation
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker and Docker Compose

### Development Setup

1. Clone the repository and install dependencies:

```bash
pnpm install
```

2. Start the development database and Redis:

```bash
pnpm docker:dev
```

3. Copy the environment file and configure:

```bash
cp .env.example .env
# Edit .env with your API keys
```

4. Run database migrations:

```bash
pnpm db:migrate
```

5. Start the development server:

```bash
pnpm dev
```

The site will be available at http://localhost:3000

### Running Workers

In a separate terminal:

```bash
pnpm workers:dev
```

## Data Sources

- **PDC (Public Disclosure Commission)**: Campaign contributions, expenditures, lobbying
- **USASpending.gov**: Federal contracts and grants
- **WA Legislature**: Bills, votes, legislators
- **WA Secretary of State**: Business registrations

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed architecture documentation.

## License

This project is open source under the MIT License.
