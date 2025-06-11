import { useEffect, useState, useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "../lib/supabase";
import type { Player } from "../types/game";

export function usePlayersSync(initialName?: string) {
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const subscriptionRef = useRef<any>(null);
  const playersRef = useRef<Record<string, Player>>({});
  const didInitRef = useRef(false); // <- основной флаг

  // Обновляем ref при изменении players
  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  const handleChange = useCallback(
    (payload: any) => {
      // Игнорируем собственные обновления текущего игрока
      if (currentPlayer && payload.new?.id === currentPlayer.id) return;

      setPlayers((prev) => {
        const newPlayers = { ...prev };

        switch (payload.eventType) {
          case "INSERT":
          case "UPDATE":
            // Если игрок уже существует, обновляем только его позицию
            if (newPlayers[payload.new.id]) {
              newPlayers[payload.new.id] = {
                ...newPlayers[payload.new.id],
                x: payload.new.x,
                y: payload.new.y,
              };
            } else {
              newPlayers[payload.new.id] = payload.new;
            }
            break;
          case "DELETE":
            delete newPlayers[payload.old.id];
            break;
        }

        return newPlayers;
      });
    },
    [currentPlayer]
  );

  // Обновляем список игроков при изменении currentPlayer
  useEffect(() => {
    if (currentPlayer) {
      setPlayers((prev) => ({
        ...prev,
        [currentPlayer.id]: currentPlayer,
      }));
    }
  }, [currentPlayer]);

  useEffect(() => {
    if (!initialName || didInitRef.current) return;
    didInitRef.current = true;

    const setupPlayer = async () => {
      try {
        const playerId = uuidv4();
        const randomColor = `hsl(${Math.random() * 360}, 100%, 50%)`;

        const newPlayer: Player = {
          id: playerId,
          x: 400,
          y: 300,
          color: randomColor,
          name: initialName,
        };

        // Загружаем существующих игроков
        const { data: existingPlayers, error: fetchError } = await supabase
          .from("players")
          .select("*");

        if (fetchError) throw fetchError;

        const playersMap = existingPlayers.reduce((acc, player) => {
          acc[player.id] = player;
          return acc;
        }, {} as Record<string, Player>);

        setPlayers(playersMap);

        // Добавляем нового игрока
        const { error: insertError } = await supabase
          .from("players")
          .insert([newPlayer]);

        if (insertError) throw insertError;

        setCurrentPlayer(newPlayer);

        // Подписка на изменения
        subscriptionRef.current = supabase
          .channel("players_sync")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "players",
              filter: "*",
            },
            handleChange
          )
          .subscribe((status) => {
            console.log("Subscription status:", status);
          });

        setIsInitialized(true);
      } catch (err) {
        console.error("Setup error:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    };

    setupPlayer();

    return () => {
      const cleanup = async () => {
        if (subscriptionRef.current) {
          supabase.removeChannel(subscriptionRef.current);
        }

        if (currentPlayer) {
          await supabase.from("players").delete().eq("id", currentPlayer.id);
        }
      };

      cleanup();
    };
  }, [initialName, handleChange, currentPlayer]);

  const updatePlayerPosition = useCallback(
    async (position: { x: number; y: number }) => {
      if (!currentPlayer) return;

      const updatedPlayer = { ...currentPlayer, ...position };
      setCurrentPlayer(updatedPlayer);

      try {
        const { error } = await supabase
          .from("players")
          .update(position)
          .eq("id", currentPlayer.id);

        if (error) throw error;
      } catch (err) {
        console.error("Update error:", err);
        setCurrentPlayer(currentPlayer); // откат
      }
    },
    [currentPlayer]
  );

  const disconnect = useCallback(async () => {
    if (!currentPlayer) return;

    try {
      // First remove the subscription
      if (subscriptionRef.current) {
        await supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }

      // Then delete the player from the database
      const { error } = await supabase
        .from("players")
        .delete()
        .eq("id", currentPlayer.id);

      if (error) throw error;

      // Reset all state
      setCurrentPlayer(null);
      setPlayers({});
      setIsInitialized(false);
      didInitRef.current = false;
    } catch (err) {
      console.error("Disconnect error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }, [currentPlayer]);

  return {
    players: Object.values(players),
    currentPlayer,
    updatePlayerPosition,
    error,
    isInitialized,
    disconnect,
  };
}
