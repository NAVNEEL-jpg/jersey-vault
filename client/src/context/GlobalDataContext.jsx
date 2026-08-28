import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../supabase";
import { generateProductSlug } from "../utils/product-slugs";
import { API_BASE } from "../config/api";

const GlobalDataContext = createContext();

export function GlobalDataProvider({ children }) {
  const [teams, setTeams] = useState([]);
  const [featuredCategoryName, setFeaturedCategoryName] = useState("FEATURED");
  const [productSlugMap, setProductSlugMap] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchGlobalData() {
      let loadedTeams = null;
      let loadedCatName = null;
      let loadedProducts = null;

      // 1. Try Supabase
      try {
        const [siteSettingsRes, teamsRes, productsRes] = await Promise.all([
          supabase.from("site_settings").select("value").eq("key", "featured_category_name").single(),
          supabase.from("teams").select("id, name, logo_url, sport").order("name", { ascending: true }),
          supabase.from("products").select("id, name").eq("status", "active"),
        ]);

        if (siteSettingsRes.data?.value) {
          loadedCatName = siteSettingsRes.data.value;
        }
        if (teamsRes.data && teamsRes.data.length > 0) {
          loadedTeams = teamsRes.data;
        }
        if (productsRes.data && productsRes.data.length > 0) {
          loadedProducts = productsRes.data;
        }
      } catch (err) {
        console.warn("[GlobalDataContext] Supabase fetch failed, falling back to backend API:", err.message);
      }

      // 2. If any core data is missing, fetch from backend catalog fallback
      if (!loadedTeams || !loadedProducts) {
        try {
          const res = await fetch(`${API_BASE}/api/catalog/all`);
          if (res.ok) {
            const catalog = await res.json();
            if (catalog.success) {
              if (!loadedTeams && catalog.teams) loadedTeams = catalog.teams;
              if (!loadedProducts && catalog.products) loadedProducts = catalog.products;
              if (!loadedCatName && catalog.siteSettings) {
                const featSetting = catalog.siteSettings.find(s => s.key === "featured_category_name");
                if (featSetting?.value) loadedCatName = featSetting.value;
              }
            }
          }
        } catch (apiErr) {
          console.error("[GlobalDataContext] Backend catalog fallback failed:", apiErr.message);
        }
      }

      if (isMounted) {
        if (loadedCatName) setFeaturedCategoryName(loadedCatName);
        if (loadedTeams) setTeams(loadedTeams);
        if (loadedProducts) {
          const map = loadedProducts.map(p => ({
            id: p.id,
            slug: generateProductSlug(p.name)
          }));
          setProductSlugMap(map);
        }
        setLoading(false);
      }
    }

    fetchGlobalData();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <GlobalDataContext.Provider value={{ teams, featuredCategoryName, productSlugMap, loading }}>
      {children}
    </GlobalDataContext.Provider>
  );
}

export function useGlobalData() {
  return useContext(GlobalDataContext);
}
