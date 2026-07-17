"use client";

import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const colors = ["#7dd3a7", "#f5b84b", "#79a7ff", "#b48cff", "#ef6f6c", "#94a3b8"];

export function PieSummary({ data }: { data: { name: string; value: number }[] }) {
  return <ResponsiveContainer width="100%" height={240}><PieChart><Pie data={data} dataKey="value" nameKey="name" outerRadius={82} label>{data.map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}</Pie><Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} /></PieChart></ResponsiveContainer>;
}

export function DebtTrend({ data }: { data: { month: string; balance: number }[] }) {
  return <ResponsiveContainer width="100%" height={260}><LineChart data={data}><XAxis dataKey="month" stroke="#94a3b8" /><YAxis stroke="#94a3b8" /><Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} /><Line type="monotone" dataKey="balance" stroke="#b48cff" strokeWidth={3} dot={{ r: 4 }} /></LineChart></ResponsiveContainer>;
}
