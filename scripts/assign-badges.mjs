// Administrative tool. Never import this into browser code.
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
const args = process.argv.slice(2);
const value = flag => args[args.indexOf(flag) + 1];
const email = args.includes('--email') ? value('--email') : undefined;
const uid = args.includes('--uid') ? value('--uid') : undefined;
const badges = (args.includes('--badges') ? value('--badges') : '').split(',').filter(Boolean);
if ((!email && !uid) || badges.some(badge => !['owner','verified','moderator','creator','partner'].includes(badge))) {
  throw new Error('Use --email EMAIL or --uid UID, --badges owner,verified. Optional: --grant-admin. Requires Google administrative credentials.');
}
initializeApp({ credential: applicationDefault(), projectId: 'mind-a9499' });
try {
  const auth = getAuth();
  const user = uid ? await auth.getUser(uid) : await auth.getUserByEmail(email);
  await getFirestore().doc(`accountBadges/${user.uid}`).set({ badges: [...new Set(badges)], updatedAt: FieldValue.serverTimestamp() });
  if (args.includes('--grant-admin')) await auth.setCustomUserClaims(user.uid, { ...user.customClaims, badgeAdmin: true });
  console.log(`Emblemas atualizados para UID ${user.uid}. ${args.includes('--grant-admin') ? 'Entre novamente na conta para atualizar a permissão administrativa.' : ''}`);
} catch (error) {
  console.error('Não foi possível atribuir os emblemas. Configure credenciais administrativas do projeto mind-a9499 antes de executar.');
  console.error(error.code || error.message); process.exitCode = 1;
}
