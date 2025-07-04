import { useState } from 'react';
import * as XLSX from 'xlsx';

export default function App() {
  const [jsonData, setJsonData] = useState<unknown[]>([]);
  const [sheetNumber, setSheetNumber] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt: ProgressEvent<FileReader>) => {
      const bstr = evt.target?.result;
      if (typeof bstr !== 'string') return;

      const wb = XLSX.read(bstr, { type: 'binary' });

      if (sheetNumber >= wb.SheetNames.length || sheetNumber < 0) {
        alert(`Sheet number out of range. Available sheets: 0 to ${wb.SheetNames.length - 1}`);
        return;
      }

      const wsname = wb.SheetNames[sheetNumber];
      const ws = wb.Sheets[wsname];

      const rawData = XLSX.utils.sheet_to_json(ws, {
        raw: false,
      }) as Record<string, string | number>[];

      const processed = rawData.map(row => {
        const processedRow: Record<string, string | number> = {};
        for (const key in row) {
          const value = row[key];
          if (typeof value === 'string') {
            if (/^-?\d+(\.\d+)?$/.test(value)) {
              processedRow[key] = Number(value);
            } else {
              processedRow[key] = value;
            }
          } else {
            processedRow[key] = value;
          }
        }
        return processedRow;
      });

      setJsonData(processed);
      setCopied(false);
    };

    reader.readAsBinaryString(file);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sheet-${sheetNumber}-data.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className='p-4 max-w-3xl mx-auto'>
      <h1 className='text-2xl font-bold mb-4'>Excel to JSON Converter (TS)</h1>

      <div className='mb-4 flex flex-col md:flex-row items-start md:items-center gap-4'>
        <label className='font-medium'>
          Sheet Number:
          <input
            type='number'
            value={sheetNumber}
            min={0}
            onChange={e => setSheetNumber(Number(e.target.value))}
            className='ml-2 px-2 py-1 border rounded w-20'
          />
        </label>

        <input type='file' accept='.xlsx, .xls' onChange={handleFileUpload} />
      </div>

      {jsonData.length > 0 && (
        <>
          <div className='flex gap-2 mb-2'>
            <button onClick={handleCopy} className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'>
              {copied ? 'Copied!' : 'Copy JSON'}
            </button>

            <button onClick={handleDownload} className='bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700'>
              Download JSON
            </button>
          </div>

          <pre className='bg-gray-100 p-3 rounded overflow-auto max-h-[500px] text-sm'>
            {JSON.stringify(jsonData, null, 2)}
          </pre>
        </>
      )}
    </div>
  );
}
