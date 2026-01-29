import { NextRequest, NextResponse } from 'next/server';
import { exportContributions, exportContracts, exportLobbying } from '@/lib/utils/export';

type ExportType = 'contributions' | 'contracts' | 'lobbying';

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  const exportType = params.type as ExportType;
  const searchParams = request.nextUrl.searchParams;
  const format = searchParams.get('format') || 'csv';
  const entityId = searchParams.get('entity_id') || undefined;

  if (!['contributions', 'contracts', 'lobbying'].includes(exportType)) {
    return NextResponse.json(
      { error: 'Invalid export type. Must be contributions, contracts, or lobbying.' },
      { status: 400 }
    );
  }

  if (!['csv', 'json'].includes(format)) {
    return NextResponse.json(
      { error: 'Invalid format. Must be csv or json.' },
      { status: 400 }
    );
  }

  try {
    let data: string;
    let contentType: string;
    let filename: string;

    switch (exportType) {
      case 'contributions':
        data = await exportContributions(entityId, format as 'csv' | 'json');
        break;
      case 'contracts':
        data = await exportContracts(entityId, format as 'csv' | 'json');
        break;
      case 'lobbying':
        data = await exportLobbying(entityId, format as 'csv' | 'json');
        break;
    }

    if (format === 'csv') {
      contentType = 'text/csv';
      filename = `${exportType}-export.csv`;
    } else {
      contentType = 'application/json';
      filename = `${exportType}-export.json`;
    }

    return new NextResponse(data, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Export failed' },
      { status: 500 }
    );
  }
}
