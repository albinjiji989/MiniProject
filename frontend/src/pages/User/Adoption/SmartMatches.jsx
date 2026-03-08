import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient, resolveMediaUrl } from '../../../services/api';
import {
  Box, Container, Typography, Button, Grid, Chip, LinearProgress,
  CircularProgress, IconButton, Dialog, Stack, Alert, Tooltip, Collapse
} from '@mui/material';
import {
  Refresh, Settings, Close, Pets, Favorite, EmojiEvents,
  Check, Warning, AutoAwesome, Psychology, Home, FitnessCenter,
  ChildCare, AttachMoney, Straighten, Speed, ContentCut, WatchLater,
  DirectionsRun, KeyboardArrowDown, KeyboardArrowUp
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

/* ─── User vs Pet comparison row ────────────────────────────── */
const CompareRow = ({ icon, label, userVal, petVal, status }) => {
  const col = { ok:'#22c55e', warn:'#f59e0b', bad:'#ef4444' }[status]||'#6b7280';
  const Ico = { ok: Check, warn: Warning, bad: Warning }[status]||Check;
  return (
    <Box sx={{ display:'flex', alignItems:'center', gap:1.5, py:1.2,
      borderBottom:'1px solid #f3f4f6', '&:last-child':{ borderBottom:'none' } }}>
      <Box sx={{ color:'#9ca3af', display:'flex' }}>{icon}</Box>
      <Typography variant="body2" sx={{ fontWeight:600, color:'#374151', minWidth:110, flexShrink:0 }}>{label}</Typography>
      <Box sx={{ flex:1, display:'flex', alignItems:'center', gap:0.6, flexWrap:'wrap' }}>
        <Chip label={userVal} size="small"
          sx={{ bgcolor:'#eff6ff', color:'#1d4ed8', fontWeight:600, fontSize:'0.72rem', height:22 }} />
        <Typography sx={{ color:'#9ca3af', fontSize:'0.7rem' }}>→</Typography>
        <Chip label={petVal} size="small"
          sx={{ bgcolor:'#f9fafb', color:'#374151', fontWeight:600, fontSize:'0.72rem', height:22 }} />
      </Box>
      <Ico sx={{ fontSize:18, color:col, flexShrink:0 }} />
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
    // Activity
    const uAct = Number(user.activityLevel||3), pEng = Number(c.energyLevel||3), adiff = Math.abs(uAct-pEng);
    rows.push({ icon:<DirectionsRun fontSize="small"/>, label:'Activity Level',
      userVal:`Level ${uAct}/5`, petVal:`Energy ${pEng}/5`,
      status: adiff<=1?'ok': adiff<=2?'warn':'bad' });
    // Space
    const ht = String(user.homeType||'').toLowerCase(), canApt = c.canLiveInApartment!==false, needYard = c.needsYard===true, hasYard = user.hasYard===true;
    let spSt='ok'; if(ht.includes('apartment')&&!canApt) spSt='bad'; else if(needYard&&!hasYard) spSt='warn';
    rows.push({ icon:<Home fontSize="small"/>, label:'Living Space',
      userVal: ht||'home', petVal: needYard?'Yard needed': canApt?'Apartment OK':'House needed', status:spSt });
    // Experience
    const expM={beginner:1,first_time:1,some_experience:2,intermediate:2,experienced:3,advanced:3};
    const trM={untrained:1,basic:2,intermediate:3,advanced:4};
    const uExp=expM[String(user.experienceLevel||'beginner').toLowerCase()]||1;
    const pTr=trM[String(c.trainedLevel||'basic').toLowerCase()]||2;
    rows.push({ icon:<FitnessCenter fontSize="small"/>, label:'Experience',
      userVal: user.experienceLevel||'Beginner', petVal: c.trainedLevel||'Basic',
      status: uExp>=pTr?'ok': uExp>=pTr-1?'warn':'bad' });
    // Children
    if (user.hasChildren) {
      const cs=Number(c.childFriendlyScore||5);
      rows.push({ icon:<ChildCare fontSize="small"/>, label:'Good with Kids',
        userVal:'Has children', petVal:`Score ${cs}/10`, status:cs>=7?'ok':cs>=4?'warn':'bad' });
    }
    // Other pets
    if (user.hasOtherPets) {
      const ps=Number(c.petFriendlyScore||5);
      rows.push({ icon:<Pets fontSize="small"/>, label:'Other Pets',
        userVal:'Has other pets', petVal:`Score ${ps}/10`, status:ps>=7?'ok':ps>=4?'warn':'bad' });
    }
    // Time alone
    const uH=Number(user.hoursAlonePerDay||8), pM=Number(c.maxHoursAlone||6);
    rows.push({ icon:<WatchLater fontSize="small"/>, label:'Time Alone',
      userVal:`${uH}h/day`, petVal:`Max ${pM}h`, status:uH<=pM?'ok':uH<=pM+2?'warn':'bad' });
    // Budget
    const uB=Number(user.monthlyBudget||0), pC=Number(c.estimatedMonthlyCost||0);
    if(uB>0&&pC>0) rows.push({ icon:<AttachMoney fontSize="small"/>, label:'Monthly Cost',
      userVal:`$${uB}/mo budget`, petVal:`~$${pC}/mo`, status:pC<=uB?'ok':pC<=uB*1.3?'warn':'bad' });
    return rows;
  };

  const openDetails = match => { setSelectedPet(match); setActiveImg(0); setDrawerOpen(true); };

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

  const visible = matches.filter(m => !dismissed.has((extractPet(m).breed||'').toLowerCase()));

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
                  {visible.length} compatible pets ranked for you
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
            <Typography variant="h6" sx={{ fontWeight:700, color:'#374151', mb:1 }}>No matches found</Typography>
            <Typography sx={{ color:'#6b7280', mb:3 }}>No pets currently match your profile. Try updating your preferences.</Typography>
            <Button variant="contained" onClick={()=>navigate('/user/adoption/profile-wizard')}
              sx={{ bgcolor:'#065f46', textTransform:'none', fontWeight:700, borderRadius:2 }}>
              Update Preferences
            </Button>
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

                      {/* top AI reason */}
                      {pet.explanations.length>0 && (
                        <Box sx={{ bgcolor:'#f0fdf4', borderRadius:1.5, px:1.2, py:0.8, mb:1.5, borderLeft:'3px solid '+color }}>
                          <Typography sx={{ fontSize:'0.74rem', color:'#166534', lineHeight:1.45 }}>
                            {String(pet.explanations[0]).replace(/^[✓⚠️~⚠]\s*/,'')}
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

          const compatItems = [
            { icon:<Speed fontSize="small"/>,       label:'Energy',      val: pet.compat.energyLevel!=null?`${pet.compat.energyLevel}/5`:null },
            { icon:<Straighten fontSize="small"/>,  label:'Size',        val: pet.compat.size||null },
            { icon:<FitnessCenter fontSize="small"/>,label:'Training',   val: pet.compat.trainedLevel||null },
            { icon:<DirectionsRun fontSize="small"/>,label:'Exercise',   val: pet.compat.exerciseNeeds||null },
            { icon:<ContentCut fontSize="small"/>,  label:'Grooming',    val: pet.compat.groomingNeeds||null },
            { icon:<Home fontSize="small"/>,        label:'Apt OK',      val: pet.compat.canLiveInApartment!=null?(pet.compat.canLiveInApartment?'Yes':'No'):null },
            { icon:<ChildCare fontSize="small"/>,   label:'Kids',        val: pet.compat.childFriendlyScore!=null?`${pet.compat.childFriendlyScore}/10`:null },
            { icon:<Pets fontSize="small"/>,        label:'Pets',        val: pet.compat.petFriendlyScore!=null?`${pet.compat.petFriendlyScore}/10`:null },
            { icon:<WatchLater fontSize="small"/>,  label:'Max Alone',   val: pet.compat.maxHoursAlone!=null?`${pet.compat.maxHoursAlone}h`:null },
            { icon:<AttachMoney fontSize="small"/>, label:'Monthly',     val: pet.compat.estimatedMonthlyCost?`~$${pet.compat.estimatedMonthlyCost}`:null },
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

                {/* ── WHY YOU MATCH ── */}
                <Box sx={{ bgcolor:'#fff', my:1.5, p:2.5 }}>
                  <Typography sx={{ fontWeight:800, fontSize:'1rem', color:'#111827', mb:0.4 }}>Why You Match</Typography>
                  <Typography sx={{ fontSize:'0.77rem', color:'#6b7280', mb:2 }}>
                    Trait-by-trait: your profile vs {pet.name}'s needs
                  </Typography>

                  {comps.length>0
                    ? comps.map((row,i)=><CompareRow key={i} {...row} />)
                    : <Typography variant="body2" sx={{ color:'#9ca3af' }}>Complete your profile to see comparisons.</Typography>
                  }

                  {/* AI text explanations */}
                  {pet.explanations.filter(e=>!String(e).startsWith('⚠')).length>0 && (
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
                    <Typography sx={{ fontWeight:800, fontSize:'1rem', color:'#111827', mb:1.5 }}>{pet.name}'s Requirements</Typography>
                    <Grid container spacing={1.5}>
                      {compatItems.map(({ icon, label, val })=>(
                        <Grid item xs={4} key={label}>
                          <Box sx={{ bgcolor:'#f9fafb', borderRadius:2, p:1.2, display:'flex', flexDirection:'column', alignItems:'center', gap:0.5 }}>
                            <Box sx={{ color:'#9ca3af' }}>{icon}</Box>
                            <Typography sx={{ fontWeight:700, fontSize:'0.8rem', color:'#111827', textAlign:'center' }}>{val}</Typography>
                            <Typography sx={{ fontSize:'0.64rem', color:'#9ca3af', textAlign:'center' }}>{label}</Typography>
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
