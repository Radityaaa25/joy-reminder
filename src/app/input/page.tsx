"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Save, Camera, Loader2 } from "lucide-react";
import Link from "next/link";

export default function InputPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // State Form
  const [name, setName] = useState("");
  const [nopol, setNopol] = useState("");
  const [date, setDate] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);

  const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !nopol || !date) return alert("Lengkapi data dulu!");

    setLoading(true);
    try {
      let photoUrl = null;

      // Upload Foto jika ada
      if (photo) {
        const fileName = `${Date.now()}-${photo.name}`;
        const { error: uploadError } = await supabase.storage.from('reminder-docs').upload(fileName, photo);
        if (uploadError) throw uploadError;
        
        const { data } = supabase.storage.from('reminder-docs').getPublicUrl(fileName);
        photoUrl = data.publicUrl;
      }

      // Simpan ke Database
      const { error } = await supabase.from('reminders').insert([{
        name: name.toUpperCase(),
        nopol: nopol.toUpperCase(),
        valid_until: date,
        photo_url: photoUrl
      }]);

      if (error) throw error;

      alert("Data Berhasil Disimpan!");
      router.push("/"); // Balik ke menu
    } catch (err) {
      alert("Gagal menyimpan data.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header Kecil */}
      <div className="flex justify-between items-center mb-6">
        <Link href="/" className="bg-white p-2 rounded-full shadow text-slate-600"><ArrowLeft size={20}/></Link>
        <span className="text-xs font-medium text-slate-500">{today}</span>
      </div>

      <h1 className="text-2xl font-bold text-slate-800 mb-6">Input Pengingat</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* NAMA */}
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <label className="text-xs font-bold text-slate-500 block mb-1">NAMA PELANGGAN</label>
          <input 
            type="text" 
            placeholder="Bpk. Budi" 
            className="w-full text-lg font-bold outline-none uppercase placeholder:normal-case"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        {/* NOPOL */}
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <label className="text-xs font-bold text-slate-500 block mb-1">NOMOR POLISI</label>
          <input 
            type="text" 
            placeholder="B 1234 XYZ" 
            className="w-full text-lg font-bold outline-none uppercase font-mono"
            value={nopol}
            onChange={e => setNopol(e.target.value)}
          />
        </div>

        {/* TANGGAL BERLAKU */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-200">
          <label className="text-xs font-bold text-emerald-600 block mb-1">MASA BERLAKU S/D</label>
          <input 
            type="date" 
            className="w-full text-lg font-bold outline-none bg-transparent"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>

        {/* FOTO */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-dashed border-slate-400 text-center">
          <label className="cursor-pointer block">
            <input type="file" accept="image/*" className="hidden" onChange={e => setPhoto(e.target.files?.[0] || null)} />
            <div className="flex flex-col items-center gap-2 text-slate-500 py-4">
              <Camera size={32} className={photo ? "text-blue-500" : "text-slate-400"} />
              <span className="text-sm font-medium">{photo ? "Foto Terpilih: " + photo.name : "Ambil Foto Dokumen"}</span>
            </div>
          </label>
        </div>

        <button disabled={loading} className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg mt-8 flex justify-center items-center gap-2">
          {loading ? <Loader2 className="animate-spin"/> : <Save size={20}/>}
          SIMPAN DATA
        </button>
      </form>
    </div>
  );
}