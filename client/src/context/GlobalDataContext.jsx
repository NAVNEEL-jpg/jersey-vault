import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../supabase";
import { generateProductSlug } from "../utils/product-slugs";

const GlobalDataContext = createContext();

export function GlobalDataProvider({ children }) {
  const [teams, setTeams] = useState([]);
  const [featuredCategoryName, setFeaturedCategoryName] = useState("FEATURED");
  const [productSlugMap, setProductSlugMap] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchGlobalData() {
      try {
        const { data: siteSettingsData } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "featured_category_name")
          .single();

        if (siteSettingsData?.value && isMounted) {
          setFeaturedCategoryName(siteSettingsData.value);
        }

        const { data: teamsData } = await supabase
          .from("teams")
          .select("id, name, logo_url, sport")
          .order("name", { ascending: true });

        if (teamsData && isMounted) {
          setTeams(teamsData);
        }

        const { data: productsData } = await supabase
          .from("products")
          .select("id, name")
          .eq("status", "active");

        if (productsData && isMounted) {
          const map = productsData.map(p => ({
            id: p.id,
            slug: generateProductSlug(p.name)
          }));
          setProductSlugMap(map);
        }
      } catch (err) {
        console.error("Failed to fetch global data:", err);
      } finally {
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

