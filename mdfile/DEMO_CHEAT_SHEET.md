# 🎯 BLOCKCHAIN DEMO CHEAT SHEET
## Print This - One Page Reference

---

## ⚡ THE ANSWER

**Q**: What does blockchain show when MongoDB is tampered?

**A**: Admin sees Block #10 (fee: $500) vs Block #13 (paid: $50) = $450 loss detected!

---

## 🎬 DEMO STEPS (10 MIN)

### 1. CREATE PET (2 min)
```
POST /api/adoption/manager/pets
{ "name": "Buddy", "adoptionFee": 500 }

→ Show in explorer: Block #10, Amount: $500
```

### 2. TAMPER MONGODB (2 min)
```
MongoDB Compass → adoptionpets
Change: adoptionFee: 500 → 50
```

### 3. USER ADOPTS (3 min)
```
POST /applications (user applies)
POST /approve (manager approves)
POST /payments/verify (user pays $50)
```

### 4. SHOW DETECTION (3 min)
```
Explorer → Expand BUD12345
Point: Block #10 = $500
Point: Block #13 = $50
Say: "$450 loss detected!"
```

---

## 🎤 KEY PHRASES

**Block #10**: "Original fee $500 recorded immutably"  
**Block #13**: "User paid $50 - tampered amount"  
**Discrepancy**: "$450 loss detected through blockchain comparison"  
**Missing Event**: "No PET_FEE_CHANGED proves unauthorized modification"  
**SHA-256**: "Cryptographic fingerprint ensures data integrity"  
**Verified**: "Chain intact, but data discrepancy exists"

---

## 🔑 TECHNICAL TERMS

**SHA-256**: Cryptographic hash function (64 chars)  
**Proof-of-Work**: Hash must start with "00"  
**Chain Linkage**: Each block stores previous hash  
**Merkle Root**: Single hash of all transactions  
**Immutable**: Cannot change without detection  
**Nonce**: Number tried to find valid hash

---

## 📍 URLS

- Explorer: `http://localhost:5173/admin/pets/blockchain/explorer`
- Backend: `http://localhost:5000`
- MongoDB: `mongodb://localhost:27017`

---

## 🎯 WHAT ADMIN SEES

```
Block #10: $500 (original)  ← Point here
Block #13: $50 (tampered)   ← Point here
Loss: $450                  ← Emphasize
Missing: PET_FEE_CHANGED    ← Explain
```

---

## ❓ QUICK Q&A

**Q**: Why not prevent?  
**A**: Detection simpler, prevention needs change streams

**Q**: Can attacker modify blocks?  
**A**: Yes, but verification fails (hash mismatch)

**Q**: Production ready?  
**A**: Yes for audit trail, needs enhancements for prevention

---

## ✅ CHECKLIST

- [ ] Backend running
- [ ] Frontend running
- [ ] MongoDB running
- [ ] Admin logged in
- [ ] Explorer page open
- [ ] Compass open
- [ ] Postman ready

---

## 🎉 CONFIDENCE

You have:
✅ Real SHA-256  
✅ Real proof-of-work  
✅ Real chain linkage  
✅ Real detection  

**YOU'RE READY! 🚀**

