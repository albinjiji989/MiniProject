import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient, resolveMediaUrl } from '../../../services/api';
import {
  Box, Container, Typography, Button, Grid, Chip, LinearProgress,
  CircularProgress, IconButton, Dialog, Stack, Alert, Tooltip, Collapse,
  Badge
} from '@mui/material';
import {
  Refresh, Settings, Close, Pets, Favorite, EmojiEvents,
  Check, Warning, AutoAwesome, Psychology, Home, FitnessCenter,
  ChildCare, AttachMoney, Straighten, Speed, ContentCut, WatchLater,
  DirectionsRun, KeyboardArrowDown, KeyboardArrowUp,
  Lightbulb, TrendingUp, TrendingDown, RemoveCircleOutline,
  Info, BarChart, FilterList, Clear, Category, Female, Male,
  Cake, Tune
} from '@mui/icons-material';

/* ─── SVG Circular Match Score Ring ─────────────────────────── */
const ScoreRing = ({ score, size = 72 }) => {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, score || 0));
  const fill = (pct / 100) * circ;
  const color = pct >= 85 ? '#22c55e' : pct >= 70 ? '#3b82f6' : pct >= 55 ? '#f59e0b' : '#ef4444';
  return (
    <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0,
      filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.35))' }}>
      {/* White disc backdrop — always readable on any image */}
      <Box sx={{ position:'absolute', inset:0, borderRadius:'50%',
        bgcolor:'rgba(255,255,255,0.95)', backdropFilter:'blur(4px)' }} />
      <svg width={size} height={size} style={{ transform:'rotate(-90deg)', position:'relative', zIndex:1 }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(0,0,0,0.09)" strokeWidth={7} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={7}
          strokeDasharray={fill + ' ' + circ} strokeLinecap="round" />
      </svg>
      <Box sx={{ position:'absolute', inset:0, zIndex:2, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <Typography sx={{ fontWeight:800, fontSize: size>64?'1.1rem':'0.82rem', lineHeight:1, color:'#111827' }}>
          {Math.round(pct)}%
        </Typography>
      </Box>
    </Box>
  );
};

/* ─── Algorithm score bar ────────────────────────────────────── */
const AlgoBar = ({ label, value, color, desc }) => (
  <Box sx={{ mb: 2.5 }}>
    <Box sx={{ display:'flex', justifyContent:'space-between', mb:0.5 }}>
      <Typography variant="body2" sx={{ fontWeight:600, color:'#374151' }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight:700, color: color||'#374151' }}>{Math.round(value||0)}%</Typography>
    </Box>
    <LinearProgress variant="determinate" value={Math.min(100, value||0)}
      sx={{ height:8, borderRadius:4, bgcolor:'#f3f4f6', '& .MuiLinearProgress-bar':{ borderRadius:4, bgcolor:color } }} />
    {desc && <Typography variant="caption" sx={{ color:'#6b7280', mt:0.3, display:'block' }}>{desc}</Typography>}
  </Box>
);
/* ─── XAI (Explainable AI) components ─────────────────────────── */

const xaiIcons = {
  activity: <DirectionsRun fontSize="small" />,
  home: <Home fontSize="small" />,
  experience: <FitnessCenter fontSize="small" />,
  children: <ChildCare fontSize="small" />,
  pets: <Pets fontSize="small" />,
  time: <WatchLater fontSize="small" />,
  budget: <AttachMoney fontSize="small" />,
  size: <Straighten fontSize="small" />,
  info: <Info fontSize="small" />,
};

const sentimentColor = s => s === 'positive' ? '#22c55e' : s === 'negative' ? '#ef4444' : '#f59e0b';
const sentimentBg    = s => s === 'positive' ? '#f0fdf4' : s === 'negative' ? '#fef2f2' : '#fffbeb';
const sentimentBdr   = s => s === 'positive' ? '#bbf7d0' : s === 'negative' ? '#fecaca' : '#fde68a';
const SentimentIcon  = ({ s }) => s === 'positive'
  ? <TrendingUp sx={{ fontSize:16, color:'#22c55e' }} />
  : s === 'negative'
    ? <TrendingDown sx={{ fontSize:16, color:'#ef4444' }} />
    : <RemoveCircleOutline sx={{ fontSize:16, color:'#f59e0b' }} />;

/** Single XAI factor row — shows icon, label, impact badge, and reason text */
const XaiFactorRow = ({ factor }) => {
  const clr = sentimentColor(factor.sentiment);
  const bg  = sentimentBg(factor.sentiment);
  const bdr = sentimentBdr(factor.sentiment);
  return (
    <Box sx={{ border:'1px solid', borderColor:bdr, borderRadius:2, bgcolor:bg, mb:1, overflow:'hidden' }}>
      <Box sx={{ display:'flex', alignItems:'center', gap:1, px:1.5, py:1 }}>
        <Box sx={{ color:clr, display:'flex', flexShrink:0 }}>
          {xaiIcons[factor.icon] || <Info fontSize="small" />}
        </Box>
        <Typography sx={{ fontWeight:700, fontSize:'0.82rem', color:'#111827', flex:1 }}>
          {factor.factor}
        </Typography>
        <Box sx={{ display:'flex', alignItems:'center', gap:0.5, flexShrink:0 }}>
          <SentimentIcon s={factor.sentiment} />
          <Typography sx={{ fontSize:'0.68rem', fontWeight:700, color:clr,
            bgcolor: factor.sentiment==='positive'?'rgba(34,197,94,0.12)':factor.sentiment==='negative'?'rgba(239,68,68,0.12)':'rgba(245,158,11,0.12)',
            px:0.8, py:0.2, borderRadius:1 }}>
            {factor.impactLabel}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ px:1.5, pb:1.2, pt:0 }}>
        <Typography sx={{ fontSize:'0.77rem', color:'#4b5563', lineHeight:1.6 }}>
          {factor.text}
        </Typography>
      </Box>
    </Box>
  );
};

