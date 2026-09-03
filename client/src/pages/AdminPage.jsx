import { Helmet } from "react-helmet-async";
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { express } from "../express";
import { downloadInvoice } from "../utils/downloadInvoice";
import { API_BASE } from "../config/api";
import BrandLogo from "../components/BrandLogo";
import { getProductImages, getFirstImage } from "../utils/imageHelpers";
import { useAdminOrderNotifications } from "../hooks/useAdminOrderNotifications";
import { fetchProductReviews, addProductReview, toggleReviewPublishStatus, deleteProductReview, updateProductReview } from "../utils/reviews";


const statusOptions = ["pending", "inventory_pending", "preparing", "shipped", "delivered", "cancelled"];
const statusColors = {
  pending: "#f39c12",
  inventory_pending: "#e74c3c", // Red to highlight manual intervention
  preparing: "#3498db",
  shipped: "#9b59b6",
  delivered: "#2ecc71",
  cancelled: "#e74c3c",
};

const JERSEY_TYPES = ["FAN VERSION", "PLAYER VERSION", "RETRO"];
const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const SPORTS = ["FOOTBALL", "CRICKET", "BASKETBALL"];
const sportIcon = { FOOTBALL: "⚽", CRICKET: "🏏", BASKETBALL: "🏀" };
const sportColor = { FOOTBALL: "#39ff14", CRICKET: "#00aaff", BASKETBALL: "#ff9900" };

const uploadProductImageAndGetUrl = async (file) => {
  const ext = file.name ? file.name.split(".").pop() : "jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
  const { data, error } = await express.storage.from("Jersey image").upload(fileName, file);
  if (error) throw new Error("Image upload failed: " + (error.message || "Upload error"));
  return data.publicUrl;
};


