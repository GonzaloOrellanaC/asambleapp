import 'dotenv/config';
import crypto from 'crypto';
import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import cookieParser from "cookie-parser";

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/asambleapp";

const schemaOptions = {
  toJSON: {
    virtuals: true,
    transform: function(doc: any, ret: any) {
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true },
};

// Define Schemas
const orgSchema = new mongoose.Schema({
  name: String,
  customUrl: { type: String, unique: true },
  styles: { primaryColor: String },
  logoUrl: String,
  plan: { type: String, default: 'free' },
  createdAt: { type: Date, default: Date.now },
  expirationEmailSent: { type: Boolean, default: false },
  clientId: { type: Number, unique: true },
  timestampId: { type: String, unique: true },
  settings: {
    audioMessages: { type: Boolean, default: true },
    audioLimit: { type: Number, default: 30 },
    reactions: { type: Boolean, default: true },
    bannedWords: { type: [String], default: [] },
    requireDepartment: { type: Boolean, default: false },
    allowMultipleDepartments: { type: Boolean, default: false }
  }
}, schemaOptions);
const Organization = mongoose.model('Organization', orgSchema);

const ticketSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  subject: String,
  message: String,
  closingMessage: String,
  status: { type: String, default: 'open' },
  forwardedToSuperAdmin: { type: Boolean, default: false },
  responses: [{
    senderName: String,
    senderRole: String,
    message: String,
    createdAt: { type: Date, default: Date.now }
  }],
  closedAt: Date,
  createdAt: { type: Date, default: Date.now }
}, schemaOptions);
const Ticket = mongoose.model('Ticket', ticketSchema);

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: false },
  title: String,
  message: String,
  type: String,
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, schemaOptions);
const Notification = mongoose.model('Notification', notificationSchema);

const departmentSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  name: String,
  description: String,
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: false },
}, schemaOptions);
const Department = mongoose.model('Department', departmentSchema);

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: { type: String, required: false },
  role: String, // super_admin, admin, gestor, editor, user, guest
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: false },
  organizations: [{
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    role: String,
    departmentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Department' }]
  }],
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: false },
  departmentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Department' }],
  verified: { type: Boolean, default: true },
  avatarUrl: String,
  notificationPreferences: {
    enabled: { type: Boolean, default: true },
    popups: { type: Boolean, default: true }
  }
}, schemaOptions);
const User = mongoose.model('User', userSchema);

const projectSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: false },
  departmentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Department' }],
  title: String,
  content: String,
  status: String, // debate, voting, closed
  pdfUrl: String,
  pdfName: String,
  restrictBannedWords: { type: Boolean, default: true },
  editorStyles: { type: Object, required: false },
  maxChars: { type: Number, default: 500 },
  maxAudioTime: { type: Number, default: 60 },
  debateStartTime: Date,
  debateClosingTime: Date,
  votingClosingTime: Date,
  invitedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  republishedFromId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  notificationsSent: {
    debateClosed: { type: Boolean, default: false },
    votingClosed: { type: Boolean, default: false }
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
}, schemaOptions);
const Project = mongoose.model('Project', projectSchema);

const discussionSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  content: String,
  type: String, // text, audio
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
}, schemaOptions);
const Discussion = mongoose.model('Discussion', discussionSchema);

const voteSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  option: String, // A Favor, En Contra, Abstención
  createdAt: { type: Date, default: Date.now }
}, schemaOptions);
const Vote = mongoose.model('Vote', voteSchema);

const enrollmentLinkSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  role: String,
  token: String,
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
}, schemaOptions);
const EnrollmentLink = mongoose.model('EnrollmentLink', enrollmentLinkSchema);

const emailTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  token: String,
  createdAt: { type: Date, default: Date.now, expires: 86400 } // expires in 24h
}, schemaOptions);
const EmailToken = mongoose.model('EmailToken', emailTokenSchema);

const passwordResetTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  token: String,
  createdAt: { type: Date, default: Date.now, expires: 900 } // expires in 15 minutes (900 seconds)
}, schemaOptions);
const PasswordResetToken = mongoose.model('PasswordResetToken', passwordResetTokenSchema);




const blockSchema = new mongoose.Schema({
  index: Number,
  timestamp: Date,
  data: Object,
  previousHash: String,
  hash: String,
}, schemaOptions);
const Block = mongoose.model('Block', blockSchema);

class SimpleBlockchain {
  async getLatestBlock() {
    return await Block.findOne().sort({ index: -1 });
  }

  async calculateHash(index, previousHash, timestamp, data) {
    return crypto.createHash('sha256').update(index + previousHash + timestamp.getTime() + JSON.stringify(data)).digest('hex');
  }

  async addBlock(data) {
    const latestBlock = await this.getLatestBlock();
    const index = latestBlock ? latestBlock.index + 1 : 0;
    const previousHash = latestBlock ? latestBlock.hash : "0";
    const timestamp = new Date();
    const hash = await this.calculateHash(index, previousHash, timestamp, data);
    
    const newBlock = await Block.create({
      index,
      timestamp,
      data,
      previousHash,
      hash
    });
    return newBlock;
  }
}
const blockchain = new SimpleBlockchain();

// Initialize genesis block
Block.countDocuments().then(count => {
  if (count === 0) {
    blockchain.addBlock({ message: "Genesis Block - AsambleApp" }).then(() => console.log("Genesis block created"));
  }
});


const verificationCodeSchema = new mongoose.Schema({
  email: String,
  code: String,
  token: String,
  createdAt: { type: Date, default: Date.now, expires: 3600 } // expires in 1h
}, schemaOptions);
const VerificationCode = mongoose.model('VerificationCode', verificationCodeSchema);

