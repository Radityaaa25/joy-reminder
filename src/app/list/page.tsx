"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { 
  ArrowLeft, Search, Download, AlertCircle, Calendar, 
  Image as ImageIcon, Trash2, AlertTriangle, Loader2, Share2, Filter, Edit, Save, Camera, X, ChevronDown, Check 
} from "lucide-react"; 
import Link from "next/link";
import { toast } from "sonner"; 
import imageCompression from 'browser-image-compression';

interface Reminder {
  id: string;
  name: string;
  nopol: string;
  valid_until: string;
  photo_url: string | null;
  photo_url_2: string | null;
  photo_url_3: string | null;
  photo_url_4: string | null;
}

export default function ListPage() {
  const [data, setData] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Reminder | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [renewTarget, setRenewTarget] = useState<Reminder | null>(null);
  const [isRenewing, setIsRenewing] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newPhotos, setNewPhotos] = useState<(File | null)[]>([null, null, null, null]);

  const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const months = [{v: "1", l: "Januari"}, {v: "2", l: "Februari"}, {v: "3", l: "Maret"}, {v: "4", l: "April"}, {v: "5", l: "Mei"}, {v: "6", l: "Juni"}, {v: "7", l: "Juli"}, {v: "8", l: "Agustus"}, {v: "9", l: "September"}, {v: "10", l: "Oktober"}, {v: "11", l: "November"}, {v: "12", l: "Desember"}];

  useEffect(() => { fetchData(); }, []);
  const fetchData = async () => {
    const { data: result } = await supabase.from('reminders').select('*').order('valid_until', { ascending: true }); 
    if (result) setData(result);
    setLoading(false);
  };
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear(); const startYear = currentYear - 5; const endYear = currentYear + 10; const years = [];
    for (let i = startYear; i <= endYear; i++) years.push(i.toString());
    return years;
  }, []);
  const compressImage = async (file: File) => {
    const options = { maxSizeMB: 0.8, maxWidthOrHeight: 1920, useWebWorker: true };
    try { return await imageCompression(file, options); } 
    catch (error) { console.log("Gagal kompres:", error); return file; }
  };

  const executeDelete = async () => {
    if (!deleteTarget) return; setIsDeleting(true);
    try {
      const filesToRemove: string[] = []; const photos = [deleteTarget.photo_url, deleteTarget.photo_url_2, deleteTarget.photo_url_3, deleteTarget.photo_url_4];
      photos.forEach(url => { if (url) { try { const path = new URL(url).pathname.split('/reminder-docs/')[1]; if (path) filesToRemove.push(decodeURIComponent(path)); } catch (e) { console.log("Skip URL", e); } } });
      if (filesToRemove.length > 0) await supabase.storage.from('reminder-docs').remove(filesToRemove);
      const { error } = await supabase.from('reminders').delete().eq('id', deleteTarget.id); if (error) throw error;
      setData(data.filter(item => item.id !== deleteTarget.id)); toast.success("Data berhasil dihapus"); setDeleteTarget(null);
    } catch (err) { console.error(err); toast.error("Gagal menghapus data"); } finally { setIsDeleting(false); }
  };
  const openRenewModal = (item: Reminder) => { setRenewTarget(item); setNewDate(item.valid_until); setNewPhotos([null, null, null, null]); };
  const handleRenewFileChange = (index: number, file: File | null) => { const updated = [...newPhotos]; updated[index] = file; setNewPhotos(updated); };
  const executeRenew = async () => {
    if (!renewTarget || !newDate) return toast.error("Tanggal wajib diisi!"); setIsRenewing(true);
    try {
      const updatedUrls = [renewTarget.photo_url, renewTarget.photo_url_2, renewTarget.photo_url_3, renewTarget.photo_url_4];
      const safeName = renewTarget.name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase(); const safeNopol = renewTarget.nopol.replace(/[^a-zA-Z0-9]/g, "").toUpperCase(); const timestamp = Date.now();
      for (let i = 0; i < 4; i++) {
        if (newPhotos[i]) {
            const oldUrl = updatedUrls[i]; if (oldUrl) { try { const path = new URL(oldUrl).pathname.split('/reminder-docs/')[1]; if (path) await supabase.storage.from('reminder-docs').remove([decodeURIComponent(path)]); } catch (e) { console.log("Skip delete old", e); } }
            const compressed = await compressImage(newPhotos[i] as File);
            const fileName = `${safeName}/${safeNopol}/RENEW-${i+1}-${timestamp}.jpg`;
            const { error: upErr } = await supabase.storage.from('reminder-docs').upload(fileName, compressed); if (upErr) throw upErr;
            const { data: publicData } = supabase.storage.from('reminder-docs').getPublicUrl(fileName); updatedUrls[i] = publicData.publicUrl;
        }
      }
      const { error } = await supabase.from('reminders').update({ valid_until: newDate, photo_url: updatedUrls[0], photo_url_2: updatedUrls[1], photo_url_3: updatedUrls[2], photo_url_4: updatedUrls[3] }).eq('id', renewTarget.id); if (error) throw error;
      setData(data.map(item => item.id === renewTarget.id ? { ...item, valid_until: newDate, photo_url: updatedUrls[0], photo_url_2: updatedUrls[1], photo_url_3: updatedUrls[2], photo_url_4: updatedUrls[3] } : item));
      toast.success("Data Berhasil Diperbarui!"); setRenewTarget(null);
    } catch (err) { console.error(err); toast.error("Gagal memperbarui data."); } finally { setIsRenewing(false); }
  };
  const handleShare = async (nopol: string, photoUrl: string) => {
    if (!photoUrl) return; const toastId = toast.loading("Siap share...");
    try { if (navigator.share && navigator.canShare) { const response = await fetch(photoUrl); const blob = await response.blob(); const file = new File([blob], `${nopol}.jpg`, { type: "image/jpeg" }); if (navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: `Dokumen ${nopol}` }); toast.dismiss(toastId); return; } } } catch (e) { console.log(e); }
    toast.dismiss(toastId); window.open(`https://wa.me/?text=${encodeURIComponent(`Dokumen ${nopol}: ${photoUrl}`)}`, '_blank');
  };

  const filteredData = data.filter(item => {
    const itemDate = new Date(item.valid_until); const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.nopol.toLowerCase().includes(search.toLowerCase()); const matchesMonth = filterMonth === "all" || (itemDate.getMonth() + 1).toString() === filterMonth; const matchesYear = filterYear === "all" || itemDate.getFullYear().toString() === filterYear; return matchesSearch && matchesMonth && matchesYear;
  });
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  const isExpired = (dateStr: string) => { const d = new Date(dateStr); const now = new Date(); now.setHours(0,0,0,0); return d < now; };
  const getMonthLabel = () => { if (filterMonth === "all") return "Semua Bulan"; return months.find(m => m.v === filterMonth)?.l || "Bulan"; };
  const getYearLabel = () => { if (filterYear === "all") return "Thn"; return filterYear; };

  return (
    <div className="min-h-screen bg-slate-100 p-4 pb-20 relative">
      {(isMonthOpen || isYearOpen) && (<div className="fixed inset-0 z-40 bg-transparent" onClick={() => {setIsMonthOpen(false); setIsYearOpen(false);}}></div>)}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
             <div className="flex justify-center mb-4"><div className="bg-red-100 p-3 rounded-full"><AlertTriangle className="h-8 w-8 text-red-600" /></div></div>
             <h3 className="text-lg font-bold text-center mb-2">Hapus Data?</h3>
             <p className="text-center text-slate-500 mb-6">Data {deleteTarget.nopol} akan hilang permanen.</p>
             <div className="flex gap-2">
               <button disabled={isDeleting} onClick={() => setDeleteTarget(null)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600">Batal</button>
               <button disabled={isDeleting} onClick={executeDelete} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold flex justify-center items-center gap-2">{isDeleting && <Loader2 className="animate-spin" size={18}/>} Hapus</button>
             </div>
          </div>
        </div>
      )}

      {/* MODAL PERBARUI - TANGGAL LEBIH TEGAS */}
      {renewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
             <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
                <div className="flex items-center gap-2"><Edit size={20}/><span className="font-bold">Perbarui Pajak</span></div>
                <button onClick={() => setRenewTarget(null)}><X size={24}/></button>
             </div>
             <div className="p-5 overflow-y-auto">
                <div className="mb-4 text-center">
                    <h2 className="text-2xl font-black text-slate-800 font-mono tracking-tight">{renewTarget.nopol}</h2>
                    <p className="text-sm font-bold text-slate-500 uppercase">{renewTarget.name}</p>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-600 block mb-1">MASA BERLAKU BARU</label>
                        {/* UPDATE: Border-400, Text-900 */}
                        <input 
                            type="date" 
                            className="w-full text-lg font-bold text-slate-900 bg-slate-100 border-2 border-slate-400 rounded-xl p-3 focus:border-blue-500 outline-none transition-all" 
                            value={newDate} 
                            onChange={(e) => setNewDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-600 block mb-2">UPDATE FOTO (Opsional)</label>
                        <div className="grid grid-cols-2 gap-3">
                            {[0, 1, 2, 3].map((idx) => (
                                <label key={idx} className={`cursor-pointer border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${
                                  newPhotos[idx] 
                                  ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' 
                                  : 'bg-slate-100 border-slate-400 text-slate-600 hover:bg-slate-200 hover:border-slate-500'
                                }`}>
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleRenewFileChange(idx, e.target.files?.[0] || null)}/>
                                    <Camera size={24} strokeWidth={1.5}/>
                                    <span className="text-xs font-bold text-center">{newPhotos[idx] ? "File Terpilih" : `Ganti Foto ${idx+1}`}</span>
                                </label>
                            ))}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2 text-center font-medium">*Biarkan kosong jika tidak ingin mengganti foto lama.</p>
                    </div>
                </div>
             </div>
             <div className="p-4 border-t border-slate-200 bg-slate-50">
                <button onClick={executeRenew} disabled={isRenewing} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg flex justify-center items-center gap-2 active:scale-95 transition-all">{isRenewing ? <Loader2 className="animate-spin"/> : <Save size={20}/>}{isRenewing ? "Menyimpan..." : "SIMPAN PEMBARUAN"}</button>
             </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6 sticky top-0 bg-slate-100 py-2 z-10">
        <Link href="/" className="bg-white p-2 rounded-full shadow text-slate-700 hover:bg-slate-200 transition"><ArrowLeft size={24}/></Link>
        <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-full shadow-sm">{today}</span>
      </div>

      <div className="mb-4 px-1">
        <h1 className="text-2xl font-bold text-slate-800">Arsip Pajak</h1>
        <p className="text-sm text-slate-500">Total {filteredData.length} data ditemukan</p>
      </div>

      <div className="space-y-3 mb-6">
        <div className="relative shadow-sm">
          <div className="absolute left-3 top-3.5 text-slate-500"><Search size={20} /></div>
          <input className="w-full p-2.5 pl-10 rounded-xl border-2 border-slate-200 bg-white text-slate-900 placeholder:text-slate-500 placeholder:font-medium outline-none focus:border-blue-500 transition-all" placeholder="Cari Nama atau Nopol..." value={search} onChange={e => setSearch(e.target.value)}/>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
             <button onClick={() => {setIsMonthOpen(!isMonthOpen); setIsYearOpen(false);}} className={`w-full p-2.5 pl-3 pr-3 rounded-xl border-2 bg-white text-slate-700 font-bold text-sm outline-none flex justify-between items-center transition-all ${isMonthOpen ? 'border-blue-500' : 'border-slate-200'}`}>
                <div className="flex items-center gap-2 text-ellipsis overflow-hidden whitespace-nowrap"><Filter size={14} className="text-slate-500 min-w-3.5"/> <span>{getMonthLabel()}</span></div>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isMonthOpen ? 'rotate-180' : ''}`}/>
             </button>
             {isMonthOpen && (<div className="absolute top-full mt-1 left-0 w-full bg-white border-2 border-slate-100 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100"><div onClick={() => {setFilterMonth("all"); setIsMonthOpen(false);}} className={`p-3 text-sm font-medium border-b border-slate-100 cursor-pointer hover:bg-slate-50 flex justify-between items-center ${filterMonth === "all" ? 'text-blue-600 bg-blue-50/50' : 'text-slate-600'}`}><span>Semua Bulan</span>{filterMonth === "all" && <Check size={14}/>}</div>{months.map(m => (<div key={m.v} onClick={() => {setFilterMonth(m.v); setIsMonthOpen(false);}} className={`p-3 text-sm font-medium border-b border-slate-100 cursor-pointer hover:bg-slate-50 flex justify-between items-center ${filterMonth === m.v ? 'text-blue-600 bg-blue-50/50' : 'text-slate-600'}`}><span>{m.l}</span>{filterMonth === m.v && <Check size={14}/>}</div>))}</div>)}
          </div>
          <div className="relative w-1/3 min-w-28">
             <button onClick={() => {setIsYearOpen(!isYearOpen); setIsMonthOpen(false);}} className={`w-full p-2.5 pl-3 pr-3 rounded-xl border-2 bg-white text-slate-700 font-bold text-sm outline-none flex justify-between items-center transition-all ${isYearOpen ? 'border-blue-500' : 'border-slate-200'}`}><span className="text-ellipsis overflow-hidden whitespace-nowrap">{getYearLabel()}</span><ChevronDown size={16} className={`text-slate-400 transition-transform ${isYearOpen ? 'rotate-180' : ''}`}/></button>
             {isYearOpen && (<div className="absolute top-full right-0 mt-1 w-full min-w-32 bg-white border-2 border-slate-100 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100"><div onClick={() => {setFilterYear("all"); setIsYearOpen(false);}} className={`p-3 text-sm font-medium border-b border-slate-100 cursor-pointer hover:bg-slate-50 flex justify-between items-center ${filterYear === "all" ? 'text-blue-600 bg-blue-50/50' : 'text-slate-600'}`}><span>Semua</span>{filterYear === "all" && <Check size={14}/>}</div>{availableYears.map(y => (<div key={y} onClick={() => {setFilterYear(y); setIsYearOpen(false);}} className={`p-3 text-sm font-medium border-b border-slate-100 cursor-pointer hover:bg-slate-50 flex justify-between items-center ${filterYear === y ? 'text-blue-600 bg-blue-50/50' : 'text-slate-600'}`}><span>{y}</span>{filterYear === y && <Check size={14}/>}</div>))}</div>)}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (<div className="flex flex-col items-center justify-center py-10 text-slate-400"><Calendar className="animate-bounce h-8 w-8 mb-2"/><p>Memuat data...</p></div>) : filteredData.length === 0 ? (<div className="text-center py-10 bg-white rounded-xl shadow-sm border-2 border-dashed border-slate-300"><p className="text-slate-500 font-medium">Tidak ada data yang cocok.</p></div>) : (
          filteredData.map((item) => {
            const expired = isExpired(item.valid_until);
            const itemPhotos = [{ url: item.photo_url, label: "FOTO 1" }, { url: item.photo_url_2, label: "FOTO 2" }, { url: item.photo_url_3, label: "FOTO 3" }, { url: item.photo_url_4, label: "FOTO 4" }].filter(p => p.url);
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
                      <div className={`text-xs font-bold px-2 py-1 rounded w-fit ${expired ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>Masa Berlaku: {formatDate(item.valid_until)}</div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <button onClick={() => openRenewModal(item)} className="bg-blue-50 text-blue-600 p-2 rounded-xl hover:bg-blue-500 hover:text-white transition-all active:scale-90 shadow-sm border border-blue-100" title="Perbarui"><Edit size={20}/></button>
                        <button onClick={() => setDeleteTarget(item)} className="bg-red-50 text-red-400 p-2 rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-90 shadow-sm border border-red-100" title="Hapus"><Trash2 size={20}/></button>
                    </div>
                  </div>
                  {itemPhotos.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-2 border-t border-slate-100 pt-3">
                        {itemPhotos.map((photo, idx) => (
                            <div key={idx} className="bg-slate-50 p-2 rounded-lg flex flex-col gap-2">
                                <div onClick={() => window.open(photo.url || '', '_blank')} className="flex items-center gap-2 cursor-pointer group">
                                  <ImageIcon size={18} className="text-slate-400 group-hover:text-blue-500"/>
                                  <span className="text-[10px] font-bold text-slate-600 group-hover:text-blue-700">{photo.label}</span>
                                </div>
                                <div className="flex gap-1 mt-1">
                                    <button onClick={() => handleShare(item.nopol, photo.url!)} className="flex-1 bg-white p-1.5 rounded shadow-sm text-blue-500 hover:bg-blue-50"><Share2 size={16} className="mx-auto"/></button>
                                    <a href={photo.url!} download onClick={(e) => e.stopPropagation()} className="flex-1 bg-emerald-100 p-1.5 rounded shadow-sm text-emerald-700 hover:bg-emerald-200 text-center"><Download size={16} className="mx-auto"/></a>
                                </div>
                            </div>
                        ))}
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