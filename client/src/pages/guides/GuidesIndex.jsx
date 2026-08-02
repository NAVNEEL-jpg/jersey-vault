import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export default function GuidesIndex() {
  return (
    <div style={{ background: '#000', minHeight: '100vh', padding: '40px 24px', fontFamily: "'Barlow', sans-serif" }}>
      <Helmet>
        <title>Football Jersey Guides & History | Jersey Vault</title>
        <meta name="description" content="Explore our extensive library of football jersey history, club legacy, kit authentication, and care guides." />
        <link rel="canonical" href="https://www.thejerseyvault.in/pages/guides" />
      </Helmet>
      
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ color: '#fff', fontSize: '32px', fontWeight: 900, marginBottom: '20px', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '2px' }}>
          FOOTBALL JERSEY GUIDES & HISTORY
        </h1>
        <p style={{ color: '#aaa', fontSize: '16px', lineHeight: 1.6, marginBottom: '40px' }}>
          Welcome to the ultimate repository of football kit knowledge. Whether you are looking to authenticate a vintage Nike Dri-FIT shirt, understand the evolution of your club's crest, or figure out how to wash a heat-pressed player issue jersey without ruining it, we have you covered.
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            <Link to="/pages/a-c-milan-club-history" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>A C Milan Club History</Link>
            <Link to="/pages/anniversaryfootballkits" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Anniversaryfootballkits</Link>
            <Link to="/pages/arsenal-club-history" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Arsenal Club History</Link>
            <Link to="/pages/bannedfootballkits" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Bannedfootballkits</Link>
            <Link to="/pages/barcelona-club-history" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Barcelona Club History</Link>
            <Link to="/pages/bayern-munich-club-history" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Bayern Munich Club History</Link>
            <Link to="/pages/beckham-unitedto-madrid" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Beckham Unitedto Madrid</Link>
            <Link to="/pages/bellingham-first-season" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Bellingham First Season</Link>
            <Link to="/pages/blackoutfootballkits" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Blackoutfootballkits</Link>
            <Link to="/pages/blokecorefashionguide" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Blokecorefashionguide</Link>
            <Link to="/pages/buying-guide" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Buying Guide</Link>
            <Link to="/pages/care-guide" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Care Guide</Link>
            <Link to="/pages/castoresentryintofootball" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Castoresentryintofootball</Link>
            <Link to="/pages/centenaryfootballkits" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Centenaryfootballkits</Link>
            <Link to="/pages/champions-league1999" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Champions League1999</Link>
            <Link to="/pages/champions-league2005-istanbul" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Champions League2005 Istanbul</Link>
            <Link to="/pages/champions-league2008" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Champions League2008</Link>
            <Link to="/pages/champions-league2012" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Champions League2012</Link>
            <Link to="/pages/champions-league2014-la-decima" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Champions League2014 La Decima</Link>
            <Link to="/pages/champions-league2022" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Champions League2022</Link>
            <Link to="/pages/chelsea-club-history" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Chelsea Club History</Link>
            <Link to="/pages/cristiano-ronaldo-career-jerseys" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Cristiano Ronaldo Career Jerseys</Link>
            <Link to="/pages/footballkitsruinedbysponsors" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Footballkitsruinedbysponsors</Link>
            <Link to="/pages/footballkitsthatchangedtherules" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Footballkitsthatchangedtherules</Link>
            <Link to="/pages/footballshirttypographyguide" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Footballshirttypographyguide</Link>
            <Link to="/pages/gianluigi-buffoniconickits" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Gianluigi Buffoniconickits</Link>
            <Link to="/pages/goalkeeperkitevolution" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Goalkeeperkitevolution</Link>
            <Link to="/pages/henry-arsenal-invincibles" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Henry Arsenal Invincibles</Link>
            <Link to="/pages/historyofnumberedfootballshirts" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Historyofnumberedfootballshirts</Link>
            <Link to="/pages/howfootballkitsaremanufactured" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Howfootballkitsaremanufactured</Link>
            <Link to="/pages/howtoauthenticatean-adidasjersey" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Howtoauthenticatean Adidasjersey</Link>
            <Link to="/pages/howtoauthenticatea-nikejersey" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Howtoauthenticatea Nikejersey</Link>
            <Link to="/pages/howtoauthenticatea-pumajersey" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Howtoauthenticatea Pumajersey</Link>
            <Link to="/pages/howtoframeafootballshirt" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Howtoframeafootballshirt</Link>
            <Link to="/pages/howtostoreyourfootballshirts" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Howtostoreyourfootballshirts</Link>
            <Link to="/pages/hummelsuniquechevrondesigns" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Hummelsuniquechevrondesigns</Link>
            <Link to="/pages/inter-milan-club-history" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Inter Milan Club History</Link>
            <Link to="/pages/jorge-camposiconickits" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Jorge Camposiconickits</Link>
            <Link to="/pages/juventus-club-history" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Juventus Club History</Link>
            <Link to="/pages/kappasiconic90sdesigns" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Kappasiconic90sdesigns</Link>
            <Link to="/pages/liverpool-club-history" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Liverpool Club History</Link>
            <Link to="/pages/macronsdominanceinlowerleagues" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Macronsdominanceinlowerleagues</Link>
            <Link to="/pages/manchester-city-club-history" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Manchester City Club History</Link>
            <Link to="/pages/manchester-united-club-history" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Manchester United Club History</Link>
            <Link to="/pages/maradona-napoli-jerseys" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Maradona Napoli Jerseys</Link>
            <Link to="/pages/materials-guide" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Materials Guide</Link>
            <Link to="/pages/mbappe-kit-evolution" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Mbappe Kit Evolution</Link>
            <Link to="/pages/messi-career-jerseys" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Messi Career Jerseys</Link>
            <Link to="/pages/neonfootballkits" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Neonfootballkits</Link>
            <Link to="/pages/neymar-classic-kits" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Neymar Classic Kits</Link>
            <Link to="/pages/nikevs-adidasfootballrivalry" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Nikevs Adidasfootballrivalry</Link>
            <Link to="/pages/patch-guide" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Patch Guide</Link>
            <Link to="/pages/pele-brazil-kits" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Pele Brazil Kits</Link>
            <Link to="/pages/peter-schmeicheliconickits" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Peter Schmeicheliconickits</Link>
            <Link to="/pages/player-vs-fan" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Player Vs Fan</Link>
            <Link to="/pages/printing-guide" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Printing Guide</Link>
            <Link to="/pages/p-s-g-club-history" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>P S G Club History</Link>
            <Link to="/pages/pumasriseinfootball" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Pumasriseinfootball</Link>
            <Link to="/pages/real-madrid-club-history" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Real Madrid Club History</Link>
            <Link to="/pages/recycledoceanplasticfootballkits" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Recycledoceanplasticfootballkits</Link>
            <Link to="/pages/removingstainsfromfootballshirts" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Removingstainsfromfootballshirts</Link>
            <Link to="/pages/retro-guide" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Retro Guide</Link>
            <Link to="/pages/returns-guide" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Returns Guide</Link>
            <Link to="/pages/ronaldinho-iconic-jerseys" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Ronaldinho Iconic Jerseys</Link>
            <Link to="/pages/rooney-manchester-united-eras" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Rooney Manchester United Eras</Link>
            <Link to="/pages/shipping-guide" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Shipping Guide</Link>
            <Link to="/pages/size-guide" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Size Guide</Link>
            <Link to="/pages/specialeditionfootballkits" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Specialeditionfootballkits</Link>
            <Link to="/pages/sustainablefootballkits" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Sustainablefootballkits</Link>
            <Link to="/pages/thebestgoalkeeperkitsofthe90s" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Thebestgoalkeeperkitsofthe90s</Link>
            <Link to="/pages/thebestsponsorlessfootballkits" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Thebestsponsorlessfootballkits</Link>
            <Link to="/pages/thebiggestkitsupplierdealsinhistory" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Thebiggestkitsupplierdealsinhistory</Link>
            <Link to="/pages/theeconomicsoffootballkitdeals" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Theeconomicsoffootballkitdeals</Link>
            <Link to="/pages/theevolutionoffootballshirtsponsors" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Theevolutionoffootballshirtsponsors</Link>
            <Link to="/pages/thehistoryofthe-argentinastripes" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Thehistoryofthe Argentinastripes</Link>
            <Link to="/pages/thehistoryofthe-brazilyellowshirt" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Thehistoryofthe Brazilyellowshirt</Link>
            <Link to="/pages/thehistoryofthe-englandwhiteshirt" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Thehistoryofthe Englandwhiteshirt</Link>
            <Link to="/pages/thehistoryofthe-franceblueshirt" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Thehistoryofthe Franceblueshirt</Link>
            <Link to="/pages/thehistoryofthe-italyblueshirt" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Thehistoryofthe Italyblueshirt</Link>
            <Link to="/pages/thehistoryofthe-netherlandsorangeshirt" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Thehistoryofthe Netherlandsorangeshirt</Link>
            <Link to="/pages/theimpactoffastfashiononfootballkits" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Theimpactoffastfashiononfootballkits</Link>
            <Link to="/pages/themostcontroversialfootballkits" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Themostcontroversialfootballkits</Link>
            <Link to="/pages/thereturnofthecollarinfootballkits" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Thereturnofthecollarinfootballkits</Link>
            <Link to="/pages/theriseoffootballshirtsinstreetwear" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Theriseoffootballshirtsinstreetwear</Link>
            <Link to="/pages/theworstfootballkitsinhistory" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Theworstfootballkitsinhistory</Link>
            <Link to="/pages/top10-internationalkitsofalltime" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Top10 Internationalkitsofalltime</Link>
            <Link to="/pages/top10-la-ligakitsofalltime" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Top10 La Ligakitsofalltime</Link>
            <Link to="/pages/top10-premier-leaguekitsofalltime" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Top10 Premier Leaguekitsofalltime</Link>
            <Link to="/pages/top10-serie-akitsofalltime" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Top10 Serie Akitsofalltime</Link>
            <Link to="/pages/tottenham-club-history" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Tottenham Club History</Link>
            <Link to="/pages/umbroslegacyinfootball" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Umbroslegacyinfootball</Link>
            <Link to="/pages/understanding-adidas-heat-r-d-y" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Understanding Adidas Heat R D Y</Link>
            <Link to="/pages/understanding-nike-dri-f-i-t-a-d-v" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Understanding Nike Dri F I T A D V</Link>
            <Link to="/pages/understanding-puma-ultraweave" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Understanding Puma Ultraweave</Link>
            <Link to="/pages/whiteoutfootballkits" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Whiteoutfootballkits</Link>
            <Link to="/pages/whydoes-germanywearwhite" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Whydoes Germanywearwhite</Link>
            <Link to="/pages/whydoes-italywearblue" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Whydoes Italywearblue</Link>
            <Link to="/pages/whydoes-netherlandswearorange" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Whydoes Netherlandswearorange</Link>
            <Link to="/pages/whydogoalkeepersweardifferentcolors" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Whydogoalkeepersweardifferentcolors</Link>
            <Link to="/pages/whydosomekitshavelongsleeves" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Whydosomekitshavelongsleeves</Link>
            <Link to="/pages/whyfootballshirtshavestars" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Whyfootballshirtshavestars</Link>
            <Link to="/pages/world-cup1994-kits" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>World Cup1994 Kits</Link>
            <Link to="/pages/world-cup1998-kits" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>World Cup1998 Kits</Link>
            <Link to="/pages/world-cup2002-kits" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>World Cup2002 Kits</Link>
            <Link to="/pages/world-cup2006-kits" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>World Cup2006 Kits</Link>
            <Link to="/pages/world-cup2010-kits" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>World Cup2010 Kits</Link>
            <Link to="/pages/world-cup2014-kits" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>World Cup2014 Kits</Link>
            <Link to="/pages/world-cup2018-kits" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>World Cup2018 Kits</Link>
            <Link to="/pages/world-cup2022-kits" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>World Cup2022 Kits</Link>
            <Link to="/pages/zidane-best-kits" style={{ color: '#39ff14', textDecoration: 'none', display: 'block', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>Zidane Best Kits</Link>
        </div>
      </div>
    </div>
  );
}
