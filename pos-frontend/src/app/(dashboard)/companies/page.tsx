"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
// import api from "../../lib/axios";
import Header from "../../../components/layout/Header";
import Sidebar from "../../../components/layout/Sidebar";

export default function CompaniesPage() {
  // const { data: companies, isLoading } = useQuery(
  //   ["companies"],
  //   async () => (await api.get("/companies")).data,
  // );
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6">
          <h2 className="text-xl font-semibold mb-4">Companies</h2>
          {/* {isLoading ? (
            <p>Loading…</p>
          ) : (
            <div className="grid gap-3">
              {companies.map((c: any) => (
                <div key={c.id} className="p-4 bg-white rounded shadow">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-sm text-slate-600">{c.email}</div>
                </div>
              ))}
            </div>
          )} */}
        </main>
      </div>
    </div>
  );
}
