import express, { type NextFunction, type Request, type Response } from 'express';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import crypto from 'node:crypto';

const app = express();
app.use(express.json({ limit: '1mb' }));

function getAdminApp() {
  if (getApps().length) return getApps()[0];
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase Admin environment variables: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
  }
  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

const db = () => getFirestore(getAdminApp());

export function getXpForLevel(level: number) { return Math.floor(100 * Math.pow(level, 1.45)); }
export function calculateLevelData(totalXp: number) {
  let level = 1, xpRemaining = Math.max(0, totalXp);
  while (xpRemaining >= getXpForLevel(level)) { xpRemaining -= getXpForLevel(level); level++; }
  const next = getXpForLevel(level);
  return { level, currentLevelXp: xpRemaining, nextLevelXp: next, progressPct: Math.min(100, Math.floor((xpRemaining / next) * 100)) };
}

const REWARDS: Record<string, { xp: number; gold: number; stat: number }> = {
  Easy: { xp: 50, gold: 15, stat: 1 }, Medium: { xp: 80, gold: 25, stat: 2 }, Hard: { xp: 120, gold: 40, stat: 3 }, Epic: { xp: 250, gold: 100, stat: 5 }
};
const ATTRIBUTE_BY_CATEGORY: Record<string, string> = {
  Academics: 'intellect', Coding: 'intellect', Fitness: 'strength', Reading: 'wisdom', Creativity: 'creativity', Discipline: 'discipline', Personal: 'discipline'
};
const ACHIEVEMENTS = [
  { id:'ach-first-quest', name:'FIRST QUEST', description:'Complete your first quest.', icon:'Flag', requirement:'1 quest completed', xpReward:50, goldReward:20, category:'General' },
  { id:'ach-streak-7', name:'ON FIRE', description:'Maintain a 7-day streak.', icon:'Flame', requirement:'7-day streak', xpReward:100, goldReward:50, category:'Streaks' },
  { id:'ach-streak-14', name:'UNSTOPPABLE', description:'Maintain a 14-day streak.', icon:'Zap', requirement:'14-day streak', xpReward:250, goldReward:100, category:'Streaks' },
  { id:'ach-level-5', name:'ADVENTURER', description:'Reach Level 5.', icon:'Star', requirement:'Reach Level 5', xpReward:200, goldReward:80, category:'Progression' },
  { id:'ach-level-10', name:'WARRIOR', description:'Reach Level 10.', icon:'Shield', requirement:'Reach Level 10', xpReward:500, goldReward:200, category:'Progression' },
  { id:'ach-level-20', name:'ELITE', description:'Reach Level 20.', icon:'Award', requirement:'Reach Level 20', xpReward:1000, goldReward:500, category:'Progression' },
  { id:'ach-intellect-5', name:'KNOWLEDGE SEEKER', description:'Complete 5 Intellect quests.', icon:'BookOpen', requirement:'5 Intellect quests', xpReward:150, goldReward:60, category:'Attributes' },
  { id:'ach-strength-5', name:'TITAN OF STRENGTH', description:'Complete 5 Strength quests.', icon:'Activity', requirement:'5 Strength quests', xpReward:150, goldReward:60, category:'Attributes' },
  { id:'ach-discipline-5', name:'MASTER OF DISCIPLINE', description:'Complete 5 Discipline quests.', icon:'Target', requirement:'5 Discipline quests', xpReward:150, goldReward:60, category:'Attributes' },
  { id:'ach-quests-10', name:'QUEST MASTER', description:'Complete 10 quests of any type.', icon:'CheckCircle', requirement:'10 quests completed', xpReward:300, goldReward:150, category:'General' },
  { id:'ach-shop-3', name:'COSMETIC COLLECTOR', description:'Purchase 3 items from the shop.', icon:'ShoppingBag', requirement:'3 shop items bought', xpReward:200, goldReward:100, category:'Shop' }
];
const SHOP_ITEMS = [
  ['char-male-cyber-knight','Cybernetic Knight (Male)','characters',300,1,'Shield','male'],['char-male-astral-mage','Astral Sorcerer (Male)','characters',400,2,'Sparkles','male'],['char-male-shadow-rogue','Shadow Assassin (Male)','characters',500,3,'Zap','male'],['char-male-solar-paladin','Solar Paladin (Male)','characters',800,5,'Crown','male'],
  ['char-female-cyber-knight','Cybernetic Knight (Female)','characters',300,1,'Shield','female'],['char-female-astral-mage','Astral Sorceress (Female)','characters',400,2,'Sparkles','female'],['char-female-shadow-rogue','Shadow Assassin (Female)','characters',500,3,'Zap','female'],['char-female-solar-paladin','Solar Valkyrie Paladin (Female)','characters',800,5,'Crown','female'],
  ['frame-neon','Neon Frame','frames',150,1,'Square'],['frame-galaxy','Galaxy Frame','frames',450,4,'Sparkles'],['frame-royal','Royal Gold Frame','frames',800,8,'Award'],['frame-cyber','Cyber Matrix Frame','frames',1500,12,'Cpu'],
  ['effect-lightning','Lightning XP Burst','effects',300,3,'Zap'],['effect-fire','Flame Aura','effects',600,6,'Flame'],['effect-crystal','Crystal Nova','effects',900,9,'Gem'],['effect-energy','Energy Pulse','effects',1400,11,'Activity'],
  ['theme-cyber','Cyber Night (Default)','themes',0,1,''],['theme-forest','Mystic Forest','themes',350,4,''],['theme-solar','Solar Gold','themes',700,7,''],['theme-void','Midnight Void','themes',1000,10,''],['theme-aurora','Aurora Neon','themes',1800,14,''],
  ['title-explorer','Explorer','nameplates',0,1,'Shield'],['title-scholar','Arcane Scholar','nameplates',150,2,'BookOpen'],['title-architect','Cyber Architect','nameplates',400,5,'Cpu'],['title-elite','Elite Paragon','nameplates',800,8,'Award'],['title-legend','Grandmaster Legend','nameplates',2000,15,'Crown'],['title-cyber','Cyberpunk Phantom','nameplates',1200,10,'Zap'],['title-void','Void Shadow Lord','nameplates',1600,12,'Flame'],
  ['bg-dojo','Cyber Dojo','backgrounds',250,2,'MapPin'],['bg-citadel','Citadel Spire','backgrounds',500,5,'Globe'],['bg-temple','Celestial Temple','backgrounds',1000,10,'Sparkles'],['bg-neon-grid','Neon Matrix Void','backgrounds',750,7,'Zap'],['bg-shadow-dungeon','Shadow Dungeon','backgrounds',1200,11,'Shield'],['bg-solar-sanctuary','Solar Sanctuary','backgrounds',1500,13,'Sun']
].map(([id,name,category,price,requiredLevel,icon,gender]) => ({ id, name, description:`${name} cosmetic reward.`, category, price, requiredLevel, icon, ...(gender ? {gender} : {}) }));

