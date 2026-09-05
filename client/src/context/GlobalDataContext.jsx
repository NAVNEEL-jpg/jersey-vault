import React, { createContext, useContext, useState, useEffect } from "react";
import { express } from "../express";
import { generateProductSlug } from "../utils/product-slugs";
import initialTeams from "../data/teams.json";

const GlobalDataContext = createContext();

export function GlobalDataProvider({ children }) {
  const [teams, setTeams] = useState(initialTeams || []);
  const [featuredCategoryName, setFeaturedCategoryName] = useState("WC 26");
  const [productSlugMap, setProductSlugMap] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchGlobalData() {
      try {
        const [siteSettingsRes, teamsRes, productsRes] = await Promise.all([
          express.from("site_settings").select("value").eq("key", "featured_category_name").single(),
          express.from("teams").select("id, name, logo_url, sport").order("name", { ascending: true }),
          express.from("products").select("id, name").eq("status", "active"),
        ]);

        if (isMounted) {
          if (siteSettingsRes.data?.value) setFeaturedCategoryName(siteSettingsRes.data.value);
          if (teamsRes.data && teamsRes.data.length > 0) setTeams(teamsRes.data);
          if (productsRes.data && productsRes.data.length > 0) {
            const map = productsRes.data.map(p => ({
              id: p.id,
              slug: generateProductSlug(p.name)
            }));
            setProductSlugMap(map);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error("[GlobalDataContext] Error loading global data:", err);
        if (isMounted) setLoading(false);
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
