import React, { lazy, Suspense } from "react";
import { useAdminOrderNotifications } from "./hooks/useAdminOrderNotifications";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import ReactGA from "react-ga4";
import clarity from "@microsoft/clarity";
import Success from "./pages/Success";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Tracking from "./pages/Tracking";
import MyOrders from "./pages/MyOrders";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import Teams from "./pages/Teams";
import Reviews from "./pages/Reviews";
import SupportChat from "./components/SupportChat";
import Collection from "./pages/Collection";
import ProductPage from "./pages/ProductPage";
import { GlobalDataProvider } from "./context/GlobalDataContext";

const SizeGuide = lazy(() => import("./pages/guides/SizeGuide"));
const PlayerVsFan = lazy(() => import("./pages/guides/PlayerVsFan"));
const BuyingGuide = lazy(() => import("./pages/guides/BuyingGuide"));
const CareGuide = lazy(() => import("./pages/guides/CareGuide"));
const MaterialsGuide = lazy(() => import("./pages/guides/MaterialsGuide"));
const RetroGuide = lazy(() => import("./pages/guides/RetroGuide"));
const PatchGuide = lazy(() => import("./pages/guides/PatchGuide"));
const PrintingGuide = lazy(() => import("./pages/guides/PrintingGuide"));
const ShippingGuide = lazy(() => import("./pages/guides/ShippingGuide"));
const ReturnsGuide = lazy(() => import("./pages/guides/ReturnsGuide"));
const BarcelonaClubHistory = lazy(() => import("./pages/guides/BarcelonaClubHistory"));
const RealMadridClubHistory = lazy(() => import("./pages/guides/RealMadridClubHistory"));
const ManchesterUnitedClubHistory = lazy(() => import("./pages/guides/ManchesterUnitedClubHistory"));
const ManchesterCityClubHistory = lazy(() => import("./pages/guides/ManchesterCityClubHistory"));
const ArsenalClubHistory = lazy(() => import("./pages/guides/ArsenalClubHistory"));
const ChelseaClubHistory = lazy(() => import("./pages/guides/ChelseaClubHistory"));
const LiverpoolClubHistory = lazy(() => import("./pages/guides/LiverpoolClubHistory"));
const TottenhamClubHistory = lazy(() => import("./pages/guides/TottenhamClubHistory"));
const PSGClubHistory = lazy(() => import("./pages/guides/PSGClubHistory"));
const JuventusClubHistory = lazy(() => import("./pages/guides/JuventusClubHistory"));
const ACMilanClubHistory = lazy(() => import("./pages/guides/ACMilanClubHistory"));
const InterMilanClubHistory = lazy(() => import("./pages/guides/InterMilanClubHistory"));
const BayernMunichClubHistory = lazy(() => import("./pages/guides/BayernMunichClubHistory"));
const MessiCareerJerseys = lazy(() => import("./pages/guides/MessiCareerJerseys"));
const CristianoRonaldoCareerJerseys = lazy(() => import("./pages/guides/CristianoRonaldoCareerJerseys"));
const MbappeKitEvolution = lazy(() => import("./pages/guides/MbappeKitEvolution"));
const BellinghamFirstSeason = lazy(() => import("./pages/guides/BellinghamFirstSeason"));
const NeymarClassicKits = lazy(() => import("./pages/guides/NeymarClassicKits"));
const RonaldinhoIconicJerseys = lazy(() => import("./pages/guides/RonaldinhoIconicJerseys"));
const ZidaneBestKits = lazy(() => import("./pages/guides/ZidaneBestKits"));
const MaradonaNapoliJerseys = lazy(() => import("./pages/guides/MaradonaNapoliJerseys"));
const PeleBrazilKits = lazy(() => import("./pages/guides/PeleBrazilKits"));
const BeckhamUnitedtoMadrid = lazy(() => import("./pages/guides/BeckhamUnitedtoMadrid"));
const RooneyManchesterUnitedEras = lazy(() => import("./pages/guides/RooneyManchesterUnitedEras"));
const HenryArsenalInvincibles = lazy(() => import("./pages/guides/HenryArsenalInvincibles"));
const WorldCup1994Kits = lazy(() => import("./pages/guides/WorldCup1994Kits"));
const WorldCup1998Kits = lazy(() => import("./pages/guides/WorldCup1998Kits"));
const WorldCup2002Kits = lazy(() => import("./pages/guides/WorldCup2002Kits"));
const WorldCup2006Kits = lazy(() => import("./pages/guides/WorldCup2006Kits"));
const WorldCup2010Kits = lazy(() => import("./pages/guides/WorldCup2010Kits"));
const WorldCup2014Kits = lazy(() => import("./pages/guides/WorldCup2014Kits"));
const WorldCup2018Kits = lazy(() => import("./pages/guides/WorldCup2018Kits"));
const WorldCup2022Kits = lazy(() => import("./pages/guides/WorldCup2022Kits"));
const ChampionsLeague1999 = lazy(() => import("./pages/guides/ChampionsLeague1999"));
const ChampionsLeague2005Istanbul = lazy(() => import("./pages/guides/ChampionsLeague2005Istanbul"));
const ChampionsLeague2008 = lazy(() => import("./pages/guides/ChampionsLeague2008"));
const ChampionsLeague2012 = lazy(() => import("./pages/guides/ChampionsLeague2012"));
const ChampionsLeague2014LaDecima = lazy(() => import("./pages/guides/ChampionsLeague2014LaDecima"));
const ChampionsLeague2022 = lazy(() => import("./pages/guides/ChampionsLeague2022"));
const HowtoauthenticateaNikejersey = lazy(() => import("./pages/guides/HowtoauthenticateaNikejersey"));
const HowtoauthenticateanAdidasjersey = lazy(() => import("./pages/guides/HowtoauthenticateanAdidasjersey"));
const HowtoauthenticateaPumajersey = lazy(() => import("./pages/guides/HowtoauthenticateaPumajersey"));
const UnderstandingNikeDriFITADV = lazy(() => import("./pages/guides/UnderstandingNikeDriFITADV"));
const UnderstandingAdidasHeatRDY = lazy(() => import("./pages/guides/UnderstandingAdidasHeatRDY"));
const UnderstandingPumaUltraweave = lazy(() => import("./pages/guides/UnderstandingPumaUltraweave"));
const Theevolutionoffootballshirtsponsors = lazy(() => import("./pages/guides/Theevolutionoffootballshirtsponsors"));
const Historyofnumberedfootballshirts = lazy(() => import("./pages/guides/Historyofnumberedfootballshirts"));
const Whyfootballshirtshavestars = lazy(() => import("./pages/guides/Whyfootballshirtshavestars"));
const Footballshirttypographyguide = lazy(() => import("./pages/guides/Footballshirttypographyguide"));
const Howtostoreyourfootballshirts = lazy(() => import("./pages/guides/Howtostoreyourfootballshirts"));
const Removingstainsfromfootballshirts = lazy(() => import("./pages/guides/Removingstainsfromfootballshirts"));
const Howtoframeafootballshirt = lazy(() => import("./pages/guides/Howtoframeafootballshirt"));
const Theriseoffootballshirtsinstreetwear = lazy(() => import("./pages/guides/Theriseoffootballshirtsinstreetwear"));
const Blokecorefashionguide = lazy(() => import("./pages/guides/Blokecorefashionguide"));
const Top10PremierLeaguekitsofalltime = lazy(() => import("./pages/guides/Top10PremierLeaguekitsofalltime"));
const Top10LaLigakitsofalltime = lazy(() => import("./pages/guides/Top10LaLigakitsofalltime"));
const Top10SerieAkitsofalltime = lazy(() => import("./pages/guides/Top10SerieAkitsofalltime"));
const Top10Internationalkitsofalltime = lazy(() => import("./pages/guides/Top10Internationalkitsofalltime"));
const Themostcontroversialfootballkits = lazy(() => import("./pages/guides/Themostcontroversialfootballkits"));
const Bannedfootballkits = lazy(() => import("./pages/guides/Bannedfootballkits"));
const Footballkitsthatchangedtherules = lazy(() => import("./pages/guides/Footballkitsthatchangedtherules"));
const Whydosomekitshavelongsleeves = lazy(() => import("./pages/guides/Whydosomekitshavelongsleeves"));
const Thereturnofthecollarinfootballkits = lazy(() => import("./pages/guides/Thereturnofthecollarinfootballkits"));
const Goalkeeperkitevolution = lazy(() => import("./pages/guides/Goalkeeperkitevolution"));
const Whydogoalkeepersweardifferentcolors = lazy(() => import("./pages/guides/Whydogoalkeepersweardifferentcolors"));
const Thebestgoalkeeperkitsofthe90s = lazy(() => import("./pages/guides/Thebestgoalkeeperkitsofthe90s"));
const JorgeCamposiconickits = lazy(() => import("./pages/guides/JorgeCamposiconickits"));
const PeterSchmeicheliconickits = lazy(() => import("./pages/guides/PeterSchmeicheliconickits"));
const GianluigiBuffoniconickits = lazy(() => import("./pages/guides/GianluigiBuffoniconickits"));
const ThehistoryoftheBrazilyellowshirt = lazy(() => import("./pages/guides/ThehistoryoftheBrazilyellowshirt"));
const ThehistoryoftheArgentinastripes = lazy(() => import("./pages/guides/ThehistoryoftheArgentinastripes"));
const ThehistoryoftheFranceblueshirt = lazy(() => import("./pages/guides/ThehistoryoftheFranceblueshirt"));
const ThehistoryoftheEnglandwhiteshirt = lazy(() => import("./pages/guides/ThehistoryoftheEnglandwhiteshirt"));
const ThehistoryoftheItalyblueshirt = lazy(() => import("./pages/guides/ThehistoryoftheItalyblueshirt"));
const ThehistoryoftheNetherlandsorangeshirt = lazy(() => import("./pages/guides/ThehistoryoftheNetherlandsorangeshirt"));
const WhydoesGermanywearwhite = lazy(() => import("./pages/guides/WhydoesGermanywearwhite"));
const WhydoesItalywearblue = lazy(() => import("./pages/guides/WhydoesItalywearblue"));
const WhydoesNetherlandswearorange = lazy(() => import("./pages/guides/WhydoesNetherlandswearorange"));
const Theworstfootballkitsinhistory = lazy(() => import("./pages/guides/Theworstfootballkitsinhistory"));
const Footballkitsruinedbysponsors = lazy(() => import("./pages/guides/Footballkitsruinedbysponsors"));
const Thebestsponsorlessfootballkits = lazy(() => import("./pages/guides/Thebestsponsorlessfootballkits"));
const Centenaryfootballkits = lazy(() => import("./pages/guides/Centenaryfootballkits"));
const Anniversaryfootballkits = lazy(() => import("./pages/guides/Anniversaryfootballkits"));
const Specialeditionfootballkits = lazy(() => import("./pages/guides/Specialeditionfootballkits"));
const Blackoutfootballkits = lazy(() => import("./pages/guides/Blackoutfootballkits"));
const Whiteoutfootballkits = lazy(() => import("./pages/guides/Whiteoutfootballkits"));
const Neonfootballkits = lazy(() => import("./pages/guides/Neonfootballkits"));
const Theimpactoffastfashiononfootballkits = lazy(() => import("./pages/guides/Theimpactoffastfashiononfootballkits"));
const Sustainablefootballkits = lazy(() => import("./pages/guides/Sustainablefootballkits"));
const Recycledoceanplasticfootballkits = lazy(() => import("./pages/guides/Recycledoceanplasticfootballkits"));
const Howfootballkitsaremanufactured = lazy(() => import("./pages/guides/Howfootballkitsaremanufactured"));
const Theeconomicsoffootballkitdeals = lazy(() => import("./pages/guides/Theeconomicsoffootballkitdeals"));
const Thebiggestkitsupplierdealsinhistory = lazy(() => import("./pages/guides/Thebiggestkitsupplierdealsinhistory"));
const NikevsAdidasfootballrivalry = lazy(() => import("./pages/guides/NikevsAdidasfootballrivalry"));
const Pumasriseinfootball = lazy(() => import("./pages/guides/Pumasriseinfootball"));
const Castoresentryintofootball = lazy(() => import("./pages/guides/Castoresentryintofootball"));
const Umbroslegacyinfootball = lazy(() => import("./pages/guides/Umbroslegacyinfootball"));
const Kappasiconic90sdesigns = lazy(() => import("./pages/guides/Kappasiconic90sdesigns"));
const Macronsdominanceinlowerleagues = lazy(() => import("./pages/guides/Macronsdominanceinlowerleagues"));
const Hummelsuniquechevrondesigns = lazy(() => import("./pages/guides/Hummelsuniquechevrondesigns"));


