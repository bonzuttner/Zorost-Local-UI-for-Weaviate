// Weaviate export endpoint
// Developed by Zorost Intelligence

import { NextRequest, NextResponse } from 'next/server';
import { getWeaviateObjects } from '@/lib/weaviate';

export async function GET(
  request: NextRequest,
  { params }: { params: { className: string } }
) {
  try {
    const { className } = params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    
    if (!className) {
      return NextResponse.json({ error: 'Class name is required' }, { status: 400 });
    }

    // Fetch all objects from the class
    const result = await getWeaviateObjects(className, 1000);
    const allObjects = result.objects || [];

    if (format === 'csv') {
      // Convert to CSV format
      if (allObjects.length === 0) {
        return new NextResponse('', {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${className}_export.csv"`,
          },
        });
      }

      // Get all unique property keys
      const allKeys = new Set<string>();
      allObjects.forEach(obj => {
        Object.keys(obj.properties || {}).forEach(key => {
          allKeys.add(key);
        });
      });

      const headers = ['id', ...Array.from(allKeys)];
      const csvRows = [headers.join(',')];

      allObjects.forEach(obj => {
        const row = headers.map(header => {
          let value = '';
          if (header === 'id') {
            value = obj.id || '';
          } else {
            const propValue = obj.properties?.[header];
            value = propValue !== undefined ? String(propValue) : '';
          }
          // Escape commas and quotes in CSV
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        });
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');
      
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${className}_export.csv"`,
        },
      });
    } else {
      // Default to JSON format
      const exportData = {
        className,
        exportDate: new Date().toISOString(),
        totalObjects: allObjects.length,
        objects: allObjects,
      };

      return new NextResponse(JSON.stringify(exportData, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${className}_export.json"`,
        },
      });
    }
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { error: 'Failed to export data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
