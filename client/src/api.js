// Centralised API helpers
const API_BASE = '/api';

// Ensure we have a guest player record (sets httpOnly cookie on server side)
export async function initPlayer() {
  const res = await fetch(`${API_BASE}/players`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to init player');
  const { data } = await res.json();
  return data;
}

export async function fetchCharacters() {
  const res = await fetch(`${API_BASE}/characters`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch characters');
  const { data } = await res.json();
  return data;
}

export async function startAiMatch(characterId) {
  const res = await fetch(`${API_BASE}/matches/ai`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ characterId }),
  });
  if (!res.ok) throw new Error('Failed to start AI match');
  const { data } = await res.json();
  return data;
}

export async function submitAiRound(matchId, move) {
  const res = await fetch(`${API_BASE}/matches/${matchId}/round`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ move }),
  });
  if (!res.ok) throw new Error('Failed to submit round');
  const { data } = await res.json();
  return data;
}

export async function createRoom(characterId) {
  const res = await fetch(`${API_BASE}/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ characterId }),
  });
  if (!res.ok) throw new Error('Failed to create room');
  const { data } = await res.json();
  return data;
}

export async function getRoomStatus(roomCode) {
  const res = await fetch(`${API_BASE}/rooms/${roomCode}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Room not found');
  const { data } = await res.json();
  return data;
}

export async function joinRoom(roomCode, characterId, displayName) {
  const res = await fetch(`${API_BASE}/rooms/${roomCode}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ characterId, displayName }),
  });
  if (!res.ok) throw new Error('Failed to join room');
  const { data } = await res.json();
  return data;
}

export async function getMatch(matchId) {
  const res = await fetch(`${API_BASE}/matches/${matchId}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Match not found');
  const { data } = await res.json();
  return data;
}
