export default function ReportPage({ params }: { params: { sessionId: string } }) {
  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <h1 className="text-3xl font-bold mb-8">Integrity Report {params.sessionId}</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-slate-600">Report placeholder</p>
      </div>
    </main>
  )
}
