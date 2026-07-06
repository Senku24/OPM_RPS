import { useState, useEffect } from 'react';
import { initPlayer } from './api';
import Dashboard from './components/Dashboard';
import Lobby from './components/Lobby';
import JoinRoom from './components/JoinRoom';
import Playzone from './components/Playzone';
import MatchEnd from './components/MatchEnd';

// Simple client-side router using the URL pathname
function getScreen() {
  const path = window.location.pathname;
  if (path.startsWith('/join/')) return 'join';
  return 'dashboard';
}

export default function App() {
  const [screen, setScreen] = useState(getScreen());
  const [player, setPlayer] = useState(null);
  const [selectedCharacter, setSelectedCharacter] = useState(null);

  // AI mode state
  const [aiMatchId, setAiMatchId] = useState(null);

  // Friend mode state
  const [roomData, setRoomData] = useState(null);
  const [matchId, setMatchId] = useState(null);
  const [matchPlayers, setMatchPlayers] = useState(null);

  // Match end state
  const [matchResult, setMatchResult] = useState(null);

  // Init player on first load
  useEffect(() => {
    initPlayer()
      .then(setPlayer)
      .catch(console.error);
  }, []);

  const navigate = (s) => {
    setScreen(s);
    // update URL without full reload
    const urls = {
      dashboard: '/',
      lobby: '/',
      playzone: '/',
      matchend: '/',
    };
    window.history.pushState({}, '', urls[s] || '/');
  };

  // ---- Screen handlers ----

  function handleStartAi(matchId) {
    setAiMatchId(matchId);
    navigate('playzone-ai');
  }

  function handleRoomCreated(room) {
    setRoomData(room);
    navigate('lobby');
  }

  function handleMatchStarted({ matchId: mid, players }) {
    setMatchId(mid);
    setMatchPlayers(players);
    navigate('playzone-friend');
  }

  function handleMatchEnd(result) {
    setMatchResult(result);
    navigate('matchend');
  }

  function handleRematch() {
    setMatchResult(null);
    setMatchId(null);
    setMatchPlayers(null);
    navigate('dashboard');
  }

  // ---- Render ----

  // Join page: someone opened a /join/ROOMCODE URL
  if (screen === 'join' || window.location.pathname.startsWith('/join/')) {
    const roomCode = window.location.pathname.split('/join/')[1];
    return (
      <>
        <div className="speed-lines" aria-hidden="true" />
        <JoinRoom
          roomCode={roomCode}
          player={player}
          onJoined={(data) => {
            setRoomData(data);
            navigate('lobby-guest');
          }}
        />
      </>
    );
  }

  if (screen === 'lobby' || screen === 'lobby-guest') {
    return (
      <>
        <div className="speed-lines" aria-hidden="true" />
        <Lobby
          roomData={roomData}
          player={player}
          isHost={screen === 'lobby'}
          character={selectedCharacter}
          onMatchStarted={handleMatchStarted}
          onBack={() => navigate('dashboard')}
        />
      </>
    );
  }

  if (screen === 'playzone-ai') {
    return (
      <>
        <div className="speed-lines" aria-hidden="true" />
        <Playzone
          mode="ai"
          matchId={aiMatchId}
          player={player}
          playerCharacter={selectedCharacter}
          onMatchEnd={handleMatchEnd}
        />
      </>
    );
  }

  if (screen === 'playzone-friend') {
    return (
      <>
        <div className="speed-lines" aria-hidden="true" />
        <Playzone
          mode="friend"
          matchId={matchId}
          player={player}
          playerCharacter={selectedCharacter}
          matchPlayers={matchPlayers}
          onMatchEnd={handleMatchEnd}
        />
      </>
    );
  }

  if (screen === 'matchend') {
    return (
      <>
        <div className="speed-lines" aria-hidden="true" />
        <MatchEnd
          result={matchResult}
          player={player}
          onRematch={handleRematch}
          onDashboard={() => navigate('dashboard')}
        />
      </>
    );
  }

  // Default: Dashboard
  return (
    <>
      <div className="speed-lines" aria-hidden="true" />
      <Dashboard
        player={player}
        selectedCharacter={selectedCharacter}
        onSelectCharacter={setSelectedCharacter}
        onStartAi={handleStartAi}
        onRoomCreated={handleRoomCreated}
      />
    </>
  );
}
