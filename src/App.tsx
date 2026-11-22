import { useState, useEffect } from 'react';
import { ReminderForm } from './components/ReminderForm';
import { ReminderList } from './components/ReminderList';
import { SearchBar } from './components/SearchBar';
import { Pagination } from './components/Pagination';
import { TestEmailCard } from './components/TestEmailCard';
import { useReminders, useCreateReminder, useDeleteReminder } from './hooks/useReminders';
import { useDebounce } from './hooks/useDebounce';
import { BrandMarkIcon, FileTextIcon, ClockIcon, CheckCircleIcon } from './components/icons';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data, isLoading } = useReminders({
    q: debouncedSearch || undefined,
    status: statusFilter || undefined,
    page,
    limit: 10,
  });

  const createMutation = useCreateReminder();
  const deleteMutation = useDeleteReminder();

  // Reset page when search/filter changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const handleCreate = async (input: Parameters<typeof createMutation.mutateAsync>[0]) => {
    await createMutation.mutateAsync(input);
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const totalCount = data?.total ?? 0;
  const activeReminders = data?.data?.filter((r) => r.status === 'terjadwal' || r.status === 'menunggu').length ?? 0;
  const sentReminders = data?.data?.filter((r) => r.status === 'terkirim').length ?? 0;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Executive Header & Brand */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <BrandMarkIcon size={34} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
                  Vendor Reminder
                </h1>
                <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Procurement Gateway
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Sistem penjadwalan dan reminder otomatis batas waktu pengumpulan file pengadaan.
              </p>
            </div>
          </div>

          {/* Real Telemetry Strip (Single Source of Truth) */}
          <div className="flex items-center gap-2 text-xs">
            <div className="px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-white/[0.08] flex items-center gap-2">
              <FileTextIcon size={13} className="text-zinc-400" />
              <span className="text-zinc-400">Total:</span>
              <span className="font-semibold tabular-nums text-zinc-100">{totalCount}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-white/[0.08] flex items-center gap-2">
              <ClockIcon size={13} className="text-blue-400" />
              <span className="text-zinc-400">Aktif:</span>
              <span className="font-semibold tabular-nums text-blue-300">{activeReminders}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-white/[0.08] flex items-center gap-2">
              <CheckCircleIcon size={13} className="text-emerald-400" />
              <span className="text-zinc-400">Terkirim:</span>
              <span className="font-semibold tabular-nums text-emerald-300">{sentReminders}</span>
            </div>
          </div>
        </header>

        {/* Main Content Split: Form vs List */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (5 cols) - Reminder Creation & Diagnostic */}
          <section className="lg:col-span-5 space-y-5">
            <div className="bg-[#111215] rounded-xl border border-white/[0.08] p-5 shadow-sm">
              <div className="mb-5 pb-3 border-b border-white/[0.06]">
                <h2 className="text-base font-semibold text-zinc-100 tracking-tight">
                  Buat Reminder Baru
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Lengkapi parameter pengadaan untuk menjadwalkan notifikasi email ke vendor.
                </p>
              </div>

              <ReminderForm onSubmit={handleCreate} isLoading={createMutation.isPending} />
            </div>

            <TestEmailCard />
          </section>

          {/* Right Column (7 cols) - Live Feed & Filter */}
          <section className="lg:col-span-7">
            <div className="bg-[#111215] rounded-xl border border-white/[0.08] p-5 shadow-sm">
              <div className="mb-4">
                <div className="flex items-center justify-between gap-4 mb-1">
                  <h2 className="text-base font-semibold text-zinc-100 tracking-tight">
                    Daftar Reminder Pengadaan
                  </h2>
                  {data && data.total > 0 && (
                    <span className="text-xs text-zinc-400 tabular-nums">
                      {data.total} entri tercatat
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400">
                  Pantau status pengiriman, jadwal berikutnya, dan riwayat notifikasi vendor.
                </p>
              </div>

              {/* Page-Level Control Bar */}
              <div className="mb-4 pt-3 border-t border-white/[0.06]">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  statusFilter={statusFilter}
                  onStatusChange={setStatusFilter}
                />
              </div>

              {/* List Rows */}
              <ReminderList
                reminders={data?.data || []}
                onDelete={handleDelete}
                isLoading={isLoading}
              />

              {/* Pagination */}
              {data && data.totalPages > 1 && (
                <Pagination
                  currentPage={page}
                  totalPages={data.totalPages}
                  onPageChange={setPage}
                />
              )}

              {/* Row counter info */}
              {data && data.total > 0 && (
                <div className="mt-4 text-center text-xs text-zinc-400 tabular-nums">
                  Menampilkan {((page - 1) * 10) + 1} – {Math.min(page * 10, data.total)} dari {data.total} reminder
                </div>
              )}
            </div>
          </section>
        </main>

        {/* Minimal Executive Footer */}
        <footer className="pt-6 border-t border-white/[0.06] text-center text-xs text-zinc-400">
          <p>© 2026 Vendor Reminder System — Secure Procurement Notification Engine</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
