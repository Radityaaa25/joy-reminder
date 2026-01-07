"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  ArrowLeft, Search, Download, AlertCircle, Calendar, 
  Image as ImageIcon, Trash2, AlertTriangle, Loader2, Share2 
} from "lucide-react"; 
import Link from "next/link";
import { toast } from "sonner"; 

interface Reminder {
  id: string;
  name: string;
  nopol: string;
  valid_until: string;
  photo_url: string | null;
  photo_url_2: string | null;
}

export default function ListPage() {
  const [data, setData] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Reminder | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: result } = await supabase
      .from('reminders')
      .select('*')
      .order('valid_until', { ascending: true }); 
    
    if (result) setData(result);
    setLoading(false);
  };

  const confirmDelete = (item: Reminder) => {
    setDeleteTarget(item);
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      const filesToRemove = [];
      if (deleteTarget.photo_url) {
        try {
          const urlObj = new URL(deleteTarget.photo_url);
          const path = urlObj.pathname.split('/reminder-docs/')[1];
          if (path) filesToRemove.push(decodeURIComponent(path));
        } catch (e) { console.log("Skip invalid URL", e); }
      }
      if (deleteTarget.photo_url_2) {
        try {
          const urlObj = new URL(deleteTarget.photo_url_2);
          const path = urlObj.pathname.split('/reminder-docs/')[1];
          if (path) filesToRemove.push(decodeURIComponent(path));
        } catch (e) { console.log("Skip invalid URL", e); }
      }

      if (filesToRemove.length > 0) {
        await supabase.storage.from('reminder-docs').remove(filesToRemove);
      }

      const { error } = await supabase.from('reminders').delete().eq('id', deleteTarget.id);
      if (error) throw error;

      setData(data.filter(item => item.id !== deleteTarget.id));
      toast.success("Data berhasil dimusnahkan");
      setDeleteTarget(null);

    } catch (err) {
      console.error(err);
      toast.error("Gagal menghapus data");
    } finally {
      setIsDeleting(false);
    }
  };

  // --- FITUR SHARE GAMBAR LANGSUNG ---
  const handleShare = async (nopol: string, photoUrl: string) => {
    if (!photoUrl) return;

    const toastId = toast.loading("Menyiapkan gambar...");

    try {
      if (navigator.share && navigator.canShare) {
        const response = await fetch(photoUrl);
        const blob = await response.blob();
        const file = new File([blob], `${nopol}.jpg`, { type: "image/jpeg" });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `Dokumen ${nopol}`,
            text: `Berikut dokumen kendaraan ${nopol}`
          });
          toast.dismiss(toastId);
          toast.success("Berhasil membuka menu share!");
          return; 
        }
      }
    } catch (error) {
      console.log("Gagal share native, pindah ke fallback", error);
    }

    toast.dismiss(toastId);
    const text = `Dokumen Kendaraan ${nopol}: ${photoUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const filteredData = data.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    item.nopol.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  };

  const isExpired = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    now.setHours(0,0,0,0);
    return d < now;
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 pb-20 relative">
      {/* Modal Hapus */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
            <div className="bg-red-50 p-6 flex flex-col items-center text-center border-b border-red-100">
              <div className="bg-red-100 p-3 rounded-full mb-3">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Hapus Permanen?</h3>
              <p className="text-sm text-slate-500 mt-1">Data <strong>{deleteTarget.nopol}</strong> akan hilang selamanya.</p>
            </div>
            <div className="p-4 bg-white flex gap-3">
              <button disabled={isDeleting} onClick={() => setDeleteTarget(null)} className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">Batal</button>
              <button disabled={isDeleting} onClick={executeDelete} className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2">
                {isDeleting ? <Loader2 className="animate-spin h-5 w-5"/> : <Trash2 className="h-5 w-5"/>}
                {isDeleting ? "..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6 sticky top-0 bg-slate-100 py-2 z-10">
        <Link href="/" className="bg-white p-2 rounded-full shadow text-slate-700 hover:bg-slate-200 transition">
          <ArrowLeft size={24}/>
        </Link>
        <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-full shadow-sm">{today}</span>
      </div>

      <div className="mb-6 px-1">
        <h1 className="text-2xl font-bold text-slate-800">Arsip Pajak</h1>
        <p className="text-sm text-slate-500">Total {filteredData.length} data ditemukan</p>
      </div>

      <div className="relative mb-6 shadow-sm">
        <div className="absolute left-3 top-3.5 text-slate-400">
          <Search size={20} />
        </div>
        <input 
          className="w-full p-3 pl-10 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          placeholder="Cari Nama atau Nopol..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400"><Calendar className="animate-bounce h-8 w-8 mb-2"/><p>Memuat data...</p></div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl shadow-sm border border-dashed border-slate-300"><p className="text-slate-400 font-medium">Tidak ada data ditemukan.</p></div>
        ) : (
          filteredData.map((item) => {
            const expired = isExpired(item.valid_until);
            return (
              <div key={item.id} className={`bg-white p-4 rounded-xl shadow-sm border-l-[6px] transition-all hover:shadow-md ${expired ? 'border-l-red-500 bg-red-50/30' : 'border-l-emerald-500'}`}>
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-black text-slate-800 text-xl font-mono tracking-tight uppercase">{item.nopol}</span>
                        {expired && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-red-200"><AlertCircle size={10}/> LEWAT</span>}
                      </div>
                      <div className="text-sm font-bold uppercase text-slate-600 mb-2">{item.name}</div>
                      <div className={`text-xs font-bold px-2 py-1 rounded w-fit ${expired ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                        Masa Berlaku: {formatDate(item.valid_until)}
                      </div>
                    </div>
                    <button onClick={() => confirmDelete(item)} className="bg-slate-100 text-slate-400 p-2 rounded-xl hover:bg-red-100 hover:text-red-600 transition-all active:scale-90"><Trash2 size={20}/></button>
                  </div>

                  {(item.photo_url || item.photo_url_2) && (
                    <div className="grid grid-cols-2 gap-2 mt-2 border-t border-slate-100 pt-3">
                        {/* FOTO 1 */}
                        {item.photo_url ? (
                            <div className="bg-slate-50 p-2 rounded-lg flex flex-col gap-2">
                                <div onClick={() => window.open(item.photo_url || '', '_blank')} className="flex items-center gap-2 cursor-pointer group">
                                  <ImageIcon size={18} className="text-slate-400 group-hover:text-blue-500"/>
                                  <span className="text-[10px] font-bold text-slate-600 group-hover:text-blue-700">FOTO 1</span>
                                </div>
                                <div className="flex gap-1 mt-1">
                                    <button onClick={() => handleShare(item.nopol, item.photo_url!)} className="flex-1 bg-white p-1.5 rounded shadow-sm text-blue-500 hover:bg-blue-50" title="Share Gambar"><Share2 size={16} className="mx-auto"/></button>
                                    <a href={item.photo_url} download onClick={(e) => e.stopPropagation()} className="flex-1 bg-emerald-100 p-1.5 rounded shadow-sm text-emerald-700 hover:bg-emerald-200 text-center"><Download size={16} className="mx-auto"/></a>
                                </div>
                            </div>
                        ) : null}

                        {/* FOTO 2 */}
                        {item.photo_url_2 ? (
                            <div className="bg-slate-50 p-2 rounded-lg flex flex-col gap-2">
                                <div onClick={() => window.open(item.photo_url_2 || '', '_blank')} className="flex items-center gap-2 cursor-pointer group">
                                  <ImageIcon size={18} className="text-slate-400 group-hover:text-blue-500"/>
                                  <span className="text-[10px] font-bold text-slate-600 group-hover:text-blue-700">FOTO 2</span>
                                </div>
                                <div className="flex gap-1 mt-1">
                                    <button onClick={() => handleShare(item.nopol, item.photo_url_2!)} className="flex-1 bg-white p-1.5 rounded shadow-sm text-blue-500 hover:bg-blue-50" title="Share Gambar"><Share2 size={16} className="mx-auto"/></button>
                                    <a href={item.photo_url_2} download onClick={(e) => e.stopPropagation()} className="flex-1 bg-emerald-100 p-1.5 rounded shadow-sm text-emerald-700 hover:bg-emerald-200 text-center"><Download size={16} className="mx-auto"/></a>
                                </div>
                            </div>
                        ) : null}
                    </div>
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