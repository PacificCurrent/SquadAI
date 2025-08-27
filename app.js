import { createClient } from '@supabase/supabase-js';

// Vite exposes env with VITE_ prefix
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const sb = createClient(supabaseUrl, supabaseKey);

const els = {
  status: document.getElementById('status'),
  login: document.getElementById('login'),
  logout: document.getElementById('logout'),
  convTitle: document.getElementById('convTitle'),
  createConv: document.getElementById('createConv'),
  conversations: document.getElementById('conversations'),
  roomTitle: document.getElementById('roomTitle'),
  messages: document.getElementById('messages'),
  msgText: document.getElementById('msgText'),
  send: document.getElementById('send'),
  addBot: document.getElementById('addBot'),
  botKind: document.getElementById('botKind'),
};

let currentUser = null;
let currentConversationId = null;

// --- Auth ---
async function loadSession() {
  const { data: { session } } = await sb.auth.getSession();
  currentUser = session?.user ?? null;
  els.login.hidden = !!currentUser;
  els.logout.hidden = !currentUser;
  els.send.disabled = !currentUser || !currentConversationId;
  els.addBot.disabled = !currentConversationId;
  els.status.textContent = currentUser
    ? `Signed in as ${currentUser.email}`
    : 'Not signed in';
  if (currentUser) {
    await ensureProfile();
    await listConversations();
  } else {
    els.conversations.innerHTML = '';
    els.messages.innerHTML = '';
  }
}

async function ensureProfile() {
  await sb.from('profiles')
    .upsert({ id: currentUser.id }, { onConflict: 'id' });
}

els.login.onclick = async () => {
  const email = prompt('Enter email for magic link sign-in:');
  if (!email) return;
  const { error } = await sb.auth.signInWithOtp({ email });
  els.status.textContent = error
    ? `Sign-in error: ${error.message}`
    : 'Check your email for the magic link.';
};

els.logout.onclick = async () => {
  await sb.auth.signOut();
  currentUser = null;
  currentConversationId = null;
  await loadSession();
};

sb.auth.onAuthStateChange(async () => {
  await loadSession();
});

// --- Conversations ---
els.createConv.onclick = async () => {
  if (!currentUser) return alert('Sign in first');
  const title = els.convTitle.value.trim() || 'Untitled';
  const { data, error } = await sb.from('conversations')
    .insert({ title, owner_id: currentUser.id })
    .select().single();
  if (error) return alert(error.message);
  els.convTitle.value = '';
  await listConversations();
  selectConversation(data.id, data.title);
};

async function listConversations() {
  const { data, error } = await sb.from('conversations')
    .select('id,title,created_at')
    .order('created_at', { ascending: false });
  if (error) { els.conversations.innerHTML = `<li>${error.message}</li>`; return; }
  els.conversations.innerHTML = '';
  data.forEach(c => {
    const li = document.createElement('li');
    li.textContent = c.title || '(untitled)';
    li.style.cursor = 'pointer';
    li.onclick = () => selectConversation(c.id, c.title);
    els.conversations.appendChild(li);
  });
}

async function selectConversation(id, title) {
  currentConversationId = id;
  els.roomTitle.textContent = `Messages · ${title || '(untitled)'}`;
  els.send.disabled = !currentUser || !currentConversationId;
  els.addBot.disabled = !currentConversationId;
  await loadMessages();
}

// --- Participants (bots) ---
els.addBot.onclick = async () => {
  if (!currentConversationId) return;
  const bot = els.botKind.value;
  const { error } = await sb.from('participants').insert({
    conversation_id: currentConversationId,
    kind: 'bot',
    bot_type: bot,
    bot_profile: {}
  });
  if (error) return alert(error.message);
  alert(`${bot} added to this conversation`);
};

// --- Messages ---
els.send.onclick = async () => {
  if (!currentUser || !currentConversationId) return;
  const text = els.msgText.value.trim();
  if (!text) return;
  els.msgText.value = '';
  const { error } = await sb.from('messages').insert({
    conversation_id: currentConversationId,
    sender_kind: 'user',
    sender_user_id: currentUser.id,
    role: 'user',
    content: text
  });
  if (error) return alert(error.message);
  await loadMessages();
};

async function loadMessages() {
  if (!currentConversationId) return;
  const { data, error } = await sb.from('messages')
    .select('created_at, sender_kind, sender_bot_type, content')
    .eq('conversation_id', currentConversationId)
    .order('created_at', { ascending: true });
  if (error) { els.messages.innerHTML = `<li>${error.message}</li>`; return; }
  els.messages.innerHTML = '';
  data.forEach(m => {
    const li = document.createElement('li');
    const who = m.sender_kind === 'bot' ? (m.sender_bot_type || 'bot') : 'you';
    li.textContent = `${who}: ${m.content}`;
    els.messages.appendChild(li);
  });
}

// initial
loadSession();