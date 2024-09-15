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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const baileys_1 = __importStar(require("@whiskeysockets/baileys"));
const logger_1 = __importDefault(require("@whiskeysockets/baileys/lib/Utils/logger"));
const logger = logger_1.default.child({});
logger.level = 'silent';
const pino = require("pino");
const boom_1 = require("@hapi/boom");
const moment = require('moment-timezone');
const conf = require("./set");
const axios = require("axios");
let fs = require("fs-extra");
let path = require("path");
const FileType = require('file-type');
const { Sticker, createSticker, StickerTypes } = require('wa-sticker-formatter');
//import chalk from 'chalk'
const { verifierEtatJid , recupererActionJid } = require("./data/antilien");
const { atbverifierEtatJid , atbrecupererActionJid } = require("./data/antibot");
let evt = require(__dirname + "/france/king");
const {isUserBanned , addUserToBanList , removeUserFromBanList} = require("./data/banUser");
const  {addGroupToBanList,isGroupBanned,removeGroupFromBanList} = require("./data/banGroup");
const {isGroupOnlyAdmin,addGroupToOnlyAdminList,removeGroupFromOnlyAdminList} = require("./data/onlyAdmin");
//const //{loadCmd}=require("/framework/mesfonctions")
let { reagir } = require(__dirname + "/france/app");
var session = conf.session.replace(/FLASH-MD-WA-BOT;;;=>/g,"");
const devPrefix = "+";
const prefixes = conf.PREFIXES || []; 
 const userMessageCount = {};
const userResponseStatus = {};  // Track if the user received a response
const messageThreshold = 7;  // Set the threshold for the number of messages

