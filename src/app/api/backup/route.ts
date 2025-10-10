// Database Backup and Export API
// Supports full database export, import, and cloud transfer
// Developed by Zorost Intelligence

import { NextRequest, NextResponse } from 'next/server';
import { getWeaviateClient, getWeaviateSchema } from '@/lib/weaviate';
import { exportObjectsToJSON } from '@/lib/weaviate-advanced';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'exportDatabase': {
        return await handleExportDatabase(params);
      }

      case 'exportClass': {
        const { className, format = 'json' } = params;
        if (!className) {
          return NextResponse.json(
            { success: false, error: 'className is required' },
            { status: 400 }
          );
        }
        return await handleExportClass(className, format);
      }

      case 'exportSchema': {
        return await handleExportSchema();
      }

      case 'importData': {
        const { data, className, merge = false } = params;
        if (!data || !className) {
          return NextResponse.json(
            { success: false, error: 'data and className are required' },
            { status: 400 }
          );
        }
        return await handleImportData(className, data, merge);
      }

      case 'createBackup': {
        const { backupId = `backup-${Date.now()}` } = params;
        return await handleCreateBackup(backupId);
      }

      case 'restoreBackup': {
        const { backupId } = params;
        if (!backupId) {
          return NextResponse.json(
            { success: false, error: 'backupId is required' },
            { status: 400 }
          );
        }
        return await handleRestoreBackup(backupId);
      }

      case 'listBackups': {
        return await handleListBackups();
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Backup API error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

async function handleExportDatabase(params: { format?: string }) {
  try {
    const client = getWeaviateClient();
    const schema = await client.schema.getter().do();
    
    const allData: Record<string, unknown[]> = {};
    const classes = schema.classes || [];

    for (const classObj of classes) {
      const className = classObj.class;
      const result = await exportObjectsToJSON(className, 10000);
      
      if (result.success) {
        allData[className] = result.data || [];
      }
    }

    const exportData = {
      version: '2.0.0',
      exportDate: new Date().toISOString(),
      application: 'Weaviate Local App by Zorost Intelligence',
      schema: schema,
      data: allData,
      metadata: {
        totalClasses: classes.length,
        totalObjects: Object.values(allData).reduce((sum, arr) => sum + arr.length, 0),
      },
    };

    return NextResponse.json({
      success: true,
      data: exportData,
      downloadUrl: `/api/backup/download?type=full&timestamp=${Date.now()}`,
    });
  } catch (error) {
    console.error('Export database error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

async function handleExportClass(className: string, format: string) {
  try {
    const result = await exportObjectsToJSON(className, 10000);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to export class' },
        { status: 500 }
      );
    }

    const exportData = {
      version: '2.0.0',
      exportDate: new Date().toISOString(),
      className: className,
      format: format,
      data: result.data,
      metadata: result.metadata,
    };

    if (format === 'csv') {
      const csvData = convertToCSV(result.data || []);
      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${className}-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: exportData,
    });
  } catch (error) {
    console.error('Export class error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

async function handleExportSchema() {
  try {
    const schema = await getWeaviateSchema();
    
    return NextResponse.json({
      success: true,
      data: {
        version: '2.0.0',
        exportDate: new Date().toISOString(),
        schema: schema,
      },
    });
  } catch (error) {
    console.error('Export schema error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

async function handleImportData(className: string, data: unknown[], merge: boolean) {
  try {
    const client = getWeaviateClient();
    
    let batcher = client.batch.objectsBatcher();
    let successCount = 0;
    const errors: Array<{ index: number; error: string }> = [];

    for (let i = 0; i < data.length; i++) {
      const item = data[i] as Record<string, unknown>;
      
      try {
        batcher = batcher.withObject({
          class: className,
          properties: item,
        });
        
        if ((i + 1) % 100 === 0 || i === data.length - 1) {
          const result = await batcher.do();
          
          if (Array.isArray(result)) {
            result.forEach((res, idx) => {
              if (res.result?.errors) {
                errors.push({
                  index: i - (result.length - idx - 1),
                  error: res.result.errors.error?.[0]?.message || 'Unknown error',
                });
              } else {
                successCount++;
              }
            });
          }
          
          batcher = client.batch.objectsBatcher();
        }
      } catch (error) {
        errors.push({ index: i, error: String(error) });
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      successCount,
      errorCount: errors.length,
      errors: errors.slice(0, 10),
    });
  } catch (error) {
    console.error('Import data error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

async function handleCreateBackup(backupId: string) {
  try {
    const client = getWeaviateClient();
    
    const result = await client.backup
      .creator()
      .withIncludeClassNames('*')
      .withBackend('filesystem')
      .withBackupId(backupId)
      .withWaitForCompletion(true)
      .do();

    return NextResponse.json({
      success: true,
      backupId,
      status: result.status,
      path: result.path,
    });
  } catch (error) {
    console.error('Create backup error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

async function handleRestoreBackup(backupId: string) {
  try {
    const client = getWeaviateClient();
    
    const result = await client.backup
      .restorer()
      .withIncludeClassNames('*')
      .withBackend('filesystem')
      .withBackupId(backupId)
      .withWaitForCompletion(true)
      .do();

    return NextResponse.json({
      success: true,
      backupId,
      status: result.status,
    });
  } catch (error) {
    console.error('Restore backup error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

async function handleListBackups() {
  try {
    const client = getWeaviateClient();
    
    const result = await client.backup
      .getter()
      .withBackend('filesystem')
      .do();

    return NextResponse.json({
      success: true,
      backups: result || [],
    });
  } catch (error) {
    console.error('List backups error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

function convertToCSV(data: unknown[]): string {
  if (!data || data.length === 0) return '';
  
  const items = data as Record<string, unknown>[];
  const headers = Object.keys(items[0]);
  
  const csvRows = [
    headers.join(','),
    ...items.map(item =>
      headers.map(header => {
        const value = item[header];
        const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
        return `"${stringValue.replace(/"/g, '""')}"`;
      }).join(',')
    ),
  ];
  
  return csvRows.join('\n');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    if (type === 'full') {
      const result = await handleExportDatabase({ format: 'json' });
      const data = await result.json();
      
      const jsonData = JSON.stringify(data.data, null, 2);
      
      return new NextResponse(jsonData, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="weaviate-full-backup-${Date.now()}.json"`,
        },
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid download type',
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

