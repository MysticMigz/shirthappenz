'use client';
import { useState } from 'react';

export default function TaxReportsPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (from) params.append('from', from);
      if (to) params.append('to', to);
      const res = await fetch(`/api/admin/reports/tax?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch report');
      setReport(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!report?.orders) return;
    const header = 'Order Reference,Date,Net,VAT,Gross\n';
    const rows = report.orders.map((o: any) =>
      `${o.reference},${new Date(o.createdAt).toLocaleDateString()},${o.net},${o.vat},${o.gross}`
    ).join('\n');
    const csv = header + rows;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tax-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Tax Reports (VAT)</h1>
        <div className="flex gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">From</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="border rounded px-2 py-1" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">To</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} className="border rounded px-2 py-1" />
          </div>
          <button onClick={fetchReport} className="bg-purple-600 text-white px-4 py-2 rounded self-end">Generate Report</button>
          {report?.orders?.length > 0 && (
            <button onClick={exportCSV} className="bg-gray-200 text-gray-800 px-4 py-2 rounded self-end ml-2">Export CSV</button>
          )}
        </div>
        {loading && <div>Loading...</div>}
        {error && <div className="text-red-600 mb-4">{error}</div>}
        {report && (
          <div>
            <div className="mb-6">
              <div className="mb-2">Total Net Sales: <span className="font-semibold">£{report.totalNet?.toFixed(2)}</span></div>
              <div className="mb-2">Total VAT Collected: <span className="font-semibold">£{report.totalVAT?.toFixed(2)}</span></div>
              <div className="mb-2">Total Gross Sales: <span className="font-semibold">£{report.totalGross?.toFixed(2)}</span></div>
            </div>
            <table className="w-full border text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-2 py-1">Order Reference</th>
                  <th className="border px-2 py-1">Date</th>
                  <th className="border px-2 py-1">Net</th>
                  <th className="border px-2 py-1">VAT</th>
                  <th className="border px-2 py-1">Gross</th>
                </tr>
              </thead>
              <tbody>
                {report.orders?.map((o: any) => (
                  <tr key={o.reference}>
                    <td className="border px-2 py-1">{o.reference}</td>
                    <td className="border px-2 py-1">{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td className="border px-2 py-1">£{o.net.toFixed(2)}</td>
                    <td className="border px-2 py-1">£{o.vat.toFixed(2)}</td>
                    <td className="border px-2 py-1">£{o.gross.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
} 