interface AuthedRequest extends Request { uid?: string; authUser?: any }
async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) return res.status(401).json({ error:'Authentication required' });
    const decoded = await getAuth(getAdminApp()).verifyIdToken(header.slice(7));
    req.uid = decoded.uid; req.authUser = decoded;
    next();
  } catch { res.status(401).json({ error:'Invalid or expired Google authentication token' }); }
}

function cleanUser(id: string, data: any) { return { id, ...data }; }
async function ensureUser(uid: string, authUser?: any) {
  const ref = db().collection('users').doc(uid); const snap = await ref.get();
  if (snap.exists) return cleanUser(uid, snap.data());
  const now = new Date().toISOString();
  const user = { email: authUser?.email || '', username: authUser?.name || authUser?.email?.split('@')[0] || 'Hero', characterClass:'Balanced', gender: undefined, level:1,totalXp:0,gold:50,currentStreak:0,longestStreak:0,equippedTheme:'theme-cyber',equippedTitle:'Explorer',equippedFrame:'frame-neon',equippedEffect:'',equippedBackground:'bg-dojo',equippedWearables:{},createdAt:now };
  await db().collection('users').doc(uid).set(user);
  await db().collection('stats').doc(uid).set({ intellect:0,strength:0,discipline:0,wisdom:0,creativity:0 });
  return cleanUser(uid,user);
}

