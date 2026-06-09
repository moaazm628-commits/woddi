import { createServer } from "http";
import { Server } from "socket.io";

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  team: "a" | "b" | null;
}

interface PasswordState {
  secretPlayer: string;
  clues: { team: "a" | "b"; playerName: string; text: string }[];
  currentTeam: "a" | "b";
  phase: "clue" | "guess";
  round: number;
  totalRounds: number;
  scores: { a: number; b: number };
  clueGiverIndexA: number;
  clueGiverIndexB: number;
  roundResult: null | { winner: "a" | "b"; guess: string };
  finished: boolean;
}

interface Room {
  code: string;
  players: Player[];
  game: string | null;
  started: boolean;
  passwordState: PasswordState | null;
}

const rooms = new Map<string, Room>();

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function getRandomPlayer(exclude?: string): string {
  const players = [
    "ميسي", "رونالدو", "نيمار", "مبابي", "صلاح", "بنزيمة",
    "هالاند", "مودريتش", "فينيسيوس", "راموس", "بيلينغهام",
    "يامال", "أوسيمهن", "أشرف حكيمي", "كانتي", "ليفاندوفسكي",
    "ديبروين", "سواريز", "هازارد", "بوفون", "زيدان", "رونالدينيو",
  ];
  const filtered = exclude ? players.filter((p) => p !== exclude) : players;
  return filtered[Math.floor(Math.random() * filtered.length)];
}

function initPasswordState(): PasswordState {
  return {
    secretPlayer: getRandomPlayer(),
    clues: [],
    currentTeam: "a",
    phase: "clue",
    round: 1,
    totalRounds: 8,
    scores: { a: 0, b: 0 },
    clueGiverIndexA: 0,
    clueGiverIndexB: 0,
    roundResult: null,
    finished: false,
  };
}

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  // Create room
  socket.on("create_room", ({ name, game }: { name: string; game: string }) => {
    const code = generateCode();
    const player: Player = { id: socket.id, name, isHost: true, isReady: true, team: null };
    const room: Room = { code, players: [player], game, started: false, passwordState: null };
    rooms.set(code, room);
    socket.join(code);
    socket.emit("room_created", { code, player, room });
  });

  // Join room
  socket.on("join_room", ({ name, code }: { name: string; code: string }) => {
    const room = rooms.get(code.toUpperCase());
    if (!room) { socket.emit("error", { message: "الغرفة غير موجودة!" }); return; }
    if (room.started) { socket.emit("error", { message: "اللعبة بدأت بالفعل!" }); return; }
    const player: Player = { id: socket.id, name, isHost: false, isReady: false, team: null };
    room.players.push(player);
    socket.join(code.toUpperCase());
    socket.emit("room_joined", { code: code.toUpperCase(), player, room });
    io.to(code.toUpperCase()).emit("player_joined", { room });
  });

  // Choose team
  socket.on("choose_team", ({ code, team }: { code: string; team: "a" | "b" }) => {
    const room = rooms.get(code);
    if (!room) return;
    const player = room.players.find((p) => p.id === socket.id);
    if (player) { player.team = team; player.isReady = true; }
    io.to(code).emit("room_updated", { room });
  });

  // Change game
  socket.on("change_game", ({ code, game }: { code: string; game: string }) => {
    const room = rooms.get(code);
    if (!room) return;
    room.game = game;
    io.to(code).emit("room_updated", { room });
  });

  // Start game
  socket.on("start_game", ({ code }: { code: string }) => {
    const room = rooms.get(code);
    if (!room) return;
    room.started = true;
    if (room.game === "password") room.passwordState = initPasswordState();
    io.to(code).emit("game_started", { game: room.game, room });
  });

  // Password: send clue
  socket.on("password_clue", ({ code, clue }: { code: string; clue: string }) => {
    const room = rooms.get(code);
    if (!room || !room.passwordState) return;
    const state = room.passwordState;
    const player = room.players.find((p) => p.id === socket.id);
    if (!player) return;
    state.clues.push({ team: state.currentTeam, playerName: player.name, text: clue });
    state.phase = "guess";
    io.to(code).emit("password_updated", { state });
  });

  // Password: guess
  socket.on("password_guess", ({ code, guess }: { code: string; guess: string }) => {
    const room = rooms.get(code);
    if (!room || !room.passwordState) return;
    const state = room.passwordState;
    const correct = guess.trim() === state.secretPlayer.trim();

    if (correct) {
      state.scores[state.currentTeam]++;
      state.roundResult = { winner: state.currentTeam, guess };
      io.to(code).emit("password_updated", { state });

      // Next round after 3 seconds
      setTimeout(() => {
        if (!room.passwordState) return;
        const s = room.passwordState;
        if (s.round >= s.totalRounds) {
          s.finished = true;
        } else {
          s.round++;
          s.currentTeam = s.round % 2 === 1 ? "a" : "b";
          if (s.currentTeam === "a") s.clueGiverIndexA = (s.clueGiverIndexA + 1);
          else s.clueGiverIndexB = (s.clueGiverIndexB + 1);
          s.secretPlayer = getRandomPlayer(s.secretPlayer);
          s.clues = [];
          s.phase = "clue";
          s.roundResult = null;
        }
        io.to(code).emit("password_updated", { state: s });
      }, 3000);
    } else {
      // Wrong guess — switch team
      state.phase = "clue";
      state.currentTeam = state.currentTeam === "a" ? "b" : "a";
      io.to(code).emit("password_updated", { state });
    }
  });

  // Player ready
  socket.on("player_ready", ({ code }: { code: string }) => {
    const room = rooms.get(code);
    if (!room) return;
    const player = room.players.find((p) => p.id === socket.id);
    if (player) { player.isReady = true; io.to(code).emit("room_updated", { room }); }
  });
// Request current state (for rejoining)
 socket.on("request_state", ({ code, name }: { code: string; name: string }) => {
    const room = rooms.get(code);
    if (!room) return;
    // Update the player's socket id by matching their name
    const player = room.players.find((p) => p.name === name);
    if (player) player.id = socket.id;
    socket.join(code);
    socket.emit("game_started", { game: room.game, room });
    if (room.passwordState) {
      socket.emit("password_updated", { state: room.passwordState, room });
    }
  });
  // Disconnect
  socket.on("disconnect", () => {
    rooms.forEach((room, code) => {
      const idx = room.players.findIndex((p) => p.id === socket.id);
      if (idx !== -1) {
        room.players.splice(idx, 1);
        if (room.players.length === 0) {
          rooms.delete(code);
        } else {
          if (!room.players.find((p) => p.isHost)) room.players[0].isHost = true;
          io.to(code).emit("room_updated", { room });
        }
      }
    });
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});