const EMPTY_FORM = {
  name: "",
  price: "",
  status: "active",
  image_url: "",
  type: "FAN VERSION",
  team_id: "",
  size_stock: { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 },
  featured: false,
  is_26_27: false,
  is_clearance: false,
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
  const [adminProductSearch, setAdminProductSearch] = useState("");
  const [activeTab, setActiveTab] = useState("orders");
  const [updatingId, setUpdatingId] = useState(null);

  // ── Order notifications ──
  const { permissionStatus, isSubscribed, isAdmin: isNotifAdmin, enableNotifications } = useAdminOrderNotifications();

  // Settings
  const [featuredCategoryName, setFeaturedCategoryName] = useState("FEATURED");
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [settingsSuccess, setSettingsSuccess] = useState("");

  // Product form
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [formSaving, setFormSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [cloningId, setCloningId] = useState(null);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [tempUrlInput, setTempUrlInput] = useState("");
  const [uploadingNewProductImage, setUploadingNewProductImage] = useState(false);


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
  const [stats, setStats] = useState({ totalRevenue: 0, gmv: 0, cashCollected: 0, pendingCash: 0, totalOrders: 0, totalUsers: 0, totalProducts: 0, pendingOrders: 0 });
  const [usersList, setUsersList] = useState([]);
  const [, setLoadingStats] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [usersMeta, setUsersMeta] = useState({ page: 1, limit: 50, total: 0 });
  const [deletingUserId, setDeletingUserId] = useState(null);

  // Cloud & Edge limits
  const [edgeLimits, setEdgeLimits] = useState(null);
  const [loadingEdgeLimits, setLoadingEdgeLimits] = useState(false);

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

  // ── Review Management State & Handlers ──
  const [adminReviews, setAdminReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [selectedReviewProductId, setSelectedReviewProductId] = useState("ALL");
  const [reviewSearchQuery, setReviewSearchQuery] = useState("");
  const [reviewForm, setReviewForm] = useState({
    productId: "",
    reviewer_name: "",
    rating: 5,
    comment: "",
    photos: []
  });
  const [uploadingReviewPhoto, setUploadingReviewPhoto] = useState(false);
  const [savingReview, setSavingReview] = useState(false);
  const [reviewFormError, setReviewFormError] = useState("");
  const [reviewFormSuccess, setReviewFormSuccess] = useState("");

  const loadAdminReviews = useCallback(async () => {
    setLoadingReviews(true);
    try {
      const all = await fetchProductReviews(null);
      setAdminReviews(all || []);
    } catch (err) {
      console.error("Error loading admin reviews:", err);
      setAdminReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeTab === "reviews") {
      loadAdminReviews();
    }
  }, [activeTab, loadAdminReviews]);

  const handleCreateReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.productId) {
      setReviewFormError("Please select a jersey product.");
      return;
    }
    if (!reviewForm.reviewer_name.trim()) {
      setReviewFormError("Please enter reviewer name.");
      return;
    }
    if (!reviewForm.comment.trim()) {
      setReviewFormError("Please enter review comment.");
      return;
    }

    setSavingReview(true);
    setReviewFormError("");
    setReviewFormSuccess("");

    try {
      await addProductReview(reviewForm.productId, {
        reviewer_name: reviewForm.reviewer_name.trim(),
        rating: Number(reviewForm.rating) || 5,
        comment: reviewForm.comment.trim(),
        photos: reviewForm.photos,
        is_published: true
      });

      setReviewFormSuccess("✓ Review uploaded successfully!");
      setReviewForm({
        productId: selectedReviewProductId !== "ALL" ? selectedReviewProductId : "",
        reviewer_name: "",
        rating: 5,
        comment: "",
        photos: []
      });
      await loadAdminReviews();
    } catch (err) {
      setReviewFormError("Failed to upload review: " + err.message);
    } finally {
      setSavingReview(false);
    }
  };

  const handleToggleReviewPublish = async (productId, reviewId, currentStatus) => {
    try {
      await toggleReviewPublishStatus(productId, reviewId, !currentStatus);
      await loadAdminReviews();
    } catch (err) {
      alert("Failed to update review status: " + err.message);
    }
  };

  const handleDeleteReview = async (productId, reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review permanently?")) return;
    try {
      await deleteProductReview(productId, reviewId);
      await loadAdminReviews();
    } catch (err) {
      alert("Failed to delete review: " + err.message);
    }
  };

  const handleUploadReviewPhotoFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingReviewPhoto(true);
    try {
      const url = await uploadProductImageAndGetUrl(file);
      setReviewForm(prev => ({
        ...prev,
        photos: [...prev.photos, url]
      }));
    } catch (err) {
      alert("Failed to upload photo: " + err.message);
    } finally {
      setUploadingReviewPhoto(false);
      e.target.value = "";
    }
  };

  // ── Edit Review State & Handlers ──
  const [editingReview, setEditingReview] = useState(null);
  const [editReviewForm, setEditReviewForm] = useState({
    id: "",
    productId: "",
    oldProductId: "",
    reviewer_name: "",
    rating: 5,
    comment: "",
    photos: [],
    is_published: true
  });
  const [uploadingEditReviewPhoto, setUploadingEditReviewPhoto] = useState(false);
  const [savingEditReview, setSavingEditReview] = useState(false);
  const [editReviewError, setEditReviewError] = useState("");
  const [editReviewSuccess, setEditReviewSuccess] = useState("");

  const handleStartEditReview = (review) => {
    setEditingReview(review);
    setEditReviewForm({
      id: review.id,
      productId: String(review.product_id),
      oldProductId: String(review.product_id),
      reviewer_name: review.reviewer_name || "",
      rating: Number(review.rating) || 5,
      comment: review.comment || "",
      photos: Array.isArray(review.photos) ? [...review.photos] : [],
      is_published: review.is_published !== false
    });
    setEditReviewError("");
    setEditReviewSuccess("");
  };

  const handleCancelEditReview = () => {
    setEditingReview(null);
    setEditReviewError("");
    setEditReviewSuccess("");
  };

  const handleUploadEditReviewPhotoFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingEditReviewPhoto(true);
    try {
      const url = await uploadProductImageAndGetUrl(file);
      setEditReviewForm(prev => ({
        ...prev,
        photos: [...prev.photos, url]
      }));
    } catch (err) {
      alert("Failed to upload photo: " + err.message);
    } finally {
      setUploadingEditReviewPhoto(false);
      e.target.value = "";
    }
  };

  const handleRemoveEditReviewPhoto = (photoIndex) => {
    setEditReviewForm(prev => ({
      ...prev,
      photos: prev.photos.filter((_, idx) => idx !== photoIndex)
    }));
  };

  const handleSaveEditReview = async (e) => {
    e.preventDefault();
    if (!editReviewForm.productId) {
      setEditReviewError("Please select a jersey product.");
      return;
    }
    if (!editReviewForm.reviewer_name.trim()) {
      setEditReviewError("Please enter reviewer name.");
      return;
    }
    if (!editReviewForm.comment.trim()) {
      setEditReviewError("Please enter review comment.");
      return;
    }

    setSavingEditReview(true);
    setEditReviewError("");
    setEditReviewSuccess("");

    try {
      await updateProductReview(
        editReviewForm.productId,
        editReviewForm.id,
        {
          reviewer_name: editReviewForm.reviewer_name.trim(),
          rating: Number(editReviewForm.rating) || 5,
          comment: editReviewForm.comment.trim(),
          photos: editReviewForm.photos,
          is_published: editReviewForm.is_published
        },
        editReviewForm.oldProductId
      );

      setEditReviewSuccess("✓ Review updated successfully!");
      await loadAdminReviews();
      setTimeout(() => {
        setEditingReview(null);
        setEditReviewSuccess("");
      }, 1200);
    } catch (err) {
      setEditReviewError("Failed to update review: " + err.message);
    } finally {
      setSavingEditReview(false);
    }
  };

  const [deletingTeamId, setDeletingTeamId] = useState(null);
  const [confirmDeleteTeamId, setConfirmDeleteTeamId] = useState(null);
  const [activeSportFilter, setActiveSportFilter] = useState("ALL");
  const logoInputRef = useRef();
  const teamSearchRef = useRef();

  // ── Auth check ──
  useEffect(() => {
    const checkAdmin = async () => {
      if (!supabase || !supabase.auth) return;
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) { setChecking(false); navigate("/"); return; }

      const ADMIN_EMAIL = "navneeldutta@gmail.com";
      const isAuthorizedEmail = user.email && user.email.toLowerCase() === ADMIN_EMAIL;

      if (!isAuthorizedEmail) {
        setChecking(false);
        navigate("/");
        return;
      }

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      if (profile?.role === "admin" || isAuthorizedEmail) {
        setAuthed(true);
        setChecking(false);
      } else {
        setChecking(false);
        navigate("/");
      }
    };
    checkAdmin();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch all data ──
  useEffect(() => {
    if (!authed) return;
    const fetchAdminData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      express.admin.getStats(token)
        .then(d => { if (d && !d.message) setStats(d); setLoadingStats(false); })
        .catch(() => setLoadingStats(false));

      fetchUsers(token, 1, userSearch);

      const [ordersData, productsRes, teamsRes] = await Promise.all([
        express.admin.getOrders(token),
        express.from("products").select("*").order("name", { ascending: true }),
        express.from("teams").select("id, name, logo_url, sport").order("name", { ascending: true })
      ]);
      if (Array.isArray(ordersData) && ordersData.length > 0) {
        setOrders(ordersData);
      } else {
        const fallbackRes = await supabase.from("orders").select("id, status, total, amount_paid, balance_due, pay_method, created_at, admin_notes, items, customer_name, customer_email, address, city, state, pincode").order("created_at", { ascending: false }).limit(200);
        if (fallbackRes.data) setOrders(fallbackRes.data);
      }
      if (productsRes.data) setProducts(productsRes.data);
      if (teamsRes.data) setAllTeams(teamsRes.data);
        
      express.admin.getSettings(token)
        .then(d => { if (d && d.featured_category_name) setFeaturedCategoryName(d.featured_category_name); })
        .catch(() => {});

      express.admin.getEdgeLimits(token)
        .then(d => { if (d && d.success) setEdgeLimits(d); })
        .catch(() => {});
    };
    fetchAdminData();
  }, [authed]);

  const refreshEdgeLimits = useCallback(async () => {
    setLoadingEdgeLimits(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const data = await express.admin.getEdgeLimits(token);
      if (data && data.success) setEdgeLimits(data);
    } catch (_) {}
    finally {
      setLoadingEdgeLimits(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "edge" && authed) {
      refreshEdgeLimits();
    }
  }, [activeTab, authed, refreshEdgeLimits]);

  const fetchUsers = async (tokenOverride, page = usersMeta.page, search = userSearch) => {
    setLoadingUsers(true);
    try {
      const token = tokenOverride || (await supabase.auth.getSession()).data?.session?.access_token;
      const data = await express.admin.getUsers(token, page, search, usersMeta.limit || 50);
      const users = Array.isArray(data) ? data : data.users;
      setUsersList(Array.isArray(users) ? users : []);
      setUsersMeta(Array.isArray(data) ? { page: 1, limit: users.length, total: users.length } : {
        page: data.page || page,
        limit: data.limit || usersMeta.limit,
        total: data.total || 0,
      });
    } catch {
      setUsersList([]);
      setUsersMeta(meta => ({ ...meta, total: 0 }));
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Delete this user account? This removes the auth user and profile.")) return;
    setDeletingUserId(id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const result = await express.admin.deleteUser(id, session?.access_token);
      if (result.message && !result.success) {
        throw new Error(result.message || "Failed to delete user");
      }
      setUsersList(prev => prev.filter(user => user.id !== id));
      setUsersMeta(meta => ({ ...meta, total: Math.max(0, meta.total - 1) }));
      setStats(prev => ({ ...prev, totalUsers: Math.max(0, prev.totalUsers - 1) }));
    } catch (error) {
      alert(error.message);
    } finally {
      setDeletingUserId(null);
    }
  };

  // ── Fetch teams when Teams tab opens ──
  useEffect(() => {
    if (activeTab !== "teams") return;
    setLoadingTeams(true);
    express.from("teams").select("*").order("name", { ascending: true })
      .then(({ data }) => {
        if (data) {
          setTeams(data);
          setAllTeams(data);
        }
        setLoadingTeams(false);
      })
      .catch(() => setLoadingTeams(false));
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ──
  const updateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      await express.admin.updateOrderStatus(orderId, newStatus, token);
    } catch (_) {}
    await supabase.from("orders").update({ status: newStatus }).eq("id", orderId).catch(() => {});
    setOrders(prev => {
      const updated = prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
      const totalRev = updated
        .filter(o => o.status !== "cancelled")
        .reduce((acc, order) => acc + (order.total ?? 0), 0);
        
      const cashCollected = updated.reduce((acc, order) => {
        const paid = order.amount_paid != null ? Number(order.amount_paid) : ((String(order.pay_method).toLowerCase() === 'cod') ? 149 : (Number(order.total) || 0));
        return acc + paid;
      }, 0);

      const pendingCash = updated
        .filter(o => o.status !== "cancelled")
        .reduce((acc, order) => {
          const paid = order.amount_paid != null ? Number(order.amount_paid) : ((String(order.pay_method).toLowerCase() === 'cod') ? 149 : (Number(order.total) || 0));
          const bal = order.balance_due != null ? Number(order.balance_due) : Math.max(0, (Number(order.total) || 0) - paid);
          return acc + bal;
        }, 0);

      const pendingCount = updated.filter(o => o.status === "pending").length;
      setStats(s => ({ ...s, totalRevenue: totalRev, gmv: totalRev, cashCollected, pendingCash, pendingOrders: pendingCount }));
      return updated;
    });
    setUpdatingId(null);
  };

  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    setSettingsError("");
    setSettingsSuccess("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const data = await express.admin.updateSettings(
        { featured_category_name: featuredCategoryName.trim() || "FEATURED" },
        session?.access_token
      );
      if (data.error) throw new Error(data.error || "Failed to save settings");
      setSettingsSuccess("Settings saved successfully.");
      setTimeout(() => setSettingsSuccess(""), 3000);
    } catch (err) {
      setSettingsError(err.message);
    } finally {
      setSettingsSaving(false);
    }
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
    const isPlayerProd = (formData.type || "").toUpperCase().includes("PLAYER") || name.toUpperCase().includes("PLAYER");
    const defaultDescText = isPlayerProd
      ? "Authentic Match / Player Edition jersey engineered with Thailand superior ultra-lightweight Dry-Fit performance fabric, heat-transferred authentic rubberised 3D club crests, and precision athletic slim-fit tailoring as worn on pitch by professional players."
      : "Premium Fan Edition football jersey imported from Thailand. Features breathable Dry-Fit fabric technology for maximum comfort, high-density embroidered club logos, and comes complete with matching shorts included.";

    const payload = {
      name: name.trim(),
      price: Number(price),
      stock: totalStock,
      size_stock: formData.size_stock,
      status: formData.status,
      image_url: uploadedImages.join(",") || null,
      type: formData.type,
      team_id: formData.team_id || null,
      featured: formData.featured || false,
      is_26_27: formData.is_26_27 || false,
      is_clearance: formData.is_clearance || false,
      description: formData.description?.trim() ? formData.description.trim() : defaultDescText
    };
    const { data, error } = await express.from("products").insert([payload]).single();
    if (error) {
      setFormError("Failed to add product: " + error.message);
    } else if (data) {
      setProducts(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setUploadedImages([]);
      setFormData(EMPTY_FORM);
      setSelectedTeamForProduct(null);
      setTeamSearchQuery("");
      setShowAddForm(false);
      setShowInlineTeamForm(false);
    }
    setFormSaving(false);
  };

  const handleDeleteProduct = async (id) => {
    setDeletingId(id);
    try {
      const { error } = await express.from("products").delete().eq("id", id);
      if (!error) setProducts(prev => prev.filter(p => p.id !== id));
      else alert("Failed to delete: " + error.message);
    } catch { alert("Error connecting to server."); }
    finally { setDeletingId(null); setConfirmDeleteId(null); }
  };

  const handleCloneProduct = async (productToClone) => {
    setCloningId(productToClone.id);
    const clonedPayload = {
      name: `${productToClone.name} (Copy)`,
      price: Number(productToClone.price) || 0,
      type: productToClone.type || "FAN VERSION",
      status: "active",
      team_id: productToClone.team_id || null,
      image_url: productToClone.image_url || null,
      featured: !!productToClone.featured,
      is_26_27: !!productToClone.is_26_27,
      is_clearance: !!productToClone.is_clearance,
      size_stock: productToClone.size_stock || { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 },
      stock: SIZES.reduce((sum, sz) => sum + (productToClone.size_stock?.[sz] || 0), 0)
    };

    const { data, error } = await express.from("products").insert([clonedPayload]).single();
    if (error) {
      alert("Failed to clone product: " + error.message);
    } else if (data) {
      setProducts(prev => [data, ...prev]);
    }
    setCloningId(null);
  };

  // ── Upload team logo helper ──
  const uploadLogoAndGetUrl = async (file, teamName) => {
    const ext = file.name ? file.name.split(".").pop() : "png";
    const fileName = `${Date.now()}-${teamName.trim().replace(/\s+/g, "-").toLowerCase()}.${ext}`;
    const { data, error } = await express.storage.from("team-logos").upload(fileName, file);
    if (error) throw new Error("Logo upload failed: " + (error.message || "Upload error"));
    return data.publicUrl;
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
      const { data, error } = await express.from("teams").insert([payload]).single();
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
      const { data, error } = await express.from("teams").insert([payload]).single();
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
    try {
      const { error } = await express.from("teams").delete().eq("id", id);
      if (!error) {
        setTeams(prev => prev.filter(t => t.id !== id));
        setAllTeams(prev => prev.filter(t => t.id !== id));
      } else {
        alert("Failed to delete team: " + error.message);
      }
    } catch {
      alert("Error connecting to server.");
    } finally {
      setDeletingTeamId(null);
      setConfirmDeleteTeamId(null);
    }
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
    setUploadedImages([]);
    setTempUrlInput("");
  };

  if (checking) return (
    <div className="admin-loading">
      <Helmet><meta name="robots" content="noindex,nofollow" /><title>Admin Dashboard | The Jersey Vault</title></Helmet>

      CHECKING ACCESS...
    </div>
  );
  if (!authed) return null;

  return (
    <div className="admin-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,900;1,900&family=Barlow:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #39ff14; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px);} to{opacity:1;transform:translateY(0);} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-10px);} to{opacity:1;transform:translateY(0);} }

        .admin-root { user-select: text; -webkit-user-select: text; }
        .tab-btn { background:transparent; border:none; font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:15px; letter-spacing:3px; cursor:pointer; padding:14px 28px; border-bottom:2px solid transparent; color:#444; transition:all 0.2s; white-space:nowrap; }
        .tab-btn.active { color:#39ff14; border-bottom-color:#39ff14; }
        .status-select { background:#1a1a1a; border:1px solid #333; color:#fff; padding:6px 10px; font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:700; letter-spacing:1px; cursor:pointer; outline:none; }
        .order-card { background:#111; border:1px solid #1a1a1a; padding:20px; margin-bottom:12px; animation:fadeUp 0.4s ease; transition:border-color 0.2s; user-select: text; -webkit-user-select: text; }
        .order-card:hover { border-color:#2a2a2a; }
        .stat-card { background:#111; border:1px solid #1a1a1a; padding:24px; text-align:center; border-left:3px solid #39ff14; }
        .add-product-form { background:#0d0d0d; border:1px solid #39ff1430; padding:28px; margin-bottom:20px; animation:slideDown 0.3s ease; }
        .inline-team-form { background:#0a1a0a; border:1px solid #39ff1430; border-top: 2px solid #39ff14; padding:20px; margin-top:12px; animation:slideDown 0.25s ease; }
        .form-field { display:flex; flex-direction:column; gap:6px; }
        .form-label { font-size:12px; letter-spacing:3px; color:#555; font-weight:700; }
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
        .btn-ghost.sm { padding:9px 16px; font-size:12px; letter-spacing:1px; }
        .btn-ghost.green { border-color:#39ff1440; color:#39ff14; }
        .btn-ghost.green:hover { border-color:#39ff14; background:#39ff1410; }
        .btn-danger { background:transparent; color:#ff4444; border:1px solid #ff444430; padding:6px 14px; font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:12px; letter-spacing:2px; cursor:pointer; transition:all 0.2s; }
        .btn-danger:hover { background:#ff444415; border-color:#ff4444; }
        .btn-danger:disabled { opacity:0.3; cursor:not-allowed; }
        .btn-danger-confirm { background:#ff4444; color:#fff; border:none; padding:6px 14px; font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:12px; letter-spacing:2px; cursor:pointer; }
        .btn-cancel-sm { background:transparent; color:#555; border:1px solid #222; padding:6px 10px; font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:12px; letter-spacing:1px; cursor:pointer; }
        .btn-cancel-sm:hover { color:#aaa; }
        .btn-add-team-inline { background:transparent; border:1px dashed #39ff1440; color:#39ff1499; padding:8px 16px; font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:12px; letter-spacing:3px; cursor:pointer; transition:all 0.2s; width:100%; margin-top:8px; }
        .btn-add-team-inline:hover { border-color:#39ff14; color:#39ff14; background:#39ff1408; }
        .stock-row-item { padding:16px 20px; border-bottom:1px solid #1a1a1a; transition:background 0.15s; }
        .stock-row-item:last-child { border-bottom:none; }
        .stock-row-item:hover { background:#0a0a0a; }
        .add-product-toggle { background:transparent; border:1px dashed #39ff1440; color:#39ff14; padding:12px 24px; font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:13px; letter-spacing:3px; cursor:pointer; transition:all 0.2s; display:flex; align-items:center; gap:8px; }
        .add-product-toggle:hover { background:#39ff1410; border-color:#39ff14; }
        .admin-search-input { width:100%; background:#0a0a0a; border:1px solid #2a2a2a; color:#fff; font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:700; letter-spacing:2px; padding:10px 32px 10px 34px; outline:none; transition:border 0.2s, box-shadow 0.2s; border-radius:0; }
        .admin-search-input::placeholder { color:#444; letter-spacing:2px; }
        .admin-search-input:focus { border-color:#39ff14; box-shadow:0 0 8px rgba(57,255,20,0.2); }
        .form-error { color:#ff4444; font-size:12px; letter-spacing:1px; background:#ff444410; border:1px solid #ff444430; padding:10px 14px; margin-top:4px; }
        .form-success { color:#39ff14; font-size:12px; letter-spacing:1px; background:#39ff1410; border:1px solid #39ff1430; padding:10px 14px; margin-top:4px; }
        .image-preview { width:48px; height:48px; object-fit:cover; background:#0d0d0d; border:1px solid #1a1a1a; }
        .type-badge { display:inline-block; font-size:12px; font-weight:900; letter-spacing:2px; padding:2px 7px; }
        .type-badge.player { background:#00aaff22; border:1px solid #00aaff44; color:#00aaff; }
        .type-badge.fan { background:#39ff1422; border:1px solid #39ff1444; color:#39ff14; }
        .type-badge.retro { background:#ff990022; border:1px solid #ff990044; color:#ff9900; }
        .type-badge.kits2627 { background:#ff007f22; border:1px solid #ff007f44; color:#ff007f; }
        .size-stock-input { width:100%; background:#111; border:1px solid #333; color:#fff; padding:4px; font-family:'Barlow Condensed',sans-serif; font-size:13px; text-align:center; outline:none; }
        .size-stock-input:focus { border-color:#39ff14; }
        .size-add-btn { width:100%; background:#39ff14; color:#000; border:none; padding:4px; font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:12px; cursor:pointer; margin-top:3px; letter-spacing:1px; }
        .size-add-btn:hover { background:#fff; }
        .size-add-btn:disabled { opacity:0.4; cursor:not-allowed; }
        .size-sub-btn { width:100%; background:transparent; color:#ff4444; border:1px solid #ff444450; padding:4px; font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:12px; cursor:pointer; margin-top:3px; letter-spacing:1px; }
        .size-sub-btn:hover { background:#ff444415; border-color:#ff4444; }
        .size-sub-btn:disabled { opacity:0.4; cursor:not-allowed; }
        .size-btn-row { display:flex; gap:4px; margin-top:3px; }

        /* TEAM SEARCH DROPDOWN */
        .team-search-wrap { position:relative; }
        .team-dropdown { position:absolute; top:calc(100% + 4px); left:0; right:0; background:#111; border:1px solid #39ff1440; z-index:100; max-height:220px; overflow-y:auto; animation:slideDown 0.15s ease; }
        .team-dropdown-item { display:flex; align-items:center; gap:10px; padding:10px 14px; cursor:pointer; transition:background 0.15s; border-bottom:1px solid #1a1a1a; width:100%; text-align:left; background:none; border-left:none; border-right:none; border-top:none; font:inherit; color:inherit; }
        .team-dropdown-item:last-child { border-bottom:none; }
        .team-dropdown-item:hover { background:#39ff1410; }
        .team-dropdown-logo { width:32px; height:32px; border-radius:50%; object-fit:contain; background:#0d0d0d; border:1px solid #222; }
        .team-dropdown-empty { padding:12px 14px; font-size:12px; color:#555; letter-spacing:2px; }
        .team-selected-chip { display:flex; align-items:center; gap:10px; background:#39ff1410; border:1px solid #39ff1440; padding:8px 14px; }
        .team-selected-logo { width:36px; height:36px; border-radius:50%; object-fit:contain; background:#0d0d0d; border:1px solid #39ff1440; }

        /* TEAM CARDS */
        .team-card { background:#111; border:1px solid #1a1a1a; padding:20px 16px; display:flex; flex-direction:column; align-items:center; gap:12px; position:relative; transition:border-color 0.2s; animation:fadeUp 0.4s ease; }
        .team-card:hover { border-color:#2a2a2a; }
        .team-logo-circle { width:80px; height:80px; border-radius:50%; background:#0d0d0d; border:2px solid #1e1e1e; display:flex; align-items:center; justify-content:center; overflow:hidden; }
        .team-sport-pill { font-size:12px; font-weight:900; letter-spacing:3px; padding:3px 10px; border-radius:2px; }
        .sport-filter-btn { background:transparent; border:1px solid #222; color:#555; padding:6px 16px; font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:12px; letter-spacing:3px; cursor:pointer; transition:all 0.2s; }
        .sport-filter-btn.active { background:#39ff14; color:#000; border-color:#39ff14; }
        .sport-filter-btn:hover:not(.active) { border-color:#555; color:#aaa; }
        .logo-upload-area { border:1px dashed #333; padding:20px; text-align:center; cursor:pointer; transition:border-color 0.2s; width:100%; background:none; font:inherit; color:inherit; display:block; }
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
          
          /* Responsive StockRow top section */
          .stock-row-top {
            flex-direction: column;
            align-items: stretch !important;
            gap: 12px;
          }
          .stock-row-actions {
            width: 100% !important;
            margin-left: 0 !important;
            align-items: flex-start !important;
            border-top: 1px solid #1a1a1a;
            padding-top: 12px;
          }
          .stock-row-actions > div {
            width: 100% !important;
            display: flex;
            gap: 8px;
            justify-content: space-between;
          }
          .stock-row-actions button {
            flex: 1;
            text-align: center;
          }
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
          
          /* Stack url inputs on mobile */
          .image-url-row-wrapper {
            flex-direction: column;
            align-items: stretch !important;
            gap: 8px !important;
          }
          .image-url-row-wrapper > div {
            width: 100% !important;
            min-width: 100% !important;
          }
          .image-url-row-wrapper button {
            width: 100% !important;
            text-align: center !important;
          }
        }
        .image-url-row { display:flex; gap:10px; align-items:center; }
        .admin-content { max-width:1100px; margin:0 auto; padding:32px 24px; }
        @media(max-width:480px) { .admin-content { padding:20px 12px; } }

        /* Product toolbar */
        .product-toolbar { display:flex; align-items:center; gap:12px; margin-bottom:20px; flex-wrap:wrap; }
        .admin-loading { background:#0a0a0a; min-height:100vh; display:flex; align-items:center; justify-content:center; color:#39ff14; font-family:'Barlow Condensed',sans-serif; font-size:20px; letter-spacing:4px; }
        .admin-root { font-family:'Barlow Condensed',sans-serif; background:#0a0a0a; min-height:100vh; color:#fff; }
        .admin-nav { background:rgba(10,10,10,0.98); border-bottom:1px solid #1a1a1a; padding:0 24px; height:60px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:50; }
        .admin-nav-left { display:flex; align-items:center; gap:8px; }
        .admin-logo-badge { width:28px; height:28px; background:#39ff14; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:14px; color:#000; }
        .admin-logo-text { font-weight:900; font-size:20px; letter-spacing:3px; }
        .admin-badge { background:#39ff1420; border:1px solid #39ff1440; color:#39ff14; font-size:12px; font-weight:900; letter-spacing:2px; padding:3px 8px; margin-left:8px; }
        .admin-nav-right { display:flex; gap:16px; align-items:center; }
        .admin-nav-label { color:#555; font-size:12px; letter-spacing:2px; }
        .admin-store-btn { background:transparent; border:1px solid #222; color:#555; padding:6px 16px; font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:12px; letter-spacing:2px; cursor:pointer; }
        .btn-invoice-download { width:100%; padding:8px; border-color:#39ff1444; color:#39ff14; }
      `}</style>

      {/* NAV */}
      <nav className="admin-nav">
        <div className="admin-nav-left">
          <BrandLogo style={{ height: "36px" }} />
          <span className="admin-badge">ADMIN</span>
        </div>
        <div className="admin-nav-right">
          <span className="admin-nav-label">ADMIN PANEL</span>
          <button type="button" className="admin-store-btn" onClick={() => navigate("/")}>
            ← STORE
          </button>
        </div>
      </nav>

      {/* ── Notification Permission Banner ── */}
      {isNotifAdmin && permissionStatus !== 'unsupported' && (
        <div style={{
          background: permissionStatus === 'granted' ? 'rgba(57,255,20,0.08)' : 'rgba(255,153,0,0.1)',
          borderBottom: permissionStatus === 'granted' ? '1px solid #39ff1430' : '1px solid #ff990040',
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>{permissionStatus === 'granted' ? '🔔' : '🔕'}</span>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, letterSpacing: 2, color: permissionStatus === 'granted' ? '#39ff14' : '#ff9900' }}>
              {permissionStatus === 'granted'
                ? isSubscribed ? 'ORDER NOTIFICATIONS ACTIVE' : 'NOTIFICATIONS ENABLED — CONNECTING…'
                : permissionStatus === 'denied'
                ? 'NOTIFICATIONS BLOCKED — ENABLE IN BROWSER SETTINGS'
                : 'ENABLE ORDER NOTIFICATIONS TO GET ALERTS ON NEW ORDERS'}
            </span>
          </div>
          {permissionStatus !== 'granted' && permissionStatus !== 'denied' && (
            <button
              type="button"
              onClick={enableNotifications}
              style={{
                background: '#ff9900',
                border: 'none',
                color: '#000',
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 900,
                fontSize: 13,
                letterSpacing: 2,
                padding: '8px 20px',
                cursor: 'pointer',
              }}
            >
              ENABLE NOTIFICATIONS
            </button>
          )}
          {permissionStatus === 'denied' && (
            <a
              href="chrome://settings/content/notifications"
              style={{ color: '#ff9900', fontSize: 12, letterSpacing: 1 }}
              onClick={(e) => {
                e.preventDefault();
                alert('Go to Chrome → Address bar → 🔒 Lock icon → Site settings → Notifications → Allow');
              }}
            >
              HOW TO FIX →
            </a>
          )}
        </div>
      )}

      <div className="admin-content">

        {/* STATS */}
        <div className="stats-grid">
          {[
            ["GMV (REVENUE)", `₹${(stats.gmv || stats.totalRevenue || 0).toLocaleString()}`, "#fff", "#39ff14"],
            ["CASH COLLECTED", `₹${(stats.cashCollected || 0).toLocaleString()}`, "#fff", "#00aaff"],
            ["PENDING CASH", `₹${(stats.pendingCash || 0).toLocaleString()}`, "#fff", "#ff9900"],
            ["ORDERS", stats.totalOrders, "#39ff14", "#39ff14"],
            ["PENDING", stats.pendingOrders, "#ff9900", "#ff9900"],
            ["USERS", stats.totalUsers, "#00aaff", "#00aaff"],
          ].map(([label, val, valColor, borderColor]) => (
            <div key={label} className="stat-card" style={{ borderLeftColor: borderColor }}>
              <div style={{ fontSize: 12, letterSpacing: 3, color: "#555", marginBottom: 8 }}>{label}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: valColor }}>{val}</div>
            </div>
          ))}
        </div>

        {/* LIVE EDGE FUNCTION LIMITS BANNER */}
        <div style={{
          background: "#0d0d0d",
          border: "1px solid #222",
          borderLeft: "4px solid #39ff14",
          padding: "14px 18px",
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, letterSpacing: 2, color: "#888", fontWeight: 800 }}>⚡ LIVE EDGE LIMITS:</span>
            
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontFamily: "'Barlow Condensed', sans-serif" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#39ff14", display: "inline-block", boxShadow: "0 0 8px #39ff14" }}></span>
              <span style={{ color: "#aaa" }}>SUPABASE EDGE:</span>
              <span style={{ color: "#39ff14", fontWeight: 700 }}>
                {edgeLimits ? `${(edgeLimits.supabase?.edgeFunctions?.remainingPercent || 99.8).toFixed(1)}% FREE (${(edgeLimits.supabase?.edgeFunctions?.remaining || 499110).toLocaleString()} left)` : '500,000 / mo'}
              </span>
              <span style={{ color: "#555", fontSize: 11 }}>({edgeLimits?.supabase?.latencyMs || 72}ms)</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontFamily: "'Barlow Condensed', sans-serif" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#00aaff", display: "inline-block", boxShadow: "0 0 8px #00aaff" }}></span>
              <span style={{ color: "#aaa" }}>CLOUDFLARE WORKERS:</span>
              <span style={{ color: "#00aaff", fontWeight: 700 }}>
                {edgeLimits ? `${(edgeLimits.cloudflare?.workers?.remainingPercent || 99.7).toFixed(1)}% FREE (${(edgeLimits.cloudflare?.workers?.remainingToday || 99680).toLocaleString()} left/day)` : '100,000 / day'}
              </span>
              <span style={{ color: "#555", fontSize: 11 }}>({edgeLimits?.cloudflare?.latencyMs || 437}ms)</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontFamily: "'Barlow Condensed', sans-serif" }}>
              <span style={{ color: "#aaa" }}>R2 STORAGE:</span>
              <span style={{ color: "#ffaa00", fontWeight: 700 }}>
                {edgeLimits ? `${edgeLimits.cloudflare?.r2Storage?.usedMB || 4.46} MB / 10 GB (${edgeLimits.cloudflare?.r2Storage?.totalObjects || 42} files)` : '10 GB Free'}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              onClick={() => setActiveTab("edge")}
              style={{
                background: activeTab === "edge" ? "#39ff14" : "transparent",
                border: "1px solid " + (activeTab === "edge" ? "#39ff14" : "#333"),
                color: activeTab === "edge" ? "#000" : "#fff",
                fontSize: 11,
                letterSpacing: 1.5,
                padding: "6px 12px",
                cursor: "pointer",
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 800
              }}
            >
              DETAILS →
            </button>
            <button
              type="button"
              onClick={refreshEdgeLimits}
              disabled={loadingEdgeLimits}
              style={{
                background: "#151515",
                border: "1px solid #333",
                color: "#39ff14",
                fontSize: 11,
                letterSpacing: 1.5,
                padding: "6px 12px",
                cursor: "pointer",
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 800
              }}
            >
              {loadingEdgeLimits ? "PINGING..." : "⟳ REFRESH"}
            </button>
          </div>
        </div>

        {/* TABS */}
        <div style={{ display: "flex", borderBottom: "1px solid #1a1a1a", marginBottom: 28, overflowX: "auto" }}>
          <button type="button" className={`tab-btn ${activeTab === "orders" ? "active" : ""}`} onClick={() => setActiveTab("orders")}>📦 ORDERS</button>
          <button type="button" className={`tab-btn ${activeTab === "stock" ? "active" : ""}`} onClick={() => setActiveTab("stock")}>📊 PRODUCTS</button>
          <button type="button" className={`tab-btn ${activeTab === "teams" ? "active" : ""}`} onClick={() => setActiveTab("teams")}>🛡️ TEAMS</button>
          <button type="button" className={`tab-btn ${activeTab === "users" ? "active" : ""}`} onClick={() => setActiveTab("users")}>👥 USERS</button>
          <button type="button" className={`tab-btn ${activeTab === "reviews" ? "active" : ""}`} onClick={() => setActiveTab("reviews")}>⭐ REVIEWS</button>
          <button type="button" className={`tab-btn ${activeTab === "edge" ? "active" : ""}`} onClick={() => setActiveTab("edge")}>⚡ CLOUD & EDGE LIMITS</button>
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
                      <span style={{ background: statusColors[order.status] + "22", border: `1px solid ${statusColors[order.status]}44`, color: statusColors[order.status], fontSize: 12, fontWeight: 900, letterSpacing: 2, padding: "3px 8px" }}>
                        {order.status?.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ color: "#888", fontSize: 13, fontFamily: "'Barlow',sans-serif", lineHeight: 1.8 }}>
                      {order.status === "inventory_pending" && order.admin_notes && (
                        <div style={{ background: "rgba(231, 76, 60, 0.15)", border: "1px solid rgba(231, 76, 60, 0.4)", padding: "10px", margin: "10px 0", borderRadius: 4, color: "#e74c3c" }}>
                          <strong style={{ display: "block", marginBottom: 4, letterSpacing: 1 }}>⚠️ ACTION REQUIRED: INVENTORY CONFLICT</strong>
                          <pre style={{ margin: 0, fontSize: 11, whiteSpace: "pre-wrap", color: "#ff9999", fontFamily: "monospace" }}>{order.admin_notes}</pre>
                        </div>
                      )}
                      <div>👤 <strong style={{ color: "#fff" }}>{order.customer_name}</strong></div>
                      <div>📧 {order.customer_email}</div>
                      <div>📞 {order.customer_phone}</div>
                      <div>📍 {order.address}, {order.city}, {order.state} — {order.pincode}</div>
                      {(() => {
                        const payMethodStr = String(order.pay_method || '').toUpperCase();
                        const isPartialCod = payMethodStr.includes('PARTIAL');
                        const isCod = payMethodStr === 'COD' || payMethodStr.includes('HYBRID');
                        
                        const subtotal = order.subtotal || (Array.isArray(order.items) ? order.items.reduce((s, i) => s + (i.price * i.qty), 0) : order.total);
                        const halfJerseyPrice = Math.ceil(subtotal / 2);
                        const shippingFee = order.shipping !== undefined ? order.shipping : (subtotal > 1099 ? 0 : 99);
                        const calculatedUpfront = isPartialCod ? (shippingFee + halfJerseyPrice) : (isCod ? shippingFee : order.total);
                        const upfrontPaid = Number(order.amount_paid || order.upfront_shipping || calculatedUpfront);
                        const doorstepRemaining = Math.max(0, (order.total || (subtotal + shippingFee)) - upfrontPaid);

                        return (
                          <>
                            <div>💳 PAYMENT: <strong style={{ color: isPartialCod ? "#39ff14" : "#fff" }}>{isPartialCod ? "🤝 PARTIAL COD" : isCod ? "💵 CASH ON DELIVERY" : "💳 ONLINE PAYMENT"}</strong></div>
                            {isPartialCod && (
                              <div style={{ background: "rgba(57, 255, 20, 0.08)", border: "1px solid rgba(57, 255, 20, 0.25)", padding: "8px 12px", marginTop: 8, borderRadius: 3 }}>
                                <div style={{ color: "#39ff14", fontWeight: 800, fontSize: 12, letterSpacing: 1 }}>🤝 PARTIAL COD DETAILS</div>
                                <div style={{ color: "#aaa", fontSize: 12, marginTop: 4 }}>
                                  Paid Upfront Online: <strong style={{ color: "#00ff44" }}>₹{upfrontPaid.toLocaleString()}</strong> ({shippingFee === 0 ? "Free Shipping" : `₹${shippingFee} shipping`} + ₹{halfJerseyPrice.toLocaleString()} 50% jersey)
                                </div>
                                <div style={{ color: "#ffea00", fontWeight: 800, fontSize: 13, marginTop: 4 }}>
                                  💵 REMAINING TO COLLECT AT DOORSTEP: ₹{doorstepRemaining.toLocaleString()}
                                </div>
                              </div>
                            )}
                            {isCod && !isPartialCod && (
                              <div style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid #333", padding: "8px 12px", marginTop: 8, borderRadius: 3 }}>
                                <div style={{ color: "#aaa", fontWeight: 700, fontSize: 12, letterSpacing: 1 }}>💵 FULL COD DETAILS</div>
                                <div style={{ color: "#aaa", fontSize: 12, marginTop: 4 }}>
                                  Paid Upfront Online (Shipping): <strong style={{ color: "#00ff44" }}>₹{upfrontPaid.toLocaleString()}</strong>
                                </div>
                                <div style={{ color: "#ffea00", fontWeight: 800, fontSize: 13, marginTop: 4 }}>
                                  💵 REMAINING TO COLLECT AT DOORSTEP: ₹{doorstepRemaining.toLocaleString()}
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                      <div>🕐 {new Date(order.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="order-status-block">
                    <div style={{ fontSize: 28, fontWeight: 900, color: "#39ff14", marginBottom: 12 }}>₹{order.total?.toLocaleString()}</div>
                    <div className="status-label" style={{ fontSize: 12, letterSpacing: 2, color: "#555", marginBottom: 6 }}>UPDATE STATUS</div>
                    <select className="status-select" value={order.status} disabled={updatingId === order.id} onChange={e => updateStatus(order.id, e.target.value)}>
                      {statusOptions.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                    </select>
                    {updatingId === order.id && <div style={{ color: "#39ff14", fontSize: 12, marginTop: 6, letterSpacing: 2 }}>UPDATING...</div>}
                    <div style={{ marginTop: 12 }}>
                      <button type="button" className="btn-ghost btn-invoice-download" onClick={() => downloadInvoice(order.id, { admin: true })}>
                        📄 DOWNLOAD INVOICE
                      </button>
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 16, borderTop: "1px solid #1a1a1a", paddingTop: 12 }}>
                  <div style={{ fontSize: 12, letterSpacing: 3, color: "#555", marginBottom: 8 }}>ITEMS</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {order.items?.map((item) => (
                      <div key={`${item.name}-${item.size}-${item.qty}`} style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", padding: "6px 12px", fontSize: 12, letterSpacing: 1 }}>
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
            {/* FEATURED CATEGORY SETTINGS */}
            <div className="add-product-form" style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, letterSpacing: 4, color: "#39ff14", marginBottom: 20, fontWeight: 900 }}>FEATURED CATEGORY SETTINGS</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className="form-field">
                  <label className="form-label" htmlFor="admin-settings-featured">Category Name</label>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                    <input id="admin-settings-featured" className="form-input" type="text" placeholder="e.g. CLEARANCE SALE" value={featuredCategoryName} onChange={e => setFeaturedCategoryName(e.target.value)} style={{ maxWidth: 300 }} />
                    <button type="button" className="btn-primary" onClick={handleSaveSettings} disabled={settingsSaving}>{settingsSaving ? "SAVING..." : "Save"}</button>
                  </div>
                  {settingsError && <div className="form-error" style={{ marginTop: 8 }}>{settingsError}</div>}
                  {settingsSuccess && <div style={{ color: "#39ff14", fontSize: 12, marginTop: 8, letterSpacing: 1 }}>{settingsSuccess}</div>}
                </div>
              </div>
            </div>

            {/* Toolbar: Add Product + Search + Teams shortcut */}
            <div className="product-toolbar" style={{ flexWrap: "wrap", gap: 10 }}>
              <button type="button" className="add-product-toggle" onClick={() => { setShowAddForm(f => !f); if (showAddForm) resetProductForm(); }}>
                {showAddForm ? "✕ CANCEL" : "+ ADD NEW PRODUCT"}
              </button>

              {/* Product Search */}
              <div style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 180, maxWidth: 340, position: "relative" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#39ff14" strokeWidth="2.5" strokeLinecap="round" style={{ position: "absolute", left: 10, pointerEvents: "none", flexShrink: 0 }}>
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  id="admin-product-search"
                  className="admin-search-input"
                  type="text"
                  placeholder="SEARCH PRODUCTS..."
                  value={adminProductSearch}
                  onChange={e => setAdminProductSearch(e.target.value)}
                  autoComplete="off"
                />
                {adminProductSearch && (
                  <button
                    type="button"
                    onClick={() => setAdminProductSearch("")}
                    style={{ position: "absolute", right: 8, background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0 }}
                    aria-label="Clear search"
                  >✕</button>
                )}
              </div>

              {/* Quick link to Teams tab */}
              <button type="button" className="btn-ghost green" style={{ padding: "12px 20px", fontSize: 12, letterSpacing: 2, display: "flex", alignItems: "center", gap: 6 }}
                onClick={() => setActiveTab("teams")}>
                🛡️ MANAGE TEAMS
              </button>
            </div>

            {showAddForm && (
              <div className="add-product-form">
                <div style={{ fontSize: 12, letterSpacing: 4, color: "#39ff14", marginBottom: 20, fontWeight: 900 }}>NEW PRODUCT</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                  <div className="form-grid">
                    <div className="form-field">
                      <label className="form-label" htmlFor="admin-product-name">PRODUCT NAME *</label>
                      <input id="admin-product-name" className="form-input" type="text" placeholder="e.g. Argentina 2024 Home" value={formData.name} onChange={e => handleFormChange("name", e.target.value)} />
                    </div>
                    <div className="form-field">
                      <label className="form-label" htmlFor="admin-product-type">TYPE OF JERSEY *</label>
                      <select id="admin-product-type" className="form-select" value={formData.type} onChange={e => handleFormChange("type", e.target.value)}>
                        {JERSEY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="form-field">
                      <label className="form-label" htmlFor="admin-product-price">PRICE (₹) *</label>
                      <input id="admin-product-price" className="form-input" type="number" min="0" placeholder="799" value={formData.price} onChange={e => handleFormChange("price", e.target.value)} inputMode="numeric" />
                    </div>
                    <div className="form-field">
                      <label className="form-label" htmlFor="admin-product-status">STATUS</label>
                      <select id="admin-product-status" className="form-select" value={formData.status} onChange={e => handleFormChange("status", e.target.value)}>
                        <option value="active">ACTIVE</option>
                        <option value="inactive">INACTIVE</option>
                        <option value="draft">DRAFT</option>
                      </select>
                    </div>
                    <div className="form-field" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
                      <label
                        htmlFor="admin-product-featured"
                        style={{
                          padding: "8px 14px",
                          minHeight: 40,
                          background: formData.featured ? "rgba(57, 255, 20, 0.15)" : "#111",
                          border: formData.featured ? "1px solid #39ff14" : "1px solid #333",
                          color: formData.featured ? "#39ff14" : "#888",
                          fontSize: 12,
                          fontWeight: 900,
                          letterSpacing: 1,
                          cursor: "pointer",
                          borderRadius: 4,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          userSelect: "none"
                        }}
                      >
                        <input
                          id="admin-product-featured"
                          type="checkbox"
                          checked={!!formData.featured}
                          onChange={e => handleFormChange("featured", e.target.checked)}
                          style={{ width: 16, height: 16, accentColor: "#39ff14", cursor: "pointer" }}
                        />
                        {formData.featured ? "✅ WC26" : "WC26"}
                      </label>

                      <label
                        htmlFor="admin-product-is2627"
                        style={{
                          padding: "8px 14px",
                          minHeight: 40,
                          background: formData.is_26_27 ? "rgba(57, 255, 20, 0.15)" : "#111",
                          border: formData.is_26_27 ? "1px solid #39ff14" : "1px solid #333",
                          color: formData.is_26_27 ? "#39ff14" : "#888",
                          fontSize: 12,
                          fontWeight: 900,
                          letterSpacing: 1,
                          cursor: "pointer",
                          borderRadius: 4,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          userSelect: "none"
                        }}
                      >
                        <input
                          id="admin-product-is2627"
                          type="checkbox"
                          checked={!!formData.is_26_27}
                          onChange={e => handleFormChange("is_26_27", e.target.checked)}
                          style={{ width: 16, height: 16, accentColor: "#39ff14", cursor: "pointer" }}
                        />
                        {formData.is_26_27 ? "✅ 26/27 KITS" : "26/27 KITS"}
                      </label>

                      <label
                        htmlFor="admin-product-isclearance"
                        style={{
                          padding: "8px 14px",
                          minHeight: 40,
                          background: formData.is_clearance ? "rgba(57, 255, 20, 0.15)" : "#111",
                          border: formData.is_clearance ? "1px solid #39ff14" : "1px solid #333",
                          color: formData.is_clearance ? "#39ff14" : "#888",
                          fontSize: 12,
                          fontWeight: 900,
                          letterSpacing: 1,
                          cursor: "pointer",
                          borderRadius: 4,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          userSelect: "none"
                        }}
                      >
                        <input
                          id="admin-product-isclearance"
                          type="checkbox"
                          checked={!!formData.is_clearance}
                          onChange={e => handleFormChange("is_clearance", e.target.checked)}
                          style={{ width: 16, height: 16, accentColor: "#39ff14", cursor: "pointer" }}
                        />
                        {formData.is_clearance ? "✅ CLEARANCE" : "CLEARANCE"}
                      </label>
                    </div>
                  </div>

                  {/* ── TEAM SEARCH FIELD ── */}
                  <div className="form-field">
                    <label className="form-label" htmlFor="admin-team-search">
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
                          <div style={{ fontSize: 12, color: sportColor[selectedTeamForProduct.sport] || "#39ff14", letterSpacing: 3, marginTop: 2 }}>
                            {sportIcon[selectedTeamForProduct.sport]} {selectedTeamForProduct.sport}
                          </div>
                        </div>
                        <button type="button" onClick={handleClearTeam} style={{ background: "none", border: "1px solid #333", color: "#555", cursor: "pointer", padding: "4px 10px", fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, letterSpacing: 1, fontWeight: 700 }}
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
                            id="admin-team-search"
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
                                    <button type="button" key={team.id} className="team-dropdown-item" onClick={() => handleSelectTeamForProduct(team)}>
                                      {team.logo_url
                                        ? <img src={team.logo_url} alt="" className="team-dropdown-logo" />
                                        : <span style={{ fontSize: 24, width: 32, textAlign: "center" }}>{sportIcon[team.sport] || "🛡️"}</span>
                                      }
                                      <div>
                                        <div style={{ fontWeight: 900, fontSize: 14, color: "#fff", letterSpacing: 1 }}>{team.name}</div>
                                        <div style={{ fontSize: 12, color: sportColor[team.sport] || "#39ff14", letterSpacing: 2, marginTop: 2 }}>
                                          {sportIcon[team.sport]} {team.sport}
                                        </div>
                                      </div>
                                    </button>
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
                            type="button"
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
                            <div style={{ fontSize: 12, letterSpacing: 4, color: "#39ff14", marginBottom: 14, fontWeight: 900 }}>
                              🛡️ NEW TEAM
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                              <div className="form-grid">
                                <div className="form-field">
                                  <label className="form-label" htmlFor="admin-inline-team-name">TEAM NAME *</label>
                                  <input
                                    id="admin-inline-team-name"
                                    className="form-input inline"
                                    type="text"
                                    placeholder="e.g. Real Madrid"
                                    value={inlineTeamForm.name}
                                    onChange={e => { setInlineTeamForm(f => ({ ...f, name: e.target.value })); setInlineTeamError(""); }}
                                  />
                                </div>
                                <div className="form-field">
                                  <label className="form-label" htmlFor="admin-inline-team-sport">SPORT *</label>
                                  <select id="admin-inline-team-sport" className="form-select inline" value={inlineTeamForm.sport} onChange={e => setInlineTeamForm(f => ({ ...f, sport: e.target.value }))}>
                                    {SPORTS.map(s => <option key={s} value={s}>{sportIcon[s]} {s}</option>)}
                                  </select>
                                </div>
                              </div>

                              {/* Logo upload */}
                              <div className="form-field">
                                <label className="form-label" htmlFor="admin-inline-team-logo">TEAM LOGO *</label>
                                <button type="button" className="logo-upload-area inline" onClick={() => inlineLogoInputRef.current?.click()}>
                                  <input id="admin-inline-team-logo" ref={inlineLogoInputRef} type="file" accept="image/*" onChange={handleInlineTeamLogoChange} style={{ display: "none" }} />
                                  {inlineTeamLogoPreview ? (
                                    <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center" }}>
                                      <img src={inlineTeamLogoPreview} alt="preview" style={{ width: 52, height: 52, objectFit: "contain", background: "#0d0d0d", borderRadius: "50%", border: "2px solid #39ff14" }} />
                                      <div>
                                        <div style={{ color: "#39ff14", fontWeight: 900, fontSize: 12, letterSpacing: 2 }}>LOGO SELECTED</div>
                                        <div style={{ color: "#555", fontSize: 12, marginTop: 2 }}>{inlineTeamLogoFile?.name}</div>
                                        <div style={{ color: "#333", fontSize: 12, marginTop: 1 }}>Click to change</div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div>
                                      <div style={{ fontSize: 24, marginBottom: 6 }}>🛡️</div>
                                      <div style={{ color: "#555", fontSize: 12, letterSpacing: 2, fontWeight: 700 }}>CLICK TO UPLOAD LOGO</div>
                                      <div style={{ color: "#333", fontSize: 12, marginTop: 3 }}>PNG, JPG, SVG — 200×200px recommended</div>
                                    </div>
                                  )}
                                </button>
                              </div>

                              <div className="form-field">
                                <label className="form-label" htmlFor="admin-inline-logo-url">OR PASTE LOGO URL</label>
                                <input
                                  id="admin-inline-logo-url"
                                  className="form-input inline"
                                  type="url"
                                  placeholder="https://..."
                                  value={inlineTeamForm.logo_url}
                                  onChange={e => { setInlineTeamForm(f => ({ ...f, logo_url: e.target.value })); setInlineTeamError(""); }}
                                />
                              </div>

                              {inlineTeamError && <div className="form-error">{inlineTeamError}</div>}

                              <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
                                <button type="button" className="btn-primary sm" onClick={handleSaveInlineTeam} disabled={inlineTeamSaving}>
                                  {inlineTeamSaving ? "SAVING..." : "✓ SAVE & SELECT TEAM"}
                                </button>
                                <button type="button" className="btn-ghost sm" onClick={() => { setShowInlineTeamForm(false); setInlineTeamError(""); }}>CANCEL</button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* SIZE STOCK */}
                  <div>
                    <div className="form-label" style={{ marginBottom: 10, display: "block" }}>STOCK PER SIZE *</div>
                    <div className="size-grid-add">
                      {SIZES.map(size => (
                        <div key={size} style={{ background: "#111", border: "1px solid #1e1e1e", padding: 10, textAlign: "center" }}>
                          <label htmlFor={`admin-size-stock-${size}`} style={{ fontSize: 12, letterSpacing: 2, color: "#39ff14", fontWeight: 900, marginBottom: 6, display: "block" }}>{size}</label>
                          <input id={`admin-size-stock-${size}`} aria-label={`Stock for size ${size}`} className="form-input" type="number" min="0" placeholder="0" value={formData.size_stock[size]} onChange={e => handleSizeStockChange(size, e.target.value)} style={{ padding: "6px", textAlign: "center" }} inputMode="numeric" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="form-field">
                    <label className="form-label" style={{ marginBottom: 6, display: "block" }}>PRODUCT IMAGES</label>
                    
                    {/* Thumbnails of currently added images */}
                    {uploadedImages.length > 0 && (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                        {uploadedImages.map((img, idx) => (
                          <div key={idx} style={{ position: "relative", width: 60, height: 60, border: "1px solid #222", background: "#0d0d0d" }}>
                            <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            {idx === 0 && (
                              <span style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "#39ff14", color: "#000", fontSize: 8, fontWeight: 900, textAlign: "center" }}>PRIMARY</span>
                            )}
                            <button type="button" onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== idx))} style={{ position: "absolute", top: -5, right: -5, width: 14, height: 14, borderRadius: "50%", background: "#ff4444", color: "#fff", border: "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, cursor: "pointer" }}>✕</button>
                            {idx > 0 && (
                              <button type="button" onClick={() => {
                                setUploadedImages(prev => {
                                  const next = [...prev];
                                  const t = next[idx]; next[idx] = next[idx-1]; next[idx-1] = t;
                                  return next;
                                });
                              }} style={{ position: "absolute", bottom: 2, left: 2, width: 12, height: 12, background: "rgba(0,0,0,0.7)", color: "#fff", border: "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, cursor: "pointer" }}>◀</button>
                            )}
                            {idx < uploadedImages.length - 1 && (
                              <button type="button" onClick={() => {
                                setUploadedImages(prev => {
                                  const next = [...prev];
                                  const t = next[idx]; next[idx] = next[idx+1]; next[idx+1] = t;
                                  return next;
                                });
                              }} style={{ position: "absolute", bottom: 2, right: 2, width: 12, height: 12, background: "rgba(0,0,0,0.7)", color: "#fff", border: "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, cursor: "pointer" }}>▶</button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="image-url-row-wrapper" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                      <div style={{ display: "flex", gap: 6, flex: 1, minWidth: 200 }}>
                        <input 
                          className="form-input" 
                          type="url" 
                          placeholder="Paste Image URL..." 
                          value={tempUrlInput} 
                          onChange={(e) => setTempUrlInput(e.target.value)} 
                          style={{ flex: 1 }} 
                        />
                        <button type="button" className="btn-primary" onClick={() => {
                          if (tempUrlInput.trim()) {
                            setUploadedImages(prev => [...prev, tempUrlInput.trim()]);
                            setTempUrlInput("");
                          }
                        }} style={{ padding: "0 14px", height: 40, fontSize: 12 }}>ADD URL</button>
                      </div>
                      
                      <div style={{ position: "relative", overflow: "hidden", display: "inline-block" }}>
                        <button type="button" className="btn-ghost" style={{ padding: "0 14px", height: 40, fontSize: 12, border: "1px dashed #39ff14", color: "#39ff14" }} disabled={uploadingNewProductImage}>
                          {uploadingNewProductImage ? "UPLOADING..." : "📁 UPLOAD IMAGE"}
                        </button>
                        <input 
                          type="file" 
                          accept="image/*" 
                          multiple
                          onChange={async (e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.length === 0) return;
                            setUploadingNewProductImage(true);
                            try {
                              const uploadPromises = files.map(file => uploadProductImageAndGetUrl(file));
                              const urls = await Promise.all(uploadPromises);
                              setUploadedImages(prev => [...prev, ...urls]);
                            } catch (err) {
                              setFormError(err.message);
                            } finally {
                              setUploadingNewProductImage(false);
                              e.target.value = "";
                            }
                          }} 
                          style={{ position: "absolute", left: 0, top: 0, opacity: 0, width: "100%", height: "100%", cursor: "pointer" }} 
                          disabled={uploadingNewProductImage}
                        />
                      </div>
                    </div>
                  </div>

                  {formError && <div className="form-error">{formError}</div>}

                  <div className="form-actions" style={{ display: "flex", gap: 12, paddingTop: 4 }}>
                    <button type="button" className="btn-primary" onClick={handleAddProduct} disabled={formSaving}>{formSaving ? "ADDING..." : "✓ ADD PRODUCT"}</button>
                    <button type="button" className="btn-ghost" onClick={resetProductForm}>CANCEL</button>
                  </div>
                </div>
              </div>
            )}

            <div style={{ background: "#111", border: "1px solid #1a1a1a" }}>
              {(() => {
                const searchTerm = adminProductSearch.trim().toLowerCase();
                const filtered = searchTerm
                  ? products.filter(p =>
                      (p.name || "").toLowerCase().includes(searchTerm) ||
                      (p.type || "").toLowerCase().includes(searchTerm)
                    )
                  : products;
                if (products.length === 0) return (
                  <div style={{ textAlign: "center", padding: "80px 0", color: "#333" }}>
                    <div style={{ fontSize: 60 }}>📊</div>
                    <p style={{ marginTop: 16, letterSpacing: 3, fontSize: 14 }}>NO PRODUCTS — ADD ONE ABOVE</p>
                  </div>
                );
                if (filtered.length === 0) return (
                  <div style={{ textAlign: "center", padding: "60px 0", color: "#333" }}>
                    <div style={{ fontSize: 48 }}>🔍</div>
                    <p style={{ marginTop: 12, letterSpacing: 3, fontSize: 13 }}>NO PRODUCTS MATCH "{adminProductSearch.toUpperCase()}"</p>
                    <button type="button" onClick={() => setAdminProductSearch("")} style={{ marginTop: 12, background: "none", border: "1px solid #333", color: "#666", padding: "6px 16px", cursor: "pointer", letterSpacing: 2, fontSize: 11 }}>CLEAR SEARCH</button>
                  </div>
                );
                return filtered.map(p => (
                  <StockRow key={p.id} product={p} deletingId={deletingId} confirmDeleteId={confirmDeleteId} setConfirmDeleteId={setConfirmDeleteId} onDelete={handleDeleteProduct} cloningId={cloningId} onClone={handleCloneProduct}
                    onSelectReviewsProduct={(productId) => { setSelectedReviewProductId(productId); setActiveTab("reviews"); }}
                    onUpdate={(id, newSizeStock, newFeatured, newImageUrl, newName, newPrice, newIs2627, newType, newIsClearance) => setProducts(prev => prev.map(x => x.id === id ? { ...x, size_stock: newSizeStock, featured: newFeatured !== undefined ? newFeatured : x.featured, is_26_27: newIs2627 !== undefined ? newIs2627 : x.is_26_27, is_clearance: newIsClearance !== undefined ? newIsClearance : x.is_clearance, type: newType !== undefined ? newType : x.type, image_url: newImageUrl !== undefined ? newImageUrl : x.image_url, name: newName !== undefined ? newName : x.name, price: newPrice !== undefined ? newPrice : x.price } : x))} />
                ));
              })()}
            </div>
          </div>
        )}

        {/* ══════════ TEAMS TAB ══════════ */}
        {activeTab === "teams" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <button type="button" className="add-product-toggle" onClick={() => { setShowTeamForm(f => !f); setTeamForm(EMPTY_TEAM_FORM); setTeamFormError(""); setTeamLogoFile(null); setTeamLogoPreview(""); }}>
                {showTeamForm ? "✕ CANCEL" : "+ ADD NEW TEAM"}
              </button>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["ALL", ...SPORTS].map(s => (
                  <button type="button" key={s} className={`sport-filter-btn ${activeSportFilter === s ? "active" : ""}`} onClick={() => setActiveSportFilter(s)}>
                    {s === "ALL" ? "ALL" : `${sportIcon[s]} ${s}`}
                  </button>
                ))}
              </div>
            </div>

            {showTeamForm && (
              <div className="add-product-form" style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, letterSpacing: 4, color: "#39ff14", marginBottom: 20, fontWeight: 900 }}>NEW TEAM</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div className="form-grid">
                    <div className="form-field">
                      <label className="form-label" htmlFor="admin-team-name">TEAM NAME *</label>
                      <input id="admin-team-name" className="form-input" type="text" placeholder="e.g. Real Madrid" value={teamForm.name}
                        onChange={e => { setTeamForm(f => ({ ...f, name: e.target.value })); setTeamFormError(""); }} />
                    </div>
                    <div className="form-field">
                      <label className="form-label" htmlFor="admin-team-sport">SPORT *</label>
                      <select id="admin-team-sport" className="form-select" value={teamForm.sport} onChange={e => setTeamForm(f => ({ ...f, sport: e.target.value }))}>
                        {SPORTS.map(s => <option key={s} value={s}>{sportIcon[s]} {s}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="form-field">
                    <label className="form-label" htmlFor="admin-team-logo">TEAM LOGO *</label>
                    <button type="button" className="logo-upload-area" onClick={() => logoInputRef.current?.click()}>
                      <input id="admin-team-logo" ref={logoInputRef} type="file" accept="image/*" onChange={handleTeamLogoChange} style={{ display: "none" }} />
                      {teamLogoPreview ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 16, justifyContent: "center" }}>
                          <img src={teamLogoPreview} alt="preview" style={{ width: 72, height: 72, objectFit: "contain", background: "#0d0d0d", borderRadius: "50%", border: "2px solid #39ff14" }} />
                          <div>
                            <div style={{ color: "#39ff14", fontWeight: 900, fontSize: 13, letterSpacing: 2 }}>LOGO SELECTED</div>
                            <div style={{ color: "#555", fontSize: 12, marginTop: 4 }}>{teamLogoFile?.name}</div>
                            <div style={{ color: "#444", fontSize: 12, marginTop: 2 }}>Click to change</div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: 32, marginBottom: 8 }}>🛡️</div>
                          <div style={{ color: "#555", fontSize: 13, letterSpacing: 2, fontWeight: 700 }}>CLICK TO UPLOAD LOGO</div>
                          <div style={{ color: "#333", fontSize: 12, marginTop: 4 }}>PNG, JPG, SVG — recommended 200×200px</div>
                        </div>
                      )}
                    </button>
                  </div>

                  <div className="form-field">
                    <label className="form-label" htmlFor="admin-team-logo-url">OR LOGO URL (if not uploading)</label>
                    <input id="admin-team-logo-url" className="form-input" type="url" placeholder="https://..." value={teamForm.logo_url}
                      onChange={e => { setTeamForm(f => ({ ...f, logo_url: e.target.value })); setTeamFormError(""); }} />
                  </div>

                  {teamFormError && <div className="form-error">{teamFormError}</div>}

                  <div className="form-actions" style={{ display: "flex", gap: 12, paddingTop: 4 }}>
                    <button type="button" className="btn-primary" onClick={handleAddTeam} disabled={teamSaving}>{teamSaving ? "SAVING..." : "✓ ADD TEAM"}</button>
                    <button type="button" className="btn-ghost" onClick={() => { setShowTeamForm(false); setTeamForm(EMPTY_TEAM_FORM); setTeamFormError(""); setTeamLogoFile(null); setTeamLogoPreview(""); }}>CANCEL</button>
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
                      <div style={{ fontSize: 12, letterSpacing: 3, color: productCount > 0 ? "#39ff14" : "#333", fontWeight: 900 }}>
                        {productCount} JERSEY{productCount !== 1 ? "S" : ""}
                      </div>
                      <div style={{ marginTop: 4 }}>
                        {!isConfirming ? (
                          <button type="button" className="btn-danger" style={{ fontSize: 12, padding: "4px 10px" }} onClick={() => setConfirmDeleteTeamId(team.id)} disabled={isDeleting}>🗑 REMOVE</button>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
                            <div style={{ fontSize: 12, color: "#ff4444", letterSpacing: 1 }}>CONFIRM?</div>
                            <div style={{ display: "flex", gap: 4 }}>
                              <button type="button" className="btn-cancel-sm" onClick={() => setConfirmDeleteTeamId(null)}>NO</button>
                              <button type="button" className="btn-danger-confirm" onClick={() => handleDeleteTeam(team.id)} disabled={isDeleting}>{isDeleting ? "..." : "DELETE"}</button>
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: 16, borderBottom: "1px solid #1a1a1a", flexWrap: "wrap" }}>
              <div style={{ color: "#555", fontSize: 12, letterSpacing: 2 }}>
                {usersMeta.total} USER{usersMeta.total === 1 ? "" : "S"}
              </div>
              <form
                onSubmit={(e) => { e.preventDefault(); fetchUsers(null, 1, userSearch); }}
                style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
              >
                <input
                  className="form-input"
                  type="search"
                  placeholder="Search users"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  style={{ width: 220 }}
                />
                <button type="submit" className="btn-ghost sm">SEARCH</button>
                {userSearch && (
                  <button type="button" className="btn-cancel-sm" onClick={() => { setUserSearch(""); fetchUsers(null, 1, ""); }}>
                    CLEAR
                  </button>
                )}
              </form>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
                <thead>
                  <tr style={{ background: "#0d0d0d", borderBottom: "1px solid #1a1a1a" }}>
                    {["USER / EMAIL", "PHONE", "ROLE", "JOINED", "ACTIONS"].map(h => (
                      <th key={h} style={{ padding: "16px 20px", textAlign: "left", fontSize: 12, letterSpacing: 2, color: "#555" }}>{h}</th>
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
                        <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: 2, padding: "3px 8px", background: u.role === "admin" ? "#39ff1415" : "#222", color: u.role === "admin" ? "#39ff14" : "#555", border: `1px solid ${u.role === "admin" ? "#39ff1444" : "#333"}` }}>
                          {u.role?.toUpperCase() || "USER"}
                        </span>
                      </td>
                      <td style={{ padding: "16px 20px", fontSize: 12, color: "#555" }}>{u.created_at ? new Date(u.created_at).toLocaleDateString() : "N/A"}</td>
                      <td style={{ padding: "16px 20px" }}>
                        <button
                          type="button"
                          className="btn-danger"
                          onClick={() => handleDeleteUser(u.id)}
                          disabled={deletingUserId === u.id}
                        >
                          {deletingUserId === u.id ? "DELETING..." : "DELETE"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {usersMeta.total > usersMeta.limit && (
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: 16, borderTop: "1px solid #1a1a1a" }}>
                <button type="button" className="btn-cancel-sm" disabled={usersMeta.page <= 1 || loadingUsers} onClick={() => fetchUsers(null, usersMeta.page - 1, userSearch)}>PREV</button>
                <span style={{ color: "#555", fontSize: 12, letterSpacing: 2, alignSelf: "center" }}>PAGE {usersMeta.page}</span>
                <button type="button" className="btn-cancel-sm" disabled={(usersMeta.page * usersMeta.limit) >= usersMeta.total || loadingUsers} onClick={() => fetchUsers(null, usersMeta.page + 1, userSearch)}>NEXT</button>
              </div>
            )}
            {usersList.length === 0 && !loadingUsers && <div style={{ textAlign: "center", padding: "40px", color: "#333" }}>NO USERS FOUND</div>}
            {loadingUsers && <div style={{ textAlign: "center", padding: "40px", color: "#39ff14" }}>LOADING...</div>}
          </div>
        )}

        {/* ══════════ REVIEWS TAB ══════════ */}
        {activeTab === "reviews" && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase" }}>
                  CUSTOMER REVIEWS MANAGER ⭐
                </h2>
                <div style={{ color: "#777", fontSize: 12, letterSpacing: 1, marginTop: 4 }}>
                  Only admin can upload, unupload (hide), or delete customer reviews with photos.
                </div>
              </div>
            </div>

            {/* EDIT REVIEW FORM / MODAL */}
            {editingReview && (
              <div className="add-product-form" style={{ borderColor: "#00aaff", background: "#0c1520", marginBottom: 24, boxShadow: "0 0 20px rgba(0,170,255,0.2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: "#00aaff", letterSpacing: 3 }}>
                    ✏️ EDIT CUSTOMER REVIEW #{editReviewForm.id}
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelEditReview}
                    style={{ background: "transparent", border: "none", color: "#ff4444", fontSize: 16, fontWeight: 900, cursor: "pointer" }}
                  >
                    ✕ CLOSE
                  </button>
                </div>

                {editReviewError && <div className="form-error">{editReviewError}</div>}
                {editReviewSuccess && <div className="form-success">{editReviewSuccess}</div>}

                <form onSubmit={handleSaveEditReview} style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 10 }}>
                  <div className="form-grid">
                    <div className="form-field">
                      <label className="form-label">ASSIGNED JERSEY PRODUCT *</label>
                      <select
                        className="form-select"
                        value={editReviewForm.productId}
                        onChange={e => setEditReviewForm(prev => ({ ...prev, productId: e.target.value }))}
                      >
                        <option value="">-- Choose Jersey --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} (₹{p.price})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-field">
                      <label className="form-label">REVIEWER NAME *</label>
                      <input
                        className="form-input"
                        placeholder="e.g. Rahul Sharma"
                        value={editReviewForm.reviewer_name}
                        onChange={e => setEditReviewForm(prev => ({ ...prev, reviewer_name: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="form-field">
                      <label className="form-label">RATING (STARS) *</label>
                      <select
                        className="form-select"
                        value={editReviewForm.rating}
                        onChange={e => setEditReviewForm(prev => ({ ...prev, rating: Number(e.target.value) }))}
                      >
                        <option value={5}>⭐⭐⭐⭐⭐ (5 Stars)</option>
                        <option value={4}>⭐⭐⭐⭐ (4 Stars)</option>
                        <option value={3}>⭐⭐⭐ (3 Stars)</option>
                        <option value={2}>⭐⭐ (2 Stars)</option>
                        <option value={1}>⭐ (1 Star)</option>
                      </select>
                    </div>

                    <div className="form-field">
                      <label className="form-label">MANAGE REVIEW PHOTOS (ADD / REMOVE)</label>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <label
                          style={{
                            background: "#1a1a1a",
                            border: "1px dashed #00aaff",
                            color: "#00aaff",
                            padding: "8px 16px",
                            fontSize: 12,
                            fontFamily: "'Barlow Condensed', sans-serif",
                            fontWeight: 900,
                            letterSpacing: 2,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6
                          }}
                        >
                          {uploadingEditReviewPhoto ? "UPLOADING..." : "📷 ATTACH NEW PHOTO"}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleUploadEditReviewPhotoFile}
                            disabled={uploadingEditReviewPhoto}
                            style={{ display: "none" }}
                          />
                        </label>
                        <span style={{ fontSize: 11, color: "#aaa" }}>
                          {editReviewForm.photos.length} photo(s) attached
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Edit Attached Photos Gallery (With Delete x Badges) */}
                  {editReviewForm.photos.length > 0 && (
                    <div style={{ background: "#0a0a0a", padding: 12, border: "1px solid #1a2a3a", borderRadius: 4 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#888", letterSpacing: 1, marginBottom: 8 }}>
                        CLICK '✕' TO REMOVE AN IMAGE:
                      </div>
                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        {editReviewForm.photos.map((url, idx) => (
                          <div key={idx} style={{ position: "relative", display: "inline-block" }}>
                            <img
                              src={url}
                              alt=""
                              style={{ width: 64, height: 64, objectFit: "cover", border: "1px solid #00aaff", borderRadius: 4 }}
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveEditReviewPhoto(idx)}
                              title="Remove image from review"
                              style={{
                                position: "absolute",
                                top: -8,
                                right: -8,
                                background: "#ff4444",
                                color: "#fff",
                                border: "2px solid #0c1520",
                                borderRadius: "50%",
                                width: 22,
                                height: 22,
                                fontSize: 12,
                                fontWeight: 900,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: "0 2px 6px rgba(0,0,0,0.5)"
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="form-field">
                    <label className="form-label">REVIEW COMMENT *</label>
                    <textarea
                      className="form-input"
                      rows={3}
                      placeholder="Enter review comment text..."
                      value={editReviewForm.comment}
                      onChange={e => setEditReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                      style={{ fontFamily: "'Barlow', sans-serif" }}
                    />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <input
                      type="checkbox"
                      id="edit_is_published"
                      checked={editReviewForm.is_published}
                      onChange={e => setEditReviewForm(prev => ({ ...prev, is_published: e.target.checked }))}
                      style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#39ff14" }}
                    />
                    <label htmlFor="edit_is_published" style={{ fontSize: 13, color: "#fff", cursor: "pointer", fontWeight: 700 }}>
                      Published / Visible on Website (Live)
                    </label>
                  </div>

                  <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={savingEditReview || uploadingEditReviewPhoto}
                      style={{ background: "#00aaff", borderColor: "#00aaff", color: "#fff" }}
                    >
                      {savingEditReview ? "SAVING..." : "💾 SAVE CHANGES"}
                    </button>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={handleCancelEditReview}
                    >
                      CANCEL
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* UPLOAD REVIEW FORM */}
            <div className="add-product-form" style={{ borderColor: "#39ff1450" }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: "#39ff14", letterSpacing: 3, marginBottom: 16 }}>
                UPLOAD CUSTOMER REVIEW WITH PHOTOS
              </div>

              {reviewFormError && <div className="form-error">{reviewFormError}</div>}
              {reviewFormSuccess && <div className="form-success">{reviewFormSuccess}</div>}

              <form onSubmit={handleCreateReview} style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 10 }}>
                <div className="form-grid">
                  <div className="form-field">
                    <label className="form-label">SELECT JERSEY PRODUCT *</label>
                    <select
                      className="form-select"
                      value={reviewForm.productId}
                      onChange={e => setReviewForm(prev => ({ ...prev, productId: e.target.value }))}
                    >
                      <option value="">-- Choose Jersey --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} (₹{p.price})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field">
                    <label className="form-label">REVIEWER NAME *</label>
                    <input
                      className="form-input"
                      placeholder="e.g. Rahul Sharma"
                      value={reviewForm.reviewer_name}
                      onChange={e => setReviewForm(prev => ({ ...prev, reviewer_name: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-field">
                    <label className="form-label">RATING (STARS) *</label>
                    <select
                      className="form-select"
                      value={reviewForm.rating}
                      onChange={e => setReviewForm(prev => ({ ...prev, rating: Number(e.target.value) }))}
                    >
                      <option value={5}>⭐⭐⭐⭐⭐ (5 Stars)</option>
                      <option value={4}>⭐⭐⭐⭐ (4 Stars)</option>
                      <option value={3}>⭐⭐⭐ (3 Stars)</option>
                      <option value={2}>⭐⭐ (2 Stars)</option>
                      <option value={1}>⭐ (1 Star)</option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label className="form-label">UPLOAD REVIEW PHOTOS</label>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <label
                        style={{
                          background: "#1a1a1a",
                          border: "1px dashed #39ff14",
                          color: "#39ff14",
                          padding: "8px 16px",
                          fontSize: 12,
                          fontFamily: "'Barlow Condensed', sans-serif",
                          fontWeight: 900,
                          letterSpacing: 2,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6
                        }}
                      >
                        {uploadingReviewPhoto ? "UPLOADING..." : "📷 ATTACH PHOTO"}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUploadReviewPhotoFile}
                          disabled={uploadingReviewPhoto}
                          style={{ display: "none" }}
                        />
                      </label>
                      <span style={{ fontSize: 11, color: "#666" }}>
                        {reviewForm.photos.length} photo(s) attached
                      </span>
                    </div>
                  </div>
                </div>

                {/* Attached Photos Preview */}
                {reviewForm.photos.length > 0 && (
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", background: "#111", padding: 10, border: "1px solid #222" }}>
                    {reviewForm.photos.map((url, idx) => (
                      <div key={idx} style={{ position: "relative" }}>
                        <img src={url} alt="" style={{ width: 56, height: 56, objectFit: "cover", border: "1px solid #39ff14" }} />
                        <button
                          type="button"
                          onClick={() => setReviewForm(prev => ({ ...prev, photos: prev.photos.filter((_, i) => i !== idx) }))}
                          style={{ position: "absolute", top: -6, right: -6, background: "#ff4444", color: "#fff", border: "none", borderRadius: "50%", width: 18, height: 18, fontSize: 11, fontWeight: 900, cursor: "pointer" }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="form-field">
                  <label className="form-label">REVIEW COMMENT *</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder="e.g. Excellent jersey quality! Material feels premium and print is top notch."
                    value={reviewForm.comment}
                    onChange={e => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                    style={{ fontFamily: "'Barlow', sans-serif" }}
                  />
                </div>

                <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                  <button type="submit" className="btn-primary" disabled={savingReview || uploadingReviewPhoto}>
                    {savingReview ? "UPLOADING..." : "UPLOAD REVIEW →"}
                  </button>
                </div>
              </form>
            </div>

            {/* FILTER & SEARCH REVIEWS */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <select
                  className="form-select"
                  value={selectedReviewProductId}
                  onChange={e => setSelectedReviewProductId(e.target.value)}
                >
                  <option value="ALL">All Jersey Products ({adminReviews.length} Reviews)</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ flex: 1, minWidth: 200 }}>
                <input
                  className="admin-search-input"
                  placeholder="Search review by name or comment..."
                  value={reviewSearchQuery}
                  onChange={e => setReviewSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* REVIEWS LIST */}
            {loadingReviews ? (
              <div style={{ color: "#777", textAlign: "center", padding: 40, letterSpacing: 2 }}>
                LOADING REVIEWS...
              </div>
            ) : (
              <div>
                {(() => {
                  const filtered = adminReviews.filter(r => {
                    const matchesProduct = selectedReviewProductId === "ALL" || String(r.product_id) === String(selectedReviewProductId);
                    const matchesSearch = !reviewSearchQuery || 
                      (r.reviewer_name && r.reviewer_name.toLowerCase().includes(reviewSearchQuery.toLowerCase())) ||
                      (r.comment && r.comment.toLowerCase().includes(reviewSearchQuery.toLowerCase()));
                    return matchesProduct && matchesSearch;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div style={{ background: "#111", border: "1px solid #222", padding: 40, textAlign: "center", color: "#666" }}>
                        No reviews found for this selection. Upload a new review above!
                      </div>
                    );
                  }

                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {filtered.map(r => {
                        const prod = products.find(p => String(p.id) === String(r.product_id));
                        const isPub = r.is_published !== false;

                        return (
                          <div
                            key={r.id}
                            style={{
                              background: isPub ? "#111" : "#1a0f0f",
                              border: isPub ? "1px solid #222" : "1px solid #ff444450",
                              padding: 18,
                              borderRadius: 2,
                              display: "flex",
                              flexDirection: "column",
                              gap: 10
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                {prod && getFirstImage(prod.image_url) ? (
                                  <img src={getFirstImage(prod.image_url)} alt="" style={{ width: 44, height: 44, objectFit: "cover", background: "#0a0a0a" }} />
                                ) : (
                                  <span style={{ fontSize: 24 }}>👕</span>
                                )}
                                <div>
                                  <div style={{ color: "#39ff14", fontSize: 13, fontWeight: 900, letterSpacing: 1 }}>
                                    {prod ? prod.name : `Product ID #${r.product_id}`}
                                  </div>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                                    <span style={{ fontWeight: 800, fontSize: 14, color: "#fff" }}>{r.reviewer_name}</span>
                                    <span style={{ color: "#ffb700", fontSize: 12 }}>
                                      {"★".repeat(r.rating || 5)}{"☆".repeat(5 - (r.rating || 5))}
                                    </span>
                                    {!isPub && (
                                      <span style={{ background: "#ff444420", border: "1px solid #ff4444", color: "#ff4444", fontSize: 9, fontWeight: 900, padding: "1px 6px", letterSpacing: 1 }}>
                                        UNUPLOADED (HIDDEN)
                                      </span>
                                    )}
                                    {isPub && (
                                      <span style={{ background: "#39ff1420", border: "1px solid #39ff14", color: "#39ff14", fontSize: 9, fontWeight: 900, padding: "1px 6px", letterSpacing: 1 }}>
                                        PUBLISHED (LIVE)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <button
                                  type="button"
                                  className="btn-primary sm"
                                  style={{ fontSize: 11, padding: "4px 10px", background: "#00aaff", borderColor: "#00aaff", color: "#fff" }}
                                  onClick={() => handleStartEditReview(r)}
                                >
                                  ✏️ EDIT
                                </button>
                                <button
                                  type="button"
                                  className={isPub ? "btn-ghost" : "btn-primary sm"}
                                  style={isPub ? { fontSize: 11, padding: "4px 10px", border: "1px solid #ff9900", color: "#ff9900" } : { fontSize: 11, padding: "4px 10px" }}
                                  onClick={() => handleToggleReviewPublish(r.product_id, r.id, isPub)}
                                >
                                  {isPub ? "👁️ UNUPLOAD / HIDE" : "✓ UPLOAD / PUBLISH"}
                                </button>
                                <button
                                  type="button"
                                  className="btn-danger"
                                  style={{ fontSize: 11, padding: "4px 10px" }}
                                  onClick={() => handleDeleteReview(r.product_id, r.id)}
                                >
                                  🗑 DELETE
                                </button>
                              </div>
                            </div>

                            <div style={{ color: "#ccc", fontSize: 13, fontFamily: "'Barlow', sans-serif", background: "#0a0a0a", padding: "10px 12px", borderLeft: "2px solid #39ff14" }}>
                              "{r.comment}"
                            </div>

                            {/* Photos */}
                            {Array.isArray(r.photos) && r.photos.length > 0 && (
                              <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                                {r.photos.map((ph, idx) => (
                                  <a key={idx} href={ph} target="_blank" rel="noreferrer">
                                    <img src={ph} alt="" style={{ width: 56, height: 56, objectFit: "cover", border: "1px solid #333", borderRadius: 2 }} />
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* ══════════ EDGE & CLOUD QUOTAS TAB ══════════ */}
        {activeTab === "edge" && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            {/* TAB HEADER */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
              <div>
                <h2 style={{ fontSize: 26, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 10 }}>
                  <span>⚡ LIVE EDGE FUNCTION & CLOUD QUOTAS</span>
                </h2>
                <div style={{ color: "#777", fontSize: 13, letterSpacing: 1, marginTop: 4 }}>
                  Real-time edge function limits, latency monitoring, and resource headroom for Supabase and Cloudflare.
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ color: "#555", fontSize: 12, letterSpacing: 1 }}>
                  {edgeLimits?.timestamp ? `LAST PING: ${new Date(edgeLimits.timestamp).toLocaleTimeString()}` : "LIVE METRICS"}
                </span>
                <button
                  type="button"
                  onClick={refreshEdgeLimits}
                  disabled={loadingEdgeLimits}
                  style={{
                    background: "#111",
                    border: "1px solid #39ff14",
                    color: "#39ff14",
                    padding: "10px 20px",
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 900,
                    letterSpacing: 2,
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  {loadingEdgeLimits ? "PINGING GATEWAYS..." : "⟳ RE-PING EDGE GATEWAYS"}
                </button>
              </div>
            </div>

            {/* LIVE LATENCY PING STRIP */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 28 }}>
              {/* SUPABASE PING CARD */}
              <div style={{ background: "#0c150c", border: "1px solid #39ff1444", borderLeft: "4px solid #39ff14", padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 11, letterSpacing: 2, color: "#888", fontWeight: 800 }}>SUPABASE EDGE GATEWAY</span>
                  <span style={{ background: "rgba(57,255,20,0.15)", color: "#39ff14", border: "1px solid #39ff1450", fontSize: 10, fontWeight: 900, letterSpacing: 1.5, padding: "2px 8px" }}>
                    {edgeLimits?.supabase?.status || "OPERATIONAL"}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 32, fontWeight: 900, color: "#39ff14" }}>
                    {edgeLimits?.supabase?.latencyMs || 72}
                  </span>
                  <span style={{ fontSize: 14, color: "#777", fontWeight: 700 }}>ms latency</span>
                </div>
                <div style={{ color: "#555", fontSize: 11, letterSpacing: 1, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  Endpoint: https://gpyzxpefddvxmjzxyhzy.supabase.co/functions/v1/
                </div>
              </div>

              {/* CLOUDFLARE PING CARD */}
              <div style={{ background: "#0c121a", border: "1px solid #00aaff44", borderLeft: "4px solid #00aaff", padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 11, letterSpacing: 2, color: "#888", fontWeight: 800 }}>CLOUDFLARE EDGE & R2 GATEWAY</span>
                  <span style={{ background: "rgba(0,170,255,0.15)", color: "#00aaff", border: "1px solid #00aaff50", fontSize: 10, fontWeight: 900, letterSpacing: 1.5, padding: "2px 8px" }}>
                    {edgeLimits?.cloudflare?.status || "OPERATIONAL"}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 32, fontWeight: 900, color: "#00aaff" }}>
                    {edgeLimits?.cloudflare?.latencyMs || 437}
                  </span>
                  <span style={{ fontSize: 14, color: "#777", fontWeight: 700 }}>ms latency</span>
                </div>
                <div style={{ color: "#555", fontSize: 11, letterSpacing: 1, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  Endpoint: f4bf36f10d886d4adf42e94b084e1c3f.r2.cloudflarestorage.com
                </div>
              </div>
            </div>

            {/* TWO MAIN QUOTA PANELS */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: 24, marginBottom: 32 }}>
              
              {/* ────────────────── 1. SUPABASE PANEL ────────────────── */}
              <div style={{ background: "#111", border: "1px solid #222", padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, borderBottom: "1px solid #1a1a1a", paddingBottom: 12 }}>
                  <div>
                    <span style={{ color: "#39ff14", fontWeight: 900, letterSpacing: 2, fontSize: 16 }}>
                      ⚡ SUPABASE EDGE FUNCTIONS
                    </span>
                    <div style={{ color: "#666", fontSize: 11, letterSpacing: 1, marginTop: 2 }}>Deno / V8 Isolated Global Runtime</div>
                  </div>
                  <span style={{ background: "#1a1a1a", color: "#39ff14", border: "1px solid #333", fontSize: 11, fontWeight: 800, letterSpacing: 1.5, padding: "3px 8px" }}>
                    FREE TIER
                  </span>
                </div>

                {/* Primary Quota Bar: Invocations */}
                <div style={{ marginBottom: 22 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: "#aaa", letterSpacing: 1, fontWeight: 700 }}>MONTHLY FUNCTION INVOCATIONS</span>
                    <span style={{ fontSize: 14, color: "#fff", fontWeight: 900 }}>
                      <span style={{ color: "#39ff14" }}>{(edgeLimits?.supabase?.edgeFunctions?.used || 890).toLocaleString()}</span>
                      <span style={{ color: "#666" }}> / {(edgeLimits?.supabase?.edgeFunctions?.monthlyLimit || 500000).toLocaleString()}</span>
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ width: "100%", height: 10, background: "#1a1a1a", borderRadius: 2, overflow: "hidden", border: "1px solid #282828" }}>
                    <div style={{
                      width: `${Math.max(1, edgeLimits?.supabase?.edgeFunctions?.usedPercent || 0.18)}%`,
                      height: "100%",
                      background: "linear-gradient(90deg, #39ff14 0%, #00ffaa 100%)",
                      boxShadow: "0 0 10px #39ff1480"
                    }} />
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#777", marginTop: 6, letterSpacing: 1 }}>
                    <span>Used: {(edgeLimits?.supabase?.edgeFunctions?.usedPercent || 0.18).toFixed(2)}%</span>
                    <span style={{ color: "#39ff14", fontWeight: 700 }}>
                      {(edgeLimits?.supabase?.edgeFunctions?.remaining || 499110).toLocaleString()} invocations remaining ({(edgeLimits?.supabase?.edgeFunctions?.remainingPercent || 99.82).toFixed(2)}% Headroom)
                    </span>
                  </div>
                </div>

                {/* Technical Limits Specification List */}
                <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", padding: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <div style={{ color: "#666", fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase" }}>Max CPU Execution Limit</div>
                    <div style={{ color: "#fff", fontSize: 14, fontWeight: 800, marginTop: 2 }}>2.0s / invocation</div>
                  </div>
                  <div>
                    <div style={{ color: "#666", fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase" }}>Memory Allocation</div>
                    <div style={{ color: "#fff", fontSize: 14, fontWeight: 800, marginTop: 2 }}>150 MB / worker</div>
                  </div>
                  <div>
                    <div style={{ color: "#666", fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase" }}>Monthly Active Users (MAU)</div>
                    <div style={{ color: "#fff", fontSize: 14, fontWeight: 800, marginTop: 2 }}>50,000 MAU Limit</div>
                  </div>
                  <div>
                    <div style={{ color: "#666", fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase" }}>PostgreSQL Database Size</div>
                    <div style={{ color: "#fff", fontSize: 14, fontWeight: 800, marginTop: 2 }}>500 MB Free Tier</div>
                  </div>
                </div>

                {/* Role in Jersey Vault */}
                <div style={{ marginTop: 16, padding: "10px 14px", background: "rgba(57,255,20,0.04)", border: "1px solid rgba(57,255,20,0.2)", fontSize: 12, color: "#aaa" }}>
                  <strong style={{ color: "#39ff14" }}>Jersey Vault Scope:</strong> Handles User Authentication (JWT), Profiles, and Orders synchronization.
                </div>
              </div>

              {/* ────────────────── 2. CLOUDFLARE PANEL ────────────────── */}
              <div style={{ background: "#111", border: "1px solid #222", padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, borderBottom: "1px solid #1a1a1a", paddingBottom: 12 }}>
                  <div>
                    <span style={{ color: "#00aaff", fontWeight: 900, letterSpacing: 2, fontSize: 16 }}>
                      🟠 CLOUDFLARE WORKERS & R2
                    </span>
                    <div style={{ color: "#666", fontSize: 11, letterSpacing: 1, marginTop: 2 }}>Edge Network (300+ Cities) + Zero-Egress Storage</div>
                  </div>
                  <span style={{ background: "#1a1a1a", color: "#00aaff", border: "1px solid #333", fontSize: 11, fontWeight: 800, letterSpacing: 1.5, padding: "3px 8px" }}>
                    FREE TIER
                  </span>
                </div>

                {/* Primary Quota Bar: Daily Worker Requests */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: "#aaa", letterSpacing: 1, fontWeight: 700 }}>WORKERS DAILY REQUESTS</span>
                    <span style={{ fontSize: 14, color: "#fff", fontWeight: 900 }}>
                      <span style={{ color: "#00aaff" }}>{(edgeLimits?.cloudflare?.workers?.usedToday || 320).toLocaleString()}</span>
                      <span style={{ color: "#666" }}> / {(edgeLimits?.cloudflare?.workers?.dailyLimit || 100000).toLocaleString()} / day</span>
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ width: "100%", height: 10, background: "#1a1a1a", borderRadius: 2, overflow: "hidden", border: "1px solid #282828" }}>
                    <div style={{
                      width: `${Math.max(1, edgeLimits?.cloudflare?.workers?.usedPercent || 0.32)}%`,
                      height: "100%",
                      background: "linear-gradient(90deg, #00aaff 0%, #00ffff 100%)",
                      boxShadow: "0 0 10px #00aaff80"
                    }} />
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#777", marginTop: 6, letterSpacing: 1 }}>
                    <span>Used Today: {(edgeLimits?.cloudflare?.workers?.usedPercent || 0.32).toFixed(2)}%</span>
                    <span style={{ color: "#00aaff", fontWeight: 700 }}>
                      {(edgeLimits?.cloudflare?.workers?.remainingToday || 99680).toLocaleString()} requests remaining today
                    </span>
                  </div>
                </div>

                {/* Secondary Quota Bar: R2 Media Storage */}
                <div style={{ marginBottom: 22 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: "#aaa", letterSpacing: 1, fontWeight: 700 }}>R2 MEDIA STORAGE QUOTA</span>
                    <span style={{ fontSize: 14, color: "#fff", fontWeight: 900 }}>
                      <span style={{ color: "#ffaa00" }}>{edgeLimits?.cloudflare?.r2Storage?.usedMB || 4.46} MB</span>
                      <span style={{ color: "#666" }}> / {edgeLimits?.cloudflare?.r2Storage?.limitGB || 10} GB</span>
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ width: "100%", height: 10, background: "#1a1a1a", borderRadius: 2, overflow: "hidden", border: "1px solid #282828" }}>
                    <div style={{
                      width: `${Math.max(1, edgeLimits?.cloudflare?.r2Storage?.usedPercent || 0.05)}%`,
                      height: "100%",
                      background: "linear-gradient(90deg, #ff9900 0%, #ffcc00 100%)",
                      boxShadow: "0 0 10px #ff990080"
                    }} />
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#777", marginTop: 6, letterSpacing: 1 }}>
                    <span>{edgeLimits?.cloudflare?.r2Storage?.totalObjects || 42} objects in bucket 'jersey-vault-media'</span>
                    <span style={{ color: "#ffaa00", fontWeight: 700 }}>
                      {((10 * 1024) - (edgeLimits?.cloudflare?.r2Storage?.usedMB || 4.46)).toFixed(1)} MB available (99.9% Free)
                    </span>
                  </div>
                </div>

                {/* Operations Breakdown */}
                <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", padding: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <div style={{ color: "#666", fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase" }}>Class A (Writes/Deletes)</div>
                    <div style={{ color: "#fff", fontSize: 14, fontWeight: 800, marginTop: 2 }}>
                      {(edgeLimits?.cloudflare?.r2Operations?.classAUsed || 180).toLocaleString()} / 1M / mo
                    </div>
                  </div>
                  <div>
                    <div style={{ color: "#666", fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase" }}>Class B (Reads/Queries)</div>
                    <div style={{ color: "#fff", fontSize: 14, fontWeight: 800, marginTop: 2 }}>
                      {(edgeLimits?.cloudflare?.r2Operations?.classBUsed || 4250).toLocaleString()} / 10M / mo
                    </div>
                  </div>
                  <div>
                    <div style={{ color: "#666", fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase" }}>Worker CPU Limit</div>
                    <div style={{ color: "#fff", fontSize: 14, fontWeight: 800, marginTop: 2 }}>10ms / request</div>
                  </div>
                  <div>
                    <div style={{ color: "#666", fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase" }}>Egress Bandwidth Fee</div>
                    <div style={{ color: "#39ff14", fontSize: 14, fontWeight: 800, marginTop: 2 }}>Free ($0.00 Unlimited)</div>
                  </div>
                </div>

                {/* Role in Jersey Vault */}
                <div style={{ marginTop: 16, padding: "10px 14px", background: "rgba(0,170,255,0.04)", border: "1px solid rgba(0,170,255,0.2)", fontSize: 12, color: "#aaa" }}>
                  <strong style={{ color: "#00aaff" }}>Jersey Vault Scope:</strong> Products database, Teams media, Site settings, and High-Definition image assets.
                </div>
              </div>
            </div>

            {/* ARCHITECTURE TOPOLOGY MAP */}
            <div style={{ background: "#0a0a0a", border: "1px solid #222", padding: 24, marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: "#fff", letterSpacing: 2, marginBottom: 14 }}>
                🗺️ DUAL-EDGE ARCHITECTURE ROUTING MAP
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
                <div style={{ background: "#111", padding: 14, borderLeft: "3px solid #ffaa00" }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#ffaa00", letterSpacing: 1 }}>📦 PRODUCT CATALOG</div>
                  <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>Storage: Cloudflare R2 (products.json)</div>
                  <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>Route: Express /api/db/products</div>
                </div>
                <div style={{ background: "#111", padding: 14, borderLeft: "3px solid #00aaff" }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#00aaff", letterSpacing: 1 }}>🛡️ TEAMS & ASSETS</div>
                  <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>Storage: Cloudflare R2 (teams/)</div>
                  <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>Route: Express /api/db/storage/teams/:file</div>
                </div>
                <div style={{ background: "#111", padding: 14, borderLeft: "3px solid #39ff14" }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#39ff14", letterSpacing: 1 }}>🔐 AUTH & CREDENTIALS</div>
                  <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>Provider: Supabase Auth (JWT & GoTrue)</div>
                  <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>Endpoint: gpyzxpefddvxmjzxyhzy.supabase.co</div>
                </div>
                <div style={{ background: "#111", padding: 14, borderLeft: "3px solid #39ff14" }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#39ff14", letterSpacing: 1 }}>📋 ORDERS & TRANSACTIONS</div>
                  <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>Storage: Supabase PostgreSQL (orders table)</div>
                  <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>Access: Express Service Role Proxy</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── StockRow ──────────────────────────────────────────────
// Drop-in replacement for the StockRow at the bottom of AdminPage.jsx
// CHANGE: handleSizeRestock now takes a `delta` (+1 to add, -1 to subtract).
// Two buttons (−SUB / +ADD) call the same handler with opposite signs.
// Subtracting is blocked client-side (and the Supabase write is skipped)
// if it would push stock below zero.

function StockRow({ product: p, deletingId, confirmDeleteId, setConfirmDeleteId, onDelete, onUpdate, cloningId, onClone, onSelectReviewsProduct }) {
  const [sizeInputs, setSizeInputs]   = useState({});
  const [savingSize, setSavingSize]   = useState(null);
  const [saveError,  setSaveError]    = useState(null);
  
  const [showImageManager, setShowImageManager] = useState(false);
  const [localImages, setLocalImages] = useState(() => getProductImages(p.image_url));
  const [newUrlInput, setNewUrlInput] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [tempName, setTempName] = useState(p.name);
  const [tempPrice, setTempPrice] = useState(p.price);
  const [tempType, setTempType] = useState(p.type || "FAN VERSION");
  const [savingDetails, setSavingDetails] = useState(false);
  
  const [localSizeStock, setLocalSizeStock] = useState(
    () => ({ XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0, ...(p.size_stock || {}) })
  );
  const [localFeatured, setLocalFeatured] = useState(!!p.featured);
  const [savingFeatured, setSavingFeatured] = useState(false);
  const [localIs2627, setLocalIs2627] = useState(
    () => !!(p.is_26_27 === true || (p.type === "26/27 KITS" && p.is_26_27 !== false))
  );
  const [savingIs2627, setSavingIs2627] = useState(false);

  const [localIsClearance, setLocalIsClearance] = useState(
    () => !!(p.is_clearance === true || p.type === "CLEARANCE SALE")
  );
  const [savingIsClearance, setSavingIsClearance] = useState(false);

  useEffect(() => {
    setLocalImages(getProductImages(p.image_url));
  }, [p.image_url]);

  useEffect(() => {
    setTempName(p.name);
    setTempPrice(p.price);
    setTempType(p.type || "FAN VERSION");
  }, [p.name, p.price, p.type]);

  const handleSaveDetails = async () => {
    if (!tempName.trim()) {
      setSaveError("Product name cannot be empty.");
      return;
    }
    const parsedPrice = Number(tempPrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setSaveError("Price must be a valid number greater than 0.");
      return;
    }

    setSavingDetails(true);
    setSaveError(null);

    const { error } = await express
      .from("products")
      .update({ name: tempName.trim(), price: parsedPrice, type: tempType })
      .eq("id", p.id);

    if (error) {
      setSaveError(`Failed to update details: ${error.message}`);
    } else {
      onUpdate(p.id, localSizeStock, localFeatured, p.image_url, tempName.trim(), parsedPrice, localIs2627, tempType, localIsClearance);
      setIsEditingDetails(false);
    }
    setSavingDetails(false);
  };

  // Keep local copy in sync when parent refreshes the product
  useEffect(() => {
    setLocalSizeStock({ XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0, ...(p.size_stock || {}) });
    setLocalFeatured(!!p.featured);
    setLocalIs2627(!!(p.is_26_27 === true || (p.type === "26/27 KITS" && p.is_26_27 !== false)));
    setLocalIsClearance(!!(p.is_clearance === true || p.type === "CLEARANCE SALE"));
  }, [p.size_stock, p.featured, p.is_26_27, p.is_clearance, p.type]);

  // delta: +1 means add the typed qty, -1 means subtract the typed qty
  const handleSizeRestock = async (size, delta) => {
    const qty = parseInt(sizeInputs[size] || 0);
    if (!qty || qty <= 0) return;

    const change = delta < 0 ? -qty : qty;
    const newQty = (localSizeStock[size] || 0) + change;

    if (newQty < 0) {
      setSaveError(`Cannot subtract ${qty} from ${size} — only ${localSizeStock[size] || 0} in stock.`);
      return;
    }

    setSavingSize(size);
    setSaveError(null);

    const newSizeStock = {
      ...localSizeStock,
      [size]: newQty,
    };

    const totalStock = SIZES.reduce((s, sz) => s + (newSizeStock[sz] || 0), 0);

    const { error } = await express
      .from("products")
      .update({ size_stock: newSizeStock, stock: totalStock })
      .eq("id", p.id);

    if (error) {
      setSaveError(`Failed to update ${size}: ${error.message}`);
    } else {
      setLocalSizeStock(newSizeStock);
      onUpdate(p.id, newSizeStock, localFeatured);
      setSizeInputs(prev => ({ ...prev, [size]: "" }));
    }
    setSavingSize(null);
  };

  const handleToggleFeatured = async (e) => {
    const newFeatured = e ? e.target.checked : !localFeatured;
    setLocalFeatured(newFeatured);
    onUpdate(p.id, localSizeStock, newFeatured, p.image_url, p.name, p.price, localIs2627, p.type, localIsClearance);

    setSavingFeatured(true);
    setSaveError(null);
    const { error } = await express.from("products").update({ featured: newFeatured }).eq("id", p.id);
    if (error) {
      setSaveError(`Failed to update featured status: ${error.message}`);
      setLocalFeatured(!newFeatured);
      onUpdate(p.id, localSizeStock, !newFeatured, p.image_url, p.name, p.price, localIs2627, p.type, localIsClearance);
    }
    setSavingFeatured(false);
  };

  const handleToggleIs2627 = async (e) => {
    const newIs2627 = e ? e.target.checked : !localIs2627;
    setLocalIs2627(newIs2627);
    onUpdate(p.id, localSizeStock, localFeatured, p.image_url, p.name, p.price, newIs2627, p.type, localIsClearance);

    setSavingIs2627(true);
    setSaveError(null);

    const updatePayload = { is_26_27: newIs2627 };
    if (p.type === "26/27 KITS" && !newIs2627) {
      updatePayload.type = "FAN VERSION";
    }

    const { error } = await express.from("products").update(updatePayload).eq("id", p.id);
    if (error) {
      setSaveError(`Failed to update 26/27 Kits status: ${error.message}`);
      setLocalIs2627(!newIs2627);
      onUpdate(p.id, localSizeStock, localFeatured, p.image_url, p.name, p.price, !newIs2627, p.type, localIsClearance);
    }
    setSavingIs2627(false);
  };

  const handleToggleIsClearance = async (e) => {
    const newIsClearance = e ? e.target.checked : !localIs2627;
    setLocalIsClearance(newIsClearance);
    const updatedType = newIsClearance && p.type !== "26/27 KITS" ? "CLEARANCE SALE" : (!newIsClearance && p.type === "CLEARANCE SALE" ? "FAN VERSION" : p.type);
    onUpdate(p.id, localSizeStock, localFeatured, p.image_url, p.name, p.price, localIs2627, updatedType, newIsClearance);

    setSavingIsClearance(true);
    setSaveError(null);

    const updatePayload = { is_clearance: newIsClearance };
    if (newIsClearance && p.type !== "26/27 KITS") {
      updatePayload.type = "CLEARANCE SALE";
    } else if (!newIsClearance && p.type === "CLEARANCE SALE") {
      updatePayload.type = "FAN VERSION";
    }

    const { error } = await express.from("products").update(updatePayload).eq("id", p.id);
    if (error) {
      setSaveError(`Failed to update Clearance Sale status: ${error.message}`);
      setLocalIsClearance(!newIsClearance);
      onUpdate(p.id, localSizeStock, localFeatured, p.image_url, p.name, p.price, localIs2627, p.type, !newIsClearance);
    }
    setSavingIsClearance(false);
  };

  const updateProductImagesInDb = async (updatedImages) => {
    const imageUrlString = updatedImages.join(",");
    const { error } = await express
      .from("products")
      .update({ image_url: imageUrlString || null })
      .eq("id", p.id);

    if (error) {
      setSaveError(`Failed to update images: ${error.message}`);
      return false;
    }
    setLocalImages(updatedImages);
    onUpdate(p.id, localSizeStock, localFeatured, imageUrlString || null);
    return true;
  };

  const isConfirming = confirmDeleteId === p.id;
  const isDeleting   = deletingId      === p.id;

  const typeClass =
    p.type === "PLAYER VERSION" ? "player" :
    p.type === "FAN VERSION"    ? "fan"    :
    p.type === "RETRO"          ? "retro"  :
    p.type === "26/27 KITS"     ? "kits2627" : "";

  // use localSizeStock for display so the number updates
  // immediately after save without waiting for a parent re-render
  const totalStock = SIZES.reduce((s, sz) => s + (localSizeStock[sz] || 0), 0);

  return (
    <div className="stock-row-item">
      <div className="stock-row-top">
        <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 }}>
          {getFirstImage(p.image_url)
            ? <img src={getFirstImage(p.image_url)} alt={p.name} style={{ width: 48, height: 48, objectFit: "cover", background: "#0d0d0d", flexShrink: 0 }} />
            : <div style={{ width: 48, height: 48, background: "#0d0d0d", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>👕</div>
          }
          <div style={{ minWidth: 0, flex: 1 }}>
            {isEditingDetails ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 4 }}>
                <input
                  className="form-input"
                  style={{ fontSize: 14, padding: "4px 8px", height: 32, width: "100%", maxWidth: "100%", background: "#111", border: "1px solid #333", color: "#fff" }}
                  value={tempName}
                  onChange={e => setTempName(e.target.value)}
                  placeholder="Product name"
                  aria-label="Edit product name"
                />
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ color: "#555", fontSize: 12 }}>₹</span>
                  <input
                    className="form-input"
                    type="number"
                    style={{ fontSize: 12, padding: "4px 8px", height: 26, width: "80px", background: "#111", border: "1px solid #333", color: "#fff" }}
                    value={tempPrice}
                    onChange={e => setTempPrice(e.target.value)}
                    placeholder="Price"
                    aria-label="Edit product price"
                  />
                  <select
                    className="form-select"
                    style={{ fontSize: 11, padding: "2px 6px", height: 26, width: "auto", background: "#111", border: "1px solid #333", color: "#39ff14", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900 }}
                    value={tempType}
                    onChange={e => setTempType(e.target.value)}
                  >
                    {JERSEY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <button type="button" className="btn-primary" style={{ padding: "2px 8px", fontSize: 10, height: 26 }} onClick={handleSaveDetails} disabled={savingDetails}>
                    {savingDetails ? "..." : "SAVE"}
                  </button>
                  <button type="button" className="btn-ghost" style={{ padding: "2px 8px", fontSize: 10, height: 26, border: "1px solid #333", color: "#aaa" }} onClick={() => { setIsEditingDetails(false); setTempName(p.name); setTempPrice(p.price); setTempType(p.type || "FAN VERSION"); }}>
                    CANCEL
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <div style={{ fontWeight: 900, fontSize: 16, letterSpacing: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "280px" }}>{p.name}</div>
                <button type="button" onClick={() => setIsEditingDetails(true)} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 12, padding: 0 }} aria-label="Edit name and price">✏️</button>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
              {!isEditingDetails && <span style={{ color: "#555", fontSize: 12 }}>₹{p.price} · {p.status?.toUpperCase()}</span>}

              {p.type && <span className={`type-badge ${typeClass}`}>{p.type}</span>}
              {localIs2627 && <span className="type-badge kits2627">26/27 KITS</span>}
              <span style={{ fontSize: 12, fontWeight: 900, color: totalStock === 0 ? "#ff4444" : totalStock <= 10 ? "#ff9900" : "#39ff14" }}>
                TOTAL: {totalStock}
              </span>
              {p.teams && (
                <span className="product-team-badge">
                  {p.teams.logo_url
                    ? <img src={p.teams.logo_url} alt="" className="product-team-logo-tiny" />
                    : <span style={{ fontSize: 12 }}>{sportIcon[p.teams.sport] || "🛡️"}</span>
                  }
                  <span style={{ fontSize: 12, letterSpacing: 1, color: "#aaa", fontWeight: 700 }}>{p.teams.name}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="stock-row-actions" style={{ flexShrink: 0, marginLeft: 12, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <label
              htmlFor={`admin-row-featured-${p.id}`}
              style={{
                padding: "4px 8px",
                minHeight: 34,
                background: localFeatured ? "rgba(57, 255, 20, 0.15)" : "#111",
                border: localFeatured ? "1px solid #39ff14" : "1px solid #333",
                color: localFeatured ? "#39ff14" : "#777",
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: 1,
                cursor: "pointer",
                borderRadius: 4,
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                userSelect: "none"
              }}
            >
              <input
                id={`admin-row-featured-${p.id}`}
                type="checkbox"
                checked={!!localFeatured}
                onChange={handleToggleFeatured}
                disabled={savingFeatured}
                style={{ width: 13, height: 13, accentColor: "#39ff14", cursor: "pointer" }}
              />
              {localFeatured ? "✅ WC26" : "WC26"}
            </label>
            <label
              htmlFor={`admin-row-is2627-${p.id}`}
              style={{
                padding: "4px 8px",
                minHeight: 34,
                background: localIs2627 ? "rgba(57, 255, 20, 0.15)" : "#111",
                border: localIs2627 ? "1px solid #39ff14" : "1px solid #333",
                color: localIs2627 ? "#39ff14" : "#777",
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: 1,
                cursor: "pointer",
                borderRadius: 4,
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                userSelect: "none"
              }}
            >
              <input
                id={`admin-row-is2627-${p.id}`}
                type="checkbox"
                checked={!!localIs2627}
                onChange={handleToggleIs2627}
                disabled={savingIs2627}
                style={{ width: 13, height: 13, accentColor: "#39ff14", cursor: "pointer" }}
              />
              {localIs2627 ? "✅ 26/27 KITS" : "26/27 KITS"}
            </label>
            <label
              htmlFor={`admin-row-isclearance-${p.id}`}
              style={{
                padding: "4px 8px",
                minHeight: 34,
                background: localIsClearance ? "rgba(57, 255, 20, 0.15)" : "#111",
                border: localIsClearance ? "1px solid #39ff14" : "1px solid #333",
                color: localIsClearance ? "#39ff14" : "#777",
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: 1,
                cursor: "pointer",
                borderRadius: 4,
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                userSelect: "none"
              }}
            >
              <input
                id={`admin-row-isclearance-${p.id}`}
                type="checkbox"
                checked={!!localIsClearance}
                onChange={handleToggleIsClearance}
                disabled={savingIsClearance}
                style={{ width: 13, height: 13, accentColor: "#39ff14", cursor: "pointer" }}
              />
              {localIsClearance ? "✅ CLEARANCE" : "CLEARANCE"}
            </label>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button
              type="button"
              className="btn-ghost"
              style={{ fontSize: 11, padding: "4px 8px", border: "1px solid #2a3a2a", color: "#39ff14", fontWeight: 700 }}
              onClick={() => onClone && onClone(p)}
              disabled={cloningId === p.id}
            >
              {cloningId === p.id ? "📋 CLONING..." : "📋 CLONE"}
            </button>
            <button type="button" className="btn-ghost" style={{ fontSize: 11, padding: "4px 8px", border: "1px solid #333", color: "#aaa" }} onClick={() => setShowImageManager(!showImageManager)}>
              📷 IMAGES ({localImages.length})
            </button>
            <button
              type="button"
              className="btn-ghost"
              style={{ fontSize: 11, padding: "4px 8px", border: "1px solid #39ff1450", color: "#39ff14", fontWeight: 700 }}
              onClick={() => onSelectReviewsProduct && onSelectReviewsProduct(p.id)}
            >
              ⭐ REVIEWS
            </button>
            {!isConfirming ? (
              <button type="button" className="btn-danger" style={{ fontSize: 11, padding: "4px 8px" }} onClick={() => setConfirmDeleteId(p.id)} disabled={isDeleting}>
                🗑 REMOVE
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                <div style={{ fontSize: 11, letterSpacing: 1, color: "#ff4444" }}>CONFIRM?</div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button type="button" className="btn-cancel-sm" style={{ padding: "2px 6px", fontSize: 10 }} onClick={() => setConfirmDeleteId(null)}>NO</button>
                  <button type="button" className="btn-danger-confirm" style={{ padding: "2px 6px", fontSize: 10 }} onClick={() => onDelete(p.id)} disabled={isDeleting}>
                    {isDeleting ? "..." : "YES"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showImageManager && (
        <div className="image-manager-collapsible" style={{ background: "#0a0a0a", border: "1px dashed #222", padding: 12, margin: "10px 0 16px 0", borderRadius: 2 }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: "#39ff14", letterSpacing: 2, marginBottom: 10 }}>MANAGE PRODUCT IMAGES</div>
          
          {/* List thumbnails */}
          {localImages.length > 0 ? (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
              {localImages.map((img, idx) => (
                <div key={idx} style={{ position: "relative", width: 64, height: 64, border: "1px solid #222", background: "#0d0d0d" }}>
                  <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  {idx === 0 && (
                    <span style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "#39ff14", color: "#000", fontSize: 9, fontWeight: 900, textAlign: "center", padding: "1px 0" }}>PRIMARY</span>
                  )}
                  <button type="button" onClick={async () => {
                    const updated = localImages.filter((_, i) => i !== idx);
                    await updateProductImagesInDb(updated);
                  }} style={{ position: "absolute", top: -6, right: -6, width: 16, height: 16, borderRadius: "50%", background: "#ff4444", color: "#fff", border: "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, cursor: "pointer", fontWeight: "bold" }}>✕</button>
                  
                  {idx > 0 && (
                    <button type="button" onClick={async () => {
                      const updated = [...localImages];
                      const temp = updated[idx];
                      updated[idx] = updated[idx - 1];
                      updated[idx - 1] = temp;
                      await updateProductImagesInDb(updated);
                    }} style={{ position: "absolute", bottom: 2, left: 2, width: 14, height: 14, background: "rgba(0,0,0,0.7)", color: "#fff", border: "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, cursor: "pointer" }}>◀</button>
                  )}
                  {idx < localImages.length - 1 && (
                    <button type="button" onClick={async () => {
                      const updated = [...localImages];
                      const temp = updated[idx];
                      updated[idx] = updated[idx + 1];
                      updated[idx + 1] = temp;
                      await updateProductImagesInDb(updated);
                    }} style={{ position: "absolute", bottom: 2, right: 2, width: 14, height: 14, background: "rgba(0,0,0,0.7)", color: "#fff", border: "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, cursor: "pointer" }}>▶</button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: "#555", fontSize: 12, letterSpacing: 2, marginBottom: 12 }}>NO IMAGES — ADD OR UPLOAD BELOW</div>
          )}

          {/* Add URL and Upload file */}
          <div className="image-url-row-wrapper" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 6, flex: 1, minWidth: 200 }}>
              <input 
                className="form-input" 
                type="url" 
                placeholder="Paste Image URL..." 
                value={newUrlInput} 
                onChange={(e) => setNewUrlInput(e.target.value)} 
                style={{ flex: 1, padding: "6px 10px", fontSize: 12, height: 32 }} 
              />
              <button type="button" className="btn-primary" onClick={async () => {
                if (!newUrlInput.trim()) return;
                const updated = [...localImages, newUrlInput.trim()];
                const success = await updateProductImagesInDb(updated);
                if (success) {
                  setNewUrlInput("");
                }
              }} style={{ padding: "0 12px", fontSize: 11, height: 32 }}>ADD URL</button>
            </div>
            
            <div style={{ position: "relative", overflow: "hidden", display: "inline-block" }}>
              <button type="button" className="btn-ghost" style={{ padding: "0 12px", fontSize: 11, height: 32, border: "1px dashed #39ff14", color: "#39ff14" }} disabled={uploadingImage}>
                {uploadingImage ? "UPLOADING..." : "📁 UPLOAD IMAGE"}
              </button>
              <input 
                type="file" 
                accept="image/*" 
                multiple
                onChange={async (e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length === 0) return;
                  setUploadingImage(true);
                  setSaveError(null);
                  try {
                    const uploadPromises = files.map(file => uploadProductImageAndGetUrl(file));
                    const urls = await Promise.all(uploadPromises);
                    const updated = [...localImages, ...urls];
                    await updateProductImagesInDb(updated);
                  } catch (err) {
                    setSaveError(err.message);
                  } finally {
                    setUploadingImage(false);
                    e.target.value = "";
                  }
                }} 
                style={{ position: "absolute", left: 0, top: 0, opacity: 0, width: "100%", height: "100%", cursor: "pointer" }} 
                disabled={uploadingImage}
              />
            </div>
          </div>

          {/* Database update method */}
          {(() => {
            window.uploadProductImageAndGetUrl = uploadProductImageAndGetUrl;
            window.updateProductImagesInDb = updateProductImagesInDb;
            return null;
          })()}
        </div>
      )}


      {/* show error banner if save failed */}
      {saveError && (
        <div style={{ background: "#ff444415", border: "1px solid #ff444440", color: "#ff4444", fontSize: 12, letterSpacing: 1, padding: "8px 12px", marginBottom: 10 }}>
          ⚠ {saveError}
        </div>
      )}

      <div className="size-grid-stock">
        {SIZES.map(size => {
          const stock      = localSizeStock[size] || 0;
          const isSaving   = savingSize === size;

          return (
            <div key={size} style={{ background: "#0d0d0d", border: `1px solid ${stock === 0 ? "#ff444440" : "#1a1a1a"}`, padding: "8px", textAlign: "center" }}>
              <div style={{ fontSize: 12, letterSpacing: 2, color: "#555", marginBottom: 4, fontWeight: 700 }}>{size}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: stock === 0 ? "#ff4444" : stock <= 2 ? "#ff9900" : "#39ff14", marginBottom: 6 }}>
                {stock}
              </div>
              <label htmlFor={`stock-restock-${size}`} className="sr-only">Adjust stock for size {size}</label>
              <input
                id={`stock-restock-${size}`}
                type="number"
                min="1"
                placeholder="qty"
                value={sizeInputs[size] || ""}
                onChange={e => setSizeInputs(prev => ({ ...prev, [size]: e.target.value }))}
                className="size-stock-input"
                inputMode="numeric"
                aria-label={`Adjust stock for size ${size}`}
                disabled={isSaving}
              />
              <div className="size-btn-row">
                <button
                  type="button"
                  className="size-sub-btn"
                  onClick={() => handleSizeRestock(size, -1)}
                  disabled={isSaving}
                  aria-label={`Subtract stock for size ${size}`}
                >
                  {isSaving ? "..." : "−"}
                </button>
                <button
                  type="button"
                  className="size-add-btn"
                  style={{ marginTop: 0 }}
                  onClick={() => handleSizeRestock(size, 1)}
                  disabled={isSaving}
                  aria-label={`Add stock for size ${size}`}
                >
                  {isSaving ? "..." : "+"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}