// Seed function
async function seedDatabase() {
  const orgCount = await Organization.countDocuments();
  if (orgCount === 0) {
    console.log("Seeding database...");
    const org = await Organization.create({
      name: "Congreso Nacional",
      customUrl: "congreso",
      styles: { primaryColor: "#1d4ed8" }
    });

    const superAdmin = await User.create({
      name: "Super Admin",
      role: "super_admin",
    });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("admin123", salt);
    const admin = await User.create({
      name: "Admin Organización",
      email: "admin@congreso.com",
      password: hashedPassword,
      verified: true,
      role: "admin",
      orgId: org._id
    });

    const project = await Project.create({
      orgId: org._id,
      title: "Ley de Protección Ambiental",
      content: "Se propone una ley para...",
      status: "debate"
    });

    await Discussion.create({
      projectId: project._id,
      userId: admin._id,
      content: "Estoy de acuerdo con esta propuesta.",
      type: "text"
    });
    console.log("Database seeded successfully.");
  }
}

async function checkProjectStatuses(app: any) {
  try {
    const now = new Date();
    const projects = await Project.find({
      $or: [
        { debateClosingTime: { $lt: now }, 'notificationsSent.debateClosed': false },
        { votingClosingTime: { $lt: now }, 'notificationsSent.votingClosed': false }
      ]
    }).populate('invitedUsers');

    const io = app.get('io');

    for (const p of projects) {
      if (p.debateClosingTime && p.debateClosingTime < now && !p.notificationsSent?.debateClosed) {
        if (p.invitedUsers && p.invitedUsers.length > 0) {
          const notifications = p.invitedUsers.map((u: any) => ({
            userId: u._id,
            orgId: p.orgId,
            projectId: p._id,
            title: "Debate cerrado",
            message: `El periodo de debate para "${p.title}" ha finalizado y se ha iniciado el periodo de votaciones.`,
            type: 'debate_closed'
          }));
          await Notification.insertMany(notifications);
          if (io) {
            p.invitedUsers.forEach((u: any) => {
              io.to(u._id.toString()).emit('new_notification', { title: "Debate cerrado", message: `El periodo de debate para "${p.title}" ha finalizado y se ha iniciado el periodo de votaciones.` });
            });
          }
        }
        await Project.updateOne({ _id: p._id }, { 'notificationsSent.debateClosed': true });
      }

      if (p.votingClosingTime && p.votingClosingTime < now && !p.notificationsSent?.votingClosed) {
        if (p.invitedUsers && p.invitedUsers.length > 0) {
          const notifications = p.invitedUsers.map((u: any) => ({
            userId: u._id,
            orgId: p.orgId,
            projectId: p._id,
            title: "Votación cerrada",
            message: `El periodo de votación para "${p.title}" ha finalizado.`,
            type: 'voting_ended'
          }));
          await Notification.insertMany(notifications);
          if (io) {
            p.invitedUsers.forEach((u: any) => {
              io.to(u._id.toString()).emit('new_notification', { title: "Votación cerrada", message: `El periodo de votación para "${p.title}" ha finalizado.` });
            });
          }
        }
        await Project.updateOne({ _id: p._id }, { 'notificationsSent.votingClosed': true });
      }
    }
  } catch (e) {
    console.error("Error checking project statuses:", e);
  }
}

