"use client";

import { useEffect, useState, useCallback } from "react";
// Pastikan file src/lib/supabase.ts sudah dibuat ya!
import { supabase } from "@/lib/supabase"; 
import { ArrowLeft, Search, Download, Eye, AlertCircle } from "lucide-react";
import Link from "next/link";

interface Reminder {
  id: string;
  name: string;
  nopol: string;
  valid_until: string;
  photo_url: string | null;
}

export default function ListPage() {
  const [data, setData] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  // --- PERBAIKAN: Definisi fungsi ditaruh DI ATAS useEffect ---
  const fetchData = useCallback(async () => {
    // Ambil data diurutkan berdasarkan tanggal jatuh tempo (ASCENDING)
    const { data: result } = await supabase
      .from('reminders')
      .select('*')
      .order('valid_until', { ascending: true }); 
    
    if (result) setData(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]); 
  // -----------------------------------------------------------

  const filteredData = data.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    item.nopol.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  };

  const isExpired = (dateStr: string) => {
    return new Date(dateStr) < new Date();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <Link href="/" className="bg-white p-2 rounded-full shadow text-slate-600"><ArrowLeft size={20}/></Link>
        <span className="text-xs font-medium text-slate-500">{today}</span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Daftar Arsip</h1>
        <p className="text-sm text-slate-500">Diurutkan berdasarkan masa berlaku</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-3 text-slate-400" size={18} />
        <input 
          className="w-full p-3 pl-10 rounded-xl border border-slate-200 shadow-sm outline-none focus:border-emerald-500"
          placeholder="Cari Nama / Nopol..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* List Card */}
      <div className="space-y-4 pb-10">
        {loading ? (
          <p className="text-center text-slate-400">Memuat data...</p>
        ) : filteredData.length === 0 ? (
          <p className="text-center text-slate-400">Data tidak ditemukan.</p>
        ) : (
          filteredData.map((item) => {
            const expired = isExpired(item.valid_until);
            return (
              <div key={item.id} className={`bg-white p-4 rounded-xl shadow-sm border-l-4 ${expired ? 'border-l-red-500' : 'border-l-emerald-500'} flex justify-between items-start`}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-800 text-lg uppercase">{item.nopol}</span>
                    {expired && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold flex items-center gap-1"><AlertCircle size={10}/> LEWAT</span>}
                  </div>
                  <p className="text-sm text-slate-600 font-medium uppercase">{item.name}</p>
                  <p className={`text-xs mt-2 font-bold ${expired ? 'text-red-500' : 'text-slate-400'}`}>
                    Berlaku s/d: {formatDate(item.valid_until)}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  {item.photo_url && (
                    <>
                      <button 
                        onClick={() => window.open(item.photo_url || '', '_blank')}
                        className="bg-slate-100 p-2 rounded-lg text-slate-600 hover:bg-slate-200"
                        title="Lihat Full"
                      >
                        <Eye size={18}/>
                      </button>
                      <a 
                        href={item.photo_url} 
                        download={`Arsip-${item.nopol}`}
                        className="bg-emerald-100 p-2 rounded-lg text-emerald-600 hover:bg-emerald-200 flex justify-center"
                        title="Download"
                      >
                        <Download size={18}/>
                      </a>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}