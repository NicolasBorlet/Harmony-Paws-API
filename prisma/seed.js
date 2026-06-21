"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    await prisma.role.upsert({
        where: { name: 'user' },
        update: {},
        create: { name: 'user' },
    });
    const breeds = ['Labrador', 'Golden Retriever', 'Berger Allemand', 'Bulldog', 'Caniche'];
    for (const name of breeds) {
        await prisma.breed.upsert({
            where: { name },
            update: {},
            create: { name },
        });
    }
    const behaviors = ['Sociable', 'Joueur', 'Calme', 'Énergique', 'Protecteur'];
    for (const name of behaviors) {
        await prisma.behavior.upsert({
            where: { name },
            update: {},
            create: { name },
        });
    }
    const passwordHash = await bcrypt.hash('password123', 10);
    await prisma.user.upsert({
        where: { email: 'demo@harmonypaws.app' },
        update: {},
        create: {
            email: 'demo@harmonypaws.app',
            passwordHash,
            firstName: 'Demo',
            lastName: 'User',
            onBoarding: false,
            roleId: 1,
            userStats: { create: {} },
            userPreferences: { create: {} },
        },
    });
}
main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
//# sourceMappingURL=seed.js.map