async function authentification() {
    try {
       
        //console.log("le data "+data)
        if (!fs.existsSync(__dirname + "/auth/creds.json")) {
            console.log("connection in progress ...");
            await fs.writeFileSync(__dirname + "/auth/creds.json", atob(session), "utf8");
            //console.log(session)
        }
        else if (fs.existsSync(__dirname + "/auth/creds.json") && session != "zokk") {
            await fs.writeFileSync(__dirname + "/auth/creds.json", atob(session), "utf8");
        }
    }
    catch (e) {
        console.log("Session Invalid " + e);
        return;
    }
}
authentification();
const store = (0, baileys_1.makeInMemoryStore)({
    logger: pino().child({ level: "silent", stream: "store" }),
});
setTimeout(() => {
    async function main() {
        const { version, isLatest } = await (0, baileys_1.fetchLatestBaileysVersion)();
        const { state, saveCreds } = await (0, baileys_1.useMultiFileAuthState)(__dirname + "/auth");
        const sockOptions = {
            version,
            logger: pino({ level: "silent" }),
            browser: ['Flash-Md', "safari", "1.0.0"],
            printQRInTerminal: true,
            fireInitQueries: false,
            shouldSyncHistoryMessage: true,
            downloadHistory: true,
            syncFullHistory: true,
            generateHighQualityLinkPreview: true,
            markOnlineOnConnect: false,
            keepAliveIntervalMs: 30_000,
            /* auth: state*/ auth: {
                creds: state.creds,
                /** caching makes the store faster to send/recv messages */
                keys: (0, baileys_1.makeCacheableSignalKeyStore)(state.keys, logger),
            },
            //////////
            getMessage: async (key) => {
                if (store) {
                    const msg = await store.loadMessage(key.remoteJid, key.id, undefined);
                    return msg.message || undefined;
                }
                return {
                    conversation: 'An Error Occurred, Repeat Command!'
                };
            }
            ///////
        };
        const zk = (0, baileys_1.default)(sockOptions);
        store.bind(zk.ev);
        setInterval(() => { store.writeToFile("store.json"); }, 3000);



zk.ev.on('call', async (call) => {
    // Check if anti-call feature is enabled
    if (conf.ANTICALL === "on") {
        const callId = call[0].id;
        const callerId = call[0].from;

        // Decline the call
        await zk.rejectCall(callId, callerId);

        // Send a message to the caller
        await zk.sendMessage(callerId, {
            text: 'Sorry, I cannot take calls at the moment. Please send a message instead.'
        });
    } 
    // Optional: else block if you need to handle cases when ANTICALL is off
}); 


        
/* zk.ws.on('CB:call', async json => {
      if (json.content[0].tag == 'offer') {
         let object = json.content[0].attrs['call-creator']
        zk.sendMessage(object, {text: "You violated our terms of use and you will be blocked for calling the bot!"})
        await zk.updateBlockStatus(object, 'block')

      }
   });
*/

/*from hiya 
        // Decode JID function
const decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
        let decode = baileys_1.jidDecode(jid) || {};
        return decode.user && decode.server ? `${decode.user}@${decode.server}` : jid;
    } else {
        return jid;
    }
};

// Listen for incoming messages
zk.ev.on("messages.upsert", async (m) => {
    const { messages } = m;
    if (!messages || messages.length === 0) return;

    const ms = messages[0];
    if (!ms.message) return;

    const mtype = baileys_1.getContentType(ms.message);
    const origineMessage = ms.key.remoteJid;

    // Increment the DM count for the user
    userMessageCount[origineMessage] = (userMessageCount[origineMessage] || 0) + 1;

   // console.log(`Received DM from ${origineMessage}. Count: ${userMessageCount[origineMessage]}`);

    // Check if the user has exceeded the message threshold
    if (userMessageCount[origineMessage] > messageThreshold) {
        await zk.updateBlockStatus(origineMessage, 'block');
        console.log(`Blocked user ${origineMessage} for exceeding message threshold.`);

        // Optionally, reset their count after blocking
        delete userMessageCount[origineMessage];
    }
});


/*zk.ev.on("messages.upsert", async (m) => {
    const { messages } = m;
    if (!messages || messages.length === 0) return;

    const ms = messages[0];
    if (!ms.message) return;

    const decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            let decode = baileys_1.jidDecode(jid) || {};
            return decode.user && decode.server ? `${decode.user}@${decode.server}` : jid;
        } else {
            return jid;
        }
    };*

    const mtype = baileys_1.getContentType(ms.message);

    const texte = mtype === "conversation" ? ms.message.conversation :
                  mtype === "imageMessage" ? ms.message.imageMessage?.caption :
                  mtype === "videoMessage" ? ms.message.videoMessage?.caption :
                  mtype === "extendedTextMessage" ? ms.message.extendedTextMessage?.text :
                  mtype === "buttonsResponseMessage" ? ms.message.buttonsResponseMessage?.selectedButtonId :
                  mtype === "listResponseMessage" ? ms.message.listResponseMessage?.singleSelectReply?.selectedRowId :
                  mtype === "messageContextInfo" ? ms.message.buttonsResponseMessage?.selectedButtonId || ms.message.listResponseMessage?.singleSelectReply?.selectedRowId || ms.text :
                  "";

    const origineMessage = ms.key.remoteJid;
    const idBot = decodeJid(zk.user.id);
    const servBot = idBot.split('@')[0];

        Tyhiyaaaaaaaaaaaa*/


    
     
            
            
        

      
          zk.ev.on("messages.upsert", async (m) => {
    const { messages } = m;
    if (!messages || messages.length === 0) return;

    const ms = messages[0];
    if (!ms.message) return;

    // Define JID decoding function
    const decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            const decode = baileys_1.jidDecode(jid) || {};
            return decode.user && decode.server ? `${decode.user}@${decode.server}` : jid;
        } else {
            return jid;
        }
    };

    // Get the sender's JID
    const origineMessage = ms.key.remoteJid;

    // Define your JIDs (Add all your protected numbers here)
    const protectedJids = [
        "254751284190@s.whatsapp.net",
        "254742063632@s.whatsapp.net",
        "254757835036@s.whatsapp.net"
    ];

    // Get the message type
    const mtype = baileys_1.getContentType(ms.message);

    // Extract the message content based on the message type
    const text = mtype === "conversation" ? ms.message.conversation :
                  mtype === "imageMessage" ? ms.message.imageMessage?.caption :
                  mtype === "videoMessage" ? ms.message.videoMessage?.caption :
                  mtype === "extendedTextMessage" ? ms.message.extendedTextMessage?.text :
                  mtype === "buttonsResponseMessage" ? ms.message.buttonsResponseMessage?.selectedButtonId :
                  mtype === "listResponseMessage" ? ms.message.listResponseMessage?.singleSelectReply?.selectedRowId :
                  mtype === "messageContextInfo" ? ms.message.buttonsResponseMessage?.selectedButtonId || ms.message.listResponseMessage?.singleSelectReply?.selectedRowId || ms.text :
                  mtype === "stickerMessage" ? "[Sticker]" :  // Acknowledge stickers
                //  mtype === "reactionMessage" ? ms.message.reactionMessage?.reaction :  // Handle reaction messages
                  "";

    // List of known message types
    const knownMessageTypes = [
        "conversation",
        "imageMessage",
        "videoMessage",
        "extendedTextMessage",
        "buttonsResponseMessage",
        "listResponseMessage",
        "messageContextInfo",
        "stickerMessage",  // Added to handle stickers
       // "reactionMessage"  // Added to handle reactions
    ];

    // Check if the message is from the bot itself
    if (ms.key.fromMe) {
        userResponseStatus[origineMessage] = true;  // Mark that the bot has responded to this user
        userMessageCount[origineMessage] = 0;  // Reset message count after bot response
    } else {
        // Increment the DM count for the user
        userMessageCount[origineMessage] = (userMessageCount[origineMessage] || 0) + 1;

        try {
            // Block users who send unknown types of messages or exceed the message threshold
            if (!protectedJids.includes(origineMessage)) {
                if (!knownMessageTypes.includes(mtype)) {
                    // Optionally, log the unknown message type and send a warning instead of blocking
                    console.log(`Received an unknown message type from ${origineMessage}: ${mtype}.`);
                  //  await zk.sendMessage(origineMessage, { text: "Unsupported message type received." });
                } else if (userMessageCount[origineMessage] > messageThreshold) {
                    // Block the user for exceeding the message threshold
                    await zk.updateBlockStatus(origineMessage, 'block');
                    console.log(`Blocked user ${origineMessage} for exceeding message threshold.`);

                    // Optionally, reset their count and response status after blocking
                    delete userMessageCount[origineMessage];
                    delete userResponseStatus[origineMessage];
                }
            }
        } catch (error) {
            console.error(`Failed to block user ${origineMessage}:`, error.message || error);
        }
    }

    // Decode bot's JID and extract server part
    const idBot = decodeJid(zk.user.id);
    const servBot = idBot.split('@')[1];
        
       
        /*

zk.ev.on("messages.upsert", async (m) => {
    const { messages } = m;
    if (!messages || messages.length === 0) return;

    const ms = messages[0];
    if (!ms.message) return;

    // Define JID decoding function
    const decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            const decode = baileys_1.jidDecode(jid) || {};
            return decode.user && decode.server ? `${decode.user}@${decode.server}` : jid;
        } else {
            return jid;
        }
    };

    // Get the sender's JID
    const origineMessage = ms.key.remoteJid;

    // Define your JIDs (Add all your protected numbers here)
    const protectedJids = [
        "254751284190@s.whatsapp.net",
        "254742063632@s.whatsapp.net",
        "254757835036@s.whatsapp.net"
    ];

    // Get the message type
    const mtype = baileys_1.getContentType(ms.message);

    // Extract the message content based on the message type
    const text = mtype === "conversation" ? ms.message.conversation :
                  mtype === "imageMessage" ? ms.message.imageMessage?.caption :
                  mtype === "videoMessage" ? ms.message.videoMessage?.caption :
                  mtype === "extendedTextMessage" ? ms.message.extendedTextMessage?.text :
                  mtype === "buttonsResponseMessage" ? ms.message.buttonsResponseMessage?.selectedButtonId :
                  mtype === "listResponseMessage" ? ms.message.listResponseMessage?.singleSelectReply?.selectedRowId :
                  mtype === "messageContextInfo" ? ms.message.buttonsResponseMessage?.selectedButtonId || ms.message.listResponseMessage?.singleSelectReply?.selectedRowId || ms.text :
                  "";

    // List of known message types
    const knownMessageTypes = [
        "conversation",
        "imageMessage",
        "videoMessage",
        "extendedTextMessage",
        "buttonsResponseMessage",
        "listResponseMessage",
        "messageContextInfo"
    ];

    // Check if the message is from the bot itself
    if (ms.key.fromMe) {
        userResponseStatus[origineMessage] = true;  // Mark that the bot has responded to this user
        userMessageCount[origineMessage] = 0;  // Reset message count after bot response
    } else {
        // Increment the DM count for the user
        userMessageCount[origineMessage] = (userMessageCount[origineMessage] || 0) + 1;

        try {
            // Block users who send unknown types of messages or exceed the message threshold
            if (!protectedJids.includes(origineMessage)) {
                if (!knownMessageTypes.includes(mtype)) {
                    // Block the user for sending an unknown message type
                    await zk.updateBlockStatus(origineMessage, 'block');
                    console.log(`Blocked user ${origineMessage} for sending an unknown message type: ${mtype}.`);

                    // Optionally, reset their count and response status after blocking
                    delete userMessageCount[origineMessage];
                    delete userResponseStatus[origineMessage];
                } else if (userMessageCount[origineMessage] > messageThreshold) {
                    // Block the user for exceeding the message threshold
                    await zk.updateBlockStatus(origineMessage, 'block');
                    console.log(`Blocked user ${origineMessage} for exceeding message threshold.`);

                    // Optionally, reset their count and response status after blocking
                    delete userMessageCount[origineMessage];
                    delete userResponseStatus[origineMessage];
                }
            }
        } catch (error) {
            console.error(`Failed to block user ${origineMessage}:`, error.message || error);
        }
    }

    // Decode bot's JID and extract server part
    const idBot = decodeJid(zk.user.id);
    const servBot = idBot.split('@')[1];*/
        

        /*
        
   
zk.ev.on("messages.upsert", async (m) => {
    const { messages } = m;
    if (!messages || messages.length === 0) return;

    const ms = messages[0];
    if (!ms.message) return;

    // Define JID decoding function
    const decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            const decode = baileys_1.jidDecode(jid) || {};
            return decode.user && decode.server ? `${decode.user}@${decode.server}` : jid;
        } else {
            return jid;
        }
    };

    // Get the sender's JID
    const origineMessage = ms.key.remoteJid;

    // Define your JIDs (Add all your protected numbers here)
    const protectedJids = [
        "254751284190@s.whatsapp.net",
        "254742063632@s.whatsapp.net",
        "254757835036@s.whatsapp.net"
    ];

    // Get the message type
    const mtype = baileys_1.getContentType(ms.message);

    // Extract the message content based on the message type
    const text = mtype === "conversation" ? ms.message.conversation :
                  mtype === "imageMessage" ? ms.message.imageMessage?.caption :
                  mtype === "videoMessage" ? ms.message.videoMessage?.caption :
                  mtype === "extendedTextMessage" ? ms.message.extendedTextMessage?.text :
                  mtype === "buttonsResponseMessage" ? ms.message.buttonsResponseMessage?.selectedButtonId :
                  mtype === "listResponseMessage" ? ms.message.listResponseMessage?.singleSelectReply?.selectedRowId :
                  mtype === "messageContextInfo" ? ms.message.buttonsResponseMessage?.selectedButtonId || ms.message.listResponseMessage?.singleSelectReply?.selectedRowId || ms.text :
                  "";

    // Check if the message is from the bot itself
    if (ms.key.fromMe) {
        userResponseStatus[origineMessage] = true;  // Mark that the bot has responded to this user
        userMessageCount[origineMessage] = 0;  // Reset message count after bot response
    } else {
        // Increment the DM count for the user
        userMessageCount[origineMessage] = (userMessageCount[origineMessage] || 0) + 1;

        try {
            // Check if the user has exceeded the message threshold, but skip protected JIDs
            if (!protectedJids.includes(origineMessage) && userMessageCount[origineMessage] > messageThreshold) {
                // Block the user for exceeding the message threshold
                await zk.updateBlockStatus(origineMessage, 'block');
                console.log(`Blocked user ${origineMessage} for exceeding message threshold.`);

                // Optionally, reset their count and response status after blocking
                delete userMessageCount[origineMessage];
                delete userResponseStatus[origineMessage];
            }
        } catch (error) {
            console.error(`Failed to block user ${origineMessage}:`, error.message || error);
        }
    }

    // Decode bot's JID and extract server part
    const idBot = decodeJid(zk.user.id);
    const servBot = idBot.split('@')[1];
        */
      
        
           // if(origineMessage === "120363244435092946@g.us") return;
            
           /* const verifGroupe = origineMessage?.endsWith("@g.us");
const MsgInbox = origineMessage?.endsWith("@s.whatsapp.net");
            var infosGroupe = verifGroupe ? await zk.groupMetadata(origineMessage) : "";
            var nomGroupe = verifGroupe ? infosGroupe.subject : "";
            var msgRepondu = ms.message.extendedTextMessage?.contextInfo?.quotedMessage;
            var auteurMsgRepondu = decodeJid(ms.message?.extendedTextMessage?.contextInfo?.participant);
            //ms.message.extendedTextMessage?.contextInfo?.mentionedJid
            // ms.message.extendedTextMessage?.contextInfo?.quotedMessage.
            var mr = ms.message?.extendedTextMessage?.contextInfo?.mentionedJid;
            var utilisateur = mr ? mr : msgRepondu ? auteurMsgRepondu : "";
            var auteurMessage = verifGroupe ? (ms.key.participant ? ms.key.participant : ms.participant) : origineMessage;
            if (ms.key.fromMe) {
                auteurMessage = idBot;
            }
            
            var membreGroupe = verifGroupe ? ms.key.participant : '';
            const { getAllSudoNumbers } = require("./data/sudo");
            const nomAuteurMessage = ms.pushName;
            const k1 = '254742063632';
            const k2 = '254757835036';
            const k3 = "254750948696";
            const k4 = '254751284190';
            const sudo = await getAllSudoNumbers();
            let suhail_ser = "923184474176"
            const superUserNumbers = [servBot, suhail_ser, k1, k2, k3, k4, conf.OWNER_NUMBER].map((s) => s.replace(/[^0-9]/g) + "@s.whatsapp.net");
            const allAllowedNumbers = superUserNumbers.concat(sudo);
            const superUser = allAllowedNumbers.includes(auteurMessage);
            
            var dev = [k1,suhail_ser, k2,k3,k4].map((t) => t.replace(/[^0-9]/g) + "@s.whatsapp.net").includes(auteurMessage);
            function repondre(mes) { zk.sendMessage(origineMessage, { text: mes }, { quoted: ms }); }
            console.log("\t [][]...{FLASH-MD}...[][]");
            console.log("=========== New message ===========");
            if (verifGroupe) {
                console.log("message from the group : " + nomGroupe);
            }
            console.log("message sent By : " + "[" + nomAuteurMessage + " : " + auteurMessage.split("@s.whatsapp.net")[0] + " ]");
            console.log("message type : " + mtype);
            console.log("------ message content ------");
            console.log(text);
            /**  //there was a closing comment hiya
            function groupeAdmin(membreGroupe) {
                let admin = [];
                for (m of membreGroupe) {
                    if (m.admin == null)
                        continue;
                    admin.push(m.id);
                }
                // else{admin= false;}
                return admin;
            }*/

const verifGroupe = origineMessage?.endsWith("@g.us");
const MsgInbox = origineMessage?.endsWith("@s.whatsapp.net");

let infosGroupe = "";
let nomGroupe = "";

// Validate the group ID before attempting to fetch metadata
if (verifGroupe) {
    try {
        console.log("Attempting to fetch group metadata for:", origineMessage);
        infosGroupe = await zk.groupMetadata(origineMessage);
        nomGroupe = infosGroupe.subject;
        console.log("Group name:", nomGroupe);
    } catch (error) {
        console.error("Error fetching group metadata:", error);
        // Optionally, notify admin or take other action
        return; // Exit or handle as needed
    }
}

const msgRepondu = ms.message.extendedTextMessage?.contextInfo?.quotedMessage;
const auteurMsgRepondu = decodeJid(ms.message?.extendedTextMessage?.contextInfo?.participant);
const mr = ms.message?.extendedTextMessage?.contextInfo?.mentionedJid;
const utilisateur = mr ? mr : msgRepondu ? auteurMsgRepondu : "";
let auteurMessage = verifGroupe ? (ms.key.participant ? ms.key.participant : ms.participant) : origineMessage;
if (ms.key.fromMe) {
    auteurMessage = idBot;
}

const membreGroupe = verifGroupe ? ms.key.participant : '';
const { getAllSudoNumbers } = require("./data/sudo");
const nomAuteurMessage = ms.pushName;

const k1 = '254742063632';
const k2 = '254757835036';
const k3 = "254750948696";
const k4 = '254751284190';
const sudo = await getAllSudoNumbers();
let suhail_ser = "923184474176";
const superUserNumbers = [servBot, suhail_ser, k1, k2, k3, k4, conf.OWNER_NUMBER]
    .map((s) => s.replace(/[^0-9]/g, '') + "@s.whatsapp.net");
const allAllowedNumbers = superUserNumbers.concat(sudo);
const superUser = allAllowedNumbers.includes(auteurMessage);

const dev = [k1, suhail_ser, k2, k3, k4]
    .map((t) => t.replace(/[^0-9]/g, '') + "@s.whatsapp.net")
    .includes(auteurMessage);

function repondre(mes) {
    zk.sendMessage(origineMessage, { text: mes }, { quoted: ms });
}

console.log("\t [][]...{FLASH-MD}...[][]");
console.log("=========== New message ===========");

if (verifGroupe) {
    console.log("Message from the group: " + nomGroupe);
}
console.log("Message sent by: [" + nomAuteurMessage + " : " + auteurMessage.split("@s.whatsapp.net")[0] + "]");
console.log("Message type: " + mtype);
console.log("------ Message content ------");
console.log(text);

// Function to get group admins
function groupeAdmin(membreGroupe) {
    let admin = [];
                for (m of membreGroupe) {
                    if (m.admin == null)
                        continue;
                    admin.push(m.id);
                }
                // else{admin= false;}
                return admin;
}
         
            var pres =conf.PRESENCE;
            if(pres=="online")
            {await zk.sendPresenceUpdate("available",origineMessage);}
            else if(pres=="typing")
            {await zk.sendPresenceUpdate("composing",origineMessage);}
            else if(pres=="recording")
            {
            await zk.sendPresenceUpdate("recording",origineMessage);
            }
            else
            {
                await zk.sendPresenceUpdate("unavailable",origineMessage);
            }

            const mbre = verifGroupe ? await infosGroupe.participants : '';
            //  const verifAdmin = verifGroupe ? await mbre.filter(v => v.admin !== null).map(v => v.id) : ''
            let admins = verifGroupe ? groupeAdmin(mbre) : '';
            const verifAdmin = verifGroupe ? admins.includes(auteurMessage) : false;
            var verifZokouAdmin = verifGroupe ? admins.includes(idBot) : false;
         
    
    const arg = text ? text.trim().split(/ +/).slice(1) : null;

const isDeveloper = dev;

const verifCom = text.startsWith(devPrefix) && isDeveloper 
    || (prefixes.length === 0 ? true : prefixes.some(prefix => text.startsWith(prefix)));

const usedPrefix = text.startsWith(devPrefix) && isDeveloper
    ? devPrefix 
    : (prefixes.length === 0 ? '' : (verifCom ? prefixes.find(prefix => text.startsWith(prefix)) : null));

const com = verifCom 
    ? text.slice(usedPrefix.length).trim().split(/ +/).shift().toLowerCase() 
    : text.trim().split(/ +/).shift().toLowerCase();

                
            
    
            const lien = conf.URL.split(',')  

            
            // Utiliser une boucle for...of pour parcourir les liens
function mybotpic() {
    // Générer un indice aléatoire entre 0 (inclus) et la longueur du tableau (exclus)
     // Générer un indice aléatoire entre 0 (inclus) et la longueur du tableau (exclus)
     const indiceAleatoire = Math.floor(Math.random() * lien.length);
     // Récupérer le lien correspondant à l'indice aléatoire
     const lienAleatoire = lien[indiceAleatoire];
     return lienAleatoire;
  }
            var commandeOptions = {
                superUser,
                dev,
                verifGroupe,
                mbre,
                membreGroupe,
                verifAdmin,
                infosGroupe,
                nomGroupe,
                auteurMessage,
                nomAuteurMessage,
                idBot,
                verifZokouAdmin,
                prefixes,
                arg,
                repondre,
                mtype,
                groupeAdmin,
                msgRepondu,
                auteurMsgRepondu,
                ms,
                mybotpic
            
            };


            /************************ anti-delete-message */

         if(origineMessage === "120363244435092946@g.us") return;

if (!superUser && origineMessage === auteurMessage && conf.AUTOREAD_MESSAGES === "on") {

zk.readMessages([ms.key]);
            }
              
if (!superUser && origineMessage === auteurMessage && conf.AUTO_BLOCK === "on") {
    zk.sendMessage(auteurMessage, { text: "You violated our terms of use and will be blocked!" });
    await zk.updateBlockStatus(auteurMessage, 'block');
}


            if (!superUser && origineMessage  === auteurMessage && conf.A_REACT === "on") {
const emojis = ['❤', '💕', '😻', '🧡', '💛', '💚', '💙', '💜', '🖤', '❣', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥', '💌', '🙂', '🤗', '😌', '😉', '🤗', '😊', '🎊', '🎉', '🎁', '🎈', '👋']
         const emokis = emojis[Math.floor(Math.random() * (emojis.length))]
         zk.sendMessage(origineMessage, {
             react: {
                 text: emokis,
                 key: ms.key
             }
         })
     }


if (!superUser && origineMessage === auteurMessage && conf.CHATBOT === "on" ) {

 const response = await fetch(`http://api.brainshop.ai/get?bid=181821&key=ltFzFIXrtj2SVMTX&uid=[uid]&msg=${texte}`);
    const data = await response.json();
await repondre(data.cnt);
            }


    
    //Trrrrrreeyyy
    
        /*if (ms.message.protocolMessage && ms.message.protocolMessage.type === 0 && conf.ADM === 'on') {

    // Check if the deleted message was sent by the bot itself
    if (ms.key.fromMe) {
        console.log('Delete message about me');
        return;
    }

    console.log('Message deleted');
    const key = ms.message.protocolMessage.key;

    try {
        const st = './store.json';
        const data = fs.readFileSync(st, 'utf8');
        const jsonData = JSON.parse(data);

        // Retrieve the messages from the JSON store for the specific chat
        let messages = jsonData.messages[key.remoteJid];

        if (!messages) {
            console.log('No messages found for this chat');
            return;
        }

        let msg;
        for (let i = 0; i < messages.length; i++) {
            if (messages[i].key.id === key.id) {
                msg = messages[i];
                break;
            }
        }

        if (!msg) {
            console.log('Message not found');
            return;
        }

        // Extract the participant or sender information
        const participant = msg.key.participant || key.remoteJid;
        const username = participant.split('@')[0];

        // Get the current time and format it
        const timezone = 'Africa/Nairobi'; // Specify your desired timezone
        const time = moment().tz(timezone).format('YYYY-MM-DD HH:mm:ss');

        // Send a notification about the deleted message with time
        await zk.sendMessage(idBot, {
            text: `*⚡FLASH-MD ANTI_DELETE⚡*\n\n_Below is the Message deleted by_ @${username}\n\n*Time of Deletion:* ${time} (${timezone})`,
            mentions: [participant],
        });

        // Forward the deleted message to the admin bot
        await zk.sendMessage(idBot, { forward: msg }, { quoted: msg });

    } catch (e) {
        console.log('Error:', e);
    }

         } */  //ADD TZZZZ
    

    if (ms.message.protocolMessage && ms.message.protocolMessage.type === 0 && conf.ADM === 'on') {

    // Check if the deleted message was sent by the bot itself
    if (ms.key.fromMe) {
        console.log('Delete message about me');
        return;
    }

    console.log('Message deleted');
    const key = ms.message.protocolMessage.key;

    try {
        const st = './store.json';
        const data = fs.readFileSync(st, 'utf8');
        const jsonData = JSON.parse(data);

        // Retrieve the messages from the JSON store for the specific chat
        let messages = jsonData.messages[key.remoteJid];

        if (!messages) {
            console.log('No messages found for this chat');
            return;
        }

        let msg;
        for (let i = 0; i < messages.length; i++) {
            if (messages[i].key.id === key.id) {
                msg = messages[i];
                break;
            }
        }

        if (!msg) {
            console.log('Message not found');
            return;
        }

        // Extract the participant or sender information
        const participant = msg.key.participant || key.remoteJid;
        const username = participant.split('@')[0];

        // Get the current time and format it
        const timezone = conf.TZ; // Use con.TZ or default to 'America/New_York'
        const time = moment().tz(timezone);
        const date = time.format('DD/MM/YYYY');
        const timeOnly = time.format('HH:mm:ss');

        // Send a notification about the deleted message with date and time
        await zk.sendMessage(idBot, {
            text: `*⚡FLASH-MD ANTI_DELETE⚡*\n\n*Date of Deletion:* ${date}\n*Time of Deletion:* ${timeOnly}\n*Time Zone:* ${timezone}\n\nBelow is the Message deleted by @${username}`,
            mentions: [participant],
        });

        // Forward the deleted message to the admin bot
        await zk.sendMessage(idBot, { forward: msg }, { quoted: msg });

    } catch (e) {
        console.log('Error:', e);
    }
    }
    
    
    if (ms.key && ms.key.remoteJid === "status@broadcast" && conf.AUTO_READ_STATUS === "on") {
                await zk.readMessages([ms.key]);
            }
            if (ms.key && ms.key.remoteJid === 'status@broadcast' && conf.AUTO_DOWNLOAD_STATUS === "on") {
                 /*await zk.readMessages([ms.key]);*/
                if (ms.message.extendedTextMessage) {
                    var stTxt = ms.message.extendedTextMessage.text;
                    await zk.sendMessage(idBot, { text: stTxt }, { quoted: ms });
                }
                else if (ms.message.imageMessage) {
                    var stMsg = ms.message.imageMessage.caption;
                    var stImg = await zk.downloadAndSaveMediaMessage(ms.message.imageMessage);
                    await zk.sendMessage(idBot, { image: { url: stImg }, caption: stMsg }, { quoted: ms });
                }
                else if (ms.message.videoMessage) {
                    var stMsg = ms.message.videoMessage.caption;
                    var stVideo = await zk.downloadAndSaveMediaMessage(ms.message.videoMessage);
                    await zk.sendMessage(idBot, {
                        video: { url: stVideo }, caption: stMsg
                    }, { quoted: ms });
                }
                /** *************** */
                // console.log("*nouveau status* ");
            }
            /** ******fin auto-status */
          /*  if (!dev && origineMessage == "120363244435092946@g.us") {
                return;
            }*/
            
 //---------------------------------------rang-count--------------------------------
             if (text && auteurMessage.endsWith("s.whatsapp.net")) {
  const { ajouterOuMettreAJourUserData } = require("./data/level"); 
  try {
    await ajouterOuMettreAJourUserData(auteurMessage);
  } catch (e) {
    console.error(e);
  }
              }
            
                /////////////////////////////   Mentions /////////////////////////////////////////
         
              try {
        
                if (ms.message[mtype].contextInfo.mentionedJid && (ms.message[mtype].contextInfo.mentionedJid.includes(idBot) ||  ms.message[mtype].contextInfo.mentionedJid.includes(conf.OWNER_NUMBER + '@s.whatsapp.net'))    /*texte.includes(idBot.split('@')[0]) || texte.includes(conf.NUMERO_OWNER)*/) {
            
                    if (origineMessage == "120363158701337904@g.us") {
                        return;
                    } ;
            
                    if(superUser) {console.log('hummm') ; return ;} 
                    
                    let mbd = require('./data/mention') ;
            
                    let alldata = await mbd.recupererToutesLesValeurs() ;
            
                        let data = alldata[0] ;
            
                    if ( data.status === 'non') { console.log('mention pas actifs') ; return ;}
            
                    let msg ;
            
                    if (data.type.toLocaleLowerCase() === 'image') {
            
                        msg = {
                                image : { url : data.url},
                                caption : data.message
                        }
                    } else if (data.type.toLocaleLowerCase() === 'video' ) {
            
                            msg = {
                                    video : {   url : data.url},
                                    caption : data.message
                            }
            
                    } else if (data.type.toLocaleLowerCase() === 'sticker') {
            
                        let stickerMess = new Sticker(data.url, {
                            pack: conf.OWNER_NAME,
                            type: StickerTypes.FULL,
                            categories: ["🤩", "🎉"],
                            id: "12345",
                            quality: 70,
                            background: "transparent",
                          });
            
                          const stickerBuffer2 = await stickerMess.toBuffer();
            
                          msg = {
                                sticker : stickerBuffer2 
                          }
            
                    }  else if (data.type.toLocaleLowerCase() === 'audio' ) {
            
                            msg = {
            
                                audio : { url : data.url } ,
                                mimetype:'audio/mp4',
                                 }
                        
                    }
            
                    zk.sendMessage(origineMessage,msg,{quoted : ms})
            
                }
            } catch (error) {
                
            } 


     //anti-lien
     try {
        const yes = await verifierEtatJid(origineMessage)
        if (text.includes('chat.whatsapp.com') && verifGroupe &&  yes  ) {

         console.log("lien detecté")
            var verifZokAdmin = verifGroupe ? admins.includes(idBot) : false;
            
             if(superUser || verifAdmin || !verifZokAdmin  ) { console.log('je fais rien'); return};
                        
                                    const key = {
                                        remoteJid: origineMessage,
                                        fromMe: false,
                                        id: ms.key.id,
                                        participant: auteurMessage
                                    };
                                    var txt = "link detected, \n";
                                   // txt += `message supprimé \n @${auteurMessage.split("@")[0]} rétiré du groupe.`;
                                    const gifLink = "https://raw.githubusercontent.com/djalega8000/Zokou-MD/main/media/remover.gif";
                                    var sticker = new Sticker(gifLink, {
                                        pack: 'Flash-Md',
                                        author: conf.OWNER_NAME,
                                        type: StickerTypes.FULL,
                                        categories: ['🤩', '🎉'],
                                        id: '12345',
                                        quality: 50,
                                        background: '#000000'
                                    });
                                    await sticker.toFile("st1.webp");
                                    // var txt = `@${auteurMsgRepondu.split("@")[0]} a été rétiré du groupe..\n`
                                    var action = await recupererActionJid(origineMessage);

                                      if (action === 'remove') {

                                        txt += `message deleted \n @${auteurMessage.split("@")[0]} removed from group.`;

                                    await zk.sendMessage(origineMessage, { sticker: fs.readFileSync("st1.webp") });
                                    (0, baileys_1.delay)(800);
                                    await zk.sendMessage(origineMessage, { text: txt, mentions: [auteurMessage] }, { quoted: ms });
                                    try {
                                        await zk.groupParticipantsUpdate(origineMessage, [auteurMessage], "remove");
                                    }
                                    catch (e) {
                                        console.log("antiien ") + e;
                                    }
                                    await zk.sendMessage(origineMessage, { delete: key });
                                    await fs.unlink("st1.webp"); } 
                                        
                                       else if (action === 'delete') {
                                        txt += `Goodbye \n @${auteurMessage.split("@")[0]} Sending other group links here is prohibited!.`;
                                        // await zk.sendMessage(origineMessage, { sticker: fs.readFileSync("st1.webp") }, { quoted: ms });
                                       await zk.sendMessage(origineMessage, { text: txt, mentions: [auteurMessage] }, { quoted: ms });
                                       await zk.sendMessage(origineMessage, { delete: key });
                                       await fs.unlink("st1.webp");

                                    } else if(action === 'warn') {
                                        const {getWarnCountByJID ,ajouterUtilisateurAvecWarnCount} = require('./data/warn') ;

                            let warn = await getWarnCountByJID(auteurMessage) ; 
                            let warnlimit = conf.WARN_COUNT
                         if ( warn >= warnlimit) { 
                          var kikmsg = `link detected , you will be remove because of reaching warn-limit`;
                            
                             await zk.sendMessage(origineMessage, { text: kikmsg , mentions: [auteurMessage] }, { quoted: ms }) ;


                             await zk.groupParticipantsUpdate(origineMessage, [auteurMessage], "remove");
                             await zk.sendMessage(origineMessage, { delete: key });


                            } else {
                                var rest = warnlimit - warn ;
                              var  msg = `Link detected , your warn_count was upgrade ;\n rest : ${rest} `;

                              await ajouterUtilisateurAvecWarnCount(auteurMessage)

                              await zk.sendMessage(origineMessage, { text: msg , mentions: [auteurMessage] }, { quoted: ms }) ;
                              await zk.sendMessage(origineMessage, { delete: key });

                            }
                                    }
                                }
                                
                            }
                        
                    
                
            
        
    
    catch (e) {
        console.log("bdd err " + e);
    }


                    //antilink-all 
     try {
        const yes = await verifierEtatJid(origineMessage)
        if (text.includes('https://') && verifGroupe &&  yes  ) {

         console.log("link detected")
            var verifZokAdmin = verifGroupe ? admins.includes(idBot) : false;
            
             if(superUser || verifAdmin || !verifZokAdmin  ) { console.log('je fais rien'); return};
                        
                                    const key = {
                                        remoteJid: origineMessage,
                                        fromMe: false,
                                        id: ms.key.id,
                                        participant: auteurMessage
                                    };
                                    var txt = "link detected, \n";
                                   // txt += `message supprimé \n @${auteurMessage.split("@")[0]} rétiré du groupe.`;
                                    const gifLink = "https://raw.githubusercontent.com/djalega8000/Zokou-MD/main/media/remover.gif";
                                    var sticker = new Sticker(gifLink, {
                                        pack: 'Flash-Md',
                                        author: conf.OWNER_NAME,
                                        type: StickerTypes.FULL,
                                        categories: ['🤩', '🎉'],
                                        id: '12345',
                                        quality: 50,
                                        background: '#000000'
                                    });
                                    await sticker.toFile("st1.webp");
                                    // var txt = `@${auteurMsgRepondu.split("@")[0]} a été rétiré du groupe..\n`
                                    var action = await recupererActionJid(origineMessage);

                                      if (action === 'remove') {

                                        txt += `Link sent by @${auteurMessage.split("@")[0]} has been deleted and that user removed from group.`;

                                    await zk.sendMessage(origineMessage, { sticker: fs.readFileSync("st1.webp") });
                                    (0, baileys_1.delay)(800);
                                    await zk.sendMessage(origineMessage, { text: txt, mentions: [auteurMessage] }, { quoted: ms });
                                    try {
                                        await zk.groupParticipantsUpdate(origineMessage, [auteurMessage], "remove");
                                    }
                                    catch (e) {
                                        console.log("antilink-all") + e;
                                    }
                                    await zk.sendMessage(origineMessage, { delete: key });
                                    await fs.unlink("st1.webp"); } 
                                        
                                       else if (action === 'delete') {
                                        txt += `Link sent by @${auteurMessage.split("@")[0]} has been deleted!.`;
                                        // await zk.sendMessage(origineMessage, { sticker: fs.readFileSync("st1.webp") }, { quoted: ms });
                                       await zk.sendMessage(origineMessage, { text: txt, mentions: [auteurMessage] }, { quoted: ms });
                                       await zk.sendMessage(origineMessage, { delete: key });
                                       await fs.unlink("st1.webp");

                                    } else if(action === 'warn') {
                                        const {getWarnCountByJID ,ajouterUtilisateurAvecWarnCount} = require('./data/warn') ;

                            let warn = await getWarnCountByJID(auteurMessage) ; 
                            let warnlimit = conf.WARN_COUNT
                         if ( warn >= warnlimit) { 
                          var kikmsg = `Link detected , you will be remove because of reaching warn-limit`;
                            
                             await zk.sendMessage(origineMessage, { text: kikmsg , mentions: [auteurMessage] }, { quoted: ms }) ;


                             await zk.groupParticipantsUpdate(origineMessage, [auteurMessage], "remove");
                             await zk.sendMessage(origineMessage, { delete: key });


                            } else {
                                var rest = warnlimit - warn ;
                              var  msg = `bad word detected , your warn_count was upgrade ;\n rest : ${rest} `;

                              await ajouterUtilisateurAvecWarnCount(auteurMessage)

                              await zk.sendMessage(origineMessage, { text: msg , mentions: [auteurMessage] }, { quoted: ms }) ;
                              await zk.sendMessage(origineMessage, { delete: key });

                            }
                                    }
                                }
                                
                            }
                        
                    
                
            
        
    
    catch (e) {
        console.log("bdd err " + e);
    }
    /*

            //bad-words
     try {
        const yes = await verifierEtatJid(origineMessage)
        if (text.includes('fuck') && verifGroupe &&  yes  ) {

         console.log("bad word detected")
            var verifZokAdmin = verifGroupe ? admins.includes(idBot) : false;
            
             if(superUser || verifAdmin || !verifZokAdmin  ) { console.log('je fais rien'); return};
                        
                                    const key = {
                                        remoteJid: origineMessage,
                                        fromMe: false,
                                        id: ms.key.id,
                                        participant: auteurMessage
                                    };
                                    var txt = "badword detected, \n";
                                   // txt += `message supprimé \n @${auteurMessage.split("@")[0]} rétiré du groupe.`;
                                    const gifLink = "https://raw.githubusercontent.com/djalega8000/Zokou-MD/main/media/remover.gif";
                                    var sticker = new Sticker(gifLink, {
                                        pack: 'Flash-Md',
                                        author: conf.OWNER_NAME,
                                        type: StickerTypes.FULL,
                                        categories: ['🤩', '🎉'],
                                        id: '12345',
                                        quality: 50,
                                        background: '#000000'
                                    });
                                    await sticker.toFile("st1.webp");
                                    // var txt = `@${auteurMsgRepondu.split("@")[0]} a été rétiré du groupe..\n`
                                    var action = await recupererActionJid(origineMessage);

                                      if (action === 'remove') {

                                        txt += `message deleted \n @${auteurMessage.split("@")[0]} removed from group.`;

                                    await zk.sendMessage(origineMessage, { sticker: fs.readFileSync("st1.webp") });
                                    (0, baileys_1.delay)(800);
                                    await zk.sendMessage(origineMessage, { text: txt, mentions: [auteurMessage] }, { quoted: ms });
                                    try {
                                        await zk.groupParticipantsUpdate(origineMessage, [auteurMessage], "remove");
                                    }
                                    catch (e) {
                                        console.log("antiword") + e;
                                    }
                                    await zk.sendMessage(origineMessage, { delete: key });
                                    await fs.unlink("st1.webp"); } 
                                        
                                       else if (action === 'delete') {
                                        txt += `Goodbye \n @${auteurMessage.split("@")[0]} using bad words here is prohibited!.`;
                                        // await zk.sendMessage(origineMessage, { sticker: fs.readFileSync("st1.webp") }, { quoted: ms });
                                       await zk.sendMessage(origineMessage, { text: txt, mentions: [auteurMessage] }, { quoted: ms });
                                       await zk.sendMessage(origineMessage, { delete: key });
                                       await fs.unlink("st1.webp");

                                    } else if(action === 'warn') {
                                        const {getWarnCountByJID ,ajouterUtilisateurAvecWarnCount} = require('./data/warn') ;

                            let warn = await getWarnCountByJID(auteurMessage) ; 
                            let warnlimit = conf.WARN_COUNT
                         if ( warn >= warnlimit) { 
                          var kikmsg = `bad word detected , you will be remove because of reaching warn-limit`;
                            
                             await zk.sendMessage(origineMessage, { text: kikmsg , mentions: [auteurMessage] }, { quoted: ms }) ;


                             await zk.groupParticipantsUpdate(origineMessage, [auteurMessage], "remove");
                             await zk.sendMessage(origineMessage, { delete: key });


                            } else {
                                var rest = warnlimit - warn ;
                              var  msg = `bad word detected , your warn_count was upgrade ;\n rest : ${rest} `;

                              await ajouterUtilisateurAvecWarnCount(auteurMessage)

                              await zk.sendMessage(origineMessage, { text: msg , mentions: [auteurMessage] }, { quoted: ms }) ;
                              await zk.sendMessage(origineMessage, { delete: key });

                            }
                                    }
                                }
                                
                            }
                        
                    
                
            
        
    
    catch (e) {
        console.log("bdd err " + e);
                                                                   }

            //bad 

            try {
        const yes = await verifierEtatJid(origineMessage)
        if (text.includes('YEyy') && verifGroupe &&  yes  ) {

         console.log("bad word detected")
            var verifZokAdmin = verifGroupe ? admins.includes(idBot) : false;
            
             if(superUser || verifAdmin || !verifZokAdmin  ) { console.log('je fais rien'); return};
                        
                                    const key = {
                                        remoteJid: origineMessage,
                                        fromMe: false,
                                        id: ms.key.id,
                                        participant: auteurMessage
                                    };
                                    var txt = "Levelup Message detected, \n";
                                   // txt += `message supprimé \n @${auteurMessage.split("@")[0]} rétiré du groupe.`;
                                    const gifLink = "https://raw.githubusercontent.com/djalega8000/Zokou-MD/main/media/remover.gif";
                                    var sticker = new Sticker(gifLink, {
                                        pack: 'Flash-Md',
                                        author: conf.OWNER_NAME,
                                        type: StickerTypes.FULL,
                                        categories: ['🤩', '🎉'],
                                        id: '12345',
                                        quality: 50,
                                        background: '#000000'
                                    });
                                    await sticker.toFile("st1.webp");
                                    // var txt = `@${auteurMsgRepondu.split("@")[0]} a été rétiré du groupe..\n`
                                    var action = await recupererActionJid(origineMessage);

                                      if (action === 'remove') {

                                        txt += `Level up message deleted \n @${auteurMessage.split("@")[0]} removed from group.`;

                                    await zk.sendMessage(origineMessage, { sticker: fs.readFileSync("st1.webp") });
                                    (0, baileys_1.delay)(800);
                                    await zk.sendMessage(origineMessage, { text: txt, mentions: [auteurMessage] }, { quoted: ms });
                                    try {
                                        await zk.groupParticipantsUpdate(origineMessage, [auteurMessage], "remove");
                                    }
                                    catch (e) {
                                        console.log("antiword") + e;
                                    }
                                    await zk.sendMessage(origineMessage, { delete: key });
                                    await fs.unlink("st1.webp"); } 
                                        
                                       else if (action === 'delete') {
                                        txt += `Goodbye \n @${auteurMessage.split("@")[0]} using bad words here is prohibited!.`;
                                        // await zk.sendMessage(origineMessage, { sticker: fs.readFileSync("st1.webp") }, { quoted: ms });
                                       await zk.sendMessage(origineMessage, { text: txt, mentions: [auteurMessage] }, { quoted: ms });
                                       await zk.sendMessage(origineMessage, { delete: key });
                                       await fs.unlink("st1.webp");

                                    } else if(action === 'warn') {
                                        const {getWarnCountByJID ,ajouterUtilisateurAvecWarnCount} = require('./data/warn') ;

                            let warn = await getWarnCountByJID(auteurMessage) ; 
                            let warnlimit = conf.WARN_COUNT
                         if ( warn >= warnlimit) { 
                          var kikmsg = `Level up message detected , you will be remove because of reaching warn-limit`;
                            
                             await zk.sendMessage(origineMessage, { text: kikmsg , mentions: [auteurMessage] }, { quoted: ms }) ;


                             await zk.groupParticipantsUpdate(origineMessage, [auteurMessage], "remove");
                             await zk.sendMessage(origineMessage, { delete: key });


                            } else {
                                var rest = warnlimit - warn ;
                              var  msg = `Level Up message detected , your warn_count was upgrade ;\n rest : ${rest} `;

                              await ajouterUtilisateurAvecWarnCount(auteurMessage)

                              await zk.sendMessage(origineMessage, { text: msg , mentions: [auteurMessage] }, { quoted: ms }) ;
                              await zk.sendMessage(origineMessage, { delete: key });

                            }
                                    }
                                }
                                
                            }
                        
                    
                
            
        
    
    catch (e) {
        console.log("bdd err " + e);
                                       }

            //bad
            try {
        const yes = await verifierEtatJid(origineMessage)
        if (text.includes('Pussy') && verifGroupe &&  yes  ) {

         console.log("bad word detected")
            var verifZokAdmin = verifGroupe ? admins.includes(idBot) : false;
            
             if(superUser || verifAdmin || !verifZokAdmin  ) { console.log('je fais rien'); return};
                        
                                    const key = {
                                        remoteJid: origineMessage,
                                        fromMe: false,
                                        id: ms.key.id,
                                        participant: auteurMessage
                                    };
                                    var txt = "badword detected, \n";
                                   // txt += `message supprimé \n @${auteurMessage.split("@")[0]} rétiré du groupe.`;
                                    const gifLink = "https://raw.githubusercontent.com/djalega8000/Zokou-MD/main/media/remover.gif";
                                    var sticker = new Sticker(gifLink, {
                                        pack: 'Flash-Md',
                                        author: conf.OWNER_NAME,
                                        type: StickerTypes.FULL,
                                        categories: ['🤩', '🎉'],
                                        id: '12345',
                                        quality: 50,
                                        background: '#000000'
                                    });
                                    await sticker.toFile("st1.webp");
                                    // var txt = `@${auteurMsgRepondu.split("@")[0]} a été rétiré du groupe..\n`
                                    var action = await recupererActionJid(origineMessage);

                                      if (action === 'remove') {

                                        txt += `message deleted \n @${auteurMessage.split("@")[0]} removed from group.`;

                                    await zk.sendMessage(origineMessage, { sticker: fs.readFileSync("st1.webp") });
                                    (0, baileys_1.delay)(800);
                                    await zk.sendMessage(origineMessage, { text: txt, mentions: [auteurMessage] }, { quoted: ms });
                                    try {
                                        await zk.groupParticipantsUpdate(origineMessage, [auteurMessage], "remove");
                                    }
                                    catch (e) {
                                        console.log("antiword") + e;
                                    }
                                    await zk.sendMessage(origineMessage, { delete: key });
                                    await fs.unlink("st1.webp"); } 
                                        
                                       else if (action === 'delete') {
                                        txt += `Goodbye \n @${auteurMessage.split("@")[0]} using bad words here is prohibited!.`;
                                        // await zk.sendMessage(origineMessage, { sticker: fs.readFileSync("st1.webp") }, { quoted: ms });
                                       await zk.sendMessage(origineMessage, { text: txt, mentions: [auteurMessage] }, { quoted: ms });
                                       await zk.sendMessage(origineMessage, { delete: key });
                                       await fs.unlink("st1.webp");

                                    } else if(action === 'warn') {
                                        const {getWarnCountByJID ,ajouterUtilisateurAvecWarnCount} = require('./data/warn') ;

                            let warn = await getWarnCountByJID(auteurMessage) ; 
                            let warnlimit = conf.WARN_COUNT
                         if ( warn >= warnlimit) { 
                          var kikmsg = `bad word detected , you will be remove because of reaching warn-limit`;
                            
                             await zk.sendMessage(origineMessage, { text: kikmsg , mentions: [auteurMessage] }, { quoted: ms }) ;


                             await zk.groupParticipantsUpdate(origineMessage, [auteurMessage], "remove");
                             await zk.sendMessage(origineMessage, { delete: key });


                            } else {
                                var rest = warnlimit - warn ;
                              var  msg = `bad word detected , your warn_count was upgrade ;\n rest : ${rest} `;

                              await ajouterUtilisateurAvecWarnCount(auteurMessage)

                              await zk.sendMessage(origineMessage, { text: msg , mentions: [auteurMessage] }, { quoted: ms }) ;
                              await zk.sendMessage(origineMessage, { delete: key });

                            }
                                    }
                                }
                                
                            }
                        
                    
                
            
        
    
    catch (e) {
        console.log("bdd err " + e);
    }

           //bad
            try {
        const yes = await verifierEtatJid(origineMessage)
        if (text.includes('Motherfucker') && verifGroupe &&  yes  ) {

         console.log("bad word detected")
            var verifZokAdmin = verifGroupe ? admins.includes(idBot) : false;
            
             if(superUser || verifAdmin || !verifZokAdmin  ) { console.log('je fais rien'); return};
                        
                                    const key = {
                                        remoteJid: origineMessage,
                                        fromMe: false,
                                        id: ms.key.id,
                                        participant: auteurMessage
                                    };
                                    var txt = "badword detected, \n";
                                   // txt += `message supprimé \n @${auteurMessage.split("@")[0]} rétiré du groupe.`;
                                    const gifLink = "https://raw.githubusercontent.com/djalega8000/Zokou-MD/main/media/remover.gif";
                                    var sticker = new Sticker(gifLink, {
                                        pack: 'Flash-Md',
                                        author: conf.OWNER_NAME,
                                        type: StickerTypes.FULL,
                                        categories: ['🤩', '🎉'],
                                        id: '12345',
                                        quality: 50,
                                        background: '#000000'
                                    });
                                    await sticker.toFile("st1.webp");
                                    // var txt = `@${auteurMsgRepondu.split("@")[0]} a été rétiré du groupe..\n`
                                    var action = await recupererActionJid(origineMessage);

                                      if (action === 'remove') {

                                        txt += `message deleted \n @${auteurMessage.split("@")[0]} removed from group.`;

                                    await zk.sendMessage(origineMessage, { sticker: fs.readFileSync("st1.webp") });
                                    (0, baileys_1.delay)(800);
                                    await zk.sendMessage(origineMessage, { text: txt, mentions: [auteurMessage] }, { quoted: ms });
                                    try {
                                        await zk.groupParticipantsUpdate(origineMessage, [auteurMessage], "remove");
                                    }
                                    catch (e) {
                                        console.log("antiword") + e;
                                    }
                                    await zk.sendMessage(origineMessage, { delete: key });
                                    await fs.unlink("st1.webp"); } 
                                        
                                       else if (action === 'delete') {
                                        txt += `Goodbye \n @${auteurMessage.split("@")[0]} using bad words here is prohibited!.`;
                                        // await zk.sendMessage(origineMessage, { sticker: fs.readFileSync("st1.webp") }, { quoted: ms });
                                       await zk.sendMessage(origineMessage, { text: txt, mentions: [auteurMessage] }, { quoted: ms });
                                       await zk.sendMessage(origineMessage, { delete: key });
                                       await fs.unlink("st1.webp");

                                    } else if(action === 'warn') {
                                        const {getWarnCountByJID ,ajouterUtilisateurAvecWarnCount} = require('./data/warn') ;

                            let warn = await getWarnCountByJID(auteurMessage) ; 
                            let warnlimit = conf.WARN_COUNT
                         if ( warn >= warnlimit) { 
                          var kikmsg = `bad word detected , you will be remove because of reaching warn-limit`;
                            
                             await zk.sendMessage(origineMessage, { text: kikmsg , mentions: [auteurMessage] }, { quoted: ms }) ;


                             await zk.groupParticipantsUpdate(origineMessage, [auteurMessage], "remove");
                             await zk.sendMessage(origineMessage, { delete: key });


                            } else {
                                var rest = warnlimit - warn ;
                              var  msg = `bad word detected , your warn_count was upgrade ;\n rest : ${rest} `;

                              await ajouterUtilisateurAvecWarnCount(auteurMessage)

                              await zk.sendMessage(origineMessage, { text: msg , mentions: [auteurMessage] }, { quoted: ms }) ;
                              await zk.sendMessage(origineMessage, { delete: key });

                            }
                                    }
                                }
                                
                            }
                        
                    
                
            
        
    
    catch (e) {
        console.log("bdd err " + e);
                    }
            //bad-words
     try {
        const yes = await verifierEtatJid(origineMessage)
        if (text.includes('motherfucker') && verifGroupe &&  yes  ) {

         console.log("bad word detected")
            var verifZokAdmin = verifGroupe ? admins.includes(idBot) : false;
            
             if(superUser || verifAdmin || !verifZokAdmin  ) { console.log('je fais rien'); return};
                        
                                    const key = {
                                        remoteJid: origineMessage,
                                        fromMe: false,
                                        id: ms.key.id,
                                        participant: auteurMessage
                                    };
                                    var txt = "badword detected, \n";
                                   // txt += `message supprimé \n @${auteurMessage.split("@")[0]} rétiré du groupe.`;
                                    const gifLink = "https://raw.githubusercontent.com/djalega8000/Zokou-MD/main/media/remover.gif";
                                    var sticker = new Sticker(gifLink, {
                                        pack: 'Flash-Md',
                                        author: conf.OWNER_NAME,
                                        type: StickerTypes.FULL,
                                        categories: ['🤩', '🎉'],
                                        id: '12345',
                                        quality: 50,
                                        background: '#000000'
                                    });
                                    await sticker.toFile("st1.webp");
                                    // var txt = `@${auteurMsgRepondu.split("@")[0]} a été rétiré du groupe..\n`
                                    var action = await recupererActionJid(origineMessage);

                                      if (action === 'remove') {

                                        txt += `message deleted \n @${auteurMessage.split("@")[0]} removed from group.`;

                                    await zk.sendMessage(origineMessage, { sticker: fs.readFileSync("st1.webp") });
                                    (0, baileys_1.delay)(800);
                                    await zk.sendMessage(origineMessage, { text: txt, mentions: [auteurMessage] }, { quoted: ms });
                                    try {
                                        await zk.groupParticipantsUpdate(origineMessage, [auteurMessage], "remove");
                                    }
                                    catch (e) {
                                        console.log("antiword") + e;
                                    }
                                    await zk.sendMessage(origineMessage, { delete: key });
                                    await fs.unlink("st1.webp"); } 
                                        
                                       else if (action === 'delete') {
                                        txt += `Goodbye \n @${auteurMessage.split("@")[0]} using bad words here is prohibited!.`;
                                        // await zk.sendMessage(origineMessage, { sticker: fs.readFileSync("st1.webp") }, { quoted: ms });
                                       await zk.sendMessage(origineMessage, { text: txt, mentions: [auteurMessage] }, { quoted: ms });
                                       await zk.sendMessage(origineMessage, { delete: key });
                                       await fs.unlink("st1.webp");

                                    } else if(action === 'warn') {
                                        const {getWarnCountByJID ,ajouterUtilisateurAvecWarnCount} = require('./data/warn') ;

                            let warn = await getWarnCountByJID(auteurMessage) ; 
                            let warnlimit = conf.WARN_COUNT
                         if ( warn >= warnlimit) { 
                          var kikmsg = `bad word detected , you will be remove because of reaching warn-limit`;
                            
                             await zk.sendMessage(origineMessage, { text: kikmsg , mentions: [auteurMessage] }, { quoted: ms }) ;


                             await zk.groupParticipantsUpdate(origineMessage, [auteurMessage], "remove");
                             await zk.sendMessage(origineMessage, { delete: key });


                            } else {
                                var rest = warnlimit - warn ;
                              var  msg = `bad word detected , your warn_count was upgrade ;\n rest : ${rest} `;

                              await ajouterUtilisateurAvecWarnCount(auteurMessage)

                              await zk.sendMessage(origineMessage, { text: msg , mentions: [auteurMessage] }, { quoted: ms }) ;
                              await zk.sendMessage(origineMessage, { delete: key });

                            }
                                    }
                                }
                                
                            }
                        
                    
                
            
        
    
    catch (e) {
        console.log("bdd err " + e);
    }
    
            
            //bad-words
     try {
        const yes = await verifierEtatJid(origineMessage)
        if (text.includes('pussy') && verifGroupe &&  yes  ) {

         console.log("bad word detected")
            var verifZokAdmin = verifGroupe ? admins.includes(idBot) : false;
            
             if(superUser || verifAdmin || !verifZokAdmin  ) { console.log('je fais rien'); return};
                        
                                    const key = {
                                        remoteJid: origineMessage,
                                        fromMe: false,
                                        id: ms.key.id,
                                        participant: auteurMessage
                                    };
                                    var txt = "badword detected, \n";
                                   // txt += `message supprimé \n @${auteurMessage.split("@")[0]} rétiré du groupe.`;
                                    const gifLink = "https://raw.githubusercontent.com/djalega8000/Zokou-MD/main/media/remover.gif";
                                    var sticker = new Sticker(gifLink, {
                                        pack: 'Flash-Md',
                                        author: conf.OWNER_NAME,
                                        type: StickerTypes.FULL,
                                        categories: ['🤩', '🎉'],
                                        id: '12345',
                                        quality: 50,
                                        background: '#000000'
                                    });
                                    await sticker.toFile("st1.webp");
                                    // var txt = `@${auteurMsgRepondu.split("@")[0]} a été rétiré du groupe..\n`
                                    var action = await recupererActionJid(origineMessage);

                                      if (action === 'remove') {

                                        txt += `message deleted \n @${auteurMessage.split("@")[0]} removed from group.`;

                                    await zk.sendMessage(origineMessage, { sticker: fs.readFileSync("st1.webp") });
                                    (0, baileys_1.delay)(800);
                                    await zk.sendMessage(origineMessage, { text: txt, mentions: [auteurMessage] }, { quoted: ms });
                                    try {
                                        await zk.groupParticipantsUpdate(origineMessage, [auteurMessage], "remove");
                                    }
                                    catch (e) {
                                        console.log("antiword") + e;
                                    }
                                    await zk.sendMessage(origineMessage, { delete: key });
                                    await fs.unlink("st1.webp"); } 
                                        
                                       else if (action === 'delete') {
                                        txt += `Goodbye \n @${auteurMessage.split("@")[0]} using bad words here is prohibited!.`;
                                        // await zk.sendMessage(origineMessage, { sticker: fs.readFileSync("st1.webp") }, { quoted: ms });
                                       await zk.sendMessage(origineMessage, { text: txt, mentions: [auteurMessage] }, { quoted: ms });
                                       await zk.sendMessage(origineMessage, { delete: key });
                                       await fs.unlink("st1.webp");

                                    } else if(action === 'warn') {
                                        const {getWarnCountByJID ,ajouterUtilisateurAvecWarnCount} = require('./data/warn') ;

                            let warn = await getWarnCountByJID(auteurMessage) ; 
                            let warnlimit = conf.WARN_COUNT
                         if ( warn >= warnlimit) { 
                          var kikmsg = `bad word detected , you will be remove because of reaching warn-limit`;
                            
                             await zk.sendMessage(origineMessage, { text: kikmsg , mentions: [auteurMessage] }, { quoted: ms }) ;


                             await zk.groupParticipantsUpdate(origineMessage, [auteurMessage], "remove");
                             await zk.sendMessage(origineMessage, { delete: key });


                            } else {
                                var rest = warnlimit - warn ;
                              var  msg = `bad word detected , your warn_count was upgrade ;\n rest : ${rest} `;

                              await ajouterUtilisateurAvecWarnCount(auteurMessage)

                              await zk.sendMessage(origineMessage, { text: msg , mentions: [auteurMessage] }, { quoted: ms }) ;
                              await zk.sendMessage(origineMessage, { delete: key });

                            }
                                    }
                                }
                                
                            }
                        
                    
                
            
        
    
    catch (e) {
        console.log("bdd err " + e);
    }
    
*/
/*
          try {
    const badWords = ['pussy', 'fuck', 'motherfucker', 'ass']; // Add your bad words here
    const yes = await verifierEtatJid(origineMessage);

    // Convert the text to lowercase for a case-insensitive comparison
    const lowerCaseText = text.toLowerCase();

    // Check if any bad word is in the message text, ignoring case
    const containsBadWord = badWords.some(word => lowerCaseText.includes(word.toLowerCase()));

    if (containsBadWord && verifGroupe && yes) {
        console.log("Bad word detected");

        var verifZokAdmin = verifGroupe ? admins.includes(idBot) : false;
        if (superUser || verifAdmin || !verifZokAdmin) {
            console.log('I do nothing');
            return;
        }

        const key = {
            remoteJid: origineMessage,
            fromMe: false,
            id: ms.key.id,
            participant: auteurMessage
        };
        var txt = "Bad word detected.\n";
        const gifLink = "https://raw.githubusercontent.com/djalega8000/Zokou-MD/main/media/remover.gif";
        var sticker = new Sticker(gifLink, {
            pack: 'Flash-Md',
            author: conf.OWNER_NAME,
            type: StickerTypes.FULL,
            categories: ['🤩', '🎉'],
            id: '12345',
            quality: 50,
            background: '#000000'
        });
        await sticker.toFile("st1.webp");

        const { getWarnCountByJID, ajouterUtilisateurAvecWarnCount } = require('./data/warn');
        let warn = await getWarnCountByJID(auteurMessage);
        let warnlimit = conf.WARN_COUNT;
        var action = await recupererActionJid(origineMessage);

        switch (action) {
            case 'remove':
                txt += `Message deleted \n @${auteurMessage.split("@")[0]} removed from group.`;
                await zk.sendMessage(origineMessage, { sticker: fs.readFileSync("st1.webp") });
                await zk.groupParticipantsUpdate(origineMessage, [auteurMessage], "remove");
                break;

            case 'delete':
                txt += `Goodbye \n @${auteurMessage.split("@")[0]} using bad words here is prohibited!.`;
                break;

            case 'warn':
                if (warn >= warnlimit) {
                    txt += `You will be removed for reaching the warn limit.`;
                    await zk.groupParticipantsUpdate(origineMessage, [auteurMessage], "remove");
                } else {
                    var rest = warnlimit - warn;
                    txt += `Your warn count was upgraded; remaining: ${rest}.`;
                    await ajouterUtilisateurAvecWarnCount(auteurMessage);
                }
                break;

            default:
                console.log("No action specified.");
                return;
        }

        await zk.sendMessage(origineMessage, { text: txt, mentions: [auteurMessage] }, { quoted: ms });
        await zk.sendMessage(origineMessage, { delete: key });
        await fs.unlink("st1.webp");
    }
} catch (e) {
    console.log("Database error: " + e);
}*/

         try {
    const badWords = ['pussy', 'fuck', 'motherfucker', 'ass']; // Add your bad words here
    const yes = await verifierEtatJid(origineMessage);

    const lowerCaseText = text.toLowerCase();

    // Check if any bad word is in the message text, ensuring whole word match
    const containsBadWord = badWords.some(word => 
        new RegExp(`\\b${word}\\b`, 'i').test(lowerCaseText)
    );

    if (containsBadWord && verifGroupe && yes) {
        console.log("Bad word detected");

        var verifZokAdmin = verifGroupe ? admins.includes(idBot) : false;
        if (superUser || verifAdmin || !verifZokAdmin) {
            console.log('I do nothing');
            return;
        }

        const key = {
            remoteJid: origineMessage,
            fromMe: false,
            id: ms.key.id,
            participant: auteurMessage
        };
        var txt = "Bad word detected.\n";
        const gifLink = "https://raw.githubusercontent.com/djalega8000/Zokou-MD/main/media/remover.gif";
        var sticker = new Sticker(gifLink, {
            pack: 'Flash-Md',
            author: conf.OWNER_NAME,
            type: StickerTypes.FULL,
            categories: ['🤩', '🎉'],
            id: '12345',
            quality: 50,
            background: '#000000'
        });
        await sticker.toFile("st1.webp");

        const { getWarnCountByJID, ajouterUtilisateurAvecWarnCount } = require('./data/warn');
        let warn = await getWarnCountByJID(auteurMessage);
        let warnlimit = conf.WARN_COUNT;
        var action = await recupererActionJid(origineMessage);

        switch (action) {
            case 'remove':
                txt += `Message deleted \n @${auteurMessage.split("@")[0]} removed from group.`;
                await zk.sendMessage(origineMessage, { sticker: fs.readFileSync("st1.webp") });
                await zk.groupParticipantsUpdate(origineMessage, [auteurMessage], "remove");
                break;

            case 'delete':
                txt += `Goodbye \n @${auteurMessage.split("@")[0]} using bad words here is prohibited!.`;
                break;

            case 'warn':
                if (warn >= warnlimit) {
                    txt += `You will be removed for reaching the warn limit.`;
                    await zk.groupParticipantsUpdate(origineMessage, [auteurMessage], "remove");
                } else {
                    var rest = warnlimit - warn;
                    txt += `Your warn count was upgraded; remaining: ${rest}.`;
                    await ajouterUtilisateurAvecWarnCount(auteurMessage);
                }
                break;

            default:
                console.log("No action specified.");
                return;
        }

        await zk.sendMessage(origineMessage, { text: txt, mentions: [auteurMessage] }, { quoted: ms });
        await zk.sendMessage(origineMessage, { delete: key });
        await fs.unlink("st1.webp");
    }
} catch (e) {
    console.log("Database error: " + e);
}
       

    /** *************************anti-bot******************************************** */
    try {
        const botMsg = ms.key?.id?.startsWith('BAE') && ms.key?.id?.length === 16;
        const baileysMsg = ms.key?.id?.startsWith('BAE1') && ms.key?.id?.length === 16;
        if (botMsg || baileysMsg) {

            if (mtype === 'reactionMessage') { console.log('Je ne reagis pas au reactions') ; return} ;
            const antibotactiver = await atbverifierEtatJid(origineMessage);
            if(!antibotactiver) {return};

            if( verifAdmin || auteurMessage === idBot ) { console.log('je fais rien'); return};
                        
            const key = {
                remoteJid: origineMessage,
                fromMe: false,
                id: ms.key.id,
                participant: auteurMessage
            };
            var txt = "bot detected, \n";
           // txt += `message supprimé \n @${auteurMessage.split("@")[0]} rétiré du groupe.`;
            const gifLink = "https://raw.githubusercontent.com/djalega8000/Zokou-MD/main/media/remover.gif";
            var sticker = new Sticker(gifLink, {
                pack: 'Flash-Md',
                author: conf.OWNER_NAME,
                type: StickerTypes.FULL,
                categories: ['🤩', '🎉'],
                id: '12345',
                quality: 50,
                background: '#000000'
            });
            await sticker.toFile("st1.webp");
            // var txt = `@${auteurMsgRepondu.split("@")[0]} a été rétiré du groupe..\n`
            var action = await atbrecupererActionJid(origineMessage);

              if (action === 'remove') {

                txt += `message deleted \n @${auteurMessage.split("@")[0]} removed from group.`;

            await zk.sendMessage(origineMessage, { sticker: fs.readFileSync("st1.webp") });
            (0, baileys_1.delay)(800);
            await zk.sendMessage(origineMessage, { text: txt, mentions: [auteurMessage] }, { quoted: ms });
            try {
                await zk.groupParticipantsUpdate(origineMessage, [auteurMessage], "remove");
            }
            catch (e) {
                console.log("antibot ") + e;
            }
            await zk.sendMessage(origineMessage, { delete: key });
            await fs.unlink("st1.webp"); } 
                
               else if (action === 'delete') {
                txt += `message delete \n @${auteurMessage.split("@")[0]} Avoid sending link.`;
                //await zk.sendMessage(origineMessage, { sticker: fs.readFileSync("st1.webp") }, { quoted: ms });
               await zk.sendMessage(origineMessage, { text: txt, mentions: [auteurMessage] }, { quoted: ms });
               await zk.sendMessage(origineMessage, { delete: key });
               await fs.unlink("st1.webp");

            } else if(action === 'warn') {
                const {getWarnCountByJID ,ajouterUtilisateurAvecWarnCount} = require('./data/warn') ;

    let warn = await getWarnCountByJID(auteurMessage) ; 
    let warnlimit = conf.WARN_COUNT
 if ( warn >= warnlimit) { 
  var kikmsg = `bot detected ;you will be removed because of reaching warn-limit`;
    
     await zk.sendMessage(origineMessage, { text: kikmsg , mentions: [auteurMessage] }, { quoted: ms }) ;


     await zk.groupParticipantsUpdate(origineMessage, [auteurMessage], "remove");
     await zk.sendMessage(origineMessage, { delete: key });


    } else {
        var rest = warnlimit - warn ;
      var  msg = `bot detected , your warn_count was upgrade ;\n rest : ${rest} `;

      await ajouterUtilisateurAvecWarnCount(auteurMessage)

      await zk.sendMessage(origineMessage, { text: msg , mentions: [auteurMessage] }, { quoted: ms }) ;
      await zk.sendMessage(origineMessage, { delete: key });

    }
                }
        }
    }
    catch (er) {
        console.log('.... ' + er);
    }        
             
         
            /////////////////////////
            
            //execution des commandes   
           /* if (verifCom) {
                //await await zk.readMessages(ms.key);
                const cd = evt.cm.find((king) => king.nomCom === (com));
                if (cd) {
                    try {

            if ((conf.MODE).toLocaleLowerCase() != 'public' && !superUser) {
                return;
            }*/

if (verifCom) {
    const cd = evt.cm.find((king) => king.nomCom === com || (king.aliases && king.aliases.includes(com)));
    if (cd) {
        try {
            if (conf.MODE.toLocaleLowerCase() != 'public' && !superUser) {
                return;
            }

    

                         /******************* PM_PERMT***************/

            if (!superUser && origineMessage === auteurMessage&& conf.PM_PERMIT === "on" ) {
                repondre("You don't have acces to commands here") ; return }
            ///////////////////////////////


            


             
            /*****************************banGroup  */
            if (!superUser && verifGroupe) {

                 let req = await isGroupBanned(origineMessage);
                    
                        if (req) { return }
            }

              /***************************  ONLY-ADMIN  */

            if(!verifAdmin && verifGroupe) {
                 let req = await isGroupOnlyAdmin(origineMessage);
                    
                        if (req) {  return }}

              /**********************banuser */
         
            
                if(!superUser) {
                    let req = await isUserBanned(auteurMessage);
                    
                        if (req) {repondre("You are banned from bot commands"); return}
                    

                } 

                        reagir(origineMessage, zk, ms, cd.reaction);
                        cd.fonction(origineMessage, zk, commandeOptions);
                    }
                    catch (e) {
                        console.log("😡😡 " + e);
                        zk.sendMessage(origineMessage, { text: "😡😡 " + e }, { quoted: ms });
                    }
                }
            }
            //fin exécution commandes
        });
        //fin événement message

/******** evenement groupe update ****************/
const { recupevents } = require('./data/welcome'); 

zk.ev.on('group-participants.update', async (group) => {
    console.log(group);

    let ppgroup;
    try {
        ppgroup = await zk.profilePictureUrl(group.id, 'image');
    } catch {
        ppgroup = 'https://telegra.ph/file/3bf285a2c0f3d986028f3.jpg';
    }

    try {
        const metadata = await zk.groupMetadata(group.id);

        if (group.action == 'add' && (await recupevents(group.id, "welcome") == 'on')) {
            let msg = `◇FLASH-MD◇
`;
             
            let membres = group.participants;
            for (let membre of membres) {
                msg += `Hello @${membre.split("@")[0]}\n`;
            }

            msg += `*You are welcomed here.* 
            
*You MAY read the group description FOR more info and Avoid getting removed*
            
     
            
 ◇ *GROUP DESCRIPTION*  ◇

${metadata.desc}

📌Powered by *France King`;

            zk.sendMessage(group.id, { image: { url: ppgroup }, caption: msg, mentions: membres });
        } else if (group.action == 'remove' && (await recupevents(group.id, "goodbye") == 'on')) {
            let msg = `Goodbye to that Fallen soldier, Powered by *FLASH-MD*;\n`;

            let membres = group.participants;
            for (let membre of membres) {
                msg += `@${membre.split("@")[0]}\n`;
            }

            zk.sendMessage(group.id, { text: msg, mentions: membres });

        } else if (group.action == 'promote' && (await recupevents(group.id, "antipromote") == 'on') ) {
            //  console.log(zk.user.id)
          if (group.author == metadata.owner || group.author  == conf.OWNER_NUMBER + '@s.whatsapp.net' || group.author == decodeJid(zk.user.id)  || group.author == group.participants[0]) { console.log('Cas de superUser je fais rien') ;return ;} ;


         await   zk.groupParticipantsUpdate(group.id ,[group.author,group.participants[0]],"demote") ;

         zk.sendMessage(
              group.id,
              {
                text : `@${(group.author).split("@")[0]} has violated the anti-promotion rule, therefore both ${group.author.split("@")[0]} and @${(group.participants[0]).split("@")[0]} have been removed from administrative rights.`,
                mentions : [group.author,group.participants[0]]
              }
         )

        } else if (group.action == 'demote' && (await recupevents(group.id, "antidemote") == 'on') ) {

            if (group.author == metadata.owner || group.author ==  conf.OWNER_NUMBER + '@s.whatsapp.net' || group.author == decodeJid(zk.user.id) || group.author == group.participants[0]) { console.log('Cas de superUser je fais rien') ;return ;} ;


           await  zk.groupParticipantsUpdate(group.id ,[group.author],"demote") ;
           await zk.groupParticipantsUpdate(group.id , [group.participants[0]] , "promote")

           zk.sendMessage(
                group.id,
                {
                  text : `@${(group.author).split("@")[0]} has violated the anti-demotion rule by removing @${(group.participants[0]).split("@")[0]}. Consequently, he has been demonated from the admin sit.` ,
                  mentions : [group.author,group.participants[0]]
                }
           )

     } 

    } catch (e) {
        console.error(e);
    }
});

/******** fin d'evenement groupe update *************************/



    /*****************************Cron setup */

   /*     
    async  function activateCrons() {
        const cron = require('node-cron');
        const { getCron } = require('./data/cron');

          let crons = await getCron();
          console.log(crons);
          if (crons && crons.length > 0) {
        
            for (let i = 0; i < crons.length; i++) {
        
              if (crons[i].mute_at != null) {
                let set = crons[i].mute_at.split(':');

                console.log(`etablissement d'un automute pour ${crons[i].group_id} a ${set[0]} H ${set[1]}`)

                cron.schedule(`${set[1]} ${set[0]} * * *`, async () => {
                  await zk.groupSettingUpdate(crons[i].group_id, 'announcement');
                  zk.sendMessage(crons[i].group_id, { image : { url : './media/chrono.webp'} , caption: "Hello, it's time to close the group; sayonara." });

                }, {
                    timezone: conf.TZ
                  });
              }
        
              if (crons[i].unmute_at != null) {
                let set = crons[i].unmute_at.split(':');

                console.log(`etablissement d'un autounmute pour ${set[0]} H ${set[1]} `)
        
                cron.schedule(`${set[1]} ${set[0]} * * *`, async () => {

                  await zk.groupSettingUpdate(crons[i].group_id, 'not_announcement');

                  zk.sendMessage(crons[i].group_id, { image : { url : './media/chrono.webp'} , caption: "Good morning; It's time to open the group." });

                 
                },{
                    timezone: conf.TZ
                  });
              }
        
            }
          } else {
            console.log('Les crons n\'ont pas été activés');
          }

          return
        } */

        

async function activateCrons() {
    const cron = require('node-cron');
    const { getCron } = require('./data/cron');

    let crons = await getCron();
    console.log(crons);
    
    if (crons && crons.length > 0) {
        for (let i = 0; i < crons.length; i++) {
            if (crons[i].mute_at != null) {
                let set = crons[i].mute_at.split(':');
                
                console.log(`Setting up an auto-mute for group ${crons[i].group_id} at ${set[0]}:${set[1]} H`);

                cron.schedule(`${set[1]} ${set[0]} * * *`, async () => {
                    await zk.groupSettingUpdate(crons[i].group_id, 'announcement');
                    zk.sendMessage(crons[i].group_id, { 
                        image: { url: './media/chrono.webp' }, 
                        caption: "Hello, it's time to close the group; sayonara." 
                    });

                }, {
                    timezone: conf.TZ
                });
            }

            if (crons[i].unmute_at != null) {
                let set = crons[i].unmute_at.split(':');
                
                console.log(`Setting up an auto-unmute for ${crons[i].group_id} at ${set[0]}:${set[1]} H`);

                cron.schedule(`${set[1]} ${set[0]} * * *`, async () => {
                    await zk.groupSettingUpdate(crons[i].group_id, 'not_announcement');
                    zk.sendMessage(crons[i].group_id, { 
                        image: { url: 'https://telegra.ph/file/a191f0028e105e6433938.jpg' }, 
                        caption: "Good morning; It's time to open the group." 
                    });

                }, {
                    timezone: conf.TZ
                });
            }
        }
    } else {
        console.log('No crons were activated');
    }

    return;
}


        
        //événement contact
        /*
        zk.ev.on("contacts.upsert", async (contacts) => {
            const insertContact = (newContact) => {
                for (const contact of newContact) {
                    if (store.contacts[contact.id]) {
                        Object.assign(store.contacts[contact.id], contact);
                    }
                    else {
                        store.contacts[contact.id] = contact;
                    }
                }
                return;
            };
            insertContact(contacts);
        });
        // Function to clone the repository
async function cloneCommandsRepo() {
    const git = simpleGit();
    try {
        if (fs.existsSync(commandsDir)) {
            console.log('Commands repository already exists. Pulling latest changes...');
            await git.cwd(commandsDir).pull();
        } else {
            console.log('Cloning commands repository...');
            await git.clone(commandsRepoUrl, commandsDir);
        }
    } catch (error) {
        console.error('Failed to clone or pull commands repository:', error);
    }
}

// Function to load commands from the cloned repository
async function loadCommands() {
    console.log('Loading Commands ...\n');
    fs.readdirSync(commandsDir).forEach((fichier) => {
        if (path.extname(file).toLowerCase() === '.js') {
            try {
                require(path.join(commandsDir, fichier));
                console.log(file + ' installed ✔️');
            } catch (e) {
                console.log(`${file} could not be loaded for the following reasons: ${e}`);
            }
            delay(300);
        }
    });
    delay(700);
}

// Main connection update handler
zk.ev.on("connection.update", async (con) => {
    const { lastDisconnect, connection } = con;
    if (connection === "connecting") {
        console.log("ℹ️ Searching for connection...");
    } else if (connection === 'open') {
        console.log("Connected to WhatsApp ✅");
        console.log("--");
        await delay(200);
        console.log("------");
        await delay(300);
        console.log("------------------/-----");
        console.log("the bot is online 🕸\n\n");

        // Clone the commands repository and load commands
        await cloneCommandsRepo();
        await loadCommands();
    }
}); */
        //fin événement contact 
        //événement connexion
        zk.ev.on("connection.update", async (con) => {
            const { lastDisconnect, connection } = con;
            if (connection === "connecting") {
                console.log("ℹ️ Searching for connection...");
            }
            else if (connection === 'open') {
                console.log("Connected to WhatsApp ✅");
                console.log("--");
                await (0, baileys_1.delay)(200);
                console.log("------");
                await (0, baileys_1.delay)(300);
                console.log("------------------/-----");
                console.log("the bot is online 🕸\n\n");
                //chargement des commandes 
                console.log("Loading Commands ...\n");
                fs.readdirSync(__dirname + "/commands").forEach((fichier) => {
                    if (path.extname(fichier).toLowerCase() == (".js")) {
                        try {
                            require(__dirname + "/commands/" + fichier);
                            console.log(fichier + " installed ✔️");
                        }
                        catch (e) {
                            console.log(`${fichier} could not be loaded for the following reasons  : ${e}`);
                        } /*require(__dirname + "/commands/" + fichier);
                         console.log(fichier + " installed ✔️")*/
                        (0, baileys_1.delay)(300);
                    }
                });
                (0, baileys_1.delay)(700);
                var md;
                if ((conf.MODE).toLocaleLowerCase() === "public") {
                    md = "Public";
                }
                else if ((conf.MODE).toLocaleLowerCase() === "private") {
                    md = "Private";
                }
                else {
                    md = "undefined";
                }
                console.log("Commands successfully Loaded ✅");

 
/*if ((conf.DP).toLowerCase() === 'on') {  
    // Get the current date
    const currentDate = new Date();

    // Get the formatted date
    const formattedDate = currentDate.toLocaleDateString('en-GB', { // 'en-GB' for day/month/year format
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    // Get the day of the week
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = daysOfWeek[currentDate.getDay()];
                
                let cmsg = `*❍ 𝐅𝐋𝐀𝐒𝐇-𝐌𝐃 is Connected ❍* 

*❒YOUR PREFIX:* [ ${prefixe} ] 
*❒BOT MODE:* ${md} 
*❒COMMANDS:* ${evt.cm.length}
*❒DATE:* ${formattedDate}
*❒DAY:* ${dayOfWeek}

_________________________________

╔═════◇
║◇ *KEEP USING FLASH-MD*
╚════════════════>
_________________________________
*CREATED BY ©FRANCE KING*`;

await zk.sendMessage(zk.user.id, {
    text: cmsg,
    forwardingScore: 2,  // Any number > 1 will mark the message as forwarded
    isForwarded: true,
    contextInfo: {
        externalAdReply: {
            sourceUrl: 'https://whatsapp.com/channel/0029VaTbb3p84Om9LRX1jg0P',
            mediaType: 1,
        }
    }
});
*/
                
                
                
                //  await activateCrons();


if ((conf.DP).toLowerCase() === 'on') {  
    // Get the current date
    const currentDate = new Date();

    // Get the formatted date
    const formattedDate = currentDate.toLocaleDateString('en-GB', { // 'en-GB' for day/month/year format
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    // Get the day of the week
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = daysOfWeek[currentDate.getDay()];

    let cmsg = `*❍ 𝐅𝐋𝐀𝐒𝐇-𝐌𝐃 is Connected ❍* 

*❒YOUR PREFIX:* [ ${prefixes} ] 
*❒BOT MODE:* ${md} 
*❒COMMANDS:* ${evt.cm.length}
*❒DATE:* ${formattedDate}
*❒DAY:* ${dayOfWeek}

_________________________________

╔═════◇
║◇ *KEEP USING FLASH-MD*
╚════════════════>
_________________________________
*CREATED BY ©FRANCE KING*`;

    await zk.sendMessage(zk.user.id, { 
        text: cmsg, 
        forwardingScore: 2,  // Any number > 1 will mark the message as forwarded
        isForwarded: true 
    });
}

    


                
                
               /* if((conf.DP).toLowerCase() === 'on') {     
                let cmsg = `*❍ 𝐅𝐋𝐀𝐒𝐇-𝐌𝐃 is Connected ❍* 
                  
*❒YOUR PREFIX:* [ ${prefixe} ] 
*❒BOT MODE:* ${md} 
*❒COMMANDS:* ${evt.cm.length}

_________________________________
    
╔═════◇
║◇ *KEEP USING FLASH-MD*
╚════════════════>
_________________________________
*CREATED BY ©FRANCE KING*`;
                await zk.sendMessage(zk.user.id, { text: cmsg });
                }*/
            } 
            if (connection == "close") {
                let raisonDeconnexion = new boom_1.Boom(lastDisconnect?.error)?.output.statusCode;
                if (raisonDeconnexion === baileys_1.DisconnectReason.badSession) {
                    console.log('Wrong session ID. please rescan the QR or use pairing code by France King...');
                }
                else if (raisonDeconnexion === baileys_1.DisconnectReason.connectionClosed) {
                    console.log('!!! connection closed, reconnection in progress ...');
                    main();
                }
                else if (raisonDeconnexion === baileys_1.DisconnectReason.connectionLost) {
                    console.log('connection to server lost 😞,,, reconnection in progress... ');
                    main();
                }
                else if (raisonDeconnexion === baileys_1.DisconnectReason?.connectionReplaced) {
                    console.log('connection replaced,,, a session is already open, please close it!!!');
                }
                else if (raisonDeconnexion === baileys_1.DisconnectReason.loggedOut) {
                    console.log('You are disconnected,,, please rescan the qr code or use pairing code');
                }
                else if (raisonDeconnexion === baileys_1.DisconnectReason.restartRequired) {
                    console.log('Reboot in progress ▶️');
                    main();
                }   else {

                    console.log('Reboot Error 😑',raisonDeconnexion) ;         
                    //repondre("* Redémarrage du bot en cour ...*");

                                const {exec}=require("child_process") ;

                                exec("pm2 restart all");            
                }
                // sleep(50000)
                console.log("hum " + connection);
                main(); //console.log(session)
            }
        });
        //fin événement connexion


        /*} 
          if (connection === "close") {
    try {
        const boomError = new boom_1.Boom(lastDisconnect?.error);
        const raisonDeconnexion = boomError.output?.statusCode;

        switch (raisonDeconnexion) {
            case baileys_1.DisconnectReason.badSession:
                console.log('Wrong session ID. Please rescan the QR or use the pairing code by France King...');
                break;

            case baileys_1.DisconnectReason.connectionClosed:
                console.log('!!! Connection closed, reconnection in progress...');
                main();
                break;

            case baileys_1.DisconnectReason.connectionLost:
                console.log('Connection to server lost 😞, reconnection in progress...');
                main();
                break;

            case baileys_1.DisconnectReason.connectionReplaced:
                console.log('Connection replaced, a session is already open, please close it!!!');
                break;

            case baileys_1.DisconnectReason.loggedOut:
                console.log('You are disconnected, please rescan the QR code or use the pairing code');
                break;

            case baileys_1.DisconnectReason.restartRequired:
                console.log('Reboot in progress ▶️');
                main();
                break;

            default:
                console.log('Reboot Error 😑', raisonDeconnexion);
                const { exec } = require("child_process");
                exec("pm2 restart all");
                break;
        }
        
        console.log("hum " + connection);
    } catch (error) {
        console.error("Error handling disconnection:", error);
    }
          }
        */
        //événement authentification 
        zk.ev.on("creds.update", saveCreds);
        //fin événement authentification 
        //
        /** ************* */
        //fonctions utiles
        zk.downloadAndSaveMediaMessage = async (message, filename = '', attachExtension = true) => {
            let quoted = message.msg ? message.msg : message;
            let mime = (message.msg || message).mimetype || '';
            let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
            const stream = await (0, baileys_1.downloadContentFromMessage)(quoted, messageType);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            let type = await FileType.fromBuffer(buffer);
            let trueFileName = './' + filename + '.' + type.ext;
            // save to file
            await fs.writeFileSync(trueFileName, buffer);
            return trueFileName;
        };


        zk.awaitForMessage = async (options = {}) =>{
            return new Promise((resolve, reject) => {
                if (typeof options !== 'object') reject(new Error('Options must be an object'));
                if (typeof options.sender !== 'string') reject(new Error('Sender must be a string'));
                if (typeof options.chatJid !== 'string') reject(new Error('ChatJid must be a string'));
                if (options.timeout && typeof options.timeout !== 'number') reject(new Error('Timeout must be a number'));
                if (options.filter && typeof options.filter !== 'function') reject(new Error('Filter must be a function'));
        
                const timeout = options?.timeout || undefined;
                const filter = options?.filter || (() => true);
                let interval = undefined
        
                /**
                 * 
                 * @param {{messages: Baileys.proto.IWebMessageInfo[], type: Baileys.MessageUpsertType}} data 
                 */
                let listener = (data) => {
                    let { type, messages } = data;
                    if (type == "notify") {
                        for (let message of messages) {
                            const fromMe = message.key.fromMe;
                            const chatId = message.key.remoteJid;
                            const isGroup = chatId.endsWith('@g.us');
                            const isStatus = chatId == 'status@broadcast';
        
                            const sender = fromMe ? zk.user.id.replace(/:.*@/g, '@') : (isGroup || isStatus) ? message.key.participant.replace(/:.*@/g, '@') : chatId;
                            if (sender == options.sender && chatId == options.chatJid && filter(message)) {
                                zk.ev.off('messages.upsert', listener);
                                clearTimeout(interval);
                                resolve(message);
                            }
                        }
                    }
                }
                zk.ev.on('messages.upsert', listener);
                if (timeout) {
                    interval = setTimeout(() => {
                        zk.ev.off('messages.upsert', listener);
                        reject(new Error('Timeout'));
                    }, timeout);
                }
            });
        }



        // fin fonctions utiles
        /** ************* */
        return zk;
    }
    let fichier = require.resolve(__filename);
    fs.watchFile(fichier, () => {
        fs.unwatchFile(fichier);
        console.log(`mise à jour ${__filename}`);
        delete require.cache[fichier];
        require(fichier);
    });
    main();
}, 5000);