async function checkExpiredTrials() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const expiredOrgs = await Organization.find({
      plan: 'trial',
      createdAt: { $lt: thirtyDaysAgo },
      expirationEmailSent: { $ne: true }
    });

    for (const org of expiredOrgs) {
      const admins = await User.find({ 
        'organizations': { $elemMatch: { orgId: org._id, role: 'administrador' } }
      });
      
      const adminEmails = admins.map((u: any) => u.email).filter(Boolean);
      
      if (adminEmails.length > 0 && process.env.SMTP_USER && process.env.SMTP_PASS) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_PORT === '465',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const pricingUrl = `${process.env.APP_URL || 'http://localhost:3000'}/#pricing`;
        const htmlTemplate = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 40px 20px; border-radius: 12px;">
            <div style="background-color: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <h1 style="color: #1e293b; margin-top: 0; font-size: 24px; text-align: center;">¡Gracias por usar AsambleApp!</h1>
              <p style="color: #475569; font-size: 16px; line-height: 1.5; text-align: center;">Tu periodo de prueba de 30 días para la organización <strong>${org.name}</strong> ha finalizado. Esperamos que la plataforma te haya sido de gran utilidad.</p>
              <p style="color: #475569; font-size: 16px; line-height: 1.5; text-align: center;">Para continuar utilizando nuestros servicios, te invitamos a revisar nuestros planes y elegir el que mejor se adapte a tus necesidades.</p>
              <div style="text-align: center; margin: 40px 0;">
                <a href="${pricingUrl}" style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Ver Precios</a>
              </div>
            </div>
          </div>
        `;

        try {
          await transporter.sendMail({
            from: `"AsambleApp" <${process.env.SMTP_USER}>`,
            to: adminEmails.join(', '),
            subject: "Tu periodo de prueba en AsambleApp ha finalizado",
            html: htmlTemplate,
          });
          
          org.expirationEmailSent = true;
          await org.save();
        } catch (emailError) {
          console.error(`Error enviando correo de expiración a ${org.name}:`, emailError);
        }
      } else {
         // Mark as sent even if no email is configured, so we don't keep trying
         org.expirationEmailSent = true;
         await org.save();
      }
    }
  } catch (error) {
    console.error("Error checking expired trials:", error);
  }
}

import http from "http";
import { Server as SocketIOServer } from "socket.io";

class WorkQueue {
  private queue: any[] = [];
  private isProcessing = false;

  async add(taskFn: () => Promise<any>) {
    return new Promise((resolve, reject) => {
      this.queue.push({ taskFn, resolve, reject });
      this.process();
    });
  }

  private async process() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const { taskFn, resolve, reject } = this.queue.shift();
      try {
        const result = await taskFn();
        resolve(result);
      } catch (e) {
        reject(e);
      }
    }

    this.isProcessing = false;
  }
}

const actionQueue = new WorkQueue();

async function startServer() {
  const app = express();
  const PORT = process.env.APP_PORT || 3000;
  
  const server = http.createServer(app);
  const io = new SocketIOServer(server, { cors: { origin: '*' } });
  
  app.set('io', io);
  
  io.on('connection', (socket) => {
    console.log('User connected', socket.id);
    socket.on('join_project', (projectId) => {
      socket.join(projectId);
    });
    socket.on('join_user', (userId) => {
      socket.join(userId);
    });
    socket.on('disconnect', () => {
      console.log('User disconnected', socket.id);
    });
  });

  app.use(express.json());
  app.use(cookieParser());

  // Connect to DB
  mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 2000 })
    .then(() => {
      console.log("Connected to MongoDB");
      seedDatabase();
      setInterval(checkExpiredTrials, 60 * 60 * 1000); // Check every hour
      setInterval(() => checkProjectStatuses(app), 60 * 1000); // Check every minute
      checkExpiredTrials(); // Also check on startup
      checkProjectStatuses(app);
    })
    .catch(error => {
      console.error("MongoDB connection error. Please configure MONGODB_URI.", error);
    });

  // Configure multer
  const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
      try {
        let folderName = 'general';
        
        const authHeader = req.headers.authorization;
        const token = authHeader ? authHeader.split(' ')[1] : null;
        const userId = token || req.cookies?.userId;
        
        if (userId) {
          const user = await User.findById(userId).populate('orgId');
          if (user && user.orgId && (user.orgId as any).timestampId) {
            folderName = (user.orgId as any).timestampId;
          }
        }

        const uploadPath = path.join(process.cwd(), 'public', 'uploads', folderName);
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      } catch (e) {
        const uploadPath = path.join(process.cwd(), 'public', 'uploads', 'general');
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      }
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const originalName = file.originalname === 'blob' ? 'image.jpg' : file.originalname;
      cb(null, uniqueSuffix + '-' + originalName);
    }
  });
  const upload = multer({ storage: storage });

  app.post("/api/upload-image", upload.single('image'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image provided" });
      }
      const folderName = path.basename(req.file.destination);
      res.json({ success: true, url: `/uploads/${folderName}/${req.file.filename}`, name: req.file.originalname });
    } catch (e) {
      res.status(500).json({ error: "Error uploading image" });
    }
  });

  app.post("/api/upload", upload.single('file'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }
      const folderName = path.basename(req.file.destination);
      res.json({ success: true, url: `/uploads/${folderName}/${req.file.filename}`, name: req.file.originalname });
    } catch (e) {
      res.status(500).json({ error: "Error uploading file" });
    }
  });

  // API Routes
  
  app.get("/api/users/me", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader ? authHeader.split(' ')[1] : null;
      const userId = token || req.cookies?.userId;
      if (!userId) {
        return res.status(401).json({ error: "No autenticado" });
      }
      const user = await User.findById(userId).populate('orgId');
      if (!user) {
        return res.status(401).json({ error: "Usuario no encontrado" });
      }
      res.json(user);
    } catch (e) {
      res.status(500).json({ error: "Error en el servidor" });
    }
  });

  app.post("/api/logout", (req, res) => {
    res.clearCookie('userId');
    res.json({ success: true });
  });

  app.get("/api/organizations", async (req, res) => {
    try {
      const orgs = await Organization.find();
      res.json(orgs);
    } catch (e) {
      res.status(500).json({ error: "Server error" });
    }
  });
  
  app.post("/api/tickets", async (req, res) => {
    try {
      const ticket = await Ticket.create(req.body);
      res.json(ticket);
    } catch (e) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/notifications/:userId", async (req, res) => {
    try {
      const notifications = await Notification.find({ userId: req.params.userId }).populate('projectId', 'title customUrl').sort({ createdAt: -1 }).limit(100);
      res.json(notifications);
    } catch (e) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.put("/api/notifications/:id/read", async (req, res) => {
    try {
      const notification = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
      res.json(notification);
    } catch (e) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.put("/api/notifications/read-all/:userId", async (req, res) => {
    try {
      await Notification.updateMany({ userId: req.params.userId }, { read: true });
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/tickets", async (req, res) => {
    try {
      const tickets = await Ticket.find({
        $or: [
          { forwardedToSuperAdmin: true },
          { userId: null },
          { userId: { $exists: false } }
        ]
      }).populate('orgId').populate('userId').sort({ createdAt: -1 });
      res.json(tickets);
    } catch (e) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/tickets/org/:orgId", async (req, res) => {
    try {
      const tickets = await Ticket.find({ orgId: req.params.orgId }).populate('userId').sort({ createdAt: -1 });
      res.json(tickets);
    } catch (e) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/tickets/user/:userId", async (req, res) => {
    try {
      const tickets = await Ticket.find({ userId: req.params.userId }).populate('orgId').sort({ createdAt: -1 });
      res.json(tickets);
    } catch (e) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.put("/api/tickets/:id/forward", async (req, res) => {
    try {
      const ticket = await Ticket.findByIdAndUpdate(req.params.id, { forwardedToSuperAdmin: true }, { new: true });
      res.json(ticket);
    } catch (e) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/tickets/:id/reply", async (req, res) => {
    try {
      const { message, senderName, senderRole, closeTicket } = req.body;
      if (!message) return res.status(400).json({ error: "Message required" });

      const ticket = await Ticket.findById(req.params.id);
      if (!ticket) return res.status(404).json({ error: "Ticket not found" });

      ticket.responses = ticket.responses || [];
      ticket.responses.push({
        senderName: senderName || 'Soporte',
        senderRole: senderRole || 'admin',
        message,
        createdAt: new Date()
      });

      if (closeTicket) {
        ticket.status = 'closed';
        ticket.closedAt = new Date();
        ticket.closingMessage = message;
      }

      await ticket.save();
      await ticket.populate('userId');
      await ticket.populate('orgId');

      if (ticket.userId) {
        await Notification.create({
          userId: ticket.userId._id || ticket.userId,
          orgId: ticket.orgId?._id || ticket.orgId,
          title: closeTicket ? `Ticket Cerrado: ${ticket.subject}` : `Nueva respuesta en ticket: ${ticket.subject}`,
          message: `${senderName || 'Soporte'}: ${message.substring(0, 100)}`,
          type: 'ticket'
        });
      }

      res.json(ticket);
    } catch (e) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.put("/api/tickets/:id/close", async (req, res) => {
    try {
      const { closingMessage, is24hTimeout, senderName, senderRole } = req.body;
      const default24hMsg = "Estimado usuario/administrador: Tras transcurrir 24 horas sin haber recibido respuesta por su parte, procedemos al cierre de este ticket de soporte. Quedamos a su disposición si requiere abrir una nueva consulta.";
      const finalMsg = closingMessage || (is24hTimeout ? default24hMsg : "Ticket cerrado por el equipo de soporte.");

      const ticket = await Ticket.findById(req.params.id);
      if (!ticket) return res.status(404).json({ error: "Ticket not found" });

      ticket.status = 'closed';
      ticket.closingMessage = finalMsg;
      ticket.closedAt = new Date();
      ticket.responses = ticket.responses || [];
      ticket.responses.push({
        senderName: senderName || 'Soporte AsambleApp',
        senderRole: senderRole || 'superadmin',
        message: finalMsg,
        createdAt: new Date()
      });

      await ticket.save();
      await ticket.populate('userId');
      await ticket.populate('orgId');

      if (ticket.userId) {
        await Notification.create({
          userId: ticket.userId._id || ticket.userId,
          orgId: ticket.orgId?._id || ticket.orgId,
          title: `Ticket de Soporte Cerrado: ${ticket.subject}`,
          message: finalMsg,
          type: 'ticket'
        });
      }

      res.json(ticket);
    } catch (e) {
      res.status(500).json({ error: "Server error" });
    }
  });
  
  app.delete("/api/organizations/:id", async (req, res) => {
    try {
      const orgId = req.params.id;
      await Organization.findByIdAndDelete(orgId);
      await Department.deleteMany({ orgId });
      await User.deleteMany({ orgId });
      
      const projects = await Project.find({ orgId });
      const projectIds = projects.map(p => p._id);
      
      await Project.deleteMany({ orgId });
      await Discussion.deleteMany({ projectId: { $in: projectIds } });
      await Vote.deleteMany({ projectId: { $in: projectIds } });
      
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Error deleting organization" });
    }
  });

  app.get("/api/organizations/:url", async (req, res) => {
    try {
      const org = await Organization.findOne({ customUrl: req.params.url });
      if (org) {
        res.json(org);
      } else {
        res.status(404).json({ error: "Not found" });
      }
    } catch (e) {
      res.status(500).json({ error: "Server error" });
    }
  });

  
  app.post("/api/organizations/:id", async (req, res) => {
    try {
      console.log("UPDATE ORG BODY", req.body);
      const { customUrl, styles, logoUrl, settings } = req.body;
      const updateData: any = {};
      if (customUrl !== undefined) updateData.customUrl = customUrl;
      if (styles !== undefined) updateData.styles = styles;
      if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
      if (settings !== undefined) updateData.settings = settings;

      const org = await Organization.findByIdAndUpdate(
        req.params.id, 
        { $set: updateData },
        { new: true }
      );
      res.json(org);
    } catch (e) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/users/:id", async (req, res) => {
    try {
      const { name, avatarUrl } = req.body;
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

      const user = await User.findByIdAndUpdate(
        req.params.id,
        { $set: updateData },
        { new: true }
      );
      res.json(user);
    } catch (e) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/organizations/:id/url", async (req, res) => {
    try {
      const { customUrl } = req.body;
      const existing = await Organization.findOne({ customUrl });
      if (existing && existing._id.toString() !== req.params.id) {
        return res.status(400).json({ error: "La URL ya está en uso" });
      }
      const org = await Organization.findByIdAndUpdate(req.params.id, { customUrl }, { new: true });
      res.json(org);
    } catch (e) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/projects/:orgId", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
        const token = authHeader ? authHeader.split(' ')[1] : null;
        const userId = token || req.cookies?.userId;
      let user = null;
      if (userId) {
        user = await User.findById(userId);
      }
      
      let filter: any = { orgId: req.params.orgId };
      if (user && user.role === 'usuario') {
        filter.invitedUsers = user._id;
      }

      const projects = await Project.find(filter).populate('invitedUsers');
      res.json(projects);
    } catch (e) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader ? authHeader.split(' ')[1] : null;
      const userId = token || req.cookies?.userId;
      
      const { orgId, title, content, status, maxChars, maxAudioTime, debateStartTime, debateClosingTime, votingClosingTime, pdfUrl, pdfName, invitedUsers, restrictBannedWords, republishedFromId } = req.body;
      const project = await Project.create({ 
        orgId, title, content, status: status || 'debate',
        maxChars, maxAudioTime, debateStartTime, debateClosingTime, votingClosingTime, pdfUrl, pdfName,
        restrictBannedWords: restrictBannedWords !== undefined ? restrictBannedWords : true,
        invitedUsers: invitedUsers || [],
        republishedFromId,
        createdBy: userId
      });

      if (republishedFromId) {
        await Project.findByIdAndUpdate(republishedFromId, { status: 'Terminado para republicar' });
      }

      if (invitedUsers && invitedUsers.length > 0) {
        const notifications = invitedUsers.map((uid: string) => ({
          userId: uid,
          orgId,
          projectId: project._id,
          title: "Invitación a debatir",
          message: `Has sido invitado a debatir y votar en el proyecto: ${title}`,
          type: 'invitation'
        }));
        await Notification.insertMany(notifications);
        
        const io = req.app.get('io');
        if (io) {
          invitedUsers.forEach((uid: string) => {
            io.to(uid).emit('new_notification', { title: "Invitación a debatir", message: `Has sido invitado a debatir en: ${title}` });
          });
        }
      }

      res.json(project);
    } catch (e) {
      res.status(400).json({ error: "Bad request" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader ? authHeader.split(' ')[1] : null;
      const userId = token || req.cookies?.userId;
      
      if (!userId) return res.status(401).json({ error: "No autenticado" });
      
      const user = await User.findById(userId);
      if (!user) return res.status(401).json({ error: "No autenticado" });
      
      const project = await Project.findById(req.params.id).populate('invitedUsers');
      if (!project) return res.status(404).json({ error: "Proyecto no encontrado" });
      
      if (user.role === 'administrador' || user.role === 'admin' || (user.role === 'editor' && project.createdBy?.toString() === userId)) {
        await Project.findByIdAndDelete(req.params.id);
        await Discussion.deleteMany({ projectId: req.params.id });
        await Vote.deleteMany({ projectId: req.params.id });
        return res.json({ success: true });
      } else {
        return res.status(403).json({ error: "No tienes permiso para eliminar este proyecto" });
      }
    } catch (e) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/projects/detail/:id", async (req, res) => {
    try {
      const project = await Project.findById(req.params.id).populate('invitedUsers');
      if (project) {
        const authHeader = req.headers.authorization;
        const token = authHeader ? authHeader.split(' ')[1] : null;
        const userId = token || req.cookies?.userId;
        let user = null;
        if (userId) {
          user = await User.findById(userId);
        }
        
        if (user && user.role === 'usuario') {
          if (!project.invitedUsers || !project.invitedUsers.includes(user._id)) {
            return res.status(403).json({ error: "No tienes acceso a este proyecto" });
          }
        }
        
        res.json(project);
      } else {
        res.status(404).json({ error: "Not found" });
      }
    } catch (e) {
      res.status(404).json({ error: "Not found" });
    }
  });

  app.post("/api/discussions/:id/react", async (req, res) => {
    try {
      const { userId, type } = req.body;
      const discussion = await Discussion.findById(req.params.id);
      if (!discussion) return res.status(404).json({ error: 'Not found' });
      
      discussion.likes = discussion.likes.filter(id => id.toString() !== userId);
      discussion.dislikes = discussion.dislikes.filter(id => id.toString() !== userId);
      
      if (type === 'like') {
        discussion.likes.push(userId);
      } else if (type === 'dislike') {
        discussion.dislikes.push(userId);
      }
      
      await discussion.save();
      
      const io = req.app.get('io');
      if (io) {
        io.to(discussion.projectId.toString()).emit('update_reaction', {
          discussionId: discussion._id.toString(),
          likes: discussion.likes,
          dislikes: discussion.dislikes
        });
      }
      
      res.json({ success: true, likes: discussion.likes, dislikes: discussion.dislikes });
    } catch (e) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/discussions/:projectId", async (req, res) => {
    try {
      const discussions = await Discussion.find({ projectId: req.params.projectId }).populate('userId');
      const mapped = discussions.map(d => {
        const obj = d.toJSON() as any;
        // Frontend expects user inside message
        obj.user = d.userId;
        return obj;
      });
      res.json(mapped);
    } catch (e) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/discussions", async (req, res) => {
    try {
      const { projectId, userId, content, type } = req.body;
      
      const project = await Project.findById(projectId).populate('orgId');
      if (project && project.restrictBannedWords && type === 'text') {
        const org = project.orgId as any;
        if (org && org.settings && org.settings.bannedWords && org.settings.bannedWords.length > 0) {
          const lowerMsg = content.toLowerCase();
          const foundBanned = org.settings.bannedWords.some((word: string) => lowerMsg.includes(word.toLowerCase()));
          if (foundBanned) {
            return res.status(400).json({ error: "El mensaje contiene palabras no permitidas." });
          }
        }
      }
      
      const obj = await actionQueue.add(async () => {
        const existing = await Discussion.findOne({ projectId, userId });
        if (existing) {
          const io = req.app.get('io');
          if (io) {
            io.to(userId).emit('duplicate_warning', {
              message: 'Intento de chat duplicado detectado. Resuelve este problema o podrías ser baneado.'
            });
          }
          throw new Error("El usuario ya ha intervenido en este proyecto");
        }
        
        const newMsg = await Discussion.create({
          projectId,
          userId,
          content,
          type,
        });
        
        const populatedMsg = await newMsg.populate('userId');
        const obj = populatedMsg.toJSON() as any;
        obj.user = populatedMsg.userId;
        return obj;
      });
      
      const io = req.app.get('io');
      if (io) {
        io.to(projectId).emit('new_message', obj);
        
        // Notify other users
        if (project && project.invitedUsers && project.invitedUsers.length > 0) {
          const receivers = project.invitedUsers.filter((uid: any) => uid.toString() !== userId);
          if (receivers.length > 0) {
            const notifications = receivers.map((uid: any) => ({
              userId: uid,
              orgId: project.orgId,
              projectId,
              title: "Nuevo mensaje de debate",
              message: `${obj.user.name} ha enviado un mensaje en "${project.title}".`,
              type: 'chat_message'
            }));
            await Notification.insertMany(notifications);
            
            receivers.forEach((uid: any) => {
              io.to(uid.toString()).emit('new_notification', { title: "Nuevo mensaje de debate", message: `${obj.user.name} ha enviado un mensaje en "${project.title}".` });
            });
          }
        }
      }
      
      res.json(obj);
    } catch (e: any) {
      res.status(400).json({ error: e.message || "Bad request" });
    }
  });


  app.get("/api/blockchain/audit/:projectId", async (req, res) => {
    try {
      // Find blocks related to this project
      const blocks = await Block.find({ "data.projectId": req.params.projectId }).sort({ index: -1 }).limit(100);
      res.json(blocks);
    } catch (e) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/blockchain/audit", async (req, res) => {
    try {
      const blocks = await Block.find().sort({ index: -1 }).limit(100);
      res.json(blocks);
    } catch (e) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/votes", async (req, res) => {
    try {
      const { projectId, userId, option } = req.body;
      
      const newVote = await actionQueue.add(async () => {
        const existing = await Vote.findOne({ projectId, userId });
        if (existing) {
          const io = req.app.get('io');
          if (io) {
            io.to(userId).emit('duplicate_warning', {
              message: 'Intento de voto duplicado detectado. Resuelve este problema o podrías ser baneado.'
            });
          }
          throw new Error("User already voted");
        }

        const vote = await Vote.create({ projectId, userId, option });
        
        // Add to auditable blockchain, ensuring secret vote by not recording userId
        await blockchain.addBlock({
          type: 'VOTE_EMITTED',
          projectId,
          option, // Opción registrada para auditoría transparente
          timestamp: new Date().toISOString()
        });
        
        return vote;
      });
      
      res.json(newVote);
    } catch (e: any) {
      res.status(400).json({ error: e.message || "Bad request" });
    }
  });
  
  app.get("/api/votes/:projectId", async (req, res) => {
    try {
      const votes = await Vote.find({ projectId: req.params.projectId }).populate('userId');
      res.json(votes);
    } catch (e) {
      res.status(500).json({ error: "Server error" });

  app.get("/api/votes/org/:orgId", async (req, res) => {
    try {
      const projects = await Project.find({ orgId: req.params.orgId });
      const projectIds = projects.map(p => p._id);
      const votes = await Vote.find({ projectId: { $in: projectIds } });
      res.json(votes);
    } catch (e) {
      res.status(500).json({ error: "Server error" });
    }
  });

    }
  });

  app.get("/api/departments/:orgId", async (req, res) => {
    try {
      const depts = await Department.find({ orgId: req.params.orgId });
      res.json(depts);
    } catch (e) {
      res.status(500).json({ error: "Server error" });
    }
  });

  
  app.delete("/api/departments/:id", async (req, res) => {
    try {
      const deptId = req.params.id;
      
      // Find subgroups
      const subDepts = await Department.find({ parentId: deptId });
      const idsToRemove = [deptId, ...subDepts.map(d => d._id.toString())];

      // Remove from users
      await User.updateMany(
        { departmentIds: { $in: idsToRemove } },
        { $pullAll: { departmentIds: idsToRemove } }
      );
      await User.updateMany(
        { departmentId: { $in: idsToRemove } },
        { $unset: { departmentId: 1 } }
      );

      // Delete departments
      await Department.deleteMany({ _id: { $in: idsToRemove } });
      
      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Server error", details: String(e) });
    }
  });
app.post("/api/departments", async (req, res) => {
    try {
      const { orgId, name, description, parentId } = req.body;
      const dept = await Department.create({ orgId, name, description, parentId });
      res.json(dept);
    } catch (e) {
      res.status(400).json({ error: "Bad request" });
    }
  });

  app.get("/api/users/org/:orgId", async (req, res) => {
    try {
      const users = await User.find({ orgId: req.params.orgId }).populate('departmentId').populate('departmentIds');
      res.json(users);
    } catch (e) {
      res.status(500).json({ error: "Server error" });
    }
  });

  
  app.put("/api/users/org/:orgId/:userId", async (req, res) => {
    try {
      const { departmentIds, notificationPreferences } = req.body;
      const user = await User.findById(req.params.userId);
      if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
      
      if (departmentIds !== undefined) {
        user.departmentIds = departmentIds;
        if (departmentIds && departmentIds.length > 0) {
          user.departmentId = departmentIds[0];
        } else {
          user.departmentId = undefined;
        }
      }

      if (notificationPreferences !== undefined) {
        user.notificationPreferences = notificationPreferences;
      }
      
      await user.save();
      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error updating user" });
    }
  });
app.post("/api/users", async (req, res) => {
    try {
      const { orgId, name, email, role, departmentId, departmentIds } = req.body;
      const user = await User.create({ orgId, name, email, role, departmentId, departmentIds: departmentIds || (departmentId ? [departmentId] : []) });
      res.json(user);
    } catch (e) {
      res.status(400).json({ error: "Bad request" });
    }
  });

  app.post("/api/register", async (req, res) => {
    try {
      const { orgName, adminEmail, adminPassword, plan } = req.body;
      let baseSlug = orgName.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!baseSlug) baseSlug = 'org';
      
      let customUrl = baseSlug;
      let counter = 1;
      while (await Organization.findOne({ customUrl })) {
        customUrl = `${baseSlug}${counter}`;
        counter++;
      }

      const lastOrg = await Organization.findOne().sort({ clientId: -1 });
      const nextClientId = lastOrg && lastOrg.clientId ? lastOrg.clientId + 1 : 1;
      const timestampId = Date.now().toString();

      const org = await Organization.create({
        name: orgName,
        customUrl,
        plan: plan || 'free',
        styles: { primaryColor: "#1d4ed8" },
        clientId: nextClientId,
        timestampId
      });
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);

      const admin = await User.create({
        name: "Administrador",
        email: adminEmail,
        password: hashedPassword,
        role: "administrador",
        orgId: org._id,
        organizations: [{ orgId: org._id, role: "administrador" }],
        verified: false
      });

      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      await EmailToken.create({ userId: admin._id, token });

      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_PORT === '465',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const confirmUrl = `${process.env.APP_URL || 'http://localhost:3000'}/confirm-email/${token}`;
        
        const htmlTemplate = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 40px 20px; border-radius: 12px;">
            <div style="background-color: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <h1 style="color: #1e293b; margin-top: 0; font-size: 24px; text-align: center;">¡Bienvenido a AsambleApp!</h1>
              <p style="color: #475569; font-size: 16px; line-height: 1.5; text-align: center;">Gracias por registrar tu organización <strong>${org.name}</strong>. Por favor confirma tu correo electrónico para comenzar a configurar tu espacio.</p>
              <div style="text-align: center; margin: 40px 0;">
                <a href="${confirmUrl}" style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Confirmar mi correo</a>
              </div>
              <p style="color: #94a3b8; font-size: 14px; text-align: center; margin-bottom: 0;">Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:</p>
              <p style="color: #64748b; font-size: 14px; text-align: center; word-break: break-all;">${confirmUrl}</p>
            </div>
          </div>
        `;

        try {
          await transporter.sendMail({
            from: `"AsambleApp" <${process.env.SMTP_USER}>`,
            to: adminEmail,
            subject: "Bienvenido a AsambleApp - Confirma tu correo",
            html: htmlTemplate,
          });
        } catch (emailError) {
          console.error("Error enviando correo de confirmación de registro:", emailError);
        }
      }

      res.json({ success: true, org, admin, message: "Organización registrada. Si el correo no llegó, revisa la configuración SMTP." });
    } catch (e) {
      console.error("Error completo en /api/register:", e);
      res.status(400).json({ error: "Error al registrar", details: e instanceof Error ? e.message : String(e) });
    }
  });

  
  app.post("/api/request-plan", async (req, res) => {
    try {
      const { name, email, phone, comments, planId, type } = req.body;
      
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_PORT === '465',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const htmlTemplate = `
          <h2>Nueva solicitud de ${type}</h2>
          <p><strong>Plan:</strong> ${planId}</p>
          <p><strong>Nombre:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Teléfono:</strong> ${phone}</p>
          <p><strong>Comentarios:</strong> ${comments || 'N/A'}</p>
        `;

        await transporter.sendMail({
          from: `"AsambleApp" <${process.env.SMTP_USER}>`,
          to: 'proyectos@omtecnologia.cl',
          subject: `Nueva solicitud de ${type} - ${planId}`,
          html: htmlTemplate,
        });
      }
      
      res.json({ success: true });
    } catch (e) {
      console.error('Error sending email:', e);
      res.status(500).json({ error: "Error enviando correo" });
    }
  });

  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.json({ success: true }); // Silent return for security

      const token = crypto.randomBytes(32).toString("hex");
      await PasswordResetToken.create({ userId: user._id, token });

      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_PORT === '465',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password/${token}`;
        
        // Estilos de la aplicación en el correo
        const htmlTemplate = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 40px 20px; border-radius: 12px;">
            <div style="background-color: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <h1 style="color: #1e293b; margin-top: 0; font-size: 24px; text-align: center;">Recuperación de Contraseña</h1>
              <p style="color: #475569; font-size: 16px; line-height: 1.5; text-align: center;">Has solicitado restablecer tu contraseña. Haz clic en el botón de abajo para cambiarla. Este enlace expirará en 15 minutos.</p>
              <div style="text-align: center; margin: 40px 0;">
                <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Cambiar Contraseña</a>
              </div>
              <p style="color: #64748b; font-size: 14px; text-align: center;">Si no solicitaste este cambio, puedes ignorar este correo.</p>
            </div>
          </div>
        `;

        await transporter.sendMail({
          from: `"AsambleApp" <${process.env.SMTP_USER}>`,
          to: user.email,
          subject: 'Recuperación de Contraseña - AsambleApp',
          html: htmlTemplate,
        });
      }
      
      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error procesando solicitud" });
    }
  });

  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      const resetToken = await PasswordResetToken.findOne({ token });
      
      if (!resetToken) {
        return res.status(400).json({ error: "El enlace es inválido o ha expirado" });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      await User.findByIdAndUpdate(resetToken.userId, { password: hashedPassword });
      await PasswordResetToken.deleteOne({ _id: resetToken._id });

      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error procesando solicitud" });
    }
  });