// Browser guard for strict webviews (e.g., Instagram/Facebook in-app browsers)
if (typeof window !== "undefined") {
  if (!window.webkit) window.webkit = {};
  if (!window.webkit.messageHandlers) window.webkit.messageHandlers = {};
}

const Checkout = lazy(() => import("./pages/Checkout"));
const Admin = lazy(() => import("./pages/AdminPage"));

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    if (error.name === 'ChunkLoadError' || String(error).includes('Loading chunk')) {
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      return <div className="text-white p-5">An error occurred while loading this page. Please refresh.</div>;
    }
    return this.props.children; 
  }
}

// Initialize GA4 with your unique Measurement ID and debug mode for development
ReactGA.initialize([
  {
    trackingId: "G-0600VGPLMN",
    gtagOptions: {
      debug_mode: process.env.NODE_ENV === "development"
    }
  }
]);

// Initialize Microsoft Clarity securely
if (!window.clarityInitialized) {
  try {
    clarity.init("x5jhqrw2dq");
    window.clarityInitialized = true;
  } catch (e) {
    console.error("Clarity init failed", e);
  }
}

// Better approach: wrap the app content in a component that uses useLocation

function AppContent() {
  const location = useLocation();

  // Global admin order notification listener
  useAdminOrderNotifications();

  React.useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: location.pathname + location.search });
  }, [location]);

  return (
    <>
      <a
        href="#main-content"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          borderWidth: '0'
        }}
        onFocus={(e) => {
          e.target.style.position = 'static';
          e.target.style.width = 'auto';
          e.target.style.height = 'auto';
          e.target.style.clip = 'auto';
          e.target.style.padding = '10px';
          e.target.style.background = '#000';
          e.target.style.color = '#fff';
          e.target.style.zIndex = '9999';
        }}
        onBlur={(e) => {
          e.target.style.position = 'absolute';
          e.target.style.width = '1px';
          e.target.style.height = '1px';
          e.target.style.clip = 'rect(0, 0, 0, 0)';
          e.target.style.padding = '0';
        }}
      >
        Skip to content
      </a>
      <ErrorBoundary>
        <Suspense fallback={<div className="text-white p-5">Loading...</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/tracking" element={<Tracking />} />
            <Route path="/success" element={<Success />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/myorders" element={<MyOrders />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/collections/:slug" element={<Collection />} />
            <Route path="/product/:slug" element={<ProductPage />} />
            <Route path="/reviews" element={<Reviews />} />
            
            <Route path="/pages/size-guide" element={<SizeGuide />} />
            <Route path="/pages/player-version-vs-fan-version" element={<PlayerVsFan />} />
            <Route path="/pages/buying-guide" element={<BuyingGuide />} />
            <Route path="/pages/care-guide" element={<CareGuide />} />
            <Route path="/pages/materials-guide" element={<MaterialsGuide />} />
            <Route path="/pages/retro-guide" element={<RetroGuide />} />
            <Route path="/pages/patch-guide" element={<PatchGuide />} />
            <Route path="/pages/printing-guide" element={<PrintingGuide />} />
            <Route path="/pages/shipping-guide" element={<ShippingGuide />} />
            <Route path="/pages/returns-guide" element={<ReturnsGuide />} />
            <Route path="/pages/barcelona-club-history" element={<BarcelonaClubHistory />} />
            <Route path="/pages/real-madrid-club-history" element={<RealMadridClubHistory />} />
            <Route path="/pages/manchester-united-club-history" element={<ManchesterUnitedClubHistory />} />
            <Route path="/pages/manchester-city-club-history" element={<ManchesterCityClubHistory />} />
            <Route path="/pages/arsenal-club-history" element={<ArsenalClubHistory />} />
            <Route path="/pages/chelsea-club-history" element={<ChelseaClubHistory />} />
            <Route path="/pages/liverpool-club-history" element={<LiverpoolClubHistory />} />
            <Route path="/pages/tottenham-club-history" element={<TottenhamClubHistory />} />
            <Route path="/pages/psg-club-history" element={<PSGClubHistory />} />
            <Route path="/pages/juventus-club-history" element={<JuventusClubHistory />} />
            <Route path="/pages/ac-milan-club-history" element={<ACMilanClubHistory />} />
            <Route path="/pages/inter-milan-club-history" element={<InterMilanClubHistory />} />
            <Route path="/pages/bayern-munich-club-history" element={<BayernMunichClubHistory />} />
            <Route path="/pages/messi-career-jerseys" element={<MessiCareerJerseys />} />
            <Route path="/pages/cristiano-ronaldo-career-jerseys" element={<CristianoRonaldoCareerJerseys />} />
            <Route path="/pages/mbappe-kit-evolution" element={<MbappeKitEvolution />} />
            <Route path="/pages/bellingham-first-season" element={<BellinghamFirstSeason />} />
            <Route path="/pages/neymar-classic-kits" element={<NeymarClassicKits />} />
            <Route path="/pages/ronaldinho-iconic-jerseys" element={<RonaldinhoIconicJerseys />} />
            <Route path="/pages/zidane-best-kits" element={<ZidaneBestKits />} />
            <Route path="/pages/maradona-napoli-jerseys" element={<MaradonaNapoliJerseys />} />
            <Route path="/pages/pele-brazil-kits" element={<PeleBrazilKits />} />
            <Route path="/pages/beckham-united-to-madrid" element={<BeckhamUnitedtoMadrid />} />
            <Route path="/pages/rooney-manchester-united-eras" element={<RooneyManchesterUnitedEras />} />
            <Route path="/pages/henry-arsenal-invincibles" element={<HenryArsenalInvincibles />} />
            <Route path="/pages/world-cup-1994-kits" element={<WorldCup1994Kits />} />
            <Route path="/pages/world-cup-1998-kits" element={<WorldCup1998Kits />} />
            <Route path="/pages/world-cup-2002-kits" element={<WorldCup2002Kits />} />
            <Route path="/pages/world-cup-2006-kits" element={<WorldCup2006Kits />} />
            <Route path="/pages/world-cup-2010-kits" element={<WorldCup2010Kits />} />
            <Route path="/pages/world-cup-2014-kits" element={<WorldCup2014Kits />} />
            <Route path="/pages/world-cup-2018-kits" element={<WorldCup2018Kits />} />
            <Route path="/pages/world-cup-2022-kits" element={<WorldCup2022Kits />} />
            <Route path="/pages/champions-league-1999" element={<ChampionsLeague1999 />} />
            <Route path="/pages/champions-league-2005-istanbul" element={<ChampionsLeague2005Istanbul />} />
            <Route path="/pages/champions-league-2008" element={<ChampionsLeague2008 />} />
            <Route path="/pages/champions-league-2012" element={<ChampionsLeague2012 />} />
            <Route path="/pages/champions-league-2014-la-decima" element={<ChampionsLeague2014LaDecima />} />
            <Route path="/pages/champions-league-2022" element={<ChampionsLeague2022 />} />
            <Route path="/pages/how-to-authenticate-a-nike-jersey" element={<HowtoauthenticateaNikejersey />} />
            <Route path="/pages/how-to-authenticate-an-adidas-jersey" element={<HowtoauthenticateanAdidasjersey />} />
            <Route path="/pages/how-to-authenticate-a-puma-jersey" element={<HowtoauthenticateaPumajersey />} />
            <Route path="/pages/understanding-nike-dri-fit-adv" element={<UnderstandingNikeDriFITADV />} />
            <Route path="/pages/understanding-adidas-heat-rdy" element={<UnderstandingAdidasHeatRDY />} />
            <Route path="/pages/understanding-puma-ultraweave" element={<UnderstandingPumaUltraweave />} />
            <Route path="/pages/the-evolution-of-football-shirt-sponsors" element={<Theevolutionoffootballshirtsponsors />} />
            <Route path="/pages/history-of-numbered-football-shirts" element={<Historyofnumberedfootballshirts />} />
            <Route path="/pages/why-football-shirts-have-stars" element={<Whyfootballshirtshavestars />} />
            <Route path="/pages/football-shirt-typography-guide" element={<Footballshirttypographyguide />} />
            <Route path="/pages/how-to-store-your-football-shirts" element={<Howtostoreyourfootballshirts />} />
            <Route path="/pages/removing-stains-from-football-shirts" element={<Removingstainsfromfootballshirts />} />
            <Route path="/pages/how-to-frame-a-football-shirt" element={<Howtoframeafootballshirt />} />
            <Route path="/pages/the-rise-of-football-shirts-in-streetwear" element={<Theriseoffootballshirtsinstreetwear />} />
            <Route path="/pages/blokecore-fashion-guide" element={<Blokecorefashionguide />} />
            <Route path="/pages/top-10-premier-league-kits-of-all-time" element={<Top10PremierLeaguekitsofalltime />} />
            <Route path="/pages/top-10-la-liga-kits-of-all-time" element={<Top10LaLigakitsofalltime />} />
            <Route path="/pages/top-10-serie-a-kits-of-all-time" element={<Top10SerieAkitsofalltime />} />
            <Route path="/pages/top-10-international-kits-of-all-time" element={<Top10Internationalkitsofalltime />} />
            <Route path="/pages/the-most-controversial-football-kits" element={<Themostcontroversialfootballkits />} />
            <Route path="/pages/banned-football-kits" element={<Bannedfootballkits />} />
            <Route path="/pages/football-kits-that-changed-the-rules" element={<Footballkitsthatchangedtherules />} />
            <Route path="/pages/why-do-some-kits-have-long-sleeves" element={<Whydosomekitshavelongsleeves />} />
            <Route path="/pages/the-return-of-the-collar-in-football-kits" element={<Thereturnofthecollarinfootballkits />} />
            <Route path="/pages/goalkeeper-kit-evolution" element={<Goalkeeperkitevolution />} />
            <Route path="/pages/why-do-goalkeepers-wear-different-colors" element={<Whydogoalkeepersweardifferentcolors />} />
            <Route path="/pages/the-best-goalkeeper-kits-of-the-90s" element={<Thebestgoalkeeperkitsofthe90s />} />
            <Route path="/pages/jorge-campos-iconic-kits" element={<JorgeCamposiconickits />} />
            <Route path="/pages/peter-schmeichel-iconic-kits" element={<PeterSchmeicheliconickits />} />
            <Route path="/pages/gianluigi-buffon-iconic-kits" element={<GianluigiBuffoniconickits />} />
            <Route path="/pages/the-history-of-the-brazil-yellow-shirt" element={<ThehistoryoftheBrazilyellowshirt />} />
            <Route path="/pages/the-history-of-the-argentina-stripes" element={<ThehistoryoftheArgentinastripes />} />
            <Route path="/pages/the-history-of-the-france-blue-shirt" element={<ThehistoryoftheFranceblueshirt />} />
            <Route path="/pages/the-history-of-the-england-white-shirt" element={<ThehistoryoftheEnglandwhiteshirt />} />
            <Route path="/pages/the-history-of-the-italy-blue-shirt" element={<ThehistoryoftheItalyblueshirt />} />
            <Route path="/pages/the-history-of-the-netherlands-orange-shirt" element={<ThehistoryoftheNetherlandsorangeshirt />} />
            <Route path="/pages/why-does-germany-wear-white" element={<WhydoesGermanywearwhite />} />
            <Route path="/pages/why-does-italy-wear-blue" element={<WhydoesItalywearblue />} />
            <Route path="/pages/why-does-netherlands-wear-orange" element={<WhydoesNetherlandswearorange />} />
            <Route path="/pages/the-worst-football-kits-in-history" element={<Theworstfootballkitsinhistory />} />
            <Route path="/pages/football-kits-ruined-by-sponsors" element={<Footballkitsruinedbysponsors />} />
            <Route path="/pages/the-best-sponsorless-football-kits" element={<Thebestsponsorlessfootballkits />} />
            <Route path="/pages/centenary-football-kits" element={<Centenaryfootballkits />} />
            <Route path="/pages/anniversary-football-kits" element={<Anniversaryfootballkits />} />
            <Route path="/pages/special-edition-football-kits" element={<Specialeditionfootballkits />} />
            <Route path="/pages/blackout-football-kits" element={<Blackoutfootballkits />} />
            <Route path="/pages/whiteout-football-kits" element={<Whiteoutfootballkits />} />
            <Route path="/pages/neon-football-kits" element={<Neonfootballkits />} />
            <Route path="/pages/the-impact-of-fast-fashion-on-football-kits" element={<Theimpactoffastfashiononfootballkits />} />
            <Route path="/pages/sustainable-football-kits" element={<Sustainablefootballkits />} />
            <Route path="/pages/recycled-ocean-plastic-football-kits" element={<Recycledoceanplasticfootballkits />} />
            <Route path="/pages/how-football-kits-are-manufactured" element={<Howfootballkitsaremanufactured />} />
            <Route path="/pages/the-economics-of-football-kit-deals" element={<Theeconomicsoffootballkitdeals />} />
            <Route path="/pages/the-biggest-kit-supplier-deals-in-history" element={<Thebiggestkitsupplierdealsinhistory />} />
            <Route path="/pages/nike-vs-adidas-football-rivalry" element={<NikevsAdidasfootballrivalry />} />
            <Route path="/pages/puma-s-rise-in-football" element={<Pumasriseinfootball />} />
            <Route path="/pages/castore-s-entry-into-football" element={<Castoresentryintofootball />} />
            <Route path="/pages/umbro-s-legacy-in-football" element={<Umbroslegacyinfootball />} />
            <Route path="/pages/kappa-s-iconic-90s-designs" element={<Kappasiconic90sdesigns />} />
            <Route path="/pages/macron-s-dominance-in-lower-leagues" element={<Macronsdominanceinlowerleagues />} />
            <Route path="/pages/hummel-s-unique-chevron-designs" element={<Hummelsuniquechevrondesigns />} />

          </Routes>
        </Suspense>
      </ErrorBoundary>
      <SupportChat />
    </>
  );
}

function App() {
  return (
    <GlobalDataProvider>
      <Router>
        <AppContent />
      </Router>
    </GlobalDataProvider>
  );
}

export default App;