app.get('/api/health', (_req,res)=>res.json({ok:true,service:'QUESTORA API',database:'Firestore',auth:'Firebase Google OAuth'}));
app.post('/api/auth/google', requireAuth, async (req:AuthedRequest,res) => { const user=await ensureUser(req.uid!,req.authUser); const stats=(await db().collection('stats').doc(req.uid!).get()).data()||{}; res.json({user,stats}); });
app.get('/api/auth/me', requireAuth, async (req:AuthedRequest,res)=>{ const user=await ensureUser(req.uid!,req.authUser); const stats=(await db().collection('stats').doc(req.uid!).get()).data()||{}; res.json({user,stats}); });
app.post('/api/auth/logout', (_req,res)=>res.json({success:true}));

app.post('/api/onboarding/setup', requireAuth, async (req:AuthedRequest,res)=>{ const uid=req.uid!; const patch:any={}; if(req.body.characterClass) patch.characterClass=req.body.characterClass; if(Array.isArray(req.body.goals)) patch.goals=req.body.goals.slice(0,20); await db().collection('users').doc(uid).set(patch,{merge:true}); const user=cleanUser(uid,(await db().collection('users').doc(uid).get()).data()); const stats=(await db().collection('stats').doc(uid).get()).data()||{}; res.json({user,stats}); });
app.post('/api/user/avatar', requireAuth, async(req:AuthedRequest,res)=>{ const patch:any={}; if(req.body.customAvatarUrl!==undefined) patch.customAvatarUrl=String(req.body.customAvatarUrl).slice(0,2000); if(req.body.userPhotoUrl!==undefined) patch.userPhotoUrl=String(req.body.userPhotoUrl).slice(0,2000); await db().collection('users').doc(req.uid!).set(patch,{merge:true}); const user=cleanUser(req.uid!, (await db().collection('users').doc(req.uid!).get()).data()); const stats=(await db().collection('stats').doc(req.uid!).get()).data()||{}; res.json({user,stats}); });
app.post('/api/user/gender', requireAuth, async(req:AuthedRequest,res)=>{ if(!['male','female'].includes(req.body.gender)) return res.status(400).json({error:'Invalid gender'}); await db().collection('users').doc(req.uid!).set({gender:req.body.gender},{merge:true}); const user=cleanUser(req.uid!, (await db().collection('users').doc(req.uid!).get()).data()); const stats=(await db().collection('stats').doc(req.uid!).get()).data()||{}; res.json({user,stats}); });

app.get('/api/quests', requireAuth, async(req:AuthedRequest,res)=>{ const snap=await db().collection('quests').where('userId','==',req.uid!).get(); res.json({quests:snap.docs.map(d=>({id:d.id,...d.data()})).sort((a:any,b:any)=>String(b.createdAt).localeCompare(String(a.createdAt)))}); });
app.post('/api/quests', requireAuth, async(req:AuthedRequest,res)=>{ const {title,description='',category,difficulty,type='Daily',frequency='Once',attributeTarget}=req.body; if(!title||!REWARDS[difficulty]||!ATTRIBUTE_BY_CATEGORY[category]) return res.status(400).json({error:'Invalid quest data'}); const reward=REWARDS[difficulty]; const id=crypto.randomUUID(); const quest={id,userId:req.uid!,title:String(title).trim().slice(0,120),description:String(description).slice(0,500),category,difficulty,type,frequency,xpReward:reward.xp,goldReward:reward.gold,attributeReward:{attribute:attributeTarget||ATTRIBUTE_BY_CATEGORY[category],amount:reward.stat},completed:false,createdAt:new Date().toISOString()}; await db().collection('quests').doc(id).set(quest); res.json({quest}); });
app.delete('/api/quests/:id', requireAuth, async(req:AuthedRequest,res)=>{ const ref=db().collection('quests').doc(req.params.id), snap=await ref.get(); if(!snap.exists||snap.data()?.userId!==req.uid) return res.status(404).json({error:'Quest not found'}); await ref.delete(); res.json({success:true}); });

