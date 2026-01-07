"use client";

import Link from "next/link";
import { PlusCircle, List, CalendarCheck } from "lucide-react";

export default function Home() {
  // Tanggal Hari Ini
  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });

  return (
    <main className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6">
      <div className="text-center mb-10">
        <div className="bg-emerald-600 p-4 rounded-full w-fit mx-auto mb-4 shadow-lg">
          <CalendarCheck className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-800">Joy Reminder</h1>
        <p className="text-slate-500 mt-2">Arsip & Pengingat Pajak</p>
        <div className="mt-4 bg-white px-4 py-2 rounded-lg shadow-sm text-sm font-medium text-emerald-700 border border-emerald-100">
          Hari ini: {today}
        </div>
      </div>

      <div className="grid gap-6 w-full max-w-sm">
        {/* Tombol Input */}
        <Link href="/input">
          <div className="bg-white p-6 rounded-xl shadow-md border-l-8 border-l-blue-500 hover:shadow-lg transition-all cursor-pointer flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <PlusCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-700">Input Data</h3>
              <p className="text-xs text-slate-400">Tambah pelanggan baru</p>
            </div>
          </div>
        </Link>

        {/* Tombol Lihat Data */}
        <Link href="/list">
          <div className="bg-white p-6 rounded-xl shadow-md border-l-8 border-l-emerald-500 hover:shadow-lg transition-all cursor-pointer flex items-center gap-4">
            <div className="bg-emerald-100 p-3 rounded-full">
              <List className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-700">Lihat Arsip</h3>
              <p className="text-xs text-slate-400">Cek daftar masa berlaku</p>
            </div>
          </div>
        </Link>
      </div>
    </main>
  );
}