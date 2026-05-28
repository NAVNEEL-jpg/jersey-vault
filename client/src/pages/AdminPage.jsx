import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { downloadInvoice } from "../utils/downloadInvoice";
import { API_BASE } from "../config/api";

const statusOptions = ["pending", "preparing", "shipped", "delivered"];
const statusColors = {
  pending: "#ff9900",
  preparing: "#00aaff",
  shipped: "#aa44ff",
  delivered: "#39ff14",
};

const JERSEY_TYPES = ["PLAYER VERSION", "FAN VERSION", "RETRO"];
const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const SPORTS = ["FOOTBALL", "CRICKET", "BASKETBALL"];
const sportIcon = { FOOTBALL: "⚽", CRICKET: "🏏", BASKETBALL: "🏀" };
const sportColor = { FOOTBALL: "#39ff14", CRICKET: "#00aaff", BASKETBALL: "#ff9900" };

const EMPTY_FORM = {
  name: "",
  price: "",
  status: "active",
  image_url: "",
  type: "FAN VERSION",
  team_id: "",
  size_stock: { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 },
};

const EMPTY_TEAM_FORM = {
  name: "",
  sport: "FOOTBALL",
  logo_url: "",
};

export default function AdminPage() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState("orders");
  const [updatingId, setUpdatingId] = useState(null);

  // Product form
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [formSaving, setFormSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Team search in product form
  const [teamSearchQuery, setTeamSearchQuery] = useState("");
  const [teamSearchResults, setTeamSearchResults] = useState([]);
  const [selectedTeamForProduct, setSelectedTeamForProduct] = useState(null);
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);

  // Inline "Add New Team" inside product form
  const [showInlineTeamForm, setShowInlineTeamForm] = useState(false);
  const [inlineTeamForm, setInlineTeamForm] = useState(EMPTY_TEAM_FORM);
  const [inlineTeamError, setInlineTeamError] = useState("");
  const [inlineTeamSaving, setInlineTeamSaving] = useState(false);
  const [inlineTeamLogoFile, setInlineTeamLogoFile] = useState(null);
  const [inlineTeamLogoPreview, setInlineTeamLogoPreview] = useState("");
  const inlineLogoInputRef = useRef();

  // Stats & users
  const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, totalUsers: 0, totalProducts: 0, pendingOrders: 0 });
  const [usersList, setUsersList] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Teams tab
  const [teams, setTeams] = useState([]);
  const [allTeams, setAllTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [teamForm, setTeamForm] = useState(EMPTY_TEAM_FORM);
  const [teamFormError, setTeamFormError] = useState("");
  const [teamSaving, setTeamSaving] = useState(false);
  const [teamLogoFile, setTeamLogoFile] = useState(null);
  const [teamLogoPreview, setTeamLogoPreview] = useState("");
  const [deletingTeamId, setDeletingTeamId] = useState(null);
  const [confirmDeleteTeamId, setConfirmDeleteTeamId] = useState(null);
  const [activeSportFilter, setActiveSportFilter] = useState("ALL");
  const logoInputRef = useRef();
  const teamSearchRef = useRef();

  // ── Auth check ──
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) { setChecking(false); navigate("/"); return; }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (profile?.role === "admin") { setAuthed(true); setChecking(false); }
      else { setChecking(false); navigate("/"); }
    };
    checkAdmin();
  }, []);

  // ── Fetch all data ──
  useEffect(() => {
    if (!authed) return;
    const fetchAdminData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      fetch(`${API_BASE}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(d => { if (d && !d.message) setStats(d); setLoadingStats(false); })
        .catch(() => setLoadingStats(false));

      setLoadingUsers(true);
      fetch(`${API_BASE}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => { if (!r.ok) throw new Error(); return r.json(); })
        .then(d => { setUsersList(Array.isArray(d) ? d : []); setLoadingUsers(false); })
        .catch(() => { setUsersList([]); setLoadingUsers(false); });

      supabase.from("orders").select("*").order("created_at", { ascending: false })
        .then(({ data }) => { if (data) setOrders(data); });

      supabase.from("products").select("*, teams(id, name, logo_url, sport)").order("name")
        .then(({ data }) => { if (data) setProducts(data); });

      supabase.from("teams").select("*").order("sport,name")
        .then(({ data }) => { if (data) setAllTeams(data); });
    };
    fetchAdminData();
  }, [authed]);

  // ── Fetch teams when Teams tab opens ──
  useEffect(() => {
    if (activeTab !== "teams") return;
    setLoadingTeams(true);
    supabase.from("teams").select("*").order("name")
      .then(({ data }) => { if (data) { setTeams(data); setAllTeams(data); } setLoadingTeams(false); });
  }, [activeTab]);

  // ── Team search for product form ──
  useEffect(() => {
    if (!teamSearchQuery.trim()) { setTeamSearchResults([]); setShowTeamDropdown(false); return; }
    const q = teamSearchQuery.toLowerCase();
    const results = allTeams.filter(t => t.name.toLowerCase().includes(q));
    setTeamSearchResults(results);
    setShowTeamDropdown(true);
  }, [teamSearchQuery, allTeams]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (teamSearchRef.current && !teamSearchRef.current.contains(e.target)) {
        setShowTeamDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Handlers ──
  const updateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    setUpdatingId(null);
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setFormError("");
  };

  const handleSizeStockChange = (size, value) => {
    setFormData(prev => ({ ...prev, size_stock: { ...prev.size_stock, [size]: parseInt(value) || 0 } }));
  };

  const handleSelectTeamForProduct = (team) => {
    setSelectedTeamForProduct(team);
    setFormData(prev => ({ ...prev, team_id: team.id }));
    setTeamSearchQuery(team.name);
    setShowTeamDropdown(false);
    setShowInlineTeamForm(false);
    setFormError("");
  };

  const handleClearTeam = () => {
    setSelectedTeamForProduct(null);
    setFormData(prev => ({ ...prev, team_id: "" }));
    setTeamSearchQuery("");
  };

  const handleAddProduct = async () => {
    const { name, price } = formData;
    if (!name.trim()) { setFormError("Product name is required."); return; }
    if (!price || isNaN(Number(price)) || Number(price) <= 0) { setFormError("Enter a valid price."); return; }
    setFormSaving(true);
    const totalStock = SIZES.reduce((s, sz) => s + (formData.size_stock[sz] || 0), 0);
    const payload = {
      name: name.trim(),
      price: Number(price),
      stock: totalStock,
      size_stock: formData.size_stock,
      status: formData.status,
      image_url: formData.image_url.trim() || null,
      type: formData.type,
      team_id: formData.team_id || null,
    };
    const { data, error } = await supabase.from("products").insert([payload]).select("*, teams(id, name, logo_url, sport)").single();
    if (error) { setFormError("Failed to add product: " + error.message); setFormSaving(false); return; }
    setProducts(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    setFormData(EMPTY_FORM);
    setSelectedTeamForProduct(null);
    setTeamSearchQuery("");
    setShowAddForm(false);
    setShowInlineTeamForm(false);
    setFormSaving(false);
  };

  const handleDeleteProduct = async (id) => {
    setDeletingId(id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${API_BASE}/api/products/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      if (response.ok) setProducts(prev => prev.filter(p => p.id !== id));
      else { const e = await response.json(); alert("Failed to delete: " + (e.message || response.statusText)); }
    } catch { alert("Error connecting to server."); }
    finally { setDeletingId(null); setConfirmDeleteId(null); }
  };

  // ── Upload team logo helper ──
  const uploadLogoAndGetUrl = async (file, teamName) => {
    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}-${teamName.trim().replace(/\s+/g, "-").toLowerCase()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("team-logos").upload(fileName, file, { upsert: true });
    if (uploadError) throw new Error("Logo upload failed: " + uploadError.message);
    const { data: urlData } = supabase.storage.from("team-logos").getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  // ── Inline team creation (inside product form) ──
  const handleInlineTeamLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setInlineTeamLogoFile(file);
    setInlineTeamLogoPreview(URL.createObjectURL(file));
    setInlineTeamError("");
  };

  const handleSaveInlineTeam = async () => {
    if (!inlineTeamForm.name.trim()) { setInlineTeamError("Team name is required."); return; }
    if (!inlineTeamLogoFile && !inlineTeamForm.logo_url) { setInlineTeamError("Upload a logo or enter a URL."); return; }
    setInlineTeamSaving(true);
    try {
      let logo_url = inlineTeamForm.logo_url;
      if (inlineTeamLogoFile) logo_url = await uploadLogoAndGetUrl(inlineTeamLogoFile, inlineTeamForm.name);
      const payload = { name: inlineTeamForm.name.trim(), sport: inlineTeamForm.sport, logo_url: logo_url || null };
      const { data, error } = await supabase.from("teams").insert([payload]).select().single();
      if (error) { setInlineTeamError("Failed: " + error.message); setInlineTeamSaving(false); return; }
      const updated = [...allTeams, data].sort((a, b) => a.name.localeCompare(b.name));
      setAllTeams(updated);
      setTeams(updated);
      // Auto-select the newly created team
      handleSelectTeamForProduct(data);
      setInlineTeamForm(EMPTY_TEAM_FORM);
      setInlineTeamLogoFile(null);
      setInlineTeamLogoPreview("");
      setShowInlineTeamForm(false);
      if (inlineLogoInputRef.current) inlineLogoInputRef.current.value = "";
    } catch (err) {
      setInlineTeamError(err.message);
    }
    setInlineTeamSaving(false);
  };

  // ── Teams tab handlers ──
  const handleTeamLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setTeamLogoFile(file);
    setTeamLogoPreview(URL.createObjectURL(file));
    setTeamFormError("");
  };

  const handleAddTeam = async () => {
    if (!teamForm.name.trim()) { setTeamFormError("Team name is required."); return; }
    if (!teamLogoFile && !teamForm.logo_url) { setTeamFormError("Please upload a logo or enter a logo URL."); return; }
    setTeamSaving(true);
    try {
      let logo_url = teamForm.logo_url;
      if (teamLogoFile) logo_url = await uploadLogoAndGetUrl(teamLogoFile, teamForm.name);
      const payload = { name: teamForm.name.trim(), sport: teamForm.sport, logo_url: logo_url || null };
      const { data, error } = await supabase.from("teams").insert([payload]).select().single();
      if (error) { setTeamFormError("Failed to add team: " + error.message); setTeamSaving(false); return; }
      const updated = [...teams, data].sort((a, b) => a.name.localeCompare(b.name));
      setTeams(updated);
      setAllTeams(updated);
      setTeamForm(EMPTY_TEAM_FORM);
      setTeamLogoFile(null);
      setTeamLogoPreview("");
      setShowTeamForm(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    } catch (err) {
      setTeamFormError(err.message);
    }
    setTeamSaving(false);
  };

  const handleDeleteTeam = async (id) => {
    setDeletingTeamId(id);
    const { error } = await supabase.from("teams").delete().eq("id", id);
    if (!error) {
      setTeams(prev => prev.filter(t => t.id !== id));
      setAllTeams(prev => prev.filter(t => t.id !== id));
    } else alert("Failed to delete team.");
    setDeletingTeamId(null);
    setConfirmDeleteTeamId(null);
  };

  const filteredTeams = activeSportFilter === "ALL" ? teams : teams.filter(t => t.sport === activeSportFilter);

  const resetProductForm = () => {
    setShowAddForm(false);
    setFormData(EMPTY_FORM);
    setFormError("");
    setSelectedTeamForProduct(null);
    setTeamSearchQuery("");
    setShowInlineTeamForm(false);
    setInlineTeamForm(EMPTY_TEAM_FORM);
    setInlineTeamLogoFile(null);
    setInlineTeamLogoPreview("");
  };

  if (checking) return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#39ff14", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, letterSpacing: 4 }}>
      CHECKING ACCESS...
    </div>
  );
  if (!authed) return null;

  return (
    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", background: "#0a0a0a", minHeight: "100vh", color: "#fff" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,900;1,900&family=Barlow:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #39ff14; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px);} to{opacity:1;transform:translateY(0);} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-10px);} to{opacity:1;transform:translateY(0);} }

        .tab-btn { background:transparent; border:none; font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:15px; letter-spacing:3px; cursor:pointer; padding:14px 28px; border-bottom:2px solid transparent; color:#444; transition:all 0.2s; white-space:nowrap; }
        .tab-btn.active { color:#39ff14; border-bottom-color:#39ff14; }
        .status-select { background:#1a1a1a; border:1px solid #333; color:#fff; padding:6px 10px; font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:700; letter-spacing:1px; cursor:pointer; outline:none; }
        .order-card { background:#111; border:1px solid #1a1a1a; padding:20px; margin-bottom:12px; animation:fadeUp 0.4s ease; transition:border-color 0.2s; }
        .order-card:hover { border-color:#2a2a2a; }
        .stat-card { background:#111; border:1px solid #1a1a1a; padding:24px; text-align:center; border-left:3px solid #39ff14; }
        .add-product-form { background:#0d0d0d; border:1px solid #39ff1430; padding:28px; margin-bottom:20px; animation:slideDown 0.3s ease; }
        .inline-team-form { background:#0a1a0a; border:1px solid #39ff1430; border-top: 2px solid #39ff14; padding:20px; margin-top:12px; animation:slideDown 0.25s ease; }
        .form-field { display:flex; flex-direction:column; gap:6px; }
        .form-label { font-size:10px; letter-spacing:3px; color:#555; font-weight:700; }
        .form-input { background:#111; border:1px solid #1e1e1e; color:#fff; padding:10px 14px; font-family:'Barlow Condensed',sans-serif; font-size:15px; outline:none; transition:border-color 0.2s; width:100%; }
        .form-input:focus { border-color:#39ff14; }
        .form-input::placeholder { color:#333; }
        .form-input.inline { background:#0d0d0d; border-color:#39ff1430; }
        .form-input.inline:focus { border-color:#39ff14; }
        .form-select { background:#111; border:1px solid #1e1e1e; color:#fff; padding:10px 14px; font-family:'Barlow Condensed',sans-serif; font-size:15px; font-weight:700; letter-spacing:1px; outline:none; cursor:pointer; width:100%; transition:border-color 0.2s; }
        .form-select:focus { border-color:#39ff14; }
        .form-select.inline { background:#0d0d0d; border-color:#39ff1430; }
        .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        .btn-primary { background:#39ff14; color:#000; border:none; padding:12px 28px; font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:14px; letter-spacing:3px; cursor:pointer; transition:background 0.2s,transform 0.1s; }
        .btn-primary:hover { background:#fff; }
        .btn-primary:active { transform:scale(0.98); }
        .btn-primary:disabled { opacity:0.4; cursor:not-allowed; }
        .btn-primary.sm { padding:9px 18px; font-size:12px; letter-spacing:2px; }
        .btn-ghost { background:transparent; color:#555; border:1px solid #222; padding:12px 24px; font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:13px; letter-spacing:2px; cursor:pointer; transition:all 0.2s; }
        .btn-ghost:hover { border-color:#555; color:#aaa; }
        .btn-ghost.sm { padding:9px 16px; font-size:11px; letter-spacing:1px; }
        .btn-ghost.green { border-color:#39ff1440; color:#39ff14; }
        .btn-ghost.green:hover { border-color:#39ff14; background:#39ff1410; }
        .btn-danger { background:transparent; color:#ff4444; border:1px solid #ff444430; padding:6px 14px; font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:11px; letter-spacing:2px; cursor:pointer; transition:all 0.2s; }
        .btn-danger:hover { background:#ff444415; border-color:#ff4444; }
        .btn-danger:disabled { opacity:0.3; cursor:not-allowed; }
        .btn-danger-confirm { background:#ff4444; color:#fff; border:none; padding:6px 14px; font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:11px; letter-spacing:2px; cursor:pointer; }
        .btn-cancel-sm { background:transparent; color:#555; border:1px solid #222; padding:6px 10px; font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:11px; letter-spacing:1px; cursor:pointer; }
        .btn-cancel-sm:hover { color:#aaa; }
        .btn-add-team-inline { background:transparent; border:1px dashed #39ff1440; color:#39ff1499; padding:8px 16px; font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:11px; letter-spacing:3px; cursor:pointer; transition:all 0.2s; width:100%; margin-top:8px; }
        .btn-add-team-inline:hover { border-color:#39ff14; color:#39ff14; background:#39ff1408; }
        .stock-row-item { padding:16px 20px; border-bottom:1px solid #1a1a1a; transition:background 0.15s; }
        .stock-row-item:last-child { border-bottom:none; }
        .stock-row-item:hover { background:#0a0a0a; }
        .add-product-toggle { background:transparent; border:1px dashed #39ff1440; color:#39ff14; padding:12px 24px; font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:13px; letter-spacing:3px; cursor:pointer; transition:all 0.2s; display:flex; align-items:center; gap:8px; }
        .add-product-toggle:hover { background:#39ff1410; border-color:#39ff14; }
        .form-error { color:#ff4444; font-size:12px; letter-spacing:1px; background:#ff444410; border:1px solid #ff444430; padding:10px 14px; margin-top:4px; }
        .form-success { color:#39ff14; font-size:12px; letter-spacing:1px; background:#39ff1410; border:1px solid #39ff1430; padding:10px 14px; margin-top:4px; }
        .image-preview { width:48px; height:48px; object-fit:cover; background:#0d0d0d; border:1px solid #1a1a1a; }
        .type-badge { display:inline-block; font-size:9px; font-weight:900; letter-spacing:2px; padding:2px 7px; }
        .type-badge.player { background:#00aaff22; border:1px solid #00aaff44; color:#00aaff; }
        .type-badge.fan { background:#39ff1422; border:1px solid #39ff1444; color:#39ff14; }
        .type-badge.retro { background:#ff990022; border:1px solid #ff990044; color:#ff9900; }
        .size-stock-input { width:100%; background:#111; border:1px solid #333; color:#fff; padding:4px; font-family:'Barlow Condensed',sans-serif; font-size:13px; text-align:center; outline:none; }
        .size-stock-input:focus { border-color:#39ff14; }
        .size-add-btn { width:100%; background:#39ff14; color:#000; border:none; padding:4px; font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:11px; cursor:pointer; margin-top:3px; letter-spacing:1px; }
        .size-add-btn:hover { background:#fff; }
        .size-add-btn:disabled { opacity:0.4; cursor:not-allowed; }

        /* TEAM SEARCH DROPDOWN */
        .team-search-wrap { position:relative; }
        .team-dropdown { position:absolute; top:calc(100% + 4px); left:0; right:0; background:#111; border:1px solid #39ff1440; z-index:100; max-height:220px; overflow-y:auto; animation:slideDown 0.15s ease; }
        .team-dropdown-item { display:flex; align-items:center; gap:10px; padding:10px 14px; cursor:pointer; transition:background 0.15s; border-bottom:1px solid #1a1a1a; }
        .team-dropdown-item:last-child { border-bottom:none; }
        .team-dropdown-item:hover { background:#39ff1410; }
        .team-dropdown-logo { width:32px; height:32px; border-radius:50%; object-fit:contain; background:#0d0d0d; border:1px solid #222; }
        .team-dropdown-empty { padding:12px 14px; font-size:11px; color:#555; letter-spacing:2px; }
        .team-selected-chip { display:flex; align-items:center; gap:10px; background:#39ff1410; border:1px solid #39ff1440; padding:8px 14px; }
        .team-selected-logo { width:36px; height:36px; border-radius:50%; object-fit:contain; background:#0d0d0d; border:1px solid #39ff1440; }

        /* TEAM CARDS */
        .team-card { background:#111; border:1px solid #1a1a1a; padding:20px 16px; display:flex; flex-direction:column; align-items:center; gap:12px; position:relative; transition:border-color 0.2s; animation:fadeUp 0.4s ease; }
        .team-card:hover { border-color:#2a2a2a; }
        .team-logo-circle { width:80px; height:80px; border-radius:50%; background:#0d0d0d; border:2px solid #1e1e1e; display:flex; align-items:center; justify-content:center; overflow:hidden; }
        .team-sport-pill { font-size:9px; font-weight:900; letter-spacing:3px; padding:3px 10px; border-radius:2px; }
        .sport-filter-btn { background:transparent; border:1px solid #222; color:#555; padding:6px 16px; font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:12px; letter-spacing:3px; cursor:pointer; transition:all 0.2s; }
        .sport-filter-btn.active { background:#39ff14; color:#000; border-color:#39ff14; }
        .sport-filter-btn:hover:not(.active) { border-color:#555; color:#aaa; }
        .logo-upload-area { border:1px dashed #333; padding:20px; text-align:center; cursor:pointer; transition:border-color 0.2s; }
        .logo-upload-area:hover { border-color:#39ff14; }
        .logo-upload-area.inline { background:#0d1a0d; border-color:#39ff1430; }
        .logo-upload-area.inline:hover { border-color:#39ff14; }
        .teams-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:12px; }
        .product-team-badge { display:inline-flex; align-items:center; gap:5px; background:#0d0d0d; border:1px solid #1e1e1e; padding:2px 8px; border-radius:2px; }
        .product-team-logo-tiny { width:16px; height:16px; border-radius:50%; object-fit:contain; }

        /* divider */
        .section-divider { border:none; border-top:1px solid #1a1a1a; margin:16px 0; }

        @media(max-width:480px) {
          .admin-nav-label { display:none; }
          .tab-btn { padding:14px 12px; font-size:12px; letter-spacing:1px; }
          .admin-badge { display:none; }
        }
        .stats-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:16px; margin-bottom:32px; }
        @media(max-width:500px) {
          .stats-grid { grid-template-columns:1fr 1fr; gap:10px; }
          .stat-card { padding:16px 12px; }
        }
        .order-card-inner { display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px; }
        .order-status-block { text-align:right; }
        @media(max-width:600px) {
          .order-card { padding:14px; }
          .order-card-inner { flex-direction:column; }
          .order-status-block { text-align:left; width:100%; display:flex; align-items:center; gap:12px; padding-top:12px; border-top:1px solid #1a1a1a; flex-wrap:wrap; }
          .order-status-block .status-label { display:none; }
          .status-select { flex:1; min-width:120px; }
          .form-grid { grid-template-columns:1fr; }
          .add-product-form { padding:18px; }
          .form-actions { flex-direction:column; }
          .form-actions .btn-primary, .form-actions .btn-ghost { width:100%; text-align:center; padding:14px; }
        }
        .size-grid-add { display:grid; grid-template-columns:repeat(6,1fr); gap:8px; }
        .size-grid-stock { display:grid; grid-template-columns:repeat(6,1fr); gap:8px; }
        @media(max-width:540px) {
          .size-grid-add { grid-template-columns:repeat(3,1fr); }
          .size-grid-stock { grid-template-columns:repeat(3,1fr); }
        }
        .stock-row-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
        @media(max-width:480px) {
          .stock-row-item { padding:12px; }
          .teams-grid { grid-template-columns:repeat(2,1fr); }
          .inline-team-form { padding:14px; }
        }
        .image-url-row { display:flex; gap:10px; align-items:center; }
        .admin-content { max-width:1100px; margin:0 auto; padding:32px 24px; }
        @media(max-width:480px) { .admin-content { padding:20px 12px; } }

        /* Product toolbar */
        .product-toolbar { display:flex; align-items:center; gap:12px; margin-bottom:20px; flex-wrap:wrap; }
      `}</style>

      {/* NAV */}
      <nav style={{ background: "rgba(10,10,10,0.98)", borderBottom: "1px solid #1a1a1a", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, background: "#39ff14", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, color: "#000" }}>J</div>
          <span style={{ fontWeight: 900, fontSize: 20, letterSpacing: 3 }}>JERSEY<span style={{ color: "#39ff14" }}>VAULT</span></span>
          <span className="admin-badge" style={{ background: "#39ff1420", border: "1px solid #39ff1440", color: "#39ff14", fontSize: 10, fontWeight: 900, letterSpacing: 2, padding: "3px 8px", marginLeft: 8 }}>ADMIN</span>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <span className="admin-nav-label" style={{ color: "#555", fontSize: 12, letterSpacing: 2 }}>ADMIN PANEL</span>
          <button onClick={() => navigate("/")} style={{ background: "transparent", border: "1px solid #222", color: "#555", padding: "6px 16px", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: 2, cursor: "pointer" }}>
            ← STORE
          </button>
        </div>
      </nav>

      <div className="admin-content">

        {/* STATS */}
        <div className="stats-grid">
          {[
            ["REVENUE", `₹${stats.totalRevenue.toLocaleString()}`, "#fff", "#39ff14"],
            ["ORDERS", stats.totalOrders, "#39ff14", "#39ff14"],
            ["PENDING", stats.pendingOrders, "#ff9900", "#ff9900"],
            ["USERS", stats.totalUsers, "#00aaff", "#00aaff"],
          ].map(([label, val, valColor, borderColor]) => (
            <div key={label} className="stat-card" style={{ borderLeftColor: borderColor }}>
              <div style={{ fontSize: 11, letterSpacing: 3, color: "#555", marginBottom: 8 }}>{label}</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: valColor }}>{val}</div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div style={{ display: "flex", borderBottom: "1px solid #1a1a1a", marginBottom: 28, overflowX: "auto" }}>
          <button className={`tab-btn ${activeTab === "orders" ? "active" : ""}`} onClick={() => setActiveTab("orders")}>📦 ORDERS</button>
          <button className={`tab-btn ${activeTab === "stock" ? "active" : ""}`} onClick={() => setActiveTab("stock")}>📊 PRODUCTS</button>
          <button className={`tab-btn ${activeTab === "teams" ? "active" : ""}`} onClick={() => setActiveTab("teams")}>🛡️ TEAMS</button>
          <button className={`tab-btn ${activeTab === "users" ? "active" : ""}`} onClick={() => setActiveTab("users")}>👥 USERS</button>
        </div>

        {/* ══════════ ORDERS TAB ══════════ */}
        {activeTab === "orders" && (
          <div>
            {orders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 0", color: "#333" }}>
                <div style={{ fontSize: 60 }}>📦</div>
                <p style={{ marginTop: 16, letterSpacing: 3, fontSize: 14 }}>NO ORDERS YET</p>
              </div>
            ) : orders.map(order => (
              <div key={order.id} className="order-card">
                <div className="order-card-inner">
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: 2 }}>{order.id}</span>
                      <span style={{ background: statusColors[order.status] + "22", border: `1px solid ${statusColors[order.status]}44`, color: statusColors[order.status], fontSize: 10, fontWeight: 900, letterSpacing: 2, padding: "3px 8px" }}>
                        {order.status?.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ color: "#888", fontSize: 13, fontFamily: "'Barlow',sans-serif", lineHeight: 1.8 }}>
                      <div>👤 <strong style={{ color: "#fff" }}>{order.customer_name}</strong></div>
                      <div>📧 {order.customer_email}</div>
                      <div>📞 {order.customer_phone}</div>
                      <div>📍 {order.address}, {order.city}, {order.state} — {order.pincode}</div>
                      <div>💳 {order.pay_method?.toUpperCase()}</div>
                      <div>🕐 {new Date(order.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="order-status-block">
                    <div style={{ fontSize: 28, fontWeight: 900, color: "#39ff14", marginBottom: 12 }}>₹{order.total?.toLocaleString()}</div>
                    <div className="status-label" style={{ fontSize: 11, letterSpacing: 2, color: "#555", marginBottom: 6 }}>UPDATE STATUS</div>
                    <select className="status-select" value={order.status} disabled={updatingId === order.id} onChange={e => updateStatus(order.id, e.target.value)}>
                      {statusOptions.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                    </select>
                    {updatingId === order.id && <div style={{ color: "#39ff14", fontSize: 11, marginTop: 6, letterSpacing: 2 }}>UPDATING...</div>}
                    <div style={{ marginTop: 12 }}>
                      <button type="button" className="btn-ghost" style={{ width: "100%", padding: "8px", fontSize: "11px", borderColor: "#39ff1444", color: "#39ff14" }} onClick={() => downloadInvoice(order.id, { admin: true })}>
                        📄 DOWNLOAD INVOICE
                      </button>
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 16, borderTop: "1px solid #1a1a1a", paddingTop: 12 }}>
                  <div style={{ fontSize: 10, letterSpacing: 3, color: "#555", marginBottom: 8 }}>ITEMS</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {order.items?.map((item, i) => (
                      <div key={i} style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", padding: "6px 12px", fontSize: 12, letterSpacing: 1 }}>
                        {item.name} · Size {item.size} · Qty {item.qty} · <span style={{ color: "#39ff14" }}>₹{item.price * item.qty}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══════════ PRODUCTS TAB ══════════ */}
        {activeTab === "stock" && (
          <div>
            {/* Toolbar: Add Product + Add Team (shortcut) */}
            <div className="product-toolbar">
              <button className="add-product-toggle" onClick={() => { setShowAddForm(f => !f); if (showAddForm) resetProductForm(); }}>
                {showAddForm ? "✕ CANCEL" : "+ ADD NEW PRODUCT"}
              </button>
              {/* Quick link to Teams tab */}
              <button className="btn-ghost green" style={{ padding: "12px 20px", fontSize: 12, letterSpacing: 2, display: "flex", alignItems: "center", gap: 6 }}
                onClick={() => setActiveTab("teams")}>
                🛡️ MANAGE TEAMS
              </button>
            </div>

            {showAddForm && (
              <div className="add-product-form">
                <div style={{ fontSize: 11, letterSpacing: 4, color: "#39ff14", marginBottom: 20, fontWeight: 900 }}>NEW PRODUCT</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                  <div className="form-grid">
                    <div className="form-field">
                      <label className="form-label">PRODUCT NAME *</label>
                      <input className="form-input" type="text" placeholder="e.g. Argentina 2024 Home" value={formData.name} onChange={e => handleFormChange("name", e.target.value)} />
                    </div>
                    <div className="form-field">
                      <label className="form-label">TYPE OF JERSEY *</label>
                      <select className="form-select" value={formData.type} onChange={e => handleFormChange("type", e.target.value)}>
                        {JERSEY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="form-field">
                      <label className="form-label">PRICE (₹) *</label>
                      <input className="form-input" type="number" min="0" placeholder="799" value={formData.price} onChange={e => handleFormChange("price", e.target.value)} inputMode="numeric" />
                    </div>
                    <div className="form-field">
                      <label className="form-label">STATUS</label>
                      <select className="form-select" value={formData.status} onChange={e => handleFormChange("status", e.target.value)}>
                        <option value="active">ACTIVE</option>
                        <option value="inactive">INACTIVE</option>
                        <option value="draft">DRAFT</option>
                      </select>
                    </div>
                  </div>

                  {/* ── TEAM SEARCH FIELD ── */}
                  <div className="form-field">
                    <label className="form-label">
                      LINK TO TEAM — type to search existing teams
                    </label>

                    {selectedTeamForProduct ? (
                      /* Selected team chip */
                      <div className="team-selected-chip">
                        {selectedTeamForProduct.logo_url
                          ? <img src={selectedTeamForProduct.logo_url} alt="" className="team-selected-logo" />
                          : <span style={{ fontSize: 24 }}>{sportIcon[selectedTeamForProduct.sport] || "🛡️"}</span>
                        }
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 900, fontSize: 15, color: "#fff", letterSpacing: 1 }}>{selectedTeamForProduct.name}</div>
                          <div style={{ fontSize: 10, color: sportColor[selectedTeamForProduct.sport] || "#39ff14", letterSpacing: 3, marginTop: 2 }}>
                            {sportIcon[selectedTeamForProduct.sport]} {selectedTeamForProduct.sport}
                          </div>
                        </div>
                        <button onClick={handleClearTeam} style={{ background: "none", border: "1px solid #333", color: "#555", cursor: "pointer", padding: "4px 10px", fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, letterSpacing: 1, fontWeight: 700 }}
                          onMouseEnter={e => e.currentTarget.style.color = "#ff4444"}
                          onMouseLeave={e => e.currentTarget.style.color = "#555"}>
                          ✕ CLEAR
                        </button>
                      </div>
                    ) : (
                      /* Search input + dropdown */
                      <div ref={teamSearchRef}>
                        <div className="team-search-wrap">
                          <input
                            className="form-input"
                            type="text"
                            placeholder="Type team name e.g. Real Madrid, India..."
                            value={teamSearchQuery}
                            onChange={e => { setTeamSearchQuery(e.target.value); setShowInlineTeamForm(false); }}
                            onFocus={() => { if (teamSearchResults.length > 0) setShowTeamDropdown(true); }}
                            autoComplete="off"
                          />
                          {showTeamDropdown && teamSearchQuery && (
                            <div className="team-dropdown">
                              {teamSearchResults.length > 0
                                ? teamSearchResults.map(team => (
                                    <div key={team.id} className="team-dropdown-item" onClick={() => handleSelectTeamForProduct(team)}>
                                      {team.logo_url
                                        ? <img src={team.logo_url} alt="" className="team-dropdown-logo" />
                                        : <span style={{ fontSize: 24, width: 32, textAlign: "center" }}>{sportIcon[team.sport] || "🛡️"}</span>
                                      }
                                      <div>
                                        <div style={{ fontWeight: 900, fontSize: 14, color: "#fff", letterSpacing: 1 }}>{team.name}</div>
                                        <div style={{ fontSize: 10, color: sportColor[team.sport] || "#39ff14", letterSpacing: 2, marginTop: 2 }}>
                                          {sportIcon[team.sport]} {team.sport}
                                        </div>
                                      </div>
                                    </div>
                                  ))
                                : (
                                  <div className="team-dropdown-empty">
                                    No team found for "{teamSearchQuery}"
                                  </div>
                                )
                              }
                            </div>
                          )}
                        </div>

                        {/* ── "Add new team" toggle button ── */}
                        {!showInlineTeamForm && (
                          <button
                            className="btn-add-team-inline"
                            onClick={() => {
                              setShowInlineTeamForm(true);
                              setShowTeamDropdown(false);
                              setInlineTeamForm({ ...EMPTY_TEAM_FORM, name: teamSearchQuery });
                            }}
                          >
                            + CREATE NEW TEAM WITH LOGO
                          </button>
                        )}

                        {/* ── Inline team creation form ── */}
                        {showInlineTeamForm && (
                          <div className="inline-team-form">
                            <div style={{ fontSize: 10, letterSpacing: 4, color: "#39ff14", marginBottom: 14, fontWeight: 900 }}>
                              🛡️ NEW TEAM
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                              <div className="form-grid">
                                <div className="form-field">
                                  <label className="form-label">TEAM NAME *</label>
                                  <input
                                    className="form-input inline"
                                    type="text"
                                    placeholder="e.g. Real Madrid"
                                    value={inlineTeamForm.name}
                                    onChange={e => { setInlineTeamForm(f => ({ ...f, name: e.target.value })); setInlineTeamError(""); }}
                                  />
                                </div>
                                <div className="form-field">
                                  <label className="form-label">SPORT *</label>
                                  <select className="form-select inline" value={inlineTeamForm.sport} onChange={e => setInlineTeamForm(f => ({ ...f, sport: e.target.value }))}>
                                    {SPORTS.map(s => <option key={s} value={s}>{sportIcon[s]} {s}</option>)}
                                  </select>
                                </div>
                              </div>

                              {/* Logo upload */}
                              <div className="form-field">
                                <label className="form-label">TEAM LOGO *</label>
                                <div className="logo-upload-area inline" onClick={() => inlineLogoInputRef.current?.click()}>
                                  <input ref={inlineLogoInputRef} type="file" accept="image/*" onChange={handleInlineTeamLogoChange} style={{ display: "none" }} />
                                  {inlineTeamLogoPreview ? (
                                    <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center" }}>
                                      <img src={inlineTeamLogoPreview} alt="preview" style={{ width: 52, height: 52, objectFit: "contain", background: "#0d0d0d", borderRadius: "50%", border: "2px solid #39ff14" }} />
                                      <div>
                                        <div style={{ color: "#39ff14", fontWeight: 900, fontSize: 12, letterSpacing: 2 }}>LOGO SELECTED</div>
                                        <div style={{ color: "#555", fontSize: 10, marginTop: 2 }}>{inlineTeamLogoFile?.name}</div>
                                        <div style={{ color: "#333", fontSize: 10, marginTop: 1 }}>Click to change</div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div>
                                      <div style={{ fontSize: 24, marginBottom: 6 }}>🛡️</div>
                                      <div style={{ color: "#555", fontSize: 12, letterSpacing: 2, fontWeight: 700 }}>CLICK TO UPLOAD LOGO</div>
                                      <div style={{ color: "#333", fontSize: 10, marginTop: 3 }}>PNG, JPG, SVG — 200×200px recommended</div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="form-field">
                                <label className="form-label">OR PASTE LOGO URL</label>
                                <input
                                  className="form-input inline"
                                  type="url"
                                  placeholder="https://..."
                                  value={inlineTeamForm.logo_url}
                                  onChange={e => { setInlineTeamForm(f => ({ ...f, logo_url: e.target.value })); setInlineTeamError(""); }}
                                />
                              </div>

                              {inlineTeamError && <div className="form-error">{inlineTeamError}</div>}

                              <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
                                <button className="btn-primary sm" onClick={handleSaveInlineTeam} disabled={inlineTeamSaving}>
                                  {inlineTeamSaving ? "SAVING..." : "✓ SAVE & SELECT TEAM"}
                                </button>
                                <button className="btn-ghost sm" onClick={() => { setShowInlineTeamForm(false); setInlineTeamError(""); }}>CANCEL</button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* SIZE STOCK */}
                  <div>
                    <label className="form-label" style={{ marginBottom: 10, display: "block" }}>STOCK PER SIZE *</label>
                    <div className="size-grid-add">
                      {SIZES.map(size => (
                        <div key={size} style={{ background: "#111", border: "1px solid #1e1e1e", padding: 10, textAlign: "center" }}>
                          <div style={{ fontSize: 11, letterSpacing: 2, color: "#39ff14", fontWeight: 900, marginBottom: 6 }}>{size}</div>
                          <input className="form-input" type="number" min="0" placeholder="0" value={formData.size_stock[size]} onChange={e => handleSizeStockChange(size, e.target.value)} style={{ padding: "6px", textAlign: "center" }} inputMode="numeric" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="form-field">
                    <label className="form-label">IMAGE URL</label>
                    <div className="image-url-row">
                      <input className="form-input" type="url" placeholder="https://..." value={formData.image_url} onChange={e => handleFormChange("image_url", e.target.value)} />
                      {formData.image_url && <img src={formData.image_url} alt="preview" className="image-preview" onError={e => { e.target.style.display = "none"; }} />}
                    </div>
                  </div>

                  {formError && <div className="form-error">{formError}</div>}

                  <div className="form-actions" style={{ display: "flex", gap: 12, paddingTop: 4 }}>
                    <button className="btn-primary" onClick={handleAddProduct} disabled={formSaving}>{formSaving ? "ADDING..." : "✓ ADD PRODUCT"}</button>
                    <button className="btn-ghost" onClick={resetProductForm}>CANCEL</button>
                  </div>
                </div>
              </div>
            )}

            {/* Product list */}
            <div style={{ background: "#111", border: "1px solid #1a1a1a" }}>
              {products.length === 0 ? (
                <div style={{ textAlign: "center", padding: "80px 0", color: "#333" }}>
                  <div style={{ fontSize: 60 }}>📊</div>
                  <p style={{ marginTop: 16, letterSpacing: 3, fontSize: 14 }}>NO PRODUCTS — ADD ONE ABOVE</p>
                </div>
              ) : products.map(p => (
                <StockRow key={p.id} product={p} deletingId={deletingId} confirmDeleteId={confirmDeleteId} setConfirmDeleteId={setConfirmDeleteId} onDelete={handleDeleteProduct}
                  onUpdate={(id, newSizeStock) => setProducts(prev => prev.map(x => x.id === id ? { ...x, size_stock: newSizeStock } : x))} />
              ))}
            </div>
          </div>
        )}

        {/* ══════════ TEAMS TAB ══════════ */}
        {activeTab === "teams" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <button className="add-product-toggle" onClick={() => { setShowTeamForm(f => !f); setTeamForm(EMPTY_TEAM_FORM); setTeamFormError(""); setTeamLogoFile(null); setTeamLogoPreview(""); }}>
                {showTeamForm ? "✕ CANCEL" : "+ ADD NEW TEAM"}
              </button>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["ALL", ...SPORTS].map(s => (
                  <button key={s} className={`sport-filter-btn ${activeSportFilter === s ? "active" : ""}`} onClick={() => setActiveSportFilter(s)}>
                    {s === "ALL" ? "ALL" : `${sportIcon[s]} ${s}`}
                  </button>
                ))}
              </div>
            </div>

            {showTeamForm && (
              <div className="add-product-form" style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, letterSpacing: 4, color: "#39ff14", marginBottom: 20, fontWeight: 900 }}>NEW TEAM</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div className="form-grid">
                    <div className="form-field">
                      <label className="form-label">TEAM NAME *</label>
                      <input className="form-input" type="text" placeholder="e.g. Real Madrid" value={teamForm.name}
                        onChange={e => { setTeamForm(f => ({ ...f, name: e.target.value })); setTeamFormError(""); }} />
                    </div>
                    <div className="form-field">
                      <label className="form-label">SPORT *</label>
                      <select className="form-select" value={teamForm.sport} onChange={e => setTeamForm(f => ({ ...f, sport: e.target.value }))}>
                        {SPORTS.map(s => <option key={s} value={s}>{sportIcon[s]} {s}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="form-field">
                    <label className="form-label">TEAM LOGO *</label>
                    <div className="logo-upload-area" onClick={() => logoInputRef.current?.click()}>
                      <input ref={logoInputRef} type="file" accept="image/*" onChange={handleTeamLogoChange} style={{ display: "none" }} />
                      {teamLogoPreview ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 16, justifyContent: "center" }}>
                          <img src={teamLogoPreview} alt="preview" style={{ width: 72, height: 72, objectFit: "contain", background: "#0d0d0d", borderRadius: "50%", border: "2px solid #39ff14" }} />
                          <div>
                            <div style={{ color: "#39ff14", fontWeight: 900, fontSize: 13, letterSpacing: 2 }}>LOGO SELECTED</div>
                            <div style={{ color: "#555", fontSize: 11, marginTop: 4 }}>{teamLogoFile?.name}</div>
                            <div style={{ color: "#444", fontSize: 10, marginTop: 2 }}>Click to change</div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: 32, marginBottom: 8 }}>🛡️</div>
                          <div style={{ color: "#555", fontSize: 13, letterSpacing: 2, fontWeight: 700 }}>CLICK TO UPLOAD LOGO</div>
                          <div style={{ color: "#333", fontSize: 11, marginTop: 4 }}>PNG, JPG, SVG — recommended 200×200px</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-field">
                    <label className="form-label">OR LOGO URL (if not uploading)</label>
                    <input className="form-input" type="url" placeholder="https://..." value={teamForm.logo_url}
                      onChange={e => { setTeamForm(f => ({ ...f, logo_url: e.target.value })); setTeamFormError(""); }} />
                  </div>

                  {teamFormError && <div className="form-error">{teamFormError}</div>}

                  <div className="form-actions" style={{ display: "flex", gap: 12, paddingTop: 4 }}>
                    <button className="btn-primary" onClick={handleAddTeam} disabled={teamSaving}>{teamSaving ? "SAVING..." : "✓ ADD TEAM"}</button>
                    <button className="btn-ghost" onClick={() => { setShowTeamForm(false); setTeamForm(EMPTY_TEAM_FORM); setTeamFormError(""); setTeamLogoFile(null); setTeamLogoPreview(""); }}>CANCEL</button>
                  </div>
                </div>
              </div>
            )}

            {loadingTeams ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#39ff14", letterSpacing: 3 }}>LOADING TEAMS...</div>
            ) : filteredTeams.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 0", color: "#333" }}>
                <div style={{ fontSize: 60 }}>🛡️</div>
                <p style={{ marginTop: 16, letterSpacing: 3, fontSize: 14 }}>NO TEAMS — ADD ONE ABOVE</p>
              </div>
            ) : (
              <div className="teams-grid">
                {filteredTeams.map(team => {
                  const isConfirming = confirmDeleteTeamId === team.id;
                  const isDeleting = deletingTeamId === team.id;
                  const sc = sportColor[team.sport] || "#39ff14";
                  const productCount = products.filter(p => p.team_id === team.id).length;
                  return (
                    <div key={team.id} className="team-card">
                      <div className="team-sport-pill" style={{ background: sc + "22", border: `1px solid ${sc}44`, color: sc, position: "absolute", top: 10, right: 10 }}>
                        {sportIcon[team.sport]} {team.sport}
                      </div>
                      <div className="team-logo-circle" style={{ borderColor: sc + "44" }}>
                        {team.logo_url
                          ? <img src={team.logo_url} alt={team.name} style={{ width: 60, height: 60, objectFit: "contain" }} />
                          : <span style={{ fontSize: 36 }}>{sportIcon[team.sport] || "🛡️"}</span>
                        }
                      </div>
                      <div style={{ fontWeight: 900, fontSize: 14, letterSpacing: 1, textAlign: "center", lineHeight: 1.2 }}>{team.name}</div>
                      <div style={{ fontSize: 10, letterSpacing: 3, color: productCount > 0 ? "#39ff14" : "#333", fontWeight: 900 }}>
                        {productCount} JERSEY{productCount !== 1 ? "S" : ""}
                      </div>
                      <div style={{ marginTop: 4 }}>
                        {!isConfirming ? (
                          <button className="btn-danger" style={{ fontSize: 10, padding: "4px 10px" }} onClick={() => setConfirmDeleteTeamId(team.id)} disabled={isDeleting}>🗑 REMOVE</button>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
                            <div style={{ fontSize: 9, color: "#ff4444", letterSpacing: 1 }}>CONFIRM?</div>
                            <div style={{ display: "flex", gap: 4 }}>
                              <button className="btn-cancel-sm" onClick={() => setConfirmDeleteTeamId(null)}>NO</button>
                              <button className="btn-danger-confirm" onClick={() => handleDeleteTeam(team.id)} disabled={isDeleting}>{isDeleting ? "..." : "DELETE"}</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════ USERS TAB ══════════ */}
        {activeTab === "users" && (
          <div style={{ background: "#111", border: "1px solid #1a1a1a", animation: "fadeUp 0.4s ease" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
                <thead>
                  <tr style={{ background: "#0d0d0d", borderBottom: "1px solid #1a1a1a" }}>
                    {["USER / EMAIL", "PHONE", "ROLE", "JOINED"].map(h => (
                      <th key={h} style={{ padding: "16px 20px", textAlign: "left", fontSize: 11, letterSpacing: 2, color: "#555" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(usersList) && usersList.map(u => (
                    <tr key={u.id} style={{ borderBottom: "1px solid #0d0d0d" }}>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ fontWeight: 900, fontSize: 15 }}>{u.full_name || "Guest"}</div>
                        <div style={{ fontSize: 12, color: "#555" }}>{u.email}</div>
                      </td>
                      <td style={{ padding: "16px 20px", fontSize: 14, color: "#aaa" }}>{u.phone || "N/A"}</td>
                      <td style={{ padding: "16px 20px" }}>
                        <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 2, padding: "3px 8px", background: u.role === "admin" ? "#39ff1415" : "#222", color: u.role === "admin" ? "#39ff14" : "#555", border: `1px solid ${u.role === "admin" ? "#39ff1444" : "#333"}` }}>
                          {u.role?.toUpperCase() || "USER"}
                        </span>
                      </td>
                      <td style={{ padding: "16px 20px", fontSize: 12, color: "#555" }}>{u.created_at ? new Date(u.created_at).toLocaleDateString() : "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {usersList.length === 0 && !loadingUsers && <div style={{ textAlign: "center", padding: "40px", color: "#333" }}>NO USERS FOUND</div>}
            {loadingUsers && <div style={{ textAlign: "center", padding: "40px", color: "#39ff14" }}>LOADING...</div>}
          </div>
        )}
      </div>
    </div>
  );
}

// ── StockRow ──────────────────────────────────────────────
// ── StockRow ──────────────────────────────────────────────
// Drop-in replacement for the StockRow at the bottom of AdminPage.jsx

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const sportIcon = { FOOTBALL: "⚽", CRICKET: "🏏", BASKETBALL: "🏀" };

function StockRow({ product: p, deletingId, confirmDeleteId, setConfirmDeleteId, onDelete, onUpdate }) {
  const [sizeInputs, setSizeInputs]   = useState({});
  // FIX 1: per-size saving state instead of one shared boolean
  const [savingSize, setSavingSize]   = useState(null);
  const [saveError,  setSaveError]    = useState(null);
  // FIX 2: local copy of size_stock so re-clicks within the same row
  //        always use the latest value, not a stale prop
  const [localSizeStock, setLocalSizeStock] = useState(
    () => ({ XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0, ...(p.size_stock || {}) })
  );

  // Keep local copy in sync when parent refreshes the product
  useEffect(() => {
    setLocalSizeStock({ XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0, ...(p.size_stock || {}) });
  }, [p.size_stock]);

  const handleSizeRestock = async (size) => {
    const qty = parseInt(sizeInputs[size] || 0);
    if (!qty || qty <= 0) return;

    setSavingSize(size);
    setSaveError(null);

    // FIX 3: use localSizeStock (not p.size_stock) so sequential
    //        updates within the same row don't lose previous changes
    const newSizeStock = {
      ...localSizeStock,
      [size]: (localSizeStock[size] || 0) + qty,
    };

    // FIX 4: guard every value with || 0 so totalStock is never NaN
    const totalStock = SIZES.reduce((s, sz) => s + (newSizeStock[sz] || 0), 0);

    // FIX 5: check Supabase error and surface it to the admin
    const { error } = await supabase
      .from("products")
      .update({ size_stock: newSizeStock, stock: totalStock })
      .eq("id", p.id);

    if (error) {
      setSaveError(`Failed to update ${size}: ${error.message}`);
      setSavingSize(null);
      return;
    }

    // Update local state immediately so the next click is correct
    setLocalSizeStock(newSizeStock);
    onUpdate(p.id, newSizeStock);
    setSizeInputs(prev => ({ ...prev, [size]: "" }));
    setSavingSize(null);
  };

  const isConfirming = confirmDeleteId === p.id;
  const isDeleting   = deletingId      === p.id;

  const typeClass =
    p.type === "PLAYER VERSION" ? "player" :
    p.type === "FAN VERSION"    ? "fan"    :
    p.type === "RETRO"          ? "retro"  : "";

  // FIX 6: use localSizeStock for display so the number updates
  //        immediately after save without waiting for a parent re-render
  const totalStock = SIZES.reduce((s, sz) => s + (localSizeStock[sz] || 0), 0);

  return (
    <div className="stock-row-item">
      <div className="stock-row-top">
        <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 }}>
          {p.image_url
            ? <img src={p.image_url} alt={p.name} style={{ width: 48, height: 48, objectFit: "cover", background: "#0d0d0d", flexShrink: 0 }} />
            : <div style={{ width: 48, height: 48, background: "#0d0d0d", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>👕</div>
          }
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 900, fontSize: 16, letterSpacing: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
              <span style={{ color: "#555", fontSize: 12 }}>₹{p.price} · {p.status?.toUpperCase()}</span>
              {p.type && <span className={`type-badge ${typeClass}`}>{p.type}</span>}
              <span style={{ fontSize: 12, fontWeight: 900, color: totalStock === 0 ? "#ff4444" : totalStock <= 10 ? "#ff9900" : "#39ff14" }}>
                TOTAL: {totalStock}
              </span>
              {p.teams && (
                <span className="product-team-badge">
                  {p.teams.logo_url
                    ? <img src={p.teams.logo_url} alt="" className="product-team-logo-tiny" />
                    : <span style={{ fontSize: 12 }}>{sportIcon[p.teams.sport] || "🛡️"}</span>
                  }
                  <span style={{ fontSize: 10, letterSpacing: 1, color: "#aaa", fontWeight: 700 }}>{p.teams.name}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ flexShrink: 0, marginLeft: 12 }}>
          {!isConfirming ? (
            <button className="btn-danger" style={{ fontSize: 10, padding: "4px 10px" }} onClick={() => setConfirmDeleteId(p.id)} disabled={isDeleting}>
              🗑 REMOVE
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
              <div style={{ fontSize: 10, letterSpacing: 1, color: "#ff4444", marginBottom: 2 }}>CONFIRM DELETE?</div>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="btn-cancel-sm" onClick={() => setConfirmDeleteId(null)}>NO</button>
                <button className="btn-danger-confirm" onClick={() => onDelete(p.id)} disabled={isDeleting}>
                  {isDeleting ? "..." : "YES, DELETE"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FIX 7: show error banner if save failed */}
      {saveError && (
        <div style={{ background: "#ff444415", border: "1px solid #ff444440", color: "#ff4444", fontSize: 11, letterSpacing: 1, padding: "8px 12px", marginBottom: 10 }}>
          ⚠ {saveError}
        </div>
      )}

      <div className="size-grid-stock">
        {SIZES.map(size => {
          const stock      = localSizeStock[size] || 0;
          const isSaving   = savingSize === size;
          const anyBusy    = savingSize !== null;       // FIX 1: only THIS size button spins

          return (
            <div key={size} style={{ background: "#0d0d0d", border: `1px solid ${stock === 0 ? "#ff444440" : "#1a1a1a"}`, padding: "8px", textAlign: "center" }}>
              <div style={{ fontSize: 10, letterSpacing: 2, color: "#555", marginBottom: 4, fontWeight: 700 }}>{size}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: stock === 0 ? "#ff4444" : stock <= 2 ? "#ff9900" : "#39ff14", marginBottom: 6 }}>
                {stock}
              </div>
              <input
                type="number"
                min="1"
                placeholder="+"
                value={sizeInputs[size] || ""}
                onChange={e => setSizeInputs(prev => ({ ...prev, [size]: e.target.value }))}
                className="size-stock-input"
                inputMode="numeric"
                // FIX 1: only disable THIS size's input while it saves
                disabled={isSaving}
              />
              <button
                className="size-add-btn"
                onClick={() => handleSizeRestock(size)}
                // FIX 1: only THIS size button shows "..." — others stay clickable
                disabled={isSaving}
              >
                {isSaving ? "..." : "+ADD"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}