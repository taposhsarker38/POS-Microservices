"use client";
import React from "react";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
// import {  useGetInventoryQuery } from "../../store/api";

import { useSocket } from "../../hooks/useSocket";

export default function DashboardPage() {

  useSocket();


  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6">
          <h2 className="text-xl font-semibold mb-4">Dashboard</h2>
          <section className="grid gap-6 grid-cols-1 md:grid-cols-2">
            <div className="p-4 bg-white rounded shadow">
              <h3 className="font-medium mb-2">Companies</h3>
             
            </div>
            <div className="p-4 bg-white rounded shadow">
              <h3 className="font-medium mb-2">Inventory Snapshot</h3>
             
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