app.post('/api/quests/:id/complete', requireAuth, async(req:AuthedRequest,res)=>{
  const uid=req.uid!, questRef=db().collection('quests').doc(req.params.id), userRef=db().collection('users').doc(uid), statsRef=db().collection('stats').doc(uid);
  const result=await db().runTransaction(async tx=>{
    const [qSnap,uSnap,sSnap]=await Promise.all([tx.get(questRef),tx.get(userRef),tx.get(statsRef)]);
    if(!qSnap.exists||qSnap.data()?.userId!==uid) throw new Error('Quest not found');
    const q:any={id:qSnap.id,...qSnap.data()}; if(q.completed) throw new Error('Quest already completed');
    const user:any=uSnap.data()||await ensureUser(uid); const stats:any=sSnap.data()||{intellect:0,strength:0,discipline:0,wisdom:0,creativity:0};
    const today=new Date().toISOString().slice(0,10), last=user.lastQuestCompletedDate;
    let streak=Number(user.currentStreak||0); if(last===today) streak=Math.max(1,streak); else if(last===new Date(Date.now()-86400000).toISOString().slice(0,10)) streak+=1; else streak=1;
    const historyRef=db().collection('questHistory').doc(crypto.randomUUID());
    const newTotalXp=Number(user.totalXp||0)+q.xpReward; const oldLevel=Number(user.level||1); const levelData=calculateLevelData(newTotalXp);
    const newStats={...stats,[q.attributeReward.attribute]:Number(stats[q.attributeReward.attribute]||0)+q.attributeReward.amount};
    const completedBefore=(await db().collection('questHistory').where('userId','==',uid).get()).size;
    const unlockIds:string[]=[]; if(completedBefore===0) unlockIds.push('ach-first-quest'); if(completedBefore+1>=10) unlockIds.push('ach-quests-10'); if(streak>=7) unlockIds.push('ach-streak-7'); if(streak>=14) unlockIds.push('ach-streak-14'); if(levelData.level>=5) unlockIds.push('ach-level-5'); if(levelData.level>=10) unlockIds.push('ach-level-10'); if(levelData.level>=20) unlockIds.push('ach-level-20');
    const attr=q.attributeReward.attribute; if(attr==='intellect'&&newStats.intellect>=5) unlockIds.push('ach-intellect-5'); if(attr==='strength'&&newStats.strength>=5) unlockIds.push('ach-strength-5'); if(attr==='discipline'&&newStats.discipline>=5) unlockIds.push('ach-discipline-5');
    const uniqueUnlock=[...new Set(unlockIds)]; let bonusXp=0,bonusGold=0; const unlocked:any[]=[];
    for(const aid of uniqueUnlock){ const ar=db().collection('userAchievements').doc(`${uid}_${aid}`); const as=await tx.get(ar); if(!as.exists){ const a=ACHIEVEMENTS.find(x=>x.id===aid); if(a){ tx.set(ar,{userId:uid,achievementId:aid,unlockedAt:new Date().toISOString()}); bonusXp+=a.xpReward; bonusGold+=a.goldReward; unlocked.push(a); } } }
    const finalXp=newTotalXp+bonusXp; const finalLevel=calculateLevelData(finalXp).level;
    tx.set(questRef,{completed:true,completedAt:new Date().toISOString()},{merge:true});
    tx.set(userRef,{totalXp:finalXp,level:finalLevel,gold:Number(user.gold||0)+q.goldReward+bonusGold,currentStreak:streak,longestStreak:Math.max(Number(user.longestStreak||0),streak),lastQuestCompletedDate:today},{merge:true});
    tx.set(statsRef,newStats,{merge:true}); tx.set(historyRef,{userId:uid,questId:q.id,questTitle:q.title,category:q.category,xpEarned:q.xpReward+bonusXp,goldEarned:q.goldReward+bonusGold,attributeReward:q.attributeReward,completedAt:new Date().toISOString()});
    return {quest:{...q,completed:true,completedAt:new Date().toISOString()},user:{...user,totalXp:finalXp,level:finalLevel,gold:Number(user.gold||0)+q.goldReward+bonusGold,currentStreak:streak,longestStreak:Math.max(Number(user.longestStreak||0),streak),lastQuestCompletedDate:today},stats:newStats,didLevelUp:finalLevel>oldLevel,newLevel:finalLevel,levelData:calculateLevelData(finalXp),unlockedAchievements:unlocked};
  });
  res.json(result);
});

