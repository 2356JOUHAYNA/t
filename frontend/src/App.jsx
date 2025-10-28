import React, { useEffect, useMemo, useState } from "react";

async function getJSON(path) {
    const r = await fetch(path);
    if (!r.ok) {
        const body = await r.text().catch(() => '');
        throw new Error(`${path} → ${r.status} ${r.statusText}\n${body}`);
    }
    const ct = r.headers.get("content-type") || "";
    return ct.includes("application/json") ? r.json() : r.text();
}


export default function App() {
    const [students, setStudents] = useState([]);
    const [count, setCount] = useState(0);
    const [byYear, setByYear] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({ nom: "", prenom: "", dateNaissance: "" });
    const [saving, setSaving] = useState(false);

    const canSave = form.nom.trim() && form.prenom.trim() && form.dateNaissance;

    async function refresh() {
        setLoading(true);
        setError("");

        // Load all, but don't fail the whole page if one endpoint errors
        try {
            const list = await getJSON("/api/students/all");
            setStudents(Array.isArray(list) ? list : []);
        } catch (e) {
            console.error("students/all failed:", e);
            setStudents([]);
            setError("Some data failed to load (list).");
        }

        try {
            const raw = await fetch("/api/students/count"); // count can be text/plain
            const txt = await raw.text();
            setCount(Number(txt) || 0);
        } catch (e) {
            console.error("students/count failed:", e);
            setCount(0);
            setError((p) => p || "Some data failed to load (count).");
        }

        try {
            const rawByYear = await getJSON("/api/students/byYear");
            const normalized = Array.isArray(rawByYear)
                ? rawByYear.map((row) => {
                    if (Array.isArray(row)) return { year: row[0], total: row[1] };
                    if (row && typeof row === "object") {
                        const entries = Object.entries(row);
                        let year = null, total = null;
                        for (const [k, v] of entries) {
                            const key = String(k).toLowerCase();
                            if (key.includes("year")) year = v;
                            if (key.includes("count") || key.includes("total")) total = v;
                        }
                        return { year, total };
                    }
                    return { year: null, total: null };
                })
                : [];
            setByYear(normalized.filter(x => x.year != null));
        } catch (e) {
            console.warn("students/byYear failed (ignored):", e);
            setByYear([]);
            // don't set error; it's optional
        }

        setLoading(false);
    }

    useEffect(() => { refresh(); }, []);

    async function onCreate(e) {
        e.preventDefault();
        if (!canSave) return;
        try {
            setSaving(true);
            // Your API returns date-only, so send date-only back
            const r = await fetch("/api/students/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nom: form.nom.trim(),
                    prenom: form.prenom.trim(),
                    dateNaissance: form.dateNaissance, // yyyy-mm-dd
                }),
            });
            if (!r.ok) throw new Error(`save → ${r.status} ${r.statusText}`);
            setForm({ nom: "", prenom: "", dateNaissance: "" });
            await refresh();
        } catch (e) {
            console.error(e);
            setError(`Create failed: ${e.message}`);
        } finally {
            setSaving(false);
        }
    }

    async function onDelete(id) {
        if (!confirm(`Delete student #${id}?`)) return;
        try {
            const r = await fetch(`/api/students/delete/${id}`, { method: "DELETE" });
            if (!r.ok) throw new Error(`delete → ${r.status} ${r.statusText}`);
            await refresh();
        } catch (e) {
            console.error(e);
            setError(`Delete failed: ${e.message}`);
        }
    }

    const yearRows = useMemo(() => byYear.filter(x => x.year != null), [byYear]);

    return (
        <div style={{minHeight:"100vh", background:"linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color:"#fff"}}>
            <div style={{maxWidth:960, margin:"0 auto", padding:24}}>
                <header style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24}}>
                    <h1 style={{fontSize:36, fontWeight:800, margin:0, textShadow:"0 2px 10px rgba(0,0,0,0.1)"}}>🎓 Students Dashboard</h1>
                    <button onClick={refresh} disabled={loading}
                            style={{padding:"10px 20px", borderRadius:20, color:"#667eea", background:"#fff", fontWeight:600, border:"none", boxShadow:"0 4px 15px rgba(0,0,0,0.1)", opacity:loading?0.6:1, cursor:loading?"not-allowed":"pointer"}}>
                        {loading ? "Refreshing…" : "🔄 Refresh"}
                    </button>
                </header>

                {error && (
                    <div style={{marginTop:12, padding:16, borderRadius:16, background:"rgba(255,255,255,0.95)", color:"#dc2626", boxShadow:"0 4px 15px rgba(0,0,0,0.1)", fontWeight:500}}>
                        ⚠️ {error}
                    </div>
                )}

                <div style={{display:"grid", gap:20, gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", marginTop:20}}>
                    <div style={{borderRadius:20, padding:24, background:"rgba(255,255,255,0.95)", boxShadow:"0 8px 30px rgba(0,0,0,0.12)", backdropFilter:"blur(10px)"}}>
                        <h3 style={{fontSize:14, fontWeight:700, color:"#667eea", marginTop:0, textTransform:"uppercase", letterSpacing:"0.5px"}}>📊 Total Students</h3>
                        <div style={{fontSize:40, fontWeight:800, color:"#667eea"}}>{count}</div>
                    </div>

                    <div style={{borderRadius:20, padding:24, background:"rgba(255,255,255,0.95)", boxShadow:"0 8px 30px rgba(0,0,0,0.12)", backdropFilter:"blur(10px)"}}>
                        <h3 style={{fontSize:14, fontWeight:700, color:"#667eea", marginTop:0, marginBottom:16, textTransform:"uppercase", letterSpacing:"0.5px"}}>➕ Add Student</h3>
                        <form onSubmit={onCreate} style={{display:"grid", gap:14}}>
                            <label style={{display:"flex", flexDirection:"column", gap:6, fontSize:14, color:"#374151"}}>
                                <span style={{fontWeight:600}}>First name (prenom)</span>
                                <input
                                    style={{border:"2px solid #e5e7eb", borderRadius:12, padding:"10px 14px", fontSize:14, transition:"all 0.2s", outline:"none"}}
                                    value={form.prenom}
                                    onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                                    placeholder="e.g. Marie" required
                                    onFocus={(e) => e.target.style.borderColor = "#667eea"}
                                    onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
                                />
                            </label>
                            <label style={{display:"flex", flexDirection:"column", gap:6, fontSize:14, color:"#374151"}}>
                                <span style={{fontWeight:600}}>Last name (nom)</span>
                                <input
                                    style={{border:"2px solid #e5e7eb", borderRadius:12, padding:"10px 14px", fontSize:14, transition:"all 0.2s", outline:"none"}}
                                    value={form.nom}
                                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                                    placeholder="e.g. Dupont" required
                                    onFocus={(e) => e.target.style.borderColor = "#667eea"}
                                    onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
                                />
                            </label>
                            <label style={{display:"flex", flexDirection:"column", gap:6, fontSize:14, color:"#374151"}}>
                                <span style={{fontWeight:600}}>Birth date</span>
                                <input
                                    type="date"
                                    style={{border:"2px solid #e5e7eb", borderRadius:12, padding:"10px 14px", fontSize:14, transition:"all 0.2s", outline:"none"}}
                                    value={form.dateNaissance}
                                    onChange={(e) => setForm({ ...form, dateNaissance: e.target.value })}
                                    required
                                    onFocus={(e) => e.target.style.borderColor = "#667eea"}
                                    onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
                                />
                            </label>
                            <button type="submit" disabled={!canSave || saving}
                                    style={{padding:"12px 16px", borderRadius:12, color:"#fff", background:"linear-gradient(135deg, #667eea 0%, #764ba2 100%)", fontWeight:600, border:"none", boxShadow:"0 4px 15px rgba(102,126,234,0.4)", opacity:(!canSave||saving)?0.6:1, cursor:(!canSave||saving)?"not-allowed":"pointer"}}>
                                {saving ? "Saving…" : "✨ Create"}
                            </button>
                        </form>
                    </div>

                    <div style={{borderRadius:20, padding:24, background:"rgba(255,255,255,0.95)", boxShadow:"0 8px 30px rgba(0,0,0,0.12)", backdropFilter:"blur(10px)"}}>
                        <h3 style={{fontSize:14, fontWeight:700, color:"#667eea", marginTop:0, textTransform:"uppercase", letterSpacing:"0.5px"}}>
                            📅 By Year <span style={{fontSize:11, color:"#9ca3af", textTransform:"none"}}>/students/byYear</span>
                        </h3>
                        <div style={{maxHeight:240, overflow:"auto"}}>
                            <table style={{width:"100%", fontSize:14, borderCollapse:"collapse"}}>
                                <thead>
                                <tr style={{textAlign:"left", color:"#6b7280"}}>
                                    <th style={{padding:"8px", fontWeight:600}}>Year</th>
                                    <th style={{padding:"8px", fontWeight:600}}>Count</th>
                                </tr>
                                </thead>
                                <tbody>
                                {yearRows.length === 0 && (
                                    <tr><td colSpan={2} style={{padding:"12px", color:"#9ca3af"}}>No data</td></tr>
                                )}
                                {yearRows.map((r, i) => (
                                    <tr key={i} style={{borderTop:"1px solid #f3f4f6"}}>
                                        <td style={{padding:"8px", color:"#374151"}}>{r.year}</td>
                                        <td style={{padding:"8px", color:"#374151", fontWeight:600}}>{r.total}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div style={{marginTop:20, borderRadius:20, padding:24, background:"rgba(255,255,255,0.95)", boxShadow:"0 8px 30px rgba(0,0,0,0.12)", backdropFilter:"blur(10px)"}}>
                    <h3 style={{fontSize:14, fontWeight:700, color:"#667eea", marginTop:0, marginBottom:16, textTransform:"uppercase", letterSpacing:"0.5px"}}>
                        👥 Students List <span style={{fontSize:11, color:"#9ca3af", textTransform:"none"}}>/students/all</span>
                    </h3>
                    <div style={{overflow:"auto"}}>
                        <table style={{width:"100%", fontSize:14, borderCollapse:"collapse"}}>
                            <thead>
                            <tr style={{textAlign:"left", color:"#6b7280", borderBottom:"2px solid #f3f4f6"}}>
                                <th style={{padding:"12px", fontWeight:600}}>ID</th>
                                <th style={{padding:"12px", fontWeight:600}}>Prenom</th>
                                <th style={{padding:"12px", fontWeight:600}}>Nom</th>
                                <th style={{padding:"12px", fontWeight:600}}>Birth date</th>
                                <th style={{padding:"12px"}}></th>
                            </tr>
                            </thead>
                            <tbody>
                            {students.length === 0 && (
                                <tr><td colSpan={5} style={{padding:"16px", color:"#9ca3af", textAlign:"center"}}>No students yet</td></tr>
                            )}
                            {students.map(s => {
                                const dateStr = s.dateNaissance ? String(s.dateNaissance).slice(0,10) : "";
                                return (
                                    <tr key={s.id} style={{borderBottom:"1px solid #f3f4f6"}}>
                                        <td style={{padding:"12px", color:"#374151", fontWeight:600}}>{s.id}</td>
                                        <td style={{padding:"12px", color:"#374151"}}>{s.prenom}</td>
                                        <td style={{padding:"12px", color:"#374151"}}>{s.nom}</td>
                                        <td style={{padding:"12px", color:"#6b7280"}}>{dateStr}</td>
                                        <td style={{padding:"12px"}}>
                                            <button onClick={() => onDelete(s.id)} style={{padding:"8px 14px", borderRadius:10, border:"none", background:"#fee2e2", color:"#dc2626", fontWeight:600, cursor:"pointer", transition:"all 0.2s"}}
                                                    onMouseEnter={(e) => e.target.style.background = "#fecaca"}
                                                    onMouseLeave={(e) => e.target.style.background = "#fee2e2"}>
                                                🗑️ Delete
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <footer style={{fontSize:12, color:"rgba(255,255,255,0.8)", marginTop:16, textAlign:"center", fontWeight:500}}>
                    Using Vite proxy → backend at <code style={{background:"rgba(255,255,255,0.2)", padding:"2px 8px", borderRadius:6}}>http://localhost:8081</code>
                </footer>
            </div>
        </div>
    );
}