import { useEffect, useState } from "react";
import { GameCanvas } from "./components/GameCanvas";
import { NameInput } from "./components/NameInput";
import { useKeyboard } from "./hooks/useKeyboard";
import { usePlayersSync } from "./hooks/usePlayersSync";
import "./App.css";

function App() {
  const [playerName, setPlayerName] = useState<string>("");
  const {
    players,
    currentPlayer,
    updatePlayerPosition,
    error,
    isInitialized,
    disconnect,
  } = usePlayersSync(playerName);

  const position = useKeyboard({ x: 400, y: 300 });

  useEffect(() => {
    if (!currentPlayer) return;

    if (position.x !== currentPlayer.x || position.y !== currentPlayer.y) {
      updatePlayerPosition(position);
    }
  }, [position, currentPlayer, updatePlayerPosition]);

  const handleDisconnect = async () => {
    await disconnect();
    setPlayerName(""); // ⬅️ Сброс имени, чтобы остановить повторную инициализацию
  };

  if (!isInitialized) {
    return (
      <div className="game-container">
        <h1>Multiplayer 2D Game</h1>
        <NameInput onSubmit={setPlayerName} />
      </div>
    );
  }

  return (
    <div className="game-container">
      <h1>Multiplayer 2D Game</h1>
      {error && <div className="error-message">Error: {error}</div>}
      <div className="game-wrapper">
        <GameCanvas players={players} />
      </div>
      <div className="controls-info">
        <p>Use WASD keys to move your square</p>
        <p>Players online: {players.length}</p>
        <p>Your name: {currentPlayer?.name}</p>
        <button onClick={handleDisconnect} className="disconnect-btn">
          Disconnect
        </button>
      </div>
    </div>
  );
}

export default App;