app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email }).populate('orgId').populate('organizations.orgId');
      
      if (!user) {
        return res.status(401).json({ error: "Credenciales incorrectas" });
      }

      if (user.verified === false) {
        return res.status(403).json({ error: "Por favor confirma tu correo electrónico antes de iniciar sesión." });
      }

      if (user.password) {
        const isHashed = user.password.startsWith('$2a$') || user.password.startsWith('$2b$');
        if (isHashed) {
          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) {
            return res.status(401).json({ error: "Credenciales incorrectas" });
          }
        } else {
          if (password !== user.password) {
            return res.status(401).json({ error: "Credenciales incorrectas" });
          }
        }
      } else {
        // If the user has no password at all
        return res.status(401).json({ error: "Credenciales incorrectas" });
      }
      
      res.cookie('userId', user._id.toString(), {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 24 * 60 * 60 * 1000 // 1 day
      });

      res.json({ success: true, user, token: user._id.toString() });
    } catch (e) {
      res.status(500).json({ error: "Error en el servidor" });
    }
  });

  app.post("/api/enrollment/link", async (req, res) => {
    try {
      const { orgId, role, expiresInHours } = req.body;
      const hours = parseInt(expiresInHours) || 24;
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + hours);
      
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const link = await EnrollmentLink.create({ orgId, role, token, expiresAt });
      res.json({ success: true, token });
    } catch (e) {
      res.status(500).json({ error: "Error generando enlace" });
    }
  });

  app.get("/api/enrollment/link/:token", async (req, res) => {
    try {
      const link = await EnrollmentLink.findOne({ token: req.params.token }).populate('orgId');
      if (!link) {
        return res.status(404).json({ error: "Enlace inválido o expirado" });
      }
      res.json({ success: true, link });
    } catch (e) {
      res.status(500).json({ error: "Error verificando enlace" });
    }
  });

  app.post("/api/enrollment/complete", async (req, res) => {
    try {
      const { email, token, password, name } = req.body;
      
      const link = await EnrollmentLink.findOne({ token });
      if (!link) return res.status(400).json({ error: "Enlace inválido o expirado" });
      
      // Check for expiration manually since we are not using TTL index for it in this dev setup
      if (new Date() > new Date(link.expiresAt)) {
        return res.status(400).json({ error: "El enlace ha expirado" });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        if (!req.body.confirmJoinExisting) {
          return res.status(400).json({ error: "El correo ya está registrado", userExists: true });
        } else {
          // Check if password matches
          const isMatch = await bcrypt.compare(password, existingUser.password);
          if (!isMatch) return res.status(400).json({ error: "Contraseña incorrecta para el usuario existente" });
          
          // Check if already in org
          const alreadyInOrg = existingUser.organizations?.some(o => o.orgId.toString() === link.orgId.toString()) || existingUser.orgId?.toString() === link.orgId.toString();
          if (alreadyInOrg) return res.status(400).json({ error: "El usuario ya pertenece a esta organización" });

          await User.updateOne(
            { _id: existingUser._id },
            { $push: { organizations: { orgId: link.orgId, role: link.role } } }
          );
          return res.json({ success: true, joinedExisting: true });
        }
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = await User.create({
        name: name || "Nuevo Usuario",
        email,
        password: hashedPassword,
        role: link.role,
        orgId: link.orgId,
        organizations: [{ orgId: link.orgId, role: link.role }],
        verified: false
      });

      const confirmToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      await EmailToken.create({ userId: user._id, token: confirmToken });

      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_PORT === '465',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const confirmUrl = `${process.env.APP_URL || 'http://localhost:3000'}/confirm-email/${confirmToken}`;
        
        const htmlTemplate = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 40px 20px; border-radius: 12px;">
            <div style="background-color: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <h1 style="color: #1e293b; margin-top: 0; font-size: 24px; text-align: center;">¡Bienvenido a AsambleApp!</h1>
              <p style="color: #475569; font-size: 16px; line-height: 1.5; text-align: center;">Tu cuenta ha sido creada exitosamente mediante enrolamiento masivo. Por favor confirma tu correo electrónico para poder iniciar sesión.</p>
              <div style="text-align: center; margin: 40px 0;">
                <a href="${confirmUrl}" style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Confirmar mi correo</a>
              </div>
              <p style="color: #94a3b8; font-size: 14px; text-align: center; margin-bottom: 0;">Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:</p>
              <p style="color: #64748b; font-size: 14px; text-align: center; word-break: break-all;">${confirmUrl}</p>
            </div>
          </div>
        `;

        try {
          await transporter.sendMail({
            from: `"AsambleApp" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Bienvenido a AsambleApp - Confirma tu correo",
            html: htmlTemplate,
          });
        } catch (emailError) {
          console.error("Error enviando correo de confirmación (mass-enroll):", emailError);
        }
      }

      res.json({ success: true, message: "Usuario creado. Si el correo no llegó, revisa la configuración SMTP." });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error al completar registro" });
    }
  });

  app.get("/api/confirm-email/:token", async (req, res) => {
    try {
      const emailToken = await EmailToken.findOne({ token: req.params.token });
      if (!emailToken) {
        return res.status(400).json({ error: "Enlace inválido o expirado" });
      }

      const user = await User.findById(emailToken.userId).populate('orgId');
      if (!user) {
        return res.status(400).json({ error: "Usuario no encontrado" });
      }

      user.verified = true;
      await user.save();
      
      await EmailToken.deleteOne({ _id: emailToken._id });

      res.json({ success: true, orgUrl: (user.orgId as any).customUrl });
    } catch (e) {
      res.status(500).json({ error: "Error confirmando correo" });
    }
  });

  // Servir carpeta public para assets
  app.use(express.static(path.join(process.cwd(), 'public')));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