/** XGBoost feature importance mini-chart */
const XgbFeatureChart = ({ factors }) => {
  if (!factors || factors.length === 0) return null;
  const maxImp = Math.max(...factors.map(f => f.importance), 1);
  return (
    <Box sx={{ mt:0.5 }}>
      {factors.map((f, i) => (
        <Box key={i} sx={{ display:'flex', alignItems:'center', gap:1, mb:1 }}>
          <Typography sx={{ fontSize:'0.72rem', fontWeight:600, color:'#6b7280', width:130, flexShrink:0, textAlign:'right' }}>
            {f.feature}
          </Typography>
          <Box sx={{ flex:1, height:7, bgcolor:'#f3f4f6', borderRadius:4, overflow:'hidden' }}>
            <Box sx={{ width:`${(f.importance/maxImp)*100}%`, height:'100%', borderRadius:4,
              bgcolor: i===0?'#22c55e':i===1?'#3b82f6':i===2?'#a855f7':'#f59e0b' }} />
          </Box>
          <Typography sx={{ fontSize:'0.72rem', fontWeight:700, color:'#374151', width:36, flexShrink:0 }}>
            {f.importance}%
          </Typography>
        </Box>
      ))}
    </Box>
  );
};
/* ─── User vs Pet comparison row ────────────────────────────── */
const CompareRow = ({ icon, label, userVal, petVal, status, note }) => {
  const col = { ok:'#22c55e', warn:'#f59e0b', bad:'#ef4444' }[status]||'#6b7280';
  const bg  = { ok:'#f0fdf4', warn:'#fffbeb', bad:'#fef2f2' }[status]||'#f9fafb';
  const bdr = { ok:'#bbf7d0', warn:'#fde68a', bad:'#fecaca' }[status]||'#e5e7eb';
  const Ico = { ok: Check, warn: Warning, bad: Warning }[status]||Check;
  return (
    <Box sx={{ borderRadius:2, border:'1px solid', mb:1.2, borderColor:bdr, bgcolor:bg, overflow:'hidden' }}>
      {/* header row */}
      <Box sx={{ display:'flex', alignItems:'center', gap:1.2, px:1.5, py:0.9 }}>
        <Box sx={{ color:col, display:'flex', flexShrink:0 }}>{icon}</Box>
        <Typography variant="body2" sx={{ fontWeight:700, color:'#111827', flex:1 }}>{label}</Typography>
        <Ico sx={{ fontSize:17, color:col, flexShrink:0 }} />
      </Box>
      {/* two-column value row */}
      <Box sx={{ display:'flex', borderTop:'1px solid', borderColor:bdr }}>
        <Box sx={{ flex:1, px:1.5, py:0.8, borderRight:'1px solid', borderColor:bdr }}>
          <Typography sx={{ fontSize:'0.62rem', color:'#6b7280', fontWeight:700,
            textTransform:'uppercase', letterSpacing:0.6, mb:0.3 }}>You</Typography>
          <Typography sx={{ fontSize:'0.84rem', fontWeight:700, color:'#1d4ed8' }}>{userVal}</Typography>
        </Box>
        <Box sx={{ flex:1, px:1.5, py:0.8 }}>
          <Typography sx={{ fontSize:'0.62rem', color:'#6b7280', fontWeight:700,
            textTransform:'uppercase', letterSpacing:0.6, mb:0.3 }}>This Pet</Typography>
          <Typography sx={{ fontSize:'0.84rem', fontWeight:700, color:'#374151' }}>{petVal}</Typography>
        </Box>
      </Box>
      {/* context note */}
      {note && (
        <Box sx={{ px:1.5, py:0.6, borderTop:'1px solid', borderColor:bdr, bgcolor:'rgba(255,255,255,0.6)' }}>
          <Typography sx={{ fontSize:'0.73rem', color:col, fontWeight:600 }}>{note}</Typography>
        </Box>
      )}
    </Box>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
const SmartMatches = () => {
  const navigate = useNavigate();
  const [loading, setLoading]         = useState(true);
  const [matches, setMatches]         = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [selectedPet, setSelectedPet] = useState(null);
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [error, setError]             = useState('');
  const [mlAvailable, setMlAvailable] = useState(true);
  const [showAlgo, setShowAlgo]       = useState(false);
  const [currentWeights, setCurrentWeights] = useState(null);
  const [cacheAgeMs, setCacheAgeMs]   = useState(null);
  const [dismissed, setDismissed]     = useState(new Set());
  const [activeImg, setActiveImg]     = useState(0);

  // ── Multi-select filters ──────────────────────────────────
  const [showFilters, setShowFilters]   = useState(false);
  const [filters, setFilters] = useState({
    species: [],   // e.g. ['Dog','Cat']
    breed: [],     // e.g. ['Labrador','Siamese']
    gender: [],    // e.g. ['Male','Female']
    age: [],       // e.g. ['Puppy','Adult','Senior']
    size: [],      // e.g. ['Small','Medium','Large']
  });

  const toggleFilter = (key, value) => {
    setFilters(prev => {
      const arr = prev[key] || [];
      return {
        ...prev,
        [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
      };
    });
  };

  const clearAllFilters = () => setFilters({ species:[], breed:[], gender:[], age:[], size:[] });

  const activeFilterCount = Object.values(filters).reduce((s, a) => s + a.length, 0);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true); setError('');
    try {
      const [mRes, pRes] = await Promise.all([
        apiClient.get('/adoption/user/matches/hybrid', { params: { topN: 20, algorithm:'hybrid' } }),
        apiClient.get('/adoption/user/profile/adoption').catch(() => ({ data:{ success:false } }))
      ]);
      if (mRes.data.success) {
        if (mRes.data.data?.needsProfile) { navigate('/user/adoption/profile-wizard'); return; }
        const recs = mRes.data.data?.recommendations || mRes.data.data?.matches || [];
        setMatches(recs);
        setMlAvailable(mRes.data.data?.source !== 'fallback');
        if (mRes.data.data?.currentWeights) setCurrentWeights(mRes.data.data.currentWeights);
        setCacheAgeMs(mRes.data.data?.cachedResult && mRes.data.data?.cacheAgeMs != null
          ? mRes.data.data.cacheAgeMs : null);
      } else { setError(mRes.data.message || 'Failed to load matches'); }
      if (pRes.data.success) setUserProfile(pRes.data.data?.adoptionProfile || pRes.data.data || null);
    } catch (e) {
      if (e.response?.data?.needsProfile || e.response?.status === 400)
        navigate('/user/adoption/profile-wizard');
      else setError(e.response?.data?.message || 'Failed to load matches. Please try again.');
    } finally { setLoading(false); }
  };

  const scoreColor = s => s >= 85 ? '#22c55e' : s >= 70 ? '#3b82f6' : s >= 55 ? '#f59e0b' : '#ef4444';
  const scoreLabel = s => s >= 85 ? 'Excellent' : s >= 70 ? 'Great' : s >= 55 ? 'Good' : 'Fair';

  const resolveImg = img => {
    if (!img) return '/placeholder-pet.svg';
    const src = typeof img==='string' ? img : (img.url||img.path||img._id||'');
    return src ? resolveMediaUrl(src) : '/placeholder-pet.svg';
  };

  const extractPet = useCallback(m => {
    const p = m.pet || m;
    return {
      id:   p._id || p.id || m.petId,
      name: m.petName || p.petName || p.name || 'Lovely Pet',
      breed: p.breed || 'Mixed Breed',
      species: p.species || 'Pet',
      gender: p.gender || '',
      age: p.age || '',
      color: p.color || '',
      weight: p.weight || '',
      description: p.description || '',
      adoptionFee: p.adoptionFee || 0,
      vaccinationStatus: p.vaccinationStatus || '',
      images: p.images || [],
      compat: p.compatibilityProfile || {},
      temperamentTags: p.temperamentTags || p.compatibilityProfile?.temperamentTags || [],
      hybridScore: m.hybridScore || m.match_score || m.matchScore || p.hybridScore || 70,
      algorithmScores: m.algorithmScores || {},
      explanations: m.explanations || m.match_details?.match_reasons || [],
      xai: m.xaiExplanations || {},
      matchDetails: m.match_details || m.matchDetails || {},
      confidence: m.confidence || 0,
      successProbability: m.successProbability || 0,
      weights: m.weights || {},
      clusterName: m.clusterName || ''
    };
  }, []);

  const buildComparisons = (pet, user) => {
    if (!user) return [];
    const c = pet.compat || {};
    const rows = [];

    // ── Helpers ──────────────────────────────────────
    const actLabel = n => ['','Relaxed','Light','Moderate','Active','Very Active'][Math.min(5,Math.max(1,Math.round(n)))]||'Moderate';
    const engLabel = n => ['','Very Low','Low','Medium','High','Very High'][Math.min(5,Math.max(1,Math.round(n)))]||'Medium';
    const homeLabel = h => ({ apartment:'Apartment', house:'House', house_with_yard:'House + Yard',
      condo:'Condo', farm:'Farm / Rural' })[String(h).toLowerCase()] || String(h).replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()) || 'Home';
    const expLabel = e => ({ beginner:'Beginner', first_time:'First-Time Owner', some_experience:'Some Experience',
      intermediate:'Intermediate', experienced:'Experienced', advanced:'Advanced Owner' })[String(e).toLowerCase()] || String(e);
    const trainLabel = t => ({ untrained:'Needs Training', basic:'Basic Training',
      intermediate:'Intermediate', advanced:'Well Trained' })[String(t).toLowerCase()] || String(t);
    const friendLabel = s => s>=8?'Excellent':s>=6?'Good':s>=4?'Fair':'Not Recommended';
    const fmt$ = n => '$'+Number(n).toLocaleString();

    // ── Activity Level ────────────────────────────────
    const uAct = Number(user.activityLevel||3), pEng = Number(c.energyLevel||3), adiff = Math.abs(uAct-pEng);
    const actSt = adiff<=1?'ok':adiff<=2?'warn':'bad';
    rows.push({ icon:<DirectionsRun fontSize="small"/>, label:'Activity Level',
      userVal: actLabel(uAct), petVal: engLabel(pEng)+' energy',
      status: actSt,
      note: actSt==='ok'?'Great energy match — your lifestyle suits this pet'
          : actSt==='warn'?'Slight mismatch — manageable with exercise'
          : 'Energy mismatch — this pet needs a more active owner' });

    // ── Living Space ──────────────────────────────────
    const ht = String(user.homeType||'').toLowerCase();
    const canApt = c.canLiveInApartment!==false, needYard = c.needsYard===true, hasYard = user.hasYard===true;
    let spSt='ok';
    if (ht.includes('apartment')&&!canApt) spSt='bad';
    else if (needYard&&!hasYard) spSt='warn';
    const petSpaceLabel = needYard?'Yard required':(canApt?'Indoor / Apartment OK':'Prefers a house');
    rows.push({ icon:<Home fontSize="small"/>, label:'Living Space',
      userVal: homeLabel(user.homeType)+(user.hasYard?' ✓ Has yard':''),
      petVal: petSpaceLabel, status: spSt,
      note: spSt==='ok'?'Your home suits this pet perfectly'
          : spSt==='warn'?'Pet prefers a yard — outdoor walks can compensate'
          : 'This pet does not do well in apartments' });

    // ── Owner Experience ──────────────────────────────
    const expM={beginner:1,first_time:1,some_experience:2,intermediate:2,experienced:3,advanced:3};
    const trM={untrained:1,basic:2,intermediate:3,advanced:4};
    const uExp=expM[String(user.experienceLevel||'beginner').toLowerCase()]||1;
    const pTr=trM[String(c.trainedLevel||'basic').toLowerCase()]||2;
    const expSt = uExp>=pTr?'ok':uExp>=pTr-1?'warn':'bad';
    rows.push({ icon:<FitnessCenter fontSize="small"/>, label:'Owner Experience',
      userVal: expLabel(user.experienceLevel), petVal: trainLabel(c.trainedLevel),
      status: expSt,
      note: expSt==='ok'?'Your experience level is a good fit'
          : expSt==='warn'?'Manageable — some patience and training needed'
          : 'This pet needs an experienced owner to thrive' });

    // ── Children (only if user has kids) ─────────────
    if (user.hasChildren) {
      const cs = Number(c.childFriendlyScore||0);
      const kSt = cs>=7?'ok':cs>=4?'warn':'bad';
      rows.push({ icon:<ChildCare fontSize="small"/>, label:'Kids Compatibility',
        userVal:'You have children', petVal: friendLabel(cs)+' with kids',
        status: kSt,
        note: kSt==='ok'?'This pet does great around children'
            : kSt==='warn'?'Supervision recommended around young children'
            : 'Not recommended for households with young children' });
    }

    // ── Other Pets (only if user has pets) ───────────
    if (user.hasOtherPets) {
      const ps = Number(c.petFriendlyScore||0);
      const pSt = ps>=7?'ok':ps>=4?'warn':'bad';
      rows.push({ icon:<Pets fontSize="small"/>, label:'Pet Compatibility',
        userVal:'You have other pets', petVal: friendLabel(ps)+' with pets',
        status: pSt,
        note: pSt==='ok'?'Gets along well with other animals'
            : pSt==='warn'?'Slow introduction recommended'
            : 'May not get along with other pets' });
    }

    // ── Time Alone ────────────────────────────────────
    const uH=Number(user.hoursAlonePerDay||8), pM=Number(c.maxHoursAlone||6);
    const tSt = uH<=pM?'ok':uH<=pM+2?'warn':'bad';
    rows.push({ icon:<WatchLater fontSize="small"/>, label:'Time Left Alone',
      userVal:`You\'re away ${uH}h/day`, petVal:`Tolerates up to ${pM}h`,
      status: tSt,
      note: tSt==='ok'?'This pet is comfortable with your schedule'
          : tSt==='warn'?`Only ${uH-pM}h over limit — a pet-sitter helps`
          : `${uH-pM}h over this pet\'s limit — may cause separation anxiety` });

    // ── Monthly Cost ──────────────────────────────────
    const uB=Number(user.monthlyBudget||0), pC=Number(c.estimatedMonthlyCost||0);
    if (uB>0&&pC>0) {
      const bSt = pC<=uB?'ok':pC<=uB*1.3?'warn':'bad';
      rows.push({ icon:<AttachMoney fontSize="small"/>, label:'Monthly Cost',
        userVal:`Your budget: ${fmt$(uB)}/mo`, petVal:`Est. cost: ${fmt$(pC)}/mo`,
        status: bSt,
        note: bSt==='ok'?'Comfortably within your budget'
            : bSt==='warn'?`${fmt$(pC-uB)}/mo over budget — tight but possible`
            : `${fmt$(pC-uB)}/mo over budget — may be financially straining` });
    }

    return rows;
  };

  const openDetails = match => { setSelectedPet(match); setActiveImg(0); setDrawerOpen(true); };

  // ── Extract unique filter options from ALL matches ────────
  // Breed options depend on selected species (cascading filter)
  const filterOptions = React.useMemo(() => {
    const species = new Set(), breed = new Set(), gender = new Set(), age = new Set(), size = new Set();
    matches.forEach(m => {
      const p = extractPet(m);
      if (p.species) species.add(p.species);
      // Only include breeds that belong to the selected species (or all if none selected)
      if (p.breed && (filters.species.length === 0 || filters.species.includes(p.species))) {
        breed.add(p.breed);
      }
      if (p.gender)  gender.add(p.gender);
      const ageStr = String(p.age || '').toLowerCase();
      if (ageStr) {
        if (ageStr.includes('puppy') || ageStr.includes('kitten') || ageStr.includes('baby')) age.add('Baby/Puppy');
        else if (ageStr.includes('young') || ageStr.includes('junior')) age.add('Young');
        else if (ageStr.includes('adult')) age.add('Adult');
        else if (ageStr.includes('senior') || ageStr.includes('old')) age.add('Senior');
        else age.add(p.age);
      }
      const sz = (p.compat?.size || '').toString();
      if (sz) size.add(sz.charAt(0).toUpperCase() + sz.slice(1).toLowerCase());
    });
    return {
      species: [...species].sort(),
      breed:   [...breed].sort(),
      gender:  [...gender].sort(),
      age:     [...age].sort(),
      size:    [...size].sort(),
    };
  }, [matches, extractPet, filters.species]);

  // Auto-clear breed selections that no longer match the selected species
  React.useEffect(() => {
    if (filters.breed.length > 0 && filterOptions.breed.length > 0) {
      const validBreeds = filters.breed.filter(b => filterOptions.breed.includes(b));
      if (validBreeds.length !== filters.breed.length) {
        setFilters(prev => ({ ...prev, breed: validBreeds }));
      }
    }
  }, [filterOptions.breed, filters.breed]);

  // ── Apply filters + breed dismiss ─────────────────────────
  const visible = React.useMemo(() => {
    return matches.filter(m => {
      const p = extractPet(m);
      if (dismissed.has((p.breed || '').toLowerCase())) return false;

      if (filters.species.length > 0 && !filters.species.includes(p.species)) return false;
      if (filters.breed.length   > 0 && !filters.breed.includes(p.breed))     return false;
      if (filters.gender.length  > 0 && !filters.gender.includes(p.gender))   return false;

      if (filters.size.length > 0) {
        const petSize = (p.compat?.size || '').toString();
        const petSizeNorm = petSize.charAt(0).toUpperCase() + petSize.slice(1).toLowerCase();
        if (!filters.size.includes(petSizeNorm)) return false;
      }

      if (filters.age.length > 0) {
        const ageStr = String(p.age || '').toLowerCase();
        let bucket = p.age;
        if (ageStr.includes('puppy') || ageStr.includes('kitten') || ageStr.includes('baby')) bucket = 'Baby/Puppy';
        else if (ageStr.includes('young') || ageStr.includes('junior')) bucket = 'Young';
        else if (ageStr.includes('adult')) bucket = 'Adult';
        else if (ageStr.includes('senior') || ageStr.includes('old')) bucket = 'Senior';
        if (!filters.age.includes(bucket)) return false;
      }

      return true;
    });
  }, [matches, filters, dismissed, extractPet]);

  /* ── LOADING ── */
  if (loading) return (
    <Box sx={{ minHeight:'60vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2 }}>
      <Box sx={{ position:'relative', width:80, height:80 }}>
        <CircularProgress size={80} thickness={3} sx={{ color:'#22c55e' }} />
        <Box sx={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Pets sx={{ fontSize:32, color:'#22c55e' }} />
        </Box>
      </Box>
      <Typography variant="h6" sx={{ fontWeight:600, color:'#374151' }}>Finding your best matches…</Typography>
      <Typography variant="body2" sx={{ color:'#9ca3af' }}>AI is analysing compatibility</Typography>
    </Box>
  );

  /* ════════════════════════ RENDER ═══════════════════════════ */
  return (
    <Box sx={{ bgcolor:'#f9fafb', minHeight:'100vh' }}>

      {/* ── HERO HEADER ── */}
      <Box sx={{ background:'linear-gradient(135deg,#064e3b 0%,#047857 60%,#059669 100%)',
        pt:5, pb:6, px:{xs:2,md:4}, position:'relative', overflow:'hidden' }}>
        <Box sx={{ position:'absolute', top:-50, right:-50, width:220, height:220, borderRadius:'50%', bgcolor:'rgba(255,255,255,0.05)', pointerEvents:'none' }} />
        <Box sx={{ position:'absolute', bottom:-70, left:'25%', width:180, height:180, borderRadius:'50%', bgcolor:'rgba(255,255,255,0.04)', pointerEvents:'none' }} />
        <Container maxWidth="xl">
          <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:2 }}>
            <Box>
              <Box sx={{ display:'flex', alignItems:'center', gap:1.5, mb:1 }}>
                <AutoAwesome sx={{ color:'#fbbf24', fontSize:30 }} />
                <Typography variant="h4" sx={{ fontWeight:800, color:'#fff', letterSpacing:'-0.5px' }}>Smart Matches</Typography>
              </Box>
              <Typography sx={{ color:'rgba(255,255,255,0.78)', fontSize:'0.95rem' }}>
                {mlAvailable
                  ? 'AI hybrid: Profile · Collaborative · Success Prediction · Personality Clustering'
                  : 'Profile-based compatibility matching'}
              </Typography>
              {visible.length>0 && (
                <Typography sx={{ color:'rgba(255,255,255,0.55)', fontSize:'0.8rem', mt:0.5 }}>
                  {visible.length}{activeFilterCount > 0 ? ` of ${matches.length}` : ''} compatible pets ranked for you
                  {activeFilterCount > 0 && ' (filtered)'}
                </Typography>
              )}
            </Box>
            <Box sx={{ display:'flex', gap:1.5, alignItems:'center' }}>
              {mlAvailable && (
                <Chip icon={<Psychology sx={{ fontSize:15 }}/>} label="AI Active"
                  sx={{ bgcolor:'rgba(255,255,255,0.13)', color:'#fff', fontWeight:700,
                    border:'1px solid rgba(255,255,255,0.28)', backdropFilter:'blur(8px)' }} />
              )}
              <Tooltip title="Update preferences">
                <IconButton onClick={() => navigate('/user/adoption/profile-wizard')}
                  sx={{ bgcolor:'rgba(255,255,255,0.1)', color:'#fff', border:'1px solid rgba(255,255,255,0.18)',
                    '&:hover':{ bgcolor:'rgba(255,255,255,0.18)' } }}>
                  <Settings />
                </IconButton>
              </Tooltip>
              <Button variant="contained" startIcon={<Refresh />} onClick={loadAll}
                sx={{ bgcolor:'#fff', color:'#065f46', fontWeight:700, textTransform:'none',
                  borderRadius:2, '&:hover':{ bgcolor:'#f0fdf4' } }}>
                Refresh
              </Button>
            </Box>
          </Box>
          {/* live weight pills */}
          {mlAvailable && currentWeights && (
            <Box sx={{ mt:2.5, display:'flex', gap:1, flexWrap:'wrap' }}>
              {[
                { k:'content',       label:'Profile',        color:'#3b82f6' },
                { k:'collaborative', label:'Collaborative',  color:'#a855f7' },
                { k:'success',       label:'Success',        color:'#22c55e' },
                { k:'clustering',    label:'Clustering',     color:'#f59e0b' },
              ].map(({ k, label, color }) => (
                <Box key={k} sx={{ display:'flex', alignItems:'center', gap:0.5,
                  bgcolor:'rgba(255,255,255,0.11)', borderRadius:10, px:1.5, py:0.4 }}>
                  <Box sx={{ width:7, height:7, borderRadius:'50%', bgcolor:color }} />
                  <Typography sx={{ color:'rgba(255,255,255,0.82)', fontSize:'0.74rem', fontWeight:600 }}>
                    {label} {Math.round((currentWeights[k]||0)*100)}%
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py:4 }}>

        {/* ── FILTER BAR ── */}
        <Box sx={{ mb:3 }}>
          {/* Filter toggle button */}
          <Box sx={{ display:'flex', alignItems:'center', gap:1.5, mb: showFilters ? 2 : 0 }}>
            <Button
              startIcon={
                <Badge badgeContent={activeFilterCount} color="error"
                  sx={{ '& .MuiBadge-badge':{ fontSize:'0.65rem', minWidth:16, height:16 } }}>
                  <FilterList />
                </Badge>
              }
              onClick={() => setShowFilters(v => !v)}
              variant={activeFilterCount > 0 ? 'contained' : 'outlined'}
              size="small"
              sx={{
                textTransform:'none', fontWeight:700, borderRadius:2,
                ...(activeFilterCount > 0
                  ? { bgcolor:'#065f46', '&:hover':{ bgcolor:'#047857' } }
                  : { borderColor:'#d1d5db', color:'#374151', '&:hover':{ borderColor:'#9ca3af' } })
              }}>
              Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
              {showFilters ? <KeyboardArrowUp sx={{ ml:0.5, fontSize:18 }} /> : <KeyboardArrowDown sx={{ ml:0.5, fontSize:18 }} />}
            </Button>

            {activeFilterCount > 0 && (
              <Button size="small" startIcon={<Clear sx={{ fontSize:14 }} />}
                onClick={clearAllFilters}
                sx={{ textTransform:'none', color:'#6b7280', fontSize:'0.78rem', '&:hover':{ color:'#ef4444' } }}>
                Clear all
              </Button>
            )}

            {/* Active filter chips summary (always visible) */}
            {activeFilterCount > 0 && !showFilters && (
              <Box sx={{ display:'flex', gap:0.6, flexWrap:'wrap', flex:1 }}>
                {Object.entries(filters).flatMap(([key, vals]) =>
                  vals.map(v => (
                    <Chip key={`${key}-${v}`} label={v} size="small"
                      onDelete={() => toggleFilter(key, v)}
                      sx={{ bgcolor:'#eff6ff', color:'#1d4ed8', fontWeight:600, fontSize:'0.7rem', height:24,
                        '& .MuiChip-deleteIcon':{ fontSize:14, color:'#3b82f6', '&:hover':{ color:'#ef4444' } } }} />
                  ))
                )}
              </Box>
            )}
          </Box>

          {/* Expanded filter panel */}
          <Collapse in={showFilters}>
            <Box sx={{ bgcolor:'#fff', border:'1px solid #e5e7eb', borderRadius:3, p:2.5,
              boxShadow:'0 2px 12px rgba(0,0,0,0.04)' }}>

              {/* Species */}
              {filterOptions.species.length > 0 && (
                <Box sx={{ mb:2 }}>
                  <Box sx={{ display:'flex', alignItems:'center', gap:0.8, mb:1 }}>
                    <Category sx={{ fontSize:16, color:'#6b7280' }} />
                    <Typography sx={{ fontSize:'0.75rem', fontWeight:800, color:'#6b7280', textTransform:'uppercase', letterSpacing:0.8 }}>Species</Typography>
                  </Box>
                  <Box sx={{ display:'flex', gap:0.8, flexWrap:'wrap' }}>
                    {filterOptions.species.map(s => {
                      const active = filters.species.includes(s);
                      return (
                        <Chip key={s} label={s} size="small" clickable onClick={() => toggleFilter('species', s)}
                          sx={{ fontWeight:600, fontSize:'0.76rem', height:28, borderRadius:2,
                            bgcolor: active?'#065f46':'#f9fafb', color: active?'#fff':'#374151',
                            border:'1px solid '+(active?'#065f46':'#d1d5db'),
                            '&:hover':{ bgcolor:active?'#047857':'#f3f4f6' } }} />
                      );
                    })}
                  </Box>
                </Box>
              )}

              {/* Breed */}
              {filterOptions.breed.length > 0 && (
                <Box sx={{ mb:2 }}>
                  <Box sx={{ display:'flex', alignItems:'center', gap:0.8, mb:0.5 }}>
                    <Pets sx={{ fontSize:16, color:'#6b7280' }} />
                    <Typography sx={{ fontSize:'0.75rem', fontWeight:800, color:'#6b7280', textTransform:'uppercase', letterSpacing:0.8 }}>Breed</Typography>
                  </Box>
                  {filters.species.length > 0 && (
                    <Typography sx={{ fontSize:'0.68rem', color:'#9ca3af', mb:0.8, ml:0.3 }}>
                      Showing breeds for: {filters.species.join(', ')}
                    </Typography>
                  )}
                  <Box sx={{ display:'flex', gap:0.8, flexWrap:'wrap' }}>
                    {filterOptions.breed.map(b => {
                      const active = filters.breed.includes(b);
                      return (
                        <Chip key={b} label={b} size="small" clickable onClick={() => toggleFilter('breed', b)}
                          sx={{ fontWeight:600, fontSize:'0.76rem', height:28, borderRadius:2,
                            bgcolor: active?'#1d4ed8':'#f9fafb', color: active?'#fff':'#374151',
                            border:'1px solid '+(active?'#1d4ed8':'#d1d5db'),
                            '&:hover':{ bgcolor:active?'#1e40af':'#f3f4f6' } }} />
                      );
                    })}
                  </Box>
                </Box>
              )}

              {/* Gender + Age + Size in a row */}
              <Box sx={{ display:'flex', gap:3, flexWrap:'wrap' }}>
                {/* Gender */}
                {filterOptions.gender.length > 0 && (
                  <Box sx={{ minWidth:120 }}>
                    <Box sx={{ display:'flex', alignItems:'center', gap:0.8, mb:1 }}>
                      <Box sx={{ display:'flex', color:'#6b7280' }}>
                        {filterOptions.gender.some(g => g.toLowerCase()==='male') ? <Male sx={{ fontSize:16 }} /> : <Female sx={{ fontSize:16 }} />}
                      </Box>
                      <Typography sx={{ fontSize:'0.75rem', fontWeight:800, color:'#6b7280', textTransform:'uppercase', letterSpacing:0.8 }}>Gender</Typography>
                    </Box>
                    <Box sx={{ display:'flex', gap:0.8, flexWrap:'wrap' }}>
                      {filterOptions.gender.map(g => {
                        const active = filters.gender.includes(g);
                        return (
                          <Chip key={g} label={g} size="small" clickable onClick={() => toggleFilter('gender', g)}
                            sx={{ fontWeight:600, fontSize:'0.76rem', height:28, borderRadius:2,
                              bgcolor: active?'#7e22ce':'#f9fafb', color: active?'#fff':'#374151',
                              border:'1px solid '+(active?'#7e22ce':'#d1d5db'),
                              '&:hover':{ bgcolor:active?'#6b21a8':'#f3f4f6' } }} />
                        );
                      })}
                    </Box>
                  </Box>
                )}

                {/* Age */}
                {filterOptions.age.length > 0 && (
                  <Box sx={{ minWidth:120 }}>
                    <Box sx={{ display:'flex', alignItems:'center', gap:0.8, mb:1 }}>
                      <Cake sx={{ fontSize:16, color:'#6b7280' }} />
                      <Typography sx={{ fontSize:'0.75rem', fontWeight:800, color:'#6b7280', textTransform:'uppercase', letterSpacing:0.8 }}>Age</Typography>
                    </Box>
                    <Box sx={{ display:'flex', gap:0.8, flexWrap:'wrap' }}>
                      {filterOptions.age.map(a => {
                        const active = filters.age.includes(a);
                        return (
                          <Chip key={a} label={a} size="small" clickable onClick={() => toggleFilter('age', a)}
                            sx={{ fontWeight:600, fontSize:'0.76rem', height:28, borderRadius:2,
                              bgcolor: active?'#c2410c':'#f9fafb', color: active?'#fff':'#374151',
                              border:'1px solid '+(active?'#c2410c':'#d1d5db'),
                              '&:hover':{ bgcolor:active?'#9a3412':'#f3f4f6' } }} />
                        );
                      })}
                    </Box>
                  </Box>
                )}

                {/* Size */}
                {filterOptions.size.length > 0 && (
                  <Box sx={{ minWidth:120 }}>
                    <Box sx={{ display:'flex', alignItems:'center', gap:0.8, mb:1 }}>
                      <Straighten sx={{ fontSize:16, color:'#6b7280' }} />
                      <Typography sx={{ fontSize:'0.75rem', fontWeight:800, color:'#6b7280', textTransform:'uppercase', letterSpacing:0.8 }}>Size</Typography>
                    </Box>
                    <Box sx={{ display:'flex', gap:0.8, flexWrap:'wrap' }}>
                      {filterOptions.size.map(s => {
                        const active = filters.size.includes(s);
                        return (
                          <Chip key={s} label={s} size="small" clickable onClick={() => toggleFilter('size', s)}
                            sx={{ fontWeight:600, fontSize:'0.76rem', height:28, borderRadius:2,
                              bgcolor: active?'#0369a1':'#f9fafb', color: active?'#fff':'#374151',
                              border:'1px solid '+(active?'#0369a1':'#d1d5db'),
                              '&:hover':{ bgcolor:active?'#075985':'#f3f4f6' } }} />
                        );
                      })}
                    </Box>
                  </Box>
                )}
              </Box>

              {/* Results count */}
              <Box sx={{ mt:2, pt:1.5, borderTop:'1px solid #f3f4f6', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <Typography sx={{ fontSize:'0.78rem', color:'#6b7280' }}>
                  Showing <strong style={{ color:'#111827' }}>{visible.length}</strong> of {matches.length} pets
                </Typography>
                {activeFilterCount > 0 && (
                  <Button size="small" startIcon={<Clear sx={{ fontSize:14 }} />}
                    onClick={clearAllFilters}
                    sx={{ textTransform:'none', fontSize:'0.75rem', color:'#ef4444' }}>
                    Reset filters
                  </Button>
                )}
              </Box>
            </Box>
          </Collapse>
        </Box>

        {/* banners */}
        {!mlAvailable && <Alert severity="warning" sx={{ mb:3, borderRadius:2 }}>AI/ML service offline — showing profile-based results.</Alert>}
        {cacheAgeMs!=null && (
          <Alert severity="info" sx={{ mb:2, borderRadius:2 }}
            action={<Button size="small" onClick={loadAll} sx={{ textTransform:'none' }}>Retry</Button>}>
            Cached results from {cacheAgeMs<60000?'&lt;1 min':`${Math.round(cacheAgeMs/60000)} min`} ago — AI temporarily offline.
          </Alert>
        )}
        {error && <Alert severity="error" sx={{ mb:3, borderRadius:2 }} onClose={()=>setError('')}>{error}</Alert>}
        {dismissed.size>0 && (
          <Box sx={{ mb:2, display:'flex', alignItems:'center', gap:1 }}>
            <Typography variant="caption" sx={{ color:'#6b7280' }}>{dismissed.size} breed(s) hidden</Typography>
            <Button size="small" sx={{ textTransform:'none', fontSize:'0.72rem' }} onClick={()=>setDismissed(new Set())}>Show All</Button>
          </Box>
        )}

        {/* empty */}
        {visible.length===0 && !error && (
          <Box sx={{ textAlign:'center', py:10 }}>
            <Box sx={{ width:96, height:96, borderRadius:'50%', bgcolor:'#f0fdf4', display:'flex',
              alignItems:'center', justifyContent:'center', mx:'auto', mb:3 }}>
              <Pets sx={{ fontSize:48, color:'#d1fae5' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight:700, color:'#374151', mb:1 }}>
              {activeFilterCount > 0 ? 'No pets match your filters' : 'No matches found'}
            </Typography>
            <Typography sx={{ color:'#6b7280', mb:3 }}>
              {activeFilterCount > 0
                ? `${matches.length} pets available — try removing some filters.`
                : 'No pets currently match your profile. Try updating your preferences.'}
            </Typography>
            {activeFilterCount > 0 ? (
              <Button variant="contained" startIcon={<Clear />} onClick={clearAllFilters}
                sx={{ bgcolor:'#065f46', textTransform:'none', fontWeight:700, borderRadius:2 }}>
                Clear All Filters
              </Button>
            ) : (
              <Button variant="contained" onClick={()=>navigate('/user/adoption/profile-wizard')}
                sx={{ bgcolor:'#065f46', textTransform:'none', fontWeight:700, borderRadius:2 }}>
                Update Preferences
              </Button>
            )}
          </Box>
        )}

        {/* ── CARDS GRID ── */}
        {visible.length>0 && (
          <Grid container spacing={3}>
            {visible.map((match, index) => {
              const pet   = extractPet(match);
              const img   = resolveImg(pet.images[0]);
              const color = scoreColor(pet.hybridScore);
              const isTop = index===0 && pet.hybridScore>=80;

              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={pet.id||index}>
                  <Box sx={{
                    bgcolor:'#fff', borderRadius:3, overflow:'hidden', height:'100%', display:'flex', flexDirection:'column',
                    boxShadow: isTop ? '0 0 0 2px '+color+', 0 8px 24px rgba(0,0,0,0.10)' : '0 2px 12px rgba(0,0,0,0.07)',
                    border: isTop ? '2px solid '+color : '1px solid #e5e7eb',
                    transition:'all 0.25s ease',
                    '&:hover':{ transform:'translateY(-6px)', boxShadow:'0 16px 36px rgba(0,0,0,0.12)' }
                  }}>

                    {/* IMAGE */}
                    <Box sx={{ position:'relative', paddingTop:'68%', flexShrink:0 }}>
                      <Box component="img" src={img} alt={pet.name}
                        onError={e=>{ e.target.src='/placeholder-pet.svg'; }}
                        onClick={()=>openDetails(match)}
                        sx={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', cursor:'pointer' }} />
                      {/* gradient */}
                      <Box sx={{ position:'absolute', inset:0, pointerEvents:'none',
                        background:'linear-gradient(to bottom,rgba(0,0,0,0.3) 0%,transparent 35%,transparent 55%,rgba(0,0,0,0.72) 100%)' }} />
                      {/* rank badge */}
                      {isTop ? (
                        <Box sx={{ position:'absolute', top:10, left:10, bgcolor:'#fbbf24', borderRadius:10, px:1.2, py:0.3, display:'flex', alignItems:'center', gap:0.5 }}>
                          <EmojiEvents sx={{ fontSize:13, color:'#000' }} />
                          <Typography sx={{ fontWeight:800, fontSize:'0.7rem', color:'#000' }}>Best Match</Typography>
                        </Box>
                      ) : index<3 ? (
                        <Box sx={{ position:'absolute', top:10, left:10, bgcolor:'rgba(0,0,0,0.52)', borderRadius:10, px:1.2, py:0.3 }}>
                          <Typography sx={{ fontWeight:700, fontSize:'0.7rem', color:'#fff' }}>#{index+1}</Typography>
                        </Box>
                      ) : null}
                      {/* score ring */}
                      <Box sx={{ position:'absolute', top:8, right:8 }}>
                        <ScoreRing score={pet.hybridScore} size={56} />
                      </Box>
                      {/* name overlay */}
                      <Box sx={{ position:'absolute', bottom:0, left:0, right:0, p:1.8, pointerEvents:'none' }}>
                        <Typography sx={{ fontWeight:800, fontSize:'1.05rem', color:'#fff', textShadow:'0 1px 4px rgba(0,0,0,0.8)', lineHeight:1.2 }}>
                          {pet.name}
                        </Typography>
                        <Typography sx={{ color:'rgba(255,255,255,0.88)', fontSize:'0.78rem', textShadow:'0 1px 2px rgba(0,0,0,0.6)' }}>
                          {pet.breed}
                        </Typography>
                      </Box>
                    </Box>

                    {/* CARD BODY */}
                    <Box sx={{ p:2, flex:1, display:'flex', flexDirection:'column' }}>
                      {/* species/gender/age chips */}
                      <Box sx={{ display:'flex', gap:0.7, flexWrap:'wrap', mb:1.5 }}>
                        <Chip label={pet.species} size="small" sx={{ bgcolor:'#eff6ff', color:'#1d4ed8', fontWeight:600, fontSize:'0.68rem', height:20 }} />
                        {pet.gender && <Chip label={pet.gender} size="small" sx={{ bgcolor:'#fdf4ff', color:'#7e22ce', fontWeight:600, fontSize:'0.68rem', height:20 }} />}
                        {pet.age && <Chip label={pet.age} size="small" sx={{ bgcolor:'#fff7ed', color:'#c2410c', fontWeight:600, fontSize:'0.68rem', height:20 }} />}
                      </Box>

                      {/* match label + fee */}
                      <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:1.2 }}>
                        <Box sx={{ display:'flex', alignItems:'center', gap:0.6 }}>
                          <Box sx={{ width:7, height:7, borderRadius:'50%', bgcolor:color }} />
                          <Typography sx={{ fontWeight:700, fontSize:'0.8rem', color }}>
                            {scoreLabel(pet.hybridScore)} Match
                          </Typography>
                        </Box>
                        <Typography sx={{ fontSize:'0.8rem', fontWeight:700, color:'#374151' }}>
                          {pet.adoptionFee>0 ? '$'+pet.adoptionFee : 'Free'}
                        </Typography>
                      </Box>

                      {/* score bar */}
                      <LinearProgress variant="determinate" value={Math.min(100,pet.hybridScore)}
                        sx={{ height:5, borderRadius:3, bgcolor:'#f3f4f6', mb:1.5,
                          '& .MuiLinearProgress-bar':{ borderRadius:3, bgcolor:color } }} />

                      {/* top XAI reason (factor-level) or fallback to generic explanation */}
                      {(pet.xai?.topReasons?.length > 0 || pet.explanations.length > 0) && (
                        <Box sx={{ bgcolor: pet.xai?.topReasons?.[0]?.sentiment==='negative' ? '#fef2f2' : '#f0fdf4',
                          borderRadius:1.5, px:1.2, py:0.8, mb:1.5,
                          borderLeft:'3px solid '+(pet.xai?.topReasons?.[0]?.sentiment==='negative' ? '#ef4444' : color) }}>
                          <Box sx={{ display:'flex', alignItems:'center', gap:0.6, mb:0.2 }}>
                            <Lightbulb sx={{ fontSize:13, color: pet.xai?.topReasons?.[0]?.sentiment==='negative' ? '#ef4444' : '#166534' }} />
                            <Typography sx={{ fontSize:'0.65rem', fontWeight:800, color:'#6b7280', textTransform:'uppercase', letterSpacing:0.5 }}>
                              {pet.xai?.topReasons?.[0]?.factor || 'AI Insight'}
                            </Typography>
                          </Box>
                          <Typography sx={{ fontSize:'0.74rem', color: pet.xai?.topReasons?.[0]?.sentiment==='negative' ? '#991b1b' : '#166534', lineHeight:1.45 }}>
                            {pet.xai?.topReasons?.[0]?.text || String(pet.explanations[0]).replace(/^[✓⚠️~⚠]\s*/,'')}
                          </Typography>
                        </Box>
                      )}

                      <Box sx={{ flex:1 }} />

                      {/* actions */}
                      <Box sx={{ display:'flex', gap:1, mt:1.5 }}>
                        <Button size="small" variant="outlined" fullWidth onClick={()=>openDetails(match)}
                          sx={{ textTransform:'none', fontWeight:600, borderRadius:2, borderColor:'#d1d5db',
                            color:'#374151', fontSize:'0.78rem', '&:hover':{ borderColor:color, color } }}>
                          Details
                        </Button>
                        <Button size="small" variant="contained" fullWidth onClick={()=>navigate('/user/adoption/wizard/'+pet.id)}
                          sx={{ textTransform:'none', fontWeight:700, borderRadius:2, bgcolor:color,
                            fontSize:'0.78rem', '&:hover':{ bgcolor:color, filter:'brightness(0.88)' } }}>
                          Adopt
                        </Button>
                      </Box>
                      <Button size="small" onClick={()=>{ const b=(pet.breed||'').toLowerCase(); if(b) setDismissed(p=>new Set([...p,b])); }}
                        sx={{ mt:0.5, color:'#9ca3af', textTransform:'none', fontSize:'0.7rem', p:'2px 0' }}>
                        Not for me
                      </Button>
                    </Box>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Container>

      {/* ═══════════════════════════════════════════════════════
          DETAILS DIALOG — full two-panel layout
      ═══════════════════════════════════════════════════════ */}
      <Dialog open={drawerOpen} onClose={()=>setDrawerOpen(false)} maxWidth="lg" fullWidth
        scroll="paper"
        sx={{ '& .MuiDialog-container':{ alignItems:'flex-start' } }}
        PaperProps={{ sx:{
          borderRadius:{ xs:0, sm:3 }, overflow:'hidden',
          mt:{ xs:0, sm:'72px' },
          mb:{ xs:0, sm:'16px' },
          mx:{ xs:0, sm:'auto' },
          height:{ xs:'100dvh', sm:'calc(100vh - 94px)' },
          maxHeight:{ xs:'100dvh', sm:'calc(100vh - 94px)' },
          width:{ xs:'100%', sm:'calc(100% - 32px)' },
          maxWidth:'1100px'
        } }}>
        {selectedPet && (() => {
          const pet   = extractPet(selectedPet);
          const color = scoreColor(pet.hybridScore);
          const imgs  = pet.images.length>0 ? pet.images : [];
          const comps = buildComparisons(pet, userProfile);

          const algos = [
            { key:'content',       label:'Profile Compatibility', color:'#3b82f6',
              desc:"How well your lifestyle, space and experience match this pet's needs" },
            { key:'collaborative', label:'Collaborative Filter',  color:'#a855f7',
              desc:'Users with similar preferences adopted pets like this' },
            { key:'success',       label:'Success Prediction',    color:'#22c55e',
              desc:'XGBoost model predicts adoption outcome from historical data' },
            { key:'clustering',    label:'Personality Cluster',   color:'#f59e0b',
              desc:'K-Means personality similarity between your profile and this pet' },
          ];

          const statsRow = [
            { label:'Age',          val: pet.age||'—' },
            { label:'Weight',       val: pet.weight ? pet.weight+' kg' : '—' },
            { label:'Color',        val: pet.color||'—' },
            { label:'Adoption Fee', val: pet.adoptionFee>0 ? '$'+pet.adoptionFee : 'Free' },
            { label:'Vaccinated',   val: pet.vaccinationStatus==='up_to_date'?'✓ Yes': pet.vaccinationStatus==='partial'?'~ Partial':'—' },
            { label:'Type',         val: pet.clusterName || (pet.compat?.size ? pet.compat.size+' '+pet.species : pet.species) },
          ];

          // human-readable helpers
          const engLbl = n => ['','Very Low','Low','Medium','High','Very High'][Math.min(5,Math.max(1,Math.round(Number(n))))]||'Medium';
          const sizeLbl = s => ({ tiny:'Tiny', small:'Small', medium:'Medium', large:'Large', giant:'Giant' })[String(s).toLowerCase()] || String(s).replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
          const trainLbl = t => ({ untrained:'Needs Training', basic:'Basic-Trained', intermediate:'Well Trained', advanced:'Fully Trained' })[String(t).toLowerCase()] || String(t).replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
          const levelLbl = t => ({ low:'Low', moderate:'Moderate', medium:'Moderate', high:'High', very_high:'Very High' })[String(t).toLowerCase()] || String(t).replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
          const scoreLbl = s => { const n=Number(s); return n>=8?'Excellent':n>=6?'Good':n>=4?'Fair':'Not Ideal'; };
          const scoreClr = s => { const n=Number(s); return n>=8?'#22c55e':n>=6?'#3b82f6':n>=4?'#f59e0b':'#ef4444'; };

          const compatItems = [
            { icon:<Speed fontSize="small"/>,        label:'Energy Level',
              val: pet.compat.energyLevel!=null ? engLbl(pet.compat.energyLevel) : null,
              sub: pet.compat.energyLevel!=null ? `${pet.compat.energyLevel} / 5` : null },
            { icon:<Straighten fontSize="small"/>,   label:'Size',
              val: pet.compat.size ? sizeLbl(pet.compat.size) : null },
            { icon:<FitnessCenter fontSize="small"/>, label:'Training Level',
              val: pet.compat.trainedLevel ? trainLbl(pet.compat.trainedLevel) : null },
            { icon:<DirectionsRun fontSize="small"/>, label:'Exercise Needs',
              val: pet.compat.exerciseNeeds ? levelLbl(pet.compat.exerciseNeeds) : null },
            { icon:<ContentCut fontSize="small"/>,   label:'Grooming',
              val: pet.compat.groomingNeeds ? levelLbl(pet.compat.groomingNeeds) : null },
            { icon:<Home fontSize="small"/>,         label:'Apartment OK',
              val: pet.compat.canLiveInApartment!=null ? (pet.compat.canLiveInApartment?'Yes — Adapts Well':'No — Needs Space') : null,
              clr: pet.compat.canLiveInApartment ? '#22c55e' : '#ef4444' },
            { icon:<ChildCare fontSize="small"/>,    label:'With Children',
              val: pet.compat.childFriendlyScore!=null ? scoreLbl(pet.compat.childFriendlyScore) : null,
              sub: pet.compat.childFriendlyScore!=null ? `${pet.compat.childFriendlyScore}/10` : null,
              clr: pet.compat.childFriendlyScore!=null ? scoreClr(pet.compat.childFriendlyScore) : null },
            { icon:<Pets fontSize="small"/>,         label:'With Other Pets',
              val: pet.compat.petFriendlyScore!=null ? scoreLbl(pet.compat.petFriendlyScore) : null,
              sub: pet.compat.petFriendlyScore!=null ? `${pet.compat.petFriendlyScore}/10` : null,
              clr: pet.compat.petFriendlyScore!=null ? scoreClr(pet.compat.petFriendlyScore) : null },
            { icon:<WatchLater fontSize="small"/>,   label:'Max Time Alone',
              val: pet.compat.maxHoursAlone!=null ? `Up to ${pet.compat.maxHoursAlone} hours` : null },
            { icon:<AttachMoney fontSize="small"/>,  label:'Est. Monthly Cost',
              val: pet.compat.estimatedMonthlyCost ? `$${Number(pet.compat.estimatedMonthlyCost).toLocaleString()}/mo` : null },
          ].filter(r=>r.val!=null && r.val!=='');

          return (
            <Box sx={{ display:'flex', flexDirection:{ xs:'column', md:'row' }, height:'100%', overflow:'hidden' }}>

              {/* ══ LEFT: FULL IMAGE PANEL ══ */}
              <Box sx={{ width:{ xs:'100%', md:'42%' }, height:{ xs:300, md:'100%' },
                position:'relative', flexShrink:0, bgcolor:'#0f172a', overflow:'hidden' }}>

                {/* main image */}
                <Box component="img"
                  src={imgs.length>0 ? resolveImg(imgs[activeImg]) : '/placeholder-pet.svg'}
                  alt={pet.name}
                  onError={e=>{ e.target.src='/placeholder-pet.svg'; }}
                  sx={{ width:'100%', height:'100%', objectFit:'cover', opacity:0.88,
                    transition:'opacity 0.3s ease' }} />

                {/* dark gradient overlay */}
                <Box sx={{ position:'absolute', inset:0, pointerEvents:'none',
                  background:'linear-gradient(160deg,rgba(0,0,0,0.5) 0%,transparent 30%,transparent 45%,rgba(0,0,0,0.88) 100%)' }} />

                {/* close button */}
                <IconButton onClick={()=>setDrawerOpen(false)}
                  sx={{ position:'absolute', top:14, right:14, bgcolor:'rgba(255,255,255,0.92)',
                    boxShadow:'0 2px 8px rgba(0,0,0,0.3)',
                    '&:hover':{ bgcolor:'#fff', transform:'scale(1.05)' }, width:36, height:36 }}>
                  <Close fontSize="small" />
                </IconButton>

                {/* match score badge */}
                <Box sx={{ position:'absolute', top:14, left:14,
                  bgcolor:color, color:'#fff', borderRadius:2.5, px:1.8, py:1,
                  boxShadow:'0 4px 16px rgba(0,0,0,0.4)' }}>
                  <Typography sx={{ fontWeight:900, fontSize:'1.6rem', lineHeight:1 }}>
                    {Math.round(pet.hybridScore)}%
                  </Typography>
                  <Typography sx={{ fontSize:'0.58rem', fontWeight:800, letterSpacing:1.5, opacity:0.9 }}>MATCH</Typography>
                </Box>

                {/* name + breed at bottom */}
                <Box sx={{ position:'absolute', bottom:0, left:0, right:0, p:{ xs:2, md:3 } }}>
                  <Typography sx={{ fontWeight:900, fontSize:{ xs:'1.5rem', md:'2rem' }, color:'#fff',
                    textShadow:'0 2px 16px rgba(0,0,0,0.9)', lineHeight:1.1, mb:0.5 }}>
                    {pet.name}
                  </Typography>
                  <Typography sx={{ color:'rgba(255,255,255,0.82)', fontSize:'0.9rem', mb: imgs.length>1?1.5:0 }}>
                    {pet.breed}{pet.species?' · '+pet.species:''}{pet.gender?' · '+pet.gender:''}
                  </Typography>

                  {/* thumbnail strip inside image panel */}
                  {imgs.length>1 && (
                    <Box sx={{ display:'flex', gap:0.8, flexWrap:'wrap' }}>
                      {imgs.slice(0,6).map((im,i)=>(
                        <Box key={i} component="img" src={resolveImg(im)} alt=""
                          onError={e=>{ e.target.src='/placeholder-pet.svg'; }}
                          onClick={()=>setActiveImg(i)}
                          sx={{ width:{ xs:38, md:44 }, height:{ xs:38, md:44 }, borderRadius:1.5,
                            objectFit:'cover', cursor:'pointer', flexShrink:0,
                            border:'2.5px solid '+(i===activeImg?'#fff':'rgba(255,255,255,0.25)'),
                            opacity:i===activeImg?1:0.55, transition:'all 0.2s',
                            '&:hover':{ opacity:0.9 } }} />
                      ))}
                    </Box>
                  )}
                </Box>
              </Box>

              {/* ══ RIGHT: DETAILS PANEL ══ */}
              <Box sx={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', bgcolor:'#f9fafb' }}>

              {/* ── SCROLLABLE CONTENT ── */}
              <Box sx={{ flex:1, overflowY:'auto' }}>

                {/* quick stats */}
                <Box sx={{ bgcolor:'#fff', p:2.5, borderBottom:'1px solid #e5e7eb' }}>
                  <Grid container spacing={1.5}>
                    {statsRow.map(({ label, val })=>(
                      <Grid item xs={4} key={label}>
                        <Box sx={{ bgcolor:'#f9fafb', borderRadius:2, p:1.2, textAlign:'center' }}>
                          <Typography sx={{ fontWeight:700, fontSize:'0.86rem', color:'#111827' }}>{val}</Typography>
                          <Typography sx={{ fontSize:'0.66rem', color:'#9ca3af', mt:0.2 }}>{label}</Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>

                {/* ── XAI: WHY THIS PET? (Explainable AI) ── */}
                <Box sx={{ bgcolor:'#fff', my:1.5, p:2.5 }}>
                  <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:0.4 }}>
                    <Lightbulb sx={{ fontSize:20, color:'#f59e0b' }} />
                    <Typography sx={{ fontWeight:800, fontSize:'1rem', color:'#111827' }}>Why This Pet?</Typography>
                  </Box>
                  <Typography sx={{ fontSize:'0.77rem', color:'#6b7280', mb:2 }}>
                    Explainable AI — every factor that influenced this recommendation
                  </Typography>

                  {/* XAI Factor Breakdown */}
                  {pet.xai?.topReasons?.length > 0 ? (
                    <Box sx={{ mb:2 }}>
                      {pet.xai.topReasons.map((f, i) => <XaiFactorRow key={i} factor={f} />)}
                    </Box>
                  ) : comps.length > 0 ? (
                    comps.map((row, i) => <CompareRow key={i} {...row} />)
                  ) : (
                    <Typography variant="body2" sx={{ color:'#9ca3af' }}>Complete your profile to see comparisons.</Typography>
                  )}

                  {/* Algorithm Insights — per-algorithm natural language */}
                  {pet.xai?.algorithmInsights?.length > 0 && (
                    <Box sx={{ mt:2, pt:2, borderTop:'1px solid #f3f4f6' }}>
                      <Typography sx={{ fontSize:'0.77rem', fontWeight:700, color:'#374151', mb:1.2 }}>Algorithm Insights</Typography>
                      <Stack spacing={1}>
                        {pet.xai.algorithmInsights.map((ins, i) => (
                          <Box key={i} sx={{ bgcolor:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:2, p:1.4 }}>
                            <Box sx={{ display:'flex', alignItems:'center', gap:0.8, mb:0.5 }}>
                              <Box sx={{ width:8, height:8, borderRadius:'50%', bgcolor:ins.color, flexShrink:0 }} />
                              <Typography sx={{ fontWeight:700, fontSize:'0.78rem', color:'#111827', flex:1 }}>
                                {ins.algorithm}
                              </Typography>
                              <Typography sx={{ fontWeight:800, fontSize:'0.78rem', color:ins.color }}>
                                {Math.round(ins.score)}%
                              </Typography>
                            </Box>
                            <Typography sx={{ fontSize:'0.76rem', color:'#4b5563', lineHeight:1.55 }}>
                              {ins.explanation}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {/* XGBoost Feature Importance */}
                  {pet.xai?.xgboostFactors?.length > 0 && (
                    <Box sx={{ mt:2, pt:2, borderTop:'1px solid #f3f4f6' }}>
                      <Box sx={{ display:'flex', alignItems:'center', gap:0.8, mb:1.2 }}>
                        <BarChart sx={{ fontSize:17, color:'#22c55e' }} />
                        <Typography sx={{ fontSize:'0.77rem', fontWeight:700, color:'#374151' }}>
                          XGBoost — Top Decision Factors
                        </Typography>
                      </Box>
                      <Typography sx={{ fontSize:'0.72rem', color:'#9ca3af', mb:1.5 }}>
                        Features the ML model weighs most when predicting adoption success
                      </Typography>
                      <XgbFeatureChart factors={pet.xai.xgboostFactors} />
                    </Box>
                  )}

                  {/* Fallback: legacy AI text explanations */}
                  {!pet.xai?.topReasons?.length && pet.explanations.filter(e=>!String(e).startsWith('⚠')).length>0 && (
                    <Box sx={{ mt:2, pt:2, borderTop:'1px solid #f3f4f6' }}>
                      <Typography sx={{ fontSize:'0.77rem', fontWeight:700, color:'#374151', mb:1 }}>AI Insights</Typography>
                      <Stack spacing={0.8}>
                        {pet.explanations.slice(0,4).map((exp,i)=>{
                          const isW = String(exp).includes('⚠')||String(exp).includes('Partial');
                          return (
                            <Box key={i} sx={{ display:'flex', gap:1, alignItems:'flex-start' }}>
                              {isW
                                ? <Warning sx={{ fontSize:14, color:'#f59e0b', flexShrink:0, mt:0.15 }}/>
                                : <Check   sx={{ fontSize:14, color:'#22c55e', flexShrink:0, mt:0.15 }}/>}
                              <Typography sx={{ fontSize:'0.77rem', color:'#374151', lineHeight:1.55 }}>
                                {String(exp).replace(/^[✓⚠️~⚠]\s*/,'')}
                              </Typography>
                            </Box>
                          );
                        })}
                      </Stack>
                    </Box>
                  )}

                  {/* Trait-by-trait fallback when XAI has full factor breakdown */}
                  {pet.xai?.factorBreakdown?.length > 0 && comps.length > 0 && (
                    <Box sx={{ mt:2, pt:2, borderTop:'1px solid #f3f4f6' }}>
                      <Typography sx={{ fontSize:'0.77rem', fontWeight:700, color:'#374151', mb:1 }}>
                        Detailed Trait Comparison
                      </Typography>
                      {comps.map((row, i) => <CompareRow key={i} {...row} />)}
                    </Box>
                  )}

                  {/* warnings */}
                  {(pet.matchDetails?.warnings||[]).length>0 && (
                    <Box sx={{ mt:2 }}>
                      {pet.matchDetails.warnings.map((w,i)=>(
                        <Alert key={i} severity="warning" sx={{ mb:1, borderRadius:2, fontSize:'0.78rem' }}>
                          {String(w).replace(/^⚠[️\s]*/,'')}
                        </Alert>
                      ))}
                    </Box>
                  )}
                </Box>

                {/* ── SCORE BREAKDOWN ── */}
                <Box sx={{ bgcolor:'#fff', my:1.5, p:2.5 }}>
                  <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                    cursor:'pointer', mb: showAlgo?2:0 }} onClick={()=>setShowAlgo(v=>!v)}>
                    <Box>
                      <Typography sx={{ fontWeight:800, fontSize:'1rem', color:'#111827' }}>Score Breakdown</Typography>
                      <Typography sx={{ fontSize:'0.74rem', color:'#6b7280' }}>How each AI algorithm scored this match</Typography>
                    </Box>
                    <Box sx={{ display:'flex', gap:0.5, alignItems:'center' }}>
                      <ScoreRing score={pet.hybridScore} size={44} />
                      {showAlgo ? <KeyboardArrowUp sx={{ color:'#9ca3af' }}/> : <KeyboardArrowDown sx={{ color:'#9ca3af' }}/>}
                    </Box>
                  </Box>

                  <Collapse in={showAlgo}>
                    {algos.map(({ key, label, color:ac, desc })=>{
                      const v = pet.algorithmScores?.[key]||0;
                      return v>0 ? <AlgoBar key={key} label={label} value={v} color={ac} desc={desc} /> : null;
                    })}

                    {/* match_details score breakdown */}
                    {pet.matchDetails?.score_breakdown && Object.keys(pet.matchDetails.score_breakdown).length>0 && (
                      <Box sx={{ mt:2, pt:2, borderTop:'1px solid #f3f4f6' }}>
                        <Typography sx={{ fontSize:'0.77rem', fontWeight:700, color:'#6b7280', mb:1.5 }}>Profile Match Detail</Typography>
                        {Object.entries(pet.matchDetails.score_breakdown).map(([k,v])=>(
                          <AlgoBar key={k}
                            label={k.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}
                            value={Number(v)} color={scoreColor(Number(v))} />
                        ))}
                      </Box>
                    )}

                    {pet.successProbability>0 && (
                      <Box sx={{ mt:2, p:2, bgcolor:'#f0fdf4', borderRadius:2, border:'1px solid #bbf7d0' }}>
                        <Typography sx={{ fontWeight:700, color:'#166534', fontSize:'0.88rem' }}>
                          🎯 {Math.round(pet.successProbability*100)}% Predicted Success Rate
                        </Typography>
                        <Typography sx={{ fontSize:'0.74rem', color:'#166534', opacity:0.8, mt:0.3 }}>
                          Based on historical adoptions with similar profiles
                        </Typography>
                      </Box>
                    )}
                  </Collapse>

                  {/* collapsed mini bar preview */}
                  {!showAlgo && (
                    <Box sx={{ mt:1.5, display:'flex', gap:1 }}>
                      {algos.filter(a=>(pet.algorithmScores?.[a.key]||0)>0).map(({ key, color:ac })=>(
                        <Tooltip key={key} title={algos.find(a=>a.key===key)?.label+': '+Math.round(pet.algorithmScores[key])+'%'}>
                          <Box sx={{ flex:1, height:4, borderRadius:2, bgcolor:ac,
                            opacity: 0.2+0.8*(pet.algorithmScores[key]/100) }} />
                        </Tooltip>
                      ))}
                    </Box>
                  )}
                </Box>

                {/* ── ABOUT ── */}
                {pet.description && (
                  <Box sx={{ bgcolor:'#fff', my:1.5, p:2.5 }}>
                    <Typography sx={{ fontWeight:800, fontSize:'1rem', color:'#111827', mb:1 }}>About {pet.name}</Typography>
                    <Typography sx={{ fontSize:'0.87rem', color:'#4b5563', lineHeight:1.78 }}>{pet.description}</Typography>
                  </Box>
                )}

                {/* ── TEMPERAMENT TAGS ── */}
                {pet.temperamentTags.length>0 && (
                  <Box sx={{ bgcolor:'#fff', my:1.5, p:2.5 }}>
                    <Typography sx={{ fontWeight:800, fontSize:'1rem', color:'#111827', mb:1.5 }}>Temperament</Typography>
                    <Box sx={{ display:'flex', gap:1, flexWrap:'wrap' }}>
                      {pet.temperamentTags.map((tag,i)=>{
                        const bad = ['aggressive','bites','reactive','territorial'].includes(String(tag).toLowerCase());
                        return (
                          <Chip key={i} label={String(tag)}
                            sx={{ bgcolor:bad?'#fef2f2':'#f0fdf4', color:bad?'#dc2626':'#166534',
                              fontWeight:600, fontSize:'0.78rem',
                              border:'1px solid '+(bad?'#fecaca':'#bbf7d0') }} />
                        );
                      })}
                    </Box>
                  </Box>
                )}

                {/* ── PET REQUIREMENTS GRID ── */}
                {compatItems.length>0 && (
                  <Box sx={{ bgcolor:'#fff', my:1.5, p:2.5 }}>
                    <Typography sx={{ fontWeight:800, fontSize:'1rem', color:'#111827', mb:0.3 }}>{pet.name}'s Profile</Typography>
                    <Typography sx={{ fontSize:'0.75rem', color:'#6b7280', mb:2 }}>Key characteristics &amp; care requirements</Typography>
                    <Grid container spacing={1.2}>
                      {compatItems.map(({ icon, label, val, sub, clr })=>(
                        <Grid item xs={6} key={label}>
                          <Box sx={{ bgcolor:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:2,
                            p:1.4, display:'flex', alignItems:'flex-start', gap:1 }}>
                            <Box sx={{ color: clr||'#6b7280', mt:0.1, flexShrink:0 }}>{icon}</Box>
                            <Box>
                              <Typography sx={{ fontSize:'0.62rem', color:'#9ca3af', fontWeight:700,
                                textTransform:'uppercase', letterSpacing:0.5, mb:0.2 }}>{label}</Typography>
                              <Typography sx={{ fontWeight:700, fontSize:'0.84rem', color: clr||'#111827', lineHeight:1.2 }}>{val}</Typography>
                              {sub && <Typography sx={{ fontSize:'0.68rem', color:'#9ca3af', mt:0.2 }}>{sub}</Typography>}
                            </Box>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}

                <Box sx={{ height:90 }} />
              </Box>

              {/* ── STICKY FOOTER ── */}
              <Box sx={{ flexShrink:0, bgcolor:'#fff', borderTop:'1px solid #e5e7eb',
                p:2, display:'flex', gap:1.5 }}>
                <Button variant="outlined" fullWidth onClick={()=>setDrawerOpen(false)}
                  sx={{ textTransform:'none', fontWeight:600, borderRadius:2.5, borderColor:'#d1d5db', color:'#374151',
                    '&:hover':{ borderColor:'#9ca3af' } }}>
                  Close
                </Button>
                <Button variant="contained" fullWidth startIcon={<Favorite/>}
                  onClick={()=>{ setDrawerOpen(false); navigate('/user/adoption/wizard/'+pet.id); }}
                  sx={{ textTransform:'none', fontWeight:700, borderRadius:2.5, fontSize:'0.94rem',
                    bgcolor:color, boxShadow:'none',
                    '&:hover':{ bgcolor:color, filter:'brightness(0.88)', boxShadow:'none' } }}>
                  Adopt {pet.name}
                </Button>
              </Box>
              </Box>{/* end right panel */}
            </Box>
          );
        })()}
      </Dialog>
    </Box>
  );
};

export default SmartMatches;
