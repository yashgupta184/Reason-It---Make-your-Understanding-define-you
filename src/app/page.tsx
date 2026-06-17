export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          ExamGuard AI
        </h1>
        <p className="text-xl text-slate-300 mb-8">
          Rebuilding credential trust infrastructure for the age of AI
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/educator"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Educator Dashboard
          </a>
        </div>
      </div>
    </main>
  )
}
