'use client';
import { useState } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

  const exportExcel = () => {
    if (!report?.orders) return;
    // Add summary rows at the top
    const summary = [
      ['Tax Report (VAT)'],
      [`Period: ${from || 'All Time'} to ${to || 'All Time'}`],
      [`Total Net Sales: £${report.totalNet?.toFixed(2)}`],
      [`Total VAT Collected: £${report.totalVAT?.toFixed(2)}`],
      [`Total Gross Sales: £${report.totalGross?.toFixed(2)}`],
      [],
    ];
    const data = report.orders.map((o: any) => ([
      o.reference,
      new Date(o.createdAt).toLocaleDateString(),
      o.net,
      o.vat,
      o.gross
    ]));
    const ws = XLSX.utils.aoa_to_sheet([
      ...summary,
      ['Order Reference', 'Date', 'Net', 'VAT', 'Gross'],
      ...data
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tax Report');
    XLSX.writeFile(wb, 'tax-report.xlsx');
  };

  const exportPDF = () => {
    if (!report?.orders) return;
    const doc = new jsPDF();
    doc.text('Tax Report (VAT)', 14, 16);
    doc.text(`Period: ${from || 'All Time'} to ${to || 'All Time'}`, 14, 24);
    doc.text(`Total Net Sales: £${report.totalNet?.toFixed(2)}`, 14, 32);
    doc.text(`Total VAT Collected: £${report.totalVAT?.toFixed(2)}`, 14, 40);
    doc.text(`Total Gross Sales: £${report.totalGross?.toFixed(2)}`, 14, 48);
    autoTable(doc, {
      startY: 56,
      head: [['Order Reference', 'Date', 'Net', 'VAT', 'Gross']],
      body: report.orders.map((o: any) => [
        o.reference,
        new Date(o.createdAt).toLocaleDateString(),
        `£${o.net.toFixed(2)}`,
        `£${o.vat.toFixed(2)}`,
        `£${o.gross.toFixed(2)}`
      ]),
    });
    doc.save('tax-report.pdf');
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
            <>
              <button onClick={exportExcel} className="bg-green-200 text-green-800 px-4 py-2 rounded self-end ml-2">Export Excel</button>
              <button onClick={exportPDF} className="bg-blue-200 text-blue-800 px-4 py-2 rounded self-end ml-2">Export PDF</button>
            </>
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