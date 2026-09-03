import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { API_BASE } from "../config/api";
import { fetchProductReviews, addProductReview, uploadReviewImage } from "../utils/reviews";

export default function Reviews() {
  const [allReviews, setAllReviews] = useState([]);
  const [jerseysList, setJerseysList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState("ALL");
  const [filterHasPhotos, setFilterHasPhotos] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState(null);

  // Review Form state
  const [showForm, setShowForm] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load products for review form dropdown from Cloudflare R2 backend
      const res = await fetch(`${API_BASE}/api/products`);
      if (res.ok) {
        const productsData = await res.json();
        const active = (productsData || []).filter(p => p.status === 'active' || !p.status);
        setJerseysList(active);
      }

      // Load all reviews
      const reviewsData = await fetchProductReviews("all");
      const published = (reviewsData || []).filter(r => r.is_published !== false);
      setAllReviews(published);
    } catch (err) {
      console.error("Failed to load reviews data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadPhoto = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadingPhoto(true);
    setSubmitError("");
    try {
      for (const file of files) {
        const url = await uploadReviewImage(file);
        if (url) {
          setPhotos(prev => [...prev, url]);
        }
      }
    } catch (err) {
      console.error("Photo upload error:", err);
      setSubmitError("Failed to upload photo.");
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedProductId) {
      setSubmitError("Please select a jersey to review.");
      return;
    }
    if (!comment.trim()) {
      setSubmitError("Please enter your review text.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess("");

    try {
      await addProductReview(selectedProductId, {
        reviewer_name: reviewerName.trim() || "Customer",
        rating: Number(rating) || 5,
        comment: comment.trim(),
        photos: photos,
        is_published: true
      });

      setSubmitSuccess("✓ Thank you! Your customer review with images has been posted!");
      setComment("");
      setPhotos([]);
      setReviewerName("");
      setRating(5);
      setSelectedProductId("");

      // Reload list
      const freshReviews = await fetchProductReviews("all");
      const published = (freshReviews || []).filter(r => r.is_published !== false);
      setAllReviews(published);

      setTimeout(() => {
        setShowForm(false);
        setSubmitSuccess("");
      }, 2500);
    } catch (err) {
      console.error("Submit review error:", err);
      setSubmitError("Failed to submit review: " + (err.message || "Unknown error"));
    } finally {
      setSubmitting(false);
    }
  };

  // Filter reviews
  const filteredReviews = allReviews.filter(rev => {
    if (filterRating !== "ALL" && Number(rev.rating) !== Number(filterRating)) return false;
    if (filterHasPhotos && (!Array.isArray(rev.photos) || rev.photos.length === 0)) return false;
    return true;
  });

  const averageRating = allReviews.length > 0
    ? (allReviews.reduce((sum, r) => sum + (r.rating || 5), 0) / allReviews.length).toFixed(1)
    : "5.0";

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", color: "#fff", fontFamily: "'Barlow', sans-serif" }}>
      <Helmet><title>Customer Reviews & Photos | JERSEY VAULT</title><meta name="description" content="Read real customer reviews and photos of premium football jerseys from Jersey Vault." /><link rel="canonical" href="https://www.thejerseyvault.in/reviews" /></Helmet>

      <Navbar />

      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "30px 16px 60px" }}>
        
        {/* Header Hero Section */}
        <div style={{ textAlign: "center", marginBottom: "36px", borderBottom: "1px solid #1a1a1a", paddingBottom: "24px" }}>
          <div style={{ fontSize: "12px", color: "#39ff14", fontWeight: 800, letterSpacing: "3px", textTransform: "uppercase", marginBottom: "6px" }}>
            AUTHENTIC FEEDBACK
          </div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 900, letterSpacing: "2px", margin: "0 0 10px 0", color: "#fff" }}>
            CUSTOMER REVIEWS & PHOTOS
          </h1>
          <p style={{ color: "#aaa", fontSize: "14px", maxWidth: "600px", margin: "0 auto 16px" }}>
            See real photos and verified feedback from football fans and collectors across India who ordered from Jersey Vault.
          </p>

          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            <div style={{ background: "#111", border: "1px solid #222", borderRadius: "6px", padding: "10px 20px", display: "inline-flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "20px", color: "#ffb700" }}>★ {averageRating}</span>
              <span style={{ fontSize: "13px", color: "#bbb", fontWeight: 700 }}>
                Average Rating ({allReviews.length} Reviews)
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowForm(o => !o)}
              style={{
                background: showForm ? "rgba(255,68,68,0.15)" : "#39ff14",
                color: showForm ? "#ff4444" : "#000",
                border: showForm ? "1px solid #ff4444" : "none",
                padding: "12px 24px",
                borderRadius: "4px",
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 900,
                fontSize: "14px",
                letterSpacing: "2px",
                cursor: "pointer",
                boxShadow: showForm ? "none" : "0 0 20px rgba(57,255,20,0.4)"
              }}
            >
              {showForm ? "✕ CLOSE FORM" : "✍️ WRITE A REVIEW WITH PHOTOS"}
            </button>
          </div>
        </div>

        {/* REVIEW FORM POPUP / EXPANDABLE PANEL */}
        {showForm && (
          <div style={{ background: "#0c0c0c", border: "2px solid #39ff14", borderRadius: "8px", padding: "24px", marginBottom: "40px", boxShadow: "0 0 30px rgba(57,255,20,0.2)" }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "20px", fontWeight: 900, color: "#39ff14", letterSpacing: "2px", marginBottom: "16px" }}>
              POST YOUR CUSTOMER REVIEW
            </div>

            <form onSubmit={handleSubmitReview}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginBottom: "16px" }}>
                {/* Select Jersey */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, letterSpacing: "1px", color: "#aaa", marginBottom: "6px" }}>
                    SELECT JERSEY / PRODUCT:
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      background: "#141414",
                      border: "1px solid #333",
                      borderRadius: "4px",
                      padding: "10px 12px",
                      color: "#fff",
                      fontSize: "13px",
                      outline: "none"
                    }}
                  >
                    <option value="">-- Choose a Jersey --</option>
                    {jerseysList.map(j => (
                      <option key={j.id} value={j.id}>{j.name}</option>
                    ))}
                  </select>
                </div>

                {/* Reviewer Name */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, letterSpacing: "1px", color: "#aaa", marginBottom: "6px" }}>
                    YOUR NAME:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Vikram M."
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    style={{
                      width: "100%",
                      background: "#141414",
                      border: "1px solid #333",
                      borderRadius: "4px",
                      padding: "10px 12px",
                      color: "#fff",
                      fontSize: "13px",
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                </div>
              </div>

              {/* Star Rating Picker */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, letterSpacing: "1px", color: "#aaa", marginBottom: "6px" }}>
                  RATING:
                </label>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      style={{
                        background: "none",
                        border: "none",
                        color: star <= rating ? "#ffb700" : "#444",
                        fontSize: "26px",
                        cursor: "pointer",
                        padding: "0 2px"
                      }}
                    >
                      ★
                    </button>
                  ))}
                  <span style={{ fontSize: "13px", color: "#39ff14", fontWeight: 800, marginLeft: "8px" }}>
                    {rating} / 5 Stars
                  </span>
                </div>
              </div>

              {/* Review Comment */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, letterSpacing: "1px", color: "#aaa", marginBottom: "6px" }}>
                  YOUR REVIEW:
                </label>
                <textarea
                  rows={4}
                  placeholder="Share your honest experience regarding sizing, fabric quality, badges, delivery..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    background: "#141414",
                    border: "1px solid #333",
                    borderRadius: "4px",
                    padding: "10px 12px",
                    color: "#fff",
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              {/* Photos upload */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, letterSpacing: "1px", color: "#aaa", marginBottom: "6px" }}>
                  ATTACH PHOTOS:
                </label>
                <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                  <label style={{
                    background: "#1a1a1a",
                    border: "1px dashed #39ff14",
                    color: "#39ff14",
                    padding: "10px 18px",
                    borderRadius: "4px",
                    fontSize: "13px",
                    fontWeight: 800,
                    cursor: uploadingPhoto ? "wait" : "pointer"
                  }}>
                    <span>📷</span> {uploadingPhoto ? "UPLOADING PHOTO..." : "CHOOSE PHOTOS"}
                    <input type="file" accept="image/*" multiple onChange={handleUploadPhoto} disabled={uploadingPhoto} style={{ display: "none" }} />
                  </label>
                </div>

                {photos.length > 0 && (
                  <div style={{ display: "flex", gap: "10px", marginTop: "12px", flexWrap: "wrap" }}>
                    {photos.map((p, idx) => (
                      <div key={idx} style={{ position: "relative" }}>
                        <img src={p} alt="Attached preview" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: "4px", border: "1px solid #39ff14" }} />
                        <button
                          type="button"
                          onClick={() => setPhotos(prev => prev.filter((_, i) => i !== idx))}
                          style={{ position: "absolute", top: -6, right: -6, background: "#ff4444", color: "#fff", border: "none", width: 18, height: 18, borderRadius: "50%", cursor: "pointer", fontSize: "10px", fontWeight: 900 }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {submitError && <div style={{ color: "#ff4444", fontSize: "13px", marginBottom: "12px", fontWeight: 700 }}>⚠️ {submitError}</div>}
              {submitSuccess && <div style={{ color: "#39ff14", fontSize: "13px", marginBottom: "12px", fontWeight: 800 }}>{submitSuccess}</div>}

              <button
                type="submit"
                disabled={submitting || uploadingPhoto}
                style={{
                  background: "#39ff14",
                  color: "#000",
                  border: "none",
                  padding: "12px 28px",
                  borderRadius: "4px",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 900,
                  fontSize: "15px",
                  letterSpacing: "2px",
                  cursor: (submitting || uploadingPhoto) ? "wait" : "pointer"
                }}
              >
                {submitting ? "POSTING..." : "SUBMIT REVIEW →"}
              </button>
            </form>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "24px", background: "#0c0c0c", padding: "12px 16px", borderRadius: "6px", border: "1px solid #1a1a1a" }}>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "#777", fontWeight: 700, letterSpacing: "1px" }}>FILTER:</span>
            {["ALL", "5", "4", "3"].map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setFilterRating(r)}
                style={{
                  background: filterRating === r ? "#39ff14" : "#161616",
                  color: filterRating === r ? "#000" : "#bbb",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                {r === "ALL" ? "ALL RATINGS" : `★ ${r} STARS`}
              </button>
            ))}
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#bbb", cursor: "pointer", fontWeight: 700 }}>
            <input
              type="checkbox"
              checked={filterHasPhotos}
              onChange={(e) => setFilterHasPhotos(e.target.checked)}
              style={{ accentColor: "#39ff14" }}
            />
            📷 WITH PHOTOS ONLY
          </label>
        </div>

        {/* Reviews Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#777", fontSize: "14px" }}>
            Loading customer reviews...
          </div>
        ) : filteredReviews.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 20px", background: "#0c0c0c", border: "1px dashed #222", borderRadius: "6px" }}>
            <div style={{ fontSize: "36px", marginBottom: "10px" }}>💬</div>
            <div style={{ color: "#aaa", fontSize: "15px", fontWeight: 700 }}>No reviews match your filter</div>
            <div style={{ color: "#555", fontSize: "12px", marginTop: "4px" }}>Be the first customer to post a review!</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
            {filteredReviews.map((rev) => {
              const jerseyInfo = jerseysList.find(j => String(j.id) === String(rev.product_id));
              return (
                <div
                  key={rev.id}
                  style={{
                    background: "#0c0c0c",
                    border: "1px solid #1c1c1c",
                    borderRadius: "6px",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    position: "relative"
                  }}
                >
                  <div>
                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontWeight: 800, fontSize: "15px", color: "#fff" }}>
                          {rev.reviewer_name || "Customer"}
                        </span>
                        <span style={{
                          background: "rgba(57, 255, 20, 0.12)",
                          border: "1px solid rgba(57, 255, 20, 0.25)",
                          color: "#39ff14",
                          fontSize: "10px",
                          fontWeight: 800,
                          padding: "2px 6px",
                          borderRadius: "4px"
                        }}>
                          ✓ VERIFIED BUYER
                        </span>
                      </div>
                      <span style={{ color: "#ffb700", fontSize: "12px", letterSpacing: "1px" }}>
                        {"★".repeat(rev.rating || 5)}{"☆".repeat(5 - (rev.rating || 5))}
                      </span>
                    </div>

                    {/* Jersey Name tag if available */}
                    {jerseyInfo && (
                      <Link
                        to={`/?id=${jerseyInfo.id}`}
                        style={{
                          fontSize: "11px",
                          color: "#39ff14",
                          fontWeight: 800,
                          letterSpacing: "1px",
                          textDecoration: "none",
                          display: "inline-block",
                          marginBottom: "8px"
                        }}
                      >
                        👕 {jerseyInfo.name.toUpperCase()} →
                      </Link>
                    )}

                    {/* Comment */}
                    <p style={{ color: "#ccc", fontSize: "13px", lineHeight: "1.5", margin: "4px 0 12px 0", wordBreak: "break-word" }}>
                      {rev.comment}
                    </p>

                    {/* Photos */}
                    {Array.isArray(rev.photos) && rev.photos.length > 0 && (
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
                        {rev.photos.map((photo, pIdx) => (
                          <img
                            key={pIdx}
                            src={photo}
                            alt="Review Attachment"
                            onClick={() => setPreviewPhoto(photo)}
                            style={{
                              width: 68,
                              height: 68,
                              objectFit: "cover",
                              borderRadius: "4px",
                              border: "1px solid #2a2a2a",
                              cursor: "pointer",
                              transition: "transform 0.2s"
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                            onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Date Footer */}
                  <div style={{ borderTop: "1px solid #161616", paddingTop: "8px", marginTop: "8px", display: "flex", justifyContent: "flex-end" }}>
                    <span style={{ color: "#555", fontSize: "11px", letterSpacing: "1px" }}>
                      {rev.created_at ? new Date(rev.created_at).toLocaleDateString() : "7/26/2026"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* Lightbox Modal */}
      {previewPhoto && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.9)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}>
            <button
              type="button"
              onClick={() => setPreviewPhoto(null)}
              style={{ position: "absolute", top: -14, right: -14, background: "#39ff14", color: "#000", border: "none", width: 32, height: 32, borderRadius: "50%", fontWeight: 900, cursor: "pointer" }}
            >
              ✕
            </button>
            <img src={previewPhoto} alt="Customer review attachment" style={{ maxWidth: "100%", maxHeight: "85vh", borderRadius: "6px", border: "2px solid #39ff14" }} />
          </div>
        </div>
      )}
    </div>
  );
}