app.get('/api/shop', requireAuth, (_req,res)=>res.json({items:SHOP_ITEMS}));
app.get('/api/inventory', requireAuth, async(req:AuthedRequest,res)=>{ const snap=await db().collection('inventory').where('userId','==',req.uid!).get(); const inventory=snap.docs.map(d=>({id:d.id,...d.data()})); const ownedIds=new Set(inventory.map((x:any)=>x.itemId)); res.json({inventory,items:SHOP_ITEMS.filter((x:any)=>ownedIds.has(x.id))}); });
app.post('/api/shop/buy', requireAuth, async(req:AuthedRequest,res)=>{ const uid=req.uid!, item:any=SHOP_ITEMS.find((x:any)=>x.id===req.body.itemId); if(!item) return res.status(404).json({error:'Item not found'}); const userRef=db().collection('users').doc(uid), invRef=db().collection('inventory').doc(`${uid}_${item.id}`); const result=await db().runTransaction(async tx=>{ const [u,i]=await Promise.all([tx.get(userRef),tx.get(invRef)]); if(i.exists) throw new Error('Item already owned'); const user:any=u.data(); if(Number(user.level||1)<item.requiredLevel) throw new Error(`Reach level ${item.requiredLevel} first`); if(Number(user.gold||0)<item.price) throw new Error('Insufficient Gold'); tx.set(userRef,{gold:Number(user.gold)-item.price},{merge:true}); tx.set(invRef,{userId:uid,itemId:item.id,purchasedAt:new Date().toISOString()}); return {...user,gold:Number(user.gold)-item.price}; }); res.json({user:cleanUser(uid,result),item,inventory:(await db().collection('inventory').where('userId','==',uid).get()).docs.map(d=>({id:d.id,...d.data()}))}); });
app.post('/api/inventory/equip', requireAuth, async(req:AuthedRequest,res)=>{ const uid=req.uid!, item:any=SHOP_ITEMS.find((x:any)=>x.id===req.body.itemId); if(!item) return res.status(404).json({error:'Item not found'}); const owned=await db().collection('inventory').doc(`${uid}_${item.id}`).get(); if(!owned.exists) return res.status(403).json({error:'Item not owned'}); const field:any={}; if(item.category==='themes') field.equippedTheme=req.body.unequip?'theme-cyber':item.id; else if(item.category==='nameplates') field.equippedTitle=req.body.unequip?'Explorer':item.name; else if(item.category==='frames') field.equippedFrame=req.body.unequip?'':item.id; else if(item.category==='effects') field.equippedEffect=req.body.unequip?'':item.id; else if(item.category==='backgrounds') field.equippedBackground=req.body.unequip?'bg-dojo':item.id; else if(item.category==='characters') field.equippedCharacter=req.body.unequip?'':item.id; await db().collection('users').doc(uid).set(field,{merge:true}); res.json({user:cleanUser(uid,(await db().collection('users').doc(uid).get()).data())}); });

app.get('/api/achievements', requireAuth, async(req:AuthedRequest,res)=>{ const snap=await db().collection('userAchievements').where('userId','==',req.uid!).get(); const map=new Map(snap.docs.map(d=>[d.data().achievementId,d.data()])); res.json({achievements:ACHIEVEMENTS.map(a=>({...a,unlocked:map.has(a.id),unlockedAt:map.get(a.id)?.unlockedAt}))}); });
app.get('/api/progress', requireAuth, async(req:AuthedRequest,res)=>{ const [h,u,s,q]=await Promise.all([db().collection('questHistory').where('userId','==',req.uid!).get(),db().collection('users').doc(req.uid!).get(),db().collection('stats').doc(req.uid!).get(),db().collection('quests').where('userId','==',req.uid!).get()]); const history=h.docs.map(d=>({id:d.id,...d.data()})); const historyByDate:any={}; for(const x of history as any[]){ const d=String(x.completedAt).slice(0,10); historyByDate[d]??={xp:0,gold:0,count:0}; historyByDate[d].xp+=x.xpEarned; historyByDate[d].gold+=x.goldEarned; historyByDate[d].count++; } const user:any=u.data()||{}; res.json({history,historyByDate,stats:s.data()||{},totalCompleted:history.length,totalQuests:q.size,currentStreak:user.currentStreak||0,longestStreak:user.longestStreak||0}); });

app.use((err:any,_req:Request,res:Response,_next:NextFunction)=>{ console.error(err); res.status(400).json({error:err?.message||'Request failed'}); });

export default app;
