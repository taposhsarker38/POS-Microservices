"use client";
import React from "react";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import {  useGetInventoryQuery } from "../../stores/api";
import useRequireAuth from "../../hooks/useRequireAuth";
import { useSocket } from "../../hooks/useSocket";

export default function DashboardPage() {
  const { checked } = useRequireAuth();
  useSocket();

  // const { data: companies, isLoading: companiesLoading } =
    // useGetCompaniesQuery();
  // const { data: inventory, isLoading: invLoading } = useGetInventoryQuery();

  if (!checked)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Checking auth...
      </div>
    );

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
              {/* {companiesLoading ? (
                <p>Loading...</p>
              ) : (
                <p>Total companies: {companies?.length ?? 0}</p>
              )} */}
            </div>
            <div className="p-4 bg-white rounded shadow">
              <h3 className="font-medium mb-2">Inventory Snapshot</h3>
              {/* {invLoading ? (
                <p>Loading...</p>
              ) : (
                <p>Tracked items: {inventory?.length ?? 0}</p>
              )} */}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
