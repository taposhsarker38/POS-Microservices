"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
// import api from "../../lib/axios";
import Header from "../../components/layout/Header";
import Sidebar from "../../components/layout/Sidebar";

export default function InventoryPage() {
  // const { data: items, isLoading } = useQuery(
  //   ["inventory"],
  //   async () => (await api.get("/inventory")).data,
  // );

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6">
          <h2 className="text-xl font-semibold mb-4">Inventory</h2>
          {/* {isLoading ? (
            <p>Loading…</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((it: any) => (
                <div key={it.id} className="p-4 bg-white rounded shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{it.name}</div>
                      <div className="text-sm text-slate-600">
                        SKU: {it.sku}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">{it.stock}</div>
                      <div className="text-sm text-slate-500">{it.unit}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )} */}
        </main>
      </div>
    </div>
  );
}
