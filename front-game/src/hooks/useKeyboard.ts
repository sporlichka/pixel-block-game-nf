import { useEffect, useState } from "react";
import type { Position } from "../types/game";

const MOVEMENT_SPEED = 5;
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

export function useKeyboard(initialPosition: Position) {
  const [position, setPosition] = useState<Position>(initialPosition);
  const [keys, setKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys((prev) => ({ ...prev, [e.key.toLowerCase()]: true }));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys((prev) => ({ ...prev, [e.key.toLowerCase()]: false }));
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const gameLoop = setInterval(() => {
      setPosition((prev) => {
        let newX = prev.x;
        let newY = prev.y;

        if (keys["w"]) newY = Math.max(0, prev.y - MOVEMENT_SPEED);
        if (keys["s"])
          newY = Math.min(GAME_HEIGHT - 4, prev.y + MOVEMENT_SPEED);
        if (keys["a"]) newX = Math.max(0, prev.x - MOVEMENT_SPEED);
        if (keys["d"]) newX = Math.min(GAME_WIDTH - 4, prev.x + MOVEMENT_SPEED);

        return { x: newX, y: newY };
      });
    }, 1000 / 60); // 60 FPS

    return () => clearInterval(gameLoop);
  }, [keys]);

  return position;
}
