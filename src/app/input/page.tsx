"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Save, Camera, Loader2, Plus, Trash2, User, ImagePlus } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import imageCompression from 'browser-image-compression'; // Import Kompresi

interface VehicleInput {
  id: string;
  nopol: string;
  date: string;
  photo1: File | null;
  photo2: File | null;
}

export default function InputPage() {
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("SIMPAN DATA"); // Buat status loading lebih detail
  
  const [name, setName] = useState("");
  const [vehicles, setVehicles] = useState<VehicleInput[]>([
    { id: "1", nopol: "", date: "", photo1: null, photo2: null }
  ]);

  const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  const addVehicle = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    setVehicles([...vehicles, { id: newId, nopol: "", date: "", photo1: null, photo2: null }]);
  };

  const removeVehicle = (id: string) => {
    if (vehicles.length === 1) return;
    setVehicles(vehicles.filter(v => v.id !== id));
  };

  const updateVehicle = (id: string, field: keyof VehicleInput, value: string | File | null) => {
    setVehicles(vehicles.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  // --- FUNGSI KOMPRESI FOTO ---
  const compressImage = async (file: File) => {
    const options = {
      maxSizeMB: 0.8,          // Maksimal 800KB (Cukup tajam untuk print)
      maxWidthOrHeight: 1920,  // Resolusi Full HD (Agar tulisan terbaca)
      useWebWorker: true,      // Biar browser gak nge-lag pas kompres
    };
    try {
      return await imageCompression(file, options);
    } catch (error) {
      console.log("Gagal kompres, pakai file asli", error);
      return file; // Kalau gagal, pakai file asli saja
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) return toast.error("Nama Pelanggan wajib diisi!");
    if (vehicles.some(v => !v.nopol || !v.date)) return toast.error("Lengkapi Nopol dan Tanggal semua kendaraan!");

    setLoading(true);
    setLoadingText("Mengompres Foto..."); // Kasih tau user lagi ngapain

    try {
      await Promise.all(vehicles.map(async (v) => {
        let photoUrl1 = null;
        let photoUrl2 = null;

        // Kita rapikan nama foldernya: "NAMA/NOPOL/FILE.jpg"
        const safeName = name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
        const safeNopol = v.nopol.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
        const timestamp = Date.now();

        // Upload Foto 1
        if (v.photo1) {
          const compressedFile = await compressImage(v.photo1); // Kompres dulu
          // Simpan dalam folder biar rapi: NAMA_PELANGGAN/NOPOL/
          const fileName1 = `${safeName}/${safeNopol}/BPKB1-${timestamp}.jpg`; 
          
          const { error: err1 } = await supabase.storage.from('reminder-docs').upload(fileName1, compressedFile);
          if (err1) throw err1;
          const { data: d1 } = supabase.storage.from('reminder-docs').getPublicUrl(fileName1);
          photoUrl1 = d1.publicUrl;
        }

        // Upload Foto 2
        if (v.photo2) {
          const compressedFile = await compressImage(v.photo2); // Kompres dulu
          const fileName2 = `${safeName}/${safeNopol}/BPKB2-${timestamp}.jpg`;
          
          const { error: err2 } = await supabase.storage.from('reminder-docs').upload(fileName2, compressedFile);
          if (err2) throw err2;
          const { data: d2 } = supabase.storage.from('reminder-docs').getPublicUrl(fileName2);
          photoUrl2 = d2.publicUrl;
        }

        // Simpan ke DB
        setLoadingText("Menyimpan Data...");
        const { error: insertError } = await supabase.from('reminders').insert([{
          name: name.toUpperCase(),
          nopol: v.nopol.toUpperCase(),
          valid_until: v.date,
          photo_url: photoUrl1,
          photo_url_2: photoUrl2 
        }]);

        if (insertError) throw insertError;
      }));

      toast.success(`Sukses! ${vehicles.length} kendaraan tersimpan.`);
      
      setName("");
      setVehicles([{ id: Math.random().toString(), nopol: "", date: "", photo1: null, photo2: null }]);
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      console.error(err);
      toast.error("Gagal menyimpan. Cek koneksi internet.");
    } finally {
      setLoading(false);
      setLoadingText("SIMPAN DATA");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 pb-24">
      <div className="flex justify-between items-center mb-6 sticky top-0 bg-slate-100 py-2 z-10">
        <Link href="/" className="bg-white p-2 rounded-full shadow text-slate-700 hover:bg-slate-200 transition">
          <ArrowLeft size={24}/>
        </Link>
        <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-full shadow-sm">{today}</span>
      </div>

      <h1 className="text-2xl font-bold text-slate-800 mb-6">Input Data Baru</h1>

      <div className="space-y-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-2">
            <User size={14}/> NAMA PELANGGAN
          </label>
          <input 
            type="text" 
            placeholder="Contoh: Bpk. Hasan" 
            className="w-full text-xl font-bold text-slate-900 placeholder:text-slate-300 outline-none uppercase bg-transparent border-b border-slate-100 focus:border-blue-500 py-1 transition-colors"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        {vehicles.map((v, index) => (
          <div key={v.id} className="bg-white p-5 rounded-2xl shadow-md border-l-4 border-l-blue-500 relative animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
              <span className="text-sm font-bold text-blue-600">Kendaraan #{index + 1}</span>
              {vehicles.length > 1 && (
                <button onClick={() => removeVehicle(v.id)} className="text-red-400 hover:text-red-600">
                  <Trash2 size={18}/>
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">NOPOL / PLAT</label>
                <input 
                  type="text" 
                  placeholder="B 1234 XYZ" 
                  className="w-full text-lg font-bold font-mono text-slate-900 placeholder:text-slate-300 bg-slate-50 p-3 rounded-lg border border-slate-200 focus:border-blue-500 outline-none uppercase"
                  value={v.nopol}
                  onChange={e => updateVehicle(v.id, "nopol", e.target.value)}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">MASA BERLAKU PAJAK</label>
                <input 
                  type="date" 
                  className="w-full text-lg font-bold text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-200 focus:border-blue-500 outline-none"
                  value={v.date}
                  onChange={e => updateVehicle(v.id, "date", e.target.value)}
                />
              </div>

              {/* AREA 2 FOTO */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                 {/* FOTO 1 */}
                 <label className={`cursor-pointer flex flex-col items-center justify-center gap-2 w-full p-3 rounded-xl border-2 border-dashed transition-all ${v.photo1 ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-300 hover:bg-slate-50 text-slate-400'}`}>
                    <input type="file" accept="image/*" className="hidden" onChange={e => updateVehicle(v.id, "photo1", e.target.files?.[0] || null)} />
                    <Camera size={20} />
                    <span className="text-[10px] font-bold text-center">{v.photo1 ? "Ganti Foto 1" : "Foto BPKB 1"}</span>
                 </label>

                 {/* FOTO 2 */}
                 <label className={`cursor-pointer flex flex-col items-center justify-center gap-2 w-full p-3 rounded-xl border-2 border-dashed transition-all ${v.photo2 ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-300 hover:bg-slate-50 text-slate-400'}`}>
                    <input type="file" accept="image/*" className="hidden" onChange={e => updateVehicle(v.id, "photo2", e.target.files?.[0] || null)} />
                    <ImagePlus size={20} />
                    <span className="text-[10px] font-bold text-center">{v.photo2 ? "Ganti Foto 2" : "Foto BPKB 2"}</span>
                 </label>
              </div>
              
              {(v.photo1 || v.photo2) && (
                  <div className="text-[10px] text-slate-400 px-1">
                      {v.photo1 && <div>✅ Foto 1: {(v.photo1.size / 1024 / 1024).toFixed(2)} MB (Akan dikompres)</div>}
                      {v.photo2 && <div>✅ Foto 2: {(v.photo2.size / 1024 / 1024).toFixed(2)} MB (Akan dikompres)</div>}
                  </div>
              )}

            </div>
          </div>
        ))}

        <button onClick={addVehicle} className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-bold flex items-center justify-center gap-2 hover:bg-white hover:border-blue-400 hover:text-blue-500 transition-all">
          <Plus size={20}/> Tambah Kendaraan Lain
        </button>
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-white p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-20">
         <button 
            onClick={handleSubmit}
            disabled={loading} 
            className="w-full max-w-lg mx-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg flex justify-center items-center gap-2 active:scale-95 transition-transform"
          >
            {loading ? <Loader2 className="animate-spin"/> : <Save size={20}/>}
            {loading ? loadingText : "SIMPAN SEMUA DATA"}
          </button>
      </div>
    </div>
  );
}