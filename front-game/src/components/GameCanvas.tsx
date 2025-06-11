import { useEffect, useRef } from "react";
import type { Player } from "../types/game";

interface GameCanvasProps {
  players: Player[];
}

export function GameCanvas({ players }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      // Clear canvas
      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, 800, 600);

      // Draw all players
      players.forEach((player) => {
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y, 4, 4);

        // Draw player name
        ctx.fillStyle = "#fff";
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(player.name, player.x + 2, player.y - 5);
      });

      requestAnimationFrame(render);
    };

    const animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [players]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      style={{
        border: "1px solid #333",
        background: "#111",
      }}
    />
  );
}
