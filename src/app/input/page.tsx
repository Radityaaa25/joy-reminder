"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Save, Camera, Loader2, Plus, Trash2, User, ImagePlus, FileText } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import imageCompression from 'browser-image-compression';

interface VehicleInput {
  id: string;
  nopol: string;
  date: string;
  photo1: File | null;
  photo2: File | null;
  photo3: File | null;
  photo4: File | null;
}

export default function InputPage() {
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("SIMPAN DATA");
  
  const [name, setName] = useState("");
  const [vehicles, setVehicles] = useState<VehicleInput[]>([
    { id: "1", nopol: "", date: "", photo1: null, photo2: null, photo3: null, photo4: null }
  ]);

  const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  const addVehicle = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    setVehicles([...vehicles, { id: newId, nopol: "", date: "", photo1: null, photo2: null, photo3: null, photo4: null }]);
  };

  const removeVehicle = (id: string) => {
    if (vehicles.length === 1) return;
    setVehicles(vehicles.filter(v => v.id !== id));
  };

  const updateVehicle = (id: string, field: keyof VehicleInput, value: string | File | null) => {
    setVehicles(vehicles.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const compressImage = async (file: File) => {
    const options = { maxSizeMB: 0.8, maxWidthOrHeight: 1920, useWebWorker: true };
    try { return await imageCompression(file, options); } 
    catch (error) { console.log("Gagal kompres:", error); return file; }
  };

  const handleSubmit = async () => {
    if (!name.trim()) return toast.error("Nama Pelanggan wajib diisi!");
    if (vehicles.some(v => !v.nopol || !v.date)) return toast.error("Lengkapi Nopol dan Tanggal semua kendaraan!");

    setLoading(true);
    setLoadingText("Mengompres Foto...");

    try {
      await Promise.all(vehicles.map(async (v) => {
        const urls: (string | null)[] = [null, null, null, null]; 
        const photos = [v.photo1, v.photo2, v.photo3, v.photo4];
        
        const safeName = name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
        const safeNopol = v.nopol.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
        const timestamp = Date.now();

        for (let i = 0; i < 4; i++) {
          if (photos[i]) {
            const compressedFile = await compressImage(photos[i] as File);
            const fileName = `${safeName}/${safeNopol}/FOTO-${i+1}-${timestamp}.jpg`;
            const { error } = await supabase.storage.from('reminder-docs').upload(fileName, compressedFile);
            if (error) throw error;
            const { data } = supabase.storage.from('reminder-docs').getPublicUrl(fileName);
            urls[i] = data.publicUrl;
          }
        }

        setLoadingText("Menyimpan Data...");
        const { error: insertError } = await supabase.from('reminders').insert([{
          name: name.toUpperCase(),
          nopol: v.nopol.toUpperCase(),
          valid_until: v.date,
          photo_url: urls[0], photo_url_2: urls[1], photo_url_3: urls[2], photo_url_4: urls[3]
        }]);

        if (insertError) throw insertError;
      }));

      toast.success(`Sukses! ${vehicles.length} kendaraan tersimpan.`);
      setName("");
      setVehicles([{ id: Math.random().toString(), nopol: "", date: "", photo1: null, photo2: null, photo3: null, photo4: null }]);
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
        <Link href="/" className="bg-white p-2 rounded-full shadow text-slate-700 hover:bg-slate-200 transition"><ArrowLeft size={24}/></Link>
        <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-full shadow-sm">{today}</span>
      </div>

      <h1 className="text-2xl font-bold text-slate-800 mb-6">Input Data Baru</h1>

      <div className="space-y-6">
        {/* INPUT NAMA PELANGGAN - Placeholder Lebih Gelap */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-600 mb-2"><User size={14}/> NAMA PELANGGAN</label>
          <input 
            type="text" 
            placeholder="Contoh: Bpk. Hasan" 
            className="w-full text-xl font-bold text-slate-900 placeholder:text-slate-500 placeholder:font-medium outline-none uppercase bg-transparent border-b-2 border-slate-200 focus:border-blue-500 py-2 transition-colors"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        {vehicles.map((v, index) => (
          <div key={v.id} className="bg-white p-5 rounded-2xl shadow-md border-l-4 border-l-blue-500 relative animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
              <span className="text-sm font-bold text-blue-600">Kendaraan #{index + 1}</span>
              {vehicles.length > 1 && (
                <button onClick={() => removeVehicle(v.id)} className="text-red-400 hover:text-red-600"><Trash2 size={18}/></button>
              )}
            </div>

            <div className="space-y-4">
              {/* INPUT NOPOL - Placeholder Lebih Gelap */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">NOPOL / PLAT</label>
                <input 
                  type="text" 
                  placeholder="B 1234 XYZ" 
                  className="w-full text-lg font-bold font-mono text-slate-900 placeholder:text-slate-500 placeholder:font-medium bg-slate-100 border-2 border-slate-200 p-3 rounded-xl focus:border-blue-500 outline-none uppercase transition-all"
                  value={v.nopol}
                  onChange={e => updateVehicle(v.id, "nopol", e.target.value)}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">MASA BERLAKU PAJAK</label>
                <input type="date" className="w-full text-lg font-bold text-slate-900 bg-slate-100 border-2 border-slate-200 p-3 rounded-xl focus:border-blue-500 outline-none transition-all" value={v.date} onChange={e => updateVehicle(v.id, "date", e.target.value)}/>
              </div>

              {/* AREA FOTO - Kosong Lebih Kontras */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                 {[1, 2, 3, 4].map((num) => {
                   const fieldName = `photo${num}` as keyof VehicleInput;
                   const file = v[fieldName] as File | null;

                   return (
                     <label key={num} className={`cursor-pointer flex flex-col items-center justify-center gap-2 w-full p-3 rounded-xl border-2 border-dashed transition-all ${
                       file 
                       ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' // Ada file
                       : 'border-slate-400 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:border-slate-500' // Kosong (Lebih gelap)
                     }`}>
                        <input type="file" accept="image/*" className="hidden" onChange={e => updateVehicle(v.id, fieldName, e.target.files?.[0] || null)} />
                        {num === 1 && <Camera size={24} strokeWidth={1.5}/>}
                        {num === 2 && <ImagePlus size={24} strokeWidth={1.5}/>}
                        {num === 3 && <FileText size={24} strokeWidth={1.5}/>}
                        {num === 4 && <FileText size={24} strokeWidth={1.5}/>}
                        <span className="text-xs font-bold text-center">
                          {file ? `Ganti Foto ${num}` : `Foto ${num}`}
                        </span>
                     </label>
                   );
                 })}
              </div>
              
              <div className="text-[10px] text-slate-500 px-1 text-center font-medium">
                  * Bisa upload sampai 4 foto (Khusus BPKB)
              </div>

            </div>
          </div>
        ))}

        <button onClick={addVehicle} className="w-full py-4 border-2 border-dashed border-slate-400 rounded-xl text-slate-600 font-bold flex items-center justify-center gap-2 hover:bg-white hover:border-blue-500 hover:text-blue-600 transition-all bg-slate-50">
          <Plus size={20}/> Tambah Kendaraan Lain
        </button>
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-white p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-20">
         <button onClick={handleSubmit} disabled={loading} className="w-full max-w-lg mx-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg flex justify-center items-center gap-2 active:scale-95 transition-transform">
            {loading ? <Loader2 className="animate-spin"/> : <Save size={20}/>}{loading ? loadingText : "SIMPAN SEMUA DATA"}
          </button>
      </div>
    </div>
  );
}