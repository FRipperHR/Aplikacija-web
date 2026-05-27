import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import cors from "cors";
import crypto from "crypto";

async function startServer() {
  const app = express();
  const PORT = 3000;
  const DATA_DIR = path.join(process.cwd(), "data");
  const DATA_FILE = path.join(DATA_DIR, "data.json");

  // Ensure data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
  }

  app.use(cors());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // API Routes
  app.post("/api/login", async (req, res) => {
    const { username, pin } = req.body;
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
      const user = data.users?.find((u: any) => u.username.toLowerCase() === username.toLowerCase());
      
      if (user) {
        // Hash the incoming pin to compare with stored hash (or accept plain text if just migrated)
        const hashedPin = crypto.createHash("sha256").update(pin).digest("hex");
        
        if (user.pin === hashedPin || user.pin === pin) {
          const safeUser = { ...user };
          delete safeUser.pin;
          return res.json({ success: true, user: safeUser });
        }
      }
    }
    
    res.status(401).json({ error: "Invalid credentials" });
  });

  app.get("/api/state", (req, res) => {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
      // Strip pins from users so they don't leak to frontend
      if (data.users) {
        data.users = data.users.map((u: any) => {
          const { pin, ...safeUser } = u;
          return safeUser;
        });
      }
      res.json(data);
    } else {
      // Bootstrap system if data.json does not exist
      const defaultState = {
        users: [
          {
            id: 'admin-1',
            username: 'admin',
            pin: 'aa97e1cadbb647308a0bc13bb8135bedfe75591e5be0bad7be7f7b6758010790', // "admin321a"
            role: 'ADMIN',
            permissions: {
              kredit: true,
              uplate: true,
              ustede: true,
              materijali: true,
              dostava: true,
              radovi: true,
              kategorije: true,
              izvjesca: true,
              adminZona: true,
              backup: true,
              readOnly: false,
              allowedCategories: []
            }
          }
        ],
        categories: [
          { id: '1', name: 'Kuhinja' },
          { id: '2', name: 'Kupaonica' },
          { id: '3', name: 'Dnevni boravak' }
        ],
        materials: [],
        deliveries: [],
        works: [],
        savings: [],
        payments: [],
        auditLogs: []
      };
      // Write it to initialize the system
      fs.writeFileSync(DATA_FILE, JSON.stringify(defaultState, null, 2));
      
      const safeState = JSON.parse(JSON.stringify(defaultState));
      safeState.users = safeState.users.map((u: any) => {
          const { pin, ...safeUser } = u;
          return safeUser;
      });
      res.json(safeState);
    }
  });

  app.post("/api/state", (req, res) => {
    try {
      const incomingState = req.body;
      
      // Merge pins back from existing state if not provided
      if (fs.existsSync(DATA_FILE)) {
        const existingData = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
        if (incomingState.users && existingData.users) {
          incomingState.users = incomingState.users.map((incomingUser: any) => {
            const existingUser = existingData.users.find((u: any) => u.id === incomingUser.id);
            // If frontend did not send a pin, keep the old pin
            if (!incomingUser.pin && existingUser && existingUser.pin) {
              incomingUser.pin = existingUser.pin;
            }
            return incomingUser;
          });
        }
      }
      
      fs.writeFileSync(DATA_FILE, JSON.stringify(incomingState, null, 2));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save data" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production: serve static files from dist
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
