import React from 'react';
import { SearchIcon } from './icons';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  statusFilter,
  onStatusChange,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-2.5">
      <div className="relative flex-1">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
          <SearchIcon size={16} />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Cari nomor dokumen, judul, vendor, atau email..."
          className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-900/60 border border-white/[0.08] text-zinc-100 placeholder-zinc-500 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
        />
      </div>
      <select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
        className="px-3.5 py-2 text-sm bg-zinc-900/60 border border-white/[0.08] text-zinc-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
      >
        <option value="" className="bg-zinc-900 text-zinc-200">Semua Status</option>
        <option value="menunggu" className="bg-zinc-900 text-zinc-200">Menunggu</option>
        <option value="terjadwal" className="bg-zinc-900 text-zinc-200">Terjadwal</option>
        <option value="terkirim" className="bg-zinc-900 text-zinc-200">Terkirim</option>
        <option value="gagal" className="bg-zinc-900 text-zinc-200">Gagal</option>
      </select>
    </div>
  